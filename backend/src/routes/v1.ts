import supportRouter from '../domains/identity/admin/support.routes';
import { Router } from 'express';
import authRouter from '../domains/identity/auth';
import analyticsRouter from '../domains/analytics/analytics.routes';
import patientRouter from '../domains/identity/patient';
import nurseRouter from '../domains/identity/nurse/nurse.routes';
import visitRouter from '../domains/care/visit/visit.routes';
import doctorRouter from '../domains/identity/doctor/doctor.routes';
import careRouter from '../domains/care/requests/care.routes';
import marketplaceRouter from '../domains/marketplace/marketplace/marketplace.routes';
import contractRouter from '../domains/marketplace/contracts/contract.routes';
import clinicalRouter from '../domains/care/clinical/clinical.routes';
import adminRouter from '../domains/identity/admin/admin.routes';
import chatRouter from '../domains/communication/chat/chat.routes';
import notificationRouter from '../domains/communication/notification/notification.routes';
import escalationRouter from '../domains/care/emergency/escalation/escalation.routes';
import dispatchRouter from '../domains/care/emergency/dispatch/dispatch.routes';
import admissionRouter from '../domains/care/emergency/admission/admission.routes';
import verificationRouter from '../domains/care/visit/verification/verification.routes';
import paymentRouter from '../domains/marketplace/payments/payment.routes';

const router = Router();

// Register the Authentication feature routes under Version 1
router.use('/auth', authRouter);
router.use(supportRouter);
router.use(analyticsRouter);
router.use('/patients', patientRouter);
router.use('/nurses', nurseRouter);
router.use('/', visitRouter);
router.use('/', doctorRouter);
router.use('/', careRouter);
router.use('/', marketplaceRouter);
router.use('/', contractRouter);
router.use('/', clinicalRouter); // Mount clinical intelligence routes
router.use('/admin', adminRouter);    // Mount admin module routes at /admin prefix
router.use('/', chatRouter);     // Mount communication module routes
router.use('/', notificationRouter); // Mount notification routes
router.use('/', escalationRouter);   // Mount escalation responses routes
router.use('/', dispatchRouter);     // Mount dispatch response routes
router.use('/', admissionRouter);    // Mount admission tracking routes
router.use('/', verificationRouter); // Mount visit verification routes (Module 11)
router.use('/', paymentRouter); // Cash payment confirmation

export default router;
