import { ref, computed } from 'vue';
import type { Appointment, ExceptionRecord, ExceptionType } from '~/data/types';
import { mockAppointments } from '~/data/mockData';
const appointments = ref<Appointment[]>([...mockAppointments]);
export function useAppointments() {
 const pendingAppointments = computed(() => 
 appointments.value.filter(a => a.status === 'pending')
 );
 const confirmedAppointments = computed(() => 
 appointments.value.filter(a => a.status === 'confirmed')
 );
 const inProgressAppointments = computed(() => 
 appointments.value.filter(a => a.status === 'in_progress')
 );
 const completedAppointments = computed(() => 
 appointments.value.filter(a => a.status === 'completed')
 );
 const canceledAppointments = computed(() => 
 appointments.value.filter(a => a.status === 'canceled')
 );
 const appointmentsWithExceptions = computed(() => 
 appointments.value.filter(a => a.exceptions.length > 0)
 );
 const getAppointmentById = (id: string) => 
 appointments.value.find(a => a.id === id);
 const getAppointmentByOrderNo = (orderNo: string) => 
 appointments.value.find(a => a.orderNo === orderNo);
 const updateAppointment = (id: string, updates: Partial<Appointment>) => {
 const index = appointments.value.findIndex(a => a.id === id);
 if (index !== -1) {
 appointments.value[index] = {
 ...appointments.value[index],
 ...updates,
 updatedAt: new Date().toLocaleString('zh-CN')
 };
 }
 };
 const confirmAppointment = (id: string) => {
 updateAppointment(id, { status: 'confirmed' });
 };
 const cancelAppointment = (id: string, reason: string) => {
 updateAppointment(id, { status: 'canceled', rejectReason: reason });
 };
 const completeAppointment = (id: string, actualPrice: number) => {
 updateAppointment(id, { status: 'completed', actualPrice });
 };
 const addException = (appointmentId: string, exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'status'>) => {
 const appointment = getAppointmentById(appointmentId);
 if (appointment) {
 const newException: ExceptionRecord = {
 ...exception,
 id: `e${Date.now()}`,
 createdAt: new Date().toLocaleString('zh-CN'),
 status: 'pending'
 };
 appointment.exceptions.push(newException);
 appointment.updatedAt = new Date().toLocaleString('zh-CN');
 }
 };
 const updateException = (appointmentId: string, exceptionId: string, updates: Partial<ExceptionRecord>) => {
 const appointment = getAppointmentById(appointmentId);
 if (appointment) {
 const exception = appointment.exceptions.find(e => e.id === exceptionId);
 if (exception) {
 Object.assign(exception, updates);
 appointment.updatedAt = new Date().toLocaleString('zh-CN');
 }
 }
 };
 const resolveException = (appointmentId: string, exceptionId: string, resolution: string, handledBy: string) => {
 updateException(appointmentId, exceptionId, {
 status: 'resolved',
 resolution,
 handledBy,
 handledAt: new Date().toLocaleString('zh-CN')
 });
 };
 const getPendingExceptions = (type?: ExceptionType) => {
 let result: ExceptionRecord[] = [];
 appointments.value.forEach(a => {
 const exceptions = a.exceptions.filter(e => e.status === 'pending');
 if (type) {
 result.push(...exceptions.filter(e => e.type === type));
 }
 else {
 result.push(...exceptions);
 }
 });
 return result;
 };
 const getProcessingExceptions = () => {
 let result: ExceptionRecord[] = [];
 appointments.value.forEach(a => {
 result.push(...a.exceptions.filter(e => e.status === 'processing'));
 });
 return result;
 };
 return {
 appointments,
 pendingAppointments,
 confirmedAppointments,
 inProgressAppointments,
 completedAppointments,
 canceledAppointments,
 appointmentsWithExceptions,
 getAppointmentById,
 getAppointmentByOrderNo,
 updateAppointment,
 confirmAppointment,
 cancelAppointment,
 completeAppointment,
 addException,
 updateException,
 resolveException,
 getPendingExceptions,
 getProcessingExceptions
 };
}

