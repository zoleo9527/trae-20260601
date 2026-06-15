import { reactive } from 'vue';
import type { User, Order, Alert } from '../types';
const API_BASE = 'http://localhost:8000/api';
const appState = reactive({
 currentUser: null as User | null,
 orders: [] as Order[],
 alerts: [] as Alert[],
 loading: false,
 error: ''
});
export function useAppStore() {
 const login = async (phone: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/login`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ phone })
 });
 const data = await response.json();
 if (data.success) {
 appState.currentUser = data.user;
 localStorage.setItem('currentUser', JSON.stringify(data.user));
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Login error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const logout = () => {
 appState.currentUser = null;
 localStorage.removeItem('currentUser');
 };
 const loadOrders = async (filters: Record<string, string> = {}) => {
 appState.loading = true;
 try {
 const params = new URLSearchParams(filters);
 const response = await fetch(`${API_BASE}/orders?${params}`);
 appState.orders = await response.json();
 }
 catch (error) {
 console.error('Load orders error:', error);
 }
 finally {
 appState.loading = false;
 }
 };
 const getOrder = async (orderId: string): Promise<Order | null> => {
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}`);
 if (response.ok) {
 return await response.json();
 }
 return null;
 }
 catch (error) {
 console.error('Get order error:', error);
 return null;
 }
 };
 const createOrder = async (data: {
 customer_name: string;
 customer_phone: string;
 address: string;
 product_type: string;
 product_model: string;
 scheduled_date: string;
 }) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(data)
 });
 if (response.ok) {
 await loadOrders();
 return await response.json();
 }
 return null;
 }
 catch (error) {
 console.error('Create order error:', error);
 return null;
 }
 finally {
 appState.loading = false;
 }
 };
 const assignOrder = async (orderId: string, technicianId: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/assign`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ technician_id: technicianId, dispatcher_id: appState.currentUser?.id })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Assign order error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const acceptOrder = async (orderId: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ technician_id: appState.currentUser?.id })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Accept order error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const startOrder = async (orderId: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/start`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ technician_id: appState.currentUser?.id })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Start order error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const completeOrder = async (orderId: string, photos?: string[]) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/complete`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ technician_id: appState.currentUser?.id, photos })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Complete order error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const markAccessory = async (orderId: string, accessoryId: string, used: boolean, installed: boolean) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/mark_accessory`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ accessory_id: accessoryId, used, installed })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Mark accessory error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const reportLeakage = async (orderId: string, description: string, photos?: string[]) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/report_leakage`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ description, photos, reported_by: appState.currentUser?.id })
 });
 if (response.ok) {
 await loadOrders();
 await loadAlerts();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Report leakage error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const rejectAfterSales = async (recordId: string, reason: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/after_sales/${recordId}/reject`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ reason, rejected_by: appState.currentUser?.id })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Reject after sales error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const judgeResponsibility = async (orderId: string, responsibleParty: string, reason: string, evidence: string[], compensationAmount: number) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/judge_responsibility`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 order_id: orderId,
 responsible_party: responsibleParty,
 reason,
 evidence,
 compensation_amount: compensationAmount,
 created_by: appState.currentUser?.id
 })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Judge responsibility error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const rejectResponsibility = async (resultId: string, reason: string, additionalEvidence: string[]) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/responsibility/${resultId}/reject`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 reason,
 additional_evidence_required: additionalEvidence,
 rejected_by: appState.currentUser?.id
 })
 });
 if (response.ok) {
 await loadOrders();
 await loadAlerts();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Reject responsibility error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const finalizeResponsibility = async (resultId: string, finalReason?: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/responsibility/${resultId}/finalize`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ final_reason: finalReason })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Finalize responsibility error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const askQuestion = async (orderId: string, question: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/orders/${orderId}/ask_question`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ question, asked_by: appState.currentUser?.id })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Ask question error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const answerQuestion = async (questionId: string, answer: string) => {
 appState.loading = true;
 try {
 const response = await fetch(`${API_BASE}/questions/${questionId}/answer`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ answer, answered_by: appState.currentUser?.id })
 });
 if (response.ok) {
 await loadOrders();
 return true;
 }
 return false;
 }
 catch (error) {
 console.error('Answer question error:', error);
 return false;
 }
 finally {
 appState.loading = false;
 }
 };
 const loadAlerts = async () => {
 try {
 const response = await fetch(`${API_BASE}/alerts`);
 appState.alerts = await response.json();
 }
 catch (error) {
 console.error('Load alerts error:', error);
 }
 };
 const markAlertRead = async (alertId: string) => {
 try {
 const response = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
 method: 'PUT'
 });
 if (response.ok) {
 await loadAlerts();
 }
 }
 catch (error) {
 console.error('Mark alert read error:', error);
 }
 };
 const getUsers = async (role?: string): Promise<User[]> => {
 try {
 const params = role ? `?role=${role}` : '';
 const response = await fetch(`${API_BASE}/users${params}`);
 return await response.json();
 }
 catch (error) {
 console.error('Get users error:', error);
 return [];
 }
 };
 const getOrderStatuses = async () => {
 try {
 const response = await fetch(`${API_BASE}/order_statuses`);
 return await response.json();
 }
 catch (error) {
 console.error('Get order statuses error:', error);
 return [];
 }
 };
 const getProductTypes = async () => {
 try {
 const response = await fetch(`${API_BASE}/product_types`);
 return await response.json();
 }
 catch (error) {
 console.error('Get product types error:', error);
 return [];
 }
 };
 const init = async () => {
 const stored = localStorage.getItem('currentUser');
 if (stored) {
 appState.currentUser = JSON.parse(stored);
 }
 };
 return {
 state: appState,
 login,
 logout,
 loadOrders,
 getOrder,
 createOrder,
 assignOrder,
 acceptOrder,
 startOrder,
 completeOrder,
 markAccessory,
 reportLeakage,
 rejectAfterSales,
 judgeResponsibility,
 rejectResponsibility,
 finalizeResponsibility,
 askQuestion,
 answerQuestion,
 loadAlerts,
 markAlertRead,
 getUsers,
 getOrderStatuses,
 getProductTypes,
 init
 };
}

