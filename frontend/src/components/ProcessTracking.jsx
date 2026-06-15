import { useState, useEffect } from 'react';
import { Scissors, Thread, Flame, Truck, Clock, AlertCircle, ArrowRight, Search, Filter, User, Package, CheckCircle, XCircle, Eye } from 'lucide-react';
import axios from 'axios';
const statusLabels = {
 pending: '待量尺',
 measuring: '量尺中',
 measured: '量尺完成',
 confirmed: '已确认',
 fabric_ordered: '面料已下单',
 fabric_received: '面料已到货',
 cutting: '裁剪中',
 sewing: '缝纫中',
 ironing: '熨烫中',
 installing: '安装中',
 completed: '已完成',
 rejected: '已退回',
 needs_revision: '待修改'
};
const statusColors = {
 pending: 'bg-yellow-100 text-yellow-800',
 measuring: 'bg-blue-100 text-blue-800',
 measured: 'bg-purple-100 text-purple-800',
 confirmed: 'bg-green-100 text-green-800',
 fabric_ordered: 'bg-orange-100 text-orange-800',
 fabric_received: 'bg-teal-100 text-teal-800',
 cutting: 'bg-indigo-100 text-indigo-800',
 sewing: 'bg-pink-100 text-pink-800',
 ironing: 'bg-cyan-100 text-cyan-800',
 installing: 'bg-emerald-100 text-emerald-800',
 completed: 'bg-gray-100 text-gray-800',
 rejected: 'bg-red-100 text-red-800',
 needs_revision: 'bg-amber-100 text-amber-800'
};
const processSteps = [
 { status: 'pending', label: '待量尺', icon: Clock, role: '导购', color: 'yellow' },
 { status: 'measuring', label: '量尺中', icon: Clock, role: '量尺师', color: 'blue' },
 { status: 'measured', label: '量尺完成', icon: CheckCircle, role: '量尺师', color: 'purple' },
 { status: 'confirmed', label: '复核通过', icon: CheckCircle, role: '导购/主管', color: 'green' },
 { status: 'fabric_ordered', label: '面料下单', icon: Package, role: '采购', color: 'orange' },
 { status: 'fabric_received', label: '面料到货', icon: Package, role: '采购', color: 'teal' },
 { status: 'cutting', label: '裁剪中', icon: Scissors, role: '裁剪工', color: 'indigo' },
 { status: 'sewing', label: '缝纫中', icon: Thread, role: '缝纫工', color: 'pink' },
 { status: 'ironing', label: '熨烫中', icon: Flame, role: '熨烫工', color: 'cyan' },
 { status: 'installing', label: '安装中', icon: Truck, role: '安装师傅', color: 'emerald' },
 { status: 'completed', label: '已完成', icon: CheckCircle, role: '安装师傅', color: 'gray' }
];
const colorMap = {
 yellow: { bg: 'bg-yellow-500', bgLight: 'bg-yellow-100', text: 'text-yellow-600' },
 blue: { bg: 'bg-blue-500', bgLight: 'bg-blue-100', text: 'text-blue-600' },
 purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-100', text: 'text-purple-600' },
 green: { bg: 'bg-green-500', bgLight: 'bg-green-100', text: 'text-green-600' },
 orange: { bg: 'bg-orange-500', bgLight: 'bg-orange-100', text: 'text-orange-600' },
 teal: { bg: 'bg-teal-500', bgLight: 'bg-teal-100', text: 'text-teal-600' },
 indigo: { bg: 'bg-indigo-500', bgLight: 'bg-indigo-100', text: 'text-indigo-600' },
 pink: { bg: 'bg-pink-500', bgLight: 'bg-pink-100', text: 'text-pink-600' },
 cyan: { bg: 'bg-cyan-500', bgLight: 'bg-cyan-100', text: 'text-cyan-600' },
 emerald: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-100', text: 'text-emerald-600' },
 gray: { bg: 'bg-gray-500', bgLight: 'bg-gray-100', text: 'text-gray-600' }
};
function ProcessTracking({ onOrderClick }) {
 const [orders, setOrders] = useState([]);
 const [selectedOrder, setSelectedOrder] = useState(null);
 const [orderTracking, setOrderTracking] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterStatus, setFilterStatus] = useState('processing');
 useEffect(() => {
 fetchOrders();
 }, [searchTerm, filterStatus]);
 useEffect(() => {
 if (selectedOrder?.id) {
 fetchOrderTracking(selectedOrder.id);
 }
 }, [selectedOrder]);
 const fetchOrders = async () => {
 setLoading(true);
 try {
 const params = new URLSearchParams();
 if (searchTerm)
 params.append('search', searchTerm);
 const response = await axios.get(`/api/orders?${params.toString()}`);
 setOrders(response.data.orders);
 }
 catch (error) {
 console.error('Failed to fetch orders:', error);
 }
 setLoading(false);
 };
 const fetchOrderTracking = async (orderId) => {
 try {
 const response = await axios.get(`/api/orders/${orderId}`);
 setOrderTracking(response.data.tracking || []);
 } catch (error) {
 console.error('Failed to fetch order tracking:', error);
 }
 };
 const getCurrentStepIndex = (status) => {
 return processSteps.findIndex((step) => step.status === status);
 };
 const isProcessing = (status) => {
 return ['cutting', 'sewing', 'ironing', 'installing'].includes(status);
 };
 const isPending = (status) => {
 return ['pending', 'measuring', 'measured', 'confirmed', 'fabric_ordered', 'fabric_received'].includes(status);
 };
 const filteredOrders = orders.filter((order) => {
 if (filterStatus === 'processing')
 return isProcessing(order.status);
 if (filterStatus === 'pending')
 return isPending(order.status);
 return true;
 });
 const getProcessDuration = (order) => {
 const createdAt = new Date(order.created_at);
 const now = new Date();
 const hours = Math.floor((now.getTime() - createdAt.getTime()) / 3600000);
 if (hours < 24)
 return `${hours}小时`;
 return `${Math.floor(hours / 24)}天${hours % 24}小时`;
 };
 const formatDate = (dateString) => {
 const date = new Date(dateString);
 return date.toLocaleString('zh-CN', {
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
 };
 return (<div className="p-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-800">加工跟踪</h1>
 <p className="text-slate-500">实时跟踪订单从量尺到安装的完整流程</p>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
 <div className="bg-white rounded-xl shadow-sm p-4">
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
 <Clock className="text-blue-600" size={24}/>
 </div>
 <div>
 <p className="text-2xl font-bold text-slate-800">{orders.filter(o => ['pending', 'measuring', 'measured'].includes(o.status)).length}</p>
 <p className="text-sm text-slate-500">量尺阶段</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-sm p-4">
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
 <Package className="text-orange-600" size={24}/>
 </div>
 <div>
 <p className="text-2xl font-bold text-slate-800">{orders.filter(o => ['fabric_ordered', 'fabric_received'].includes(o.status)).length}</p>
 <p className="text-sm text-slate-500">面料阶段</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-sm p-4">
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
 <Scissors className="text-indigo-600" size={24}/>
 </div>
 <div>
 <p className="text-2xl font-bold text-slate-800">{orders.filter(o => ['cutting', 'sewing', 'ironing'].includes(o.status)).length}</p>
 <p className="text-sm text-slate-500">加工中</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-sm p-4">
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
 <Truck className="text-emerald-600" size={24}/>
 </div>
 <div>
 <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status === 'installing').length}</p>
 <p className="text-sm text-slate-500">安装中</p>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2">
 <div className="bg-white rounded-xl shadow-sm">
 <div className="p-4 border-b border-slate-200">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div className="relative flex-1 max-w-md">
 <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
 <input type="text" placeholder="搜索订单号、客户名..." value={searchTerm} onChange={(e) => {
 setSearchTerm(e.target.value);
 }} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"/>
 </div>
 <div className="flex items-center space-x-2">
 <Filter size={18} className="text-slate-400"/>
 <div className="flex bg-slate-100 rounded-lg p-1">
 <button onClick={() => setFilterStatus('processing')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === 'processing' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
 加工中
 </button>
 <button onClick={() => setFilterStatus('pending')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === 'pending' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
 待加工
 </button>
 <button onClick={() => setFilterStatus('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
 全部
 </button>
 </div>
 </div>
 </div>
 </div>

 <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
 {loading ? (<div className="text-center py-12">
 <div className="animate-spin h-8 w-8 text-cyan-600 mx-auto"/>
 </div>) : filteredOrders.length === 0 ? (<div className="text-center py-12 text-slate-500">暂无订单</div>) : (filteredOrders.map((order) => {
 const currentStep = getCurrentStepIndex(order.status);
 const currentStepInfo = processSteps[currentStep];
 const colors = colorMap[currentStepInfo?.color] || colorMap.gray;
 return (<div key={order.id} className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedOrder?.id === order.id
 ? 'border-cyan-400 shadow-lg shadow-cyan-100'
 : 'border-slate-200 hover:border-cyan-300'}`} onClick={() => {
 setSelectedOrder(order);
 }}>
 <div className="flex items-start justify-between mb-3">
 <div>
 <div className="flex items-center space-x-2">
 <span className="font-bold text-slate-800">{order.order_no}</span>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
 {statusLabels[order.status]}
 </span>
 </div>
 <p className="text-sm text-slate-500 mt-1">{order.customer_name} - {order.fabric_type}</p>
 </div>
 <div className="text-right">
 <p className="text-lg font-bold text-cyan-600">¥{order.total_price?.toFixed(2)}</p>
 </div>
 </div>

 <div className="relative">
 <div className="flex items-center justify-between">
 {processSteps.map((step, index) => {
 const Icon = step.icon;
 const isCompleted = index < currentStep;
 const isCurrent = index === currentStep;
 const stepColors = colorMap[step.color];
 return (<div key={step.status} className="flex flex-col items-center" style={{ flex: 1 }}>
 <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${isCurrent ? `${stepColors.bg} text-white shadow-lg` :
 isCompleted ? `${stepColors.bg} text-white` :
 'bg-slate-200 text-slate-400'}`}>
 {isCompleted ? (<CheckCircle size={14}/>) : (<Icon size={14}/>)}
 </div>
 <span className={`text-xs mt-1 ${isCurrent ? stepColors.text : 'text-slate-500'}`}>
 {step.label}
 </span>
 </div>);
 })}
 </div>
 </div>

 <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
 {order.current_handler?.charAt(0)}
 </div>
 <span className="text-sm text-slate-600">{order.current_handler}</span>
 </div>
 <span className="text-xs text-slate-400">已耗时: {getProcessDuration(order)}</span>
 </div>
 </div>);
 }))}
 </div>
 </div>
 </div>

 <div className="lg:col-span-1">
 <div className="bg-white rounded-xl shadow-sm p-4 sticky top-6">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-semibold text-slate-800">订单详情</h3>
 {selectedOrder && (<button onClick={() => onOrderClick && onOrderClick(selectedOrder)} className="text-sm text-cyan-600 flex items-center space-x-1">
 <Eye size={14}/>
 <span>查看完整信息</span>
 </button>)}
 </div>

 {selectedOrder ? (<div className="space-y-4">
 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
 <span className="text-sm text-slate-500">订单号</span>
 <span className="font-medium text-slate-800">{selectedOrder.order_no}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
 <span className="text-sm text-slate-500">客户</span>
 <span className="font-medium text-slate-800">{selectedOrder.customer_name}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
 <span className="text-sm text-slate-500">面料</span>
 <span className="font-medium text-slate-800">{selectedOrder.fabric_type}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
 <span className="text-sm text-slate-500">金额</span>
 <span className="font-medium text-cyan-600">¥{selectedOrder.total_price?.toFixed(2)}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
 <span className="text-sm text-slate-500">当前处理人</span>
 <div className="flex items-center space-x-2">
 <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
 {selectedOrder.current_handler?.charAt(0)}
 </div>
 <span className="font-medium text-slate-800">{selectedOrder.current_handler}</span>
 </div>
 </div>

 <div className="pt-4 border-t border-slate-200">
 <h4 className="text-sm font-semibold text-slate-700 mb-3">进度跟踪记录</h4>
 <div className="relative space-y-3 max-h-64 overflow-y-auto">
 <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
 {orderTracking.length > 0 ? (orderTracking.slice().reverse().map((item, index) => (<div key={item.id} className="relative pl-8">
 <div className={`absolute left-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${index === 0 ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 bg-white'}`}>
 {index === 0 && (<div className="w-1.5 h-1.5 bg-white rounded-full"></div>)}
 </div>
 <div className="bg-slate-50 rounded-lg p-2">
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-medium text-slate-700">{item.action}</span>
 <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
 </div>
 <p className="text-xs text-slate-500">{item.note}</p>
 <div className="flex items-center space-x-1 mt-1">
 <User size={10} className="text-slate-400"/>
 <span className="text-xs text-cyan-600">{item.handler}</span>
 </div>
 </div>
 </div>))) : (<p className="text-center text-slate-400 text-sm py-4">暂无跟踪记录</p>)}
 </div>
 </div>
 </div>) : (<div className="text-center py-12">
 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
 <Search className="text-slate-400" size={24}/>
 </div>
 <p className="text-slate-500">请选择一个订单查看详情</p>
 </div>)}
 </div>
 </div>
 </div>
 </div>);
}
export default ProcessTracking;