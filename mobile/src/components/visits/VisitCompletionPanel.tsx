import { useAppTheme } from '../../theme/ThemeProvider';

import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput, Checkbox, PaperProvider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Visit } from '../../types/visit';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';
import { visitsApi } from '../../api/visits.api';
import { uploadFile, downloadPrivateFile } from '../../utils/fileTransfer';
import { useFlowStyles, useWorkflowTheme } from '../common/WorkflowPage';

import { confirmAction } from '../common/AppDialogs';
type Evidence={id:string;type:string;urlOrText:string;uploadedAt:string;consentGiven:boolean};
export function VisitCompletionPanel({visit,onChanged}:{visit:Visit;onChanged:()=>Promise<unknown>}) {
  const { colors: COLORS } = useAppTheme();
  const s = useFlowStyles();
  const workflowTheme = useWorkflowTheme();

 const role=useAuthStore(state=>state.user?.role);
 const [consent,setConsent]=useState(false),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const records=useQuery({queryKey:['visit-evidence',visit.id,role],queryFn:async()=>{
  const [attendance,evidence]=await Promise.all([visitsApi.getAttendance(visit.id),apiClient.get<Evidence[]>(`/visits/${visit.id}/evidence`)]);return {attendance,evidence};
 },refetchInterval:15000});
 const run=async(task:()=>Promise<unknown>)=>{setBusy(true);setError('');try{await task();await records.refetch();await onChanged();}catch(e:any){setError(e.message || 'Could not save');}finally{setBusy(false);}};
 const upload=async(type:'PHOTO'|'ATTACHMENT')=>{
  if (!consent) {setError('Confirm that the patient explicitly consented before uploading.');return;}
  const selected=await DocumentPicker.getDocumentAsync({type:type==='PHOTO'?['image/png','image/jpeg']:['application/pdf','image/png','image/jpeg'],copyToCacheDirectory:true});
  if (!selected.canceled) await uploadFile(`/visits/${visit.id}/evidence/file`,selected.assets[0],{type,consentGiven:'true'});
 };
 const review=async(decision:'APPROVE'|'DISPUTE')=>{
  if (!await confirmAction(decision==='APPROVE'?'Approve completed visit?':'Report a completion concern?',decision==='APPROVE'?'Confirm only if the care visit has finished as agreed. Your approval is recorded separately from arrival.':reason))return;
  await apiClient.put(`/visits/${visit.id}/completion-review`,{decision,...(decision==='DISPUTE'?{reason}: {})});
 };
 return <PaperProvider theme={workflowTheme}><View style={s.card}><Text style={s.title}>Attendance and completion</Text>
  {(error || records.error?.message) && <Text accessibilityRole="alert" style={{color:COLORS.red}}>{error || records.error?.message}</Text>}
  {records.isError && <Button onPress={()=>void records.refetch()}>Retry</Button>}
  <Text style={s.body}>Check-in: {records.data?.attendance?.checkInAt?new Date(records.data.attendance.checkInAt).toLocaleString():'Not recorded'}</Text>
  <Text style={s.body}>Check-out: {records.data?.attendance?.checkOutAt?new Date(records.data.attendance.checkOutAt).toLocaleString():'Not recorded'}</Text>
  {role==='NURSE' && visit.status==='COMPLETED' && !records.data?.attendance?.checkOutAt && <Button disabled={busy} loading={busy} onPress={()=>void run(()=>visitsApi.checkOutVisit(visit.id))}>Check out</Button>}
  {visit.status==='COMPLETED' && <Text style={s.body}>{visit.completionApprovedAt?`Patient approved completion: ${new Date(visit.completionApprovedAt).toLocaleString()}`:'Completed by nurse · awaiting patient approval'}</Text>}
  {!!visit.completionDisputeReason && <Text style={s.body}>Patient concern: {visit.completionDisputeReason}</Text>}
  {role==='PATIENT' && visit.status==='COMPLETED' && !visit.completionApprovedAt && <View>
   {!records.data?.attendance?.checkOutAt && <Text style={s.body}>Completion review becomes available after nurse check-out.</Text>}
   <TextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label="Completion concern (at least 10 characters)" value={reason} onChangeText={setReason} maxLength={2000} multiline style={s.input}/>
   <Button disabled={busy || !records.data?.attendance?.checkOutAt} onPress={()=>void run(()=>review('APPROVE'))}>Approve completed visit</Button>
   <Button disabled={busy || reason.trim().length<10 || !records.data?.attendance?.checkOutAt} onPress={()=>void run(()=>review('DISPUTE'))}>Report completion concern</Button>
  </View>}
  <Text style={s.title}>Visit evidence</Text>
  {role==='NURSE' && visit.status==='IN_PROGRESS' && <View>
   <Checkbox.Item label="Patient explicitly consented to this evidence upload" status={consent?'checked':'unchecked'} onPress={()=>setConsent(value=>!value)} labelStyle={s.body}/>
   <Button disabled={busy || !consent} onPress={()=>void run(()=>upload('PHOTO'))}>Upload photo</Button><Button disabled={busy || !consent} onPress={()=>void run(()=>upload('ATTACHMENT'))}>Upload attachment</Button>
  </View>}
  {records.data?.evidence.length===0 && <Text style={s.body}>No evidence recorded.</Text>}
  {records.data?.evidence.map(item=><View key={item.id}><Text style={s.body}>{item.type} · {new Date(item.uploadedAt).toLocaleString()}</Text>{item.urlOrText.startsWith('private:')?<Button disabled={busy} onPress={()=>void run(()=>downloadPrivateFile(`/visits/${visit.id}/evidence/${item.id}/file`,`visit-evidence${item.urlOrText.slice(item.urlOrText.lastIndexOf('.'))}`))}>Download private evidence</Button>:<Text style={s.body}>{item.type==='NOTE'?item.urlOrText:'Previously recorded external reference'}</Text>}</View>)}
 </View></PaperProvider>;
}
