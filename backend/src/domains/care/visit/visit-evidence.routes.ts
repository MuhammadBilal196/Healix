import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../../../common/config/database';
import { asyncHandler } from '../../../common/middleware/asyncHandler';
import { AppError } from '../../../common/errors/AppError';
import { VisitAccessPolicy } from './shared/policies/visit-access.policy';
import { VerificationRepository } from './verification/verification.repository';
import { OutboxRepository } from '../../../common/events/outbox.repository';
import { recordVisitCharge } from '../../marketplace/payments/payment.charges';
const router = Router();
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1,fields:3}}).single('file');
const directory = path.resolve('private','visit-evidence',process.env.HEALIX_TEST_SCHEMA || 'app');
const ownVisit = async(req:any) => { const visit=await VerificationRepository.findVisitWithPatient(req.params.id); if (!visit) throw new AppError('Visit not found',404); VisitAccessPolicy.assertCanRead(visit,req.user); return visit; };
router.post('/visits/:id/evidence/file', asyncHandler(async(req,_res,next) => {
 const visit=await ownVisit(req);
 if ((req as any).user.role !== 'NURSE' || visit.nurseId !== (req as any).user.nurse?.id) throw new AppError('Only the assigned nurse can add evidence',403);
 if (visit.status !== 'IN_PROGRESS') throw new AppError('Evidence can be added during an active visit',409); next();
}), upload, asyncHandler(async(req,res) => {
 const parsed=z.object({type:z.enum(['PHOTO','ATTACHMENT']),consentGiven:z.literal('true')}).safeParse(req.body);
 if (!parsed.success) throw new AppError('Select evidence type and confirm patient consent',400);
 if (!req.file) throw new AppError('Choose a file',400);
 const bytes=req.file.buffer;
 const ext=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? '.png' : bytes[0]===255 && bytes[1]===216 && bytes[2]===255 ? '.jpg' : parsed.data.type==='ATTACHMENT' && bytes.subarray(0,5).toString()==='%PDF-' ? '.pdf' : null;
 if (!ext) throw new AppError('Choose a PNG/JPEG image or a PDF attachment',400);
 const name=randomUUID()+ext, folder=path.join(directory,z.string().uuid().parse(req.params.id)), file=path.join(folder,name);
 await fs.mkdir(folder,{recursive:true}); await fs.writeFile(file,bytes,{flag:'wx'});
 try {
  const evidence=await prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT id FROM visits WHERE id = ${req.params.id} FOR UPDATE`;
   const visit=await tx.visit.findUniqueOrThrow({where:{id:req.params.id}});
   if (visit.status!=='IN_PROGRESS' || visit.nurseId!==(req as any).user.nurse?.id) throw new AppError('The visit no longer accepts evidence',409);
   return tx.visitEvidence.create({data:{visitId:visit.id,type:parsed.data.type,urlOrText:'private:'+name,consentGiven:true}});
  }); res.status(201).json({success:true,data:evidence});
 } catch(error) { await fs.unlink(file).catch(()=>{}); throw error; }
}));
router.get('/visits/:id/evidence/:evidenceId/file', asyncHandler(async(req,res) => {
 await ownVisit(req);
 const evidence=await prisma.visitEvidence.findFirst({where:{id:req.params.evidenceId,visitId:req.params.id}});
 if (!evidence || !/^private:[a-f0-9-]{36}\.(png|jpg|pdf)$/.test(evidence.urlOrText)) throw new AppError('Private evidence file not found',404);
 res.setHeader('Cache-Control','private, no-store'); res.setHeader('X-Content-Type-Options','nosniff');
 res.download(path.join(directory,z.string().uuid().parse(req.params.id),evidence.urlOrText.slice(8)),`visit-evidence${path.extname(evidence.urlOrText)}`);
}));
router.put('/visits/:id/completion-review', asyncHandler(async(req,res) => {
 const input=z.object({decision:z.enum(['APPROVE','DISPUTE']),reason:z.string().trim().min(10).max(2000).optional()}).parse(req.body);
 if (input.decision==='DISPUTE' && !input.reason) throw new AppError('Explain the completion concern in at least 10 characters',400);
 const initial=await ownVisit(req), actor=(req as any).user;
 if (actor.role!=='PATIENT' || actor.patient?.id !== initial.request.patientId) throw new AppError('Only the patient can review completion',403);
 const result=await prisma.$transaction(async tx => {
  await tx.$queryRaw`SELECT id FROM care_requests WHERE id = ${initial.requestId} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM visits WHERE id = ${initial.id} FOR UPDATE`;
  const visit=await tx.visit.findUniqueOrThrow({where:{id:initial.id},include:{attendanceRecord:true}});
  if (visit.status!=='COMPLETED' || !visit.nurseConfirmed) throw new AppError('The nurse must complete this visit first',409);
  if (visit.completionApprovedAt) { if(input.decision==='APPROVE') return visit; throw new AppError('Completion was already approved',409); }
  if (!visit.attendanceRecord?.checkOutAt) throw new AppError('The nurse must check out before completion review',409);
  const updated=await tx.visit.update({where:{id:visit.id},data:input.decision==='APPROVE'?{completionApprovedAt:new Date(),completionDisputeReason:null}:{completionDisputeReason:input.reason}});
  await tx.visitVerification.create({data:{visitId:visit.id,method:'PATIENT_COMPLETION',result:input.decision==='APPROVE',reason:input.reason || 'Patient approved completed care'}});
  if(input.decision==='DISPUTE' && !await tx.supportCase.findFirst({where:{patientId:actor.patient.id,visitId:visit.id,kind:'DISPUTE',status:{in:['OPEN','IN_REVIEW']}}})) {
    await tx.supportCase.create({data:{requestKey:'visit-completion:'+visit.id,patientId:actor.patient.id,visitId:visit.id,kind:'DISPUTE',reason:input.reason!,createdBy:actor.id}});
  }

  if (input.decision==='APPROVE') {
   // The approved visit is now billable: record what the patient owes.
   await recordVisitCharge(tx, visit.requestId);
   const remaining=await tx.visit.count({where:{requestId:visit.requestId,OR:[{status:{notIn:['COMPLETED','CANCELLED','DECLINED']}},{status:'COMPLETED',completionApprovedAt:null}]}});
   if (!remaining) {
    const contract=await tx.contract.findFirst({where:{careRequestId:visit.requestId,status:'ACTIVE'}});
    if (contract && (await tx.contract.updateMany({where:{id:contract.id,status:'ACTIVE'},data:{status:'COMPLETED'}})).count) {
     await tx.contractAuditLog.create({data:{contractId:contract.id,action:'COMPLETED',actorId:actor.id,actorRole:actor.role,note:'Patient approved all completed visits.',beforeValue:JSON.stringify(contract),afterValue:JSON.stringify({...contract,status:'COMPLETED'})}});
     await OutboxRepository.createEvent(tx,{eventType:'CONTRACT_COMPLETED',aggregateType:'CONTRACT',aggregateId:contract.id,payload:{contractId:contract.id}});
    }
   }
  } return updated;
 }); res.json({success:true,data:result});
}));
export default router;
