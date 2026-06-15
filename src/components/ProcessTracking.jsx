import { useState, useEffect } from 'react';
import { Scissors, Thread, Flame, Truck, Clock, AlertCircle, ArrowRight, Search, Filter } from 'lucide-react';
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
 { status: 'pending', label: '待量尺', icon: Clock },
 { status: 'measuring', label: '量尺中', icon: Clock },
 { status: 'measured', label: '量尺完成', icon: Clock },
 { status: 'confirmed', label: '已确认', icon: Clock },
 { status: 'fabric_ordered', label: '面料下单', icon: Scissors },
 { status: 'fabric_received', label: '面料到货', icon: Scissors },
 { status: 'cutting', label: '裁剪中', icon: Scissors },
 { status: 'sewing', label: '缝纫中', icon: Thread },
 { status: 'ironing', label: '熨烫中', icon: Flame },
 { status: 'installing', label: '安装中', icon: Truck },
 { status: 'completed', label: '已完成', icon: Truck }
];
function ProcessTracking({ onOrderClick }) {
 const [orders, setOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterStatus, setFilterStatus] = useState('processing');
 useEffect(() => {
 fetchOrders();
 }, [searchTerm, filterStatus]);
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
 return (<div className="p-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-800">加工跟踪</h1>
 <p className="text-slate-500">实时跟踪订单加工进度</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div className="bg-white rounded-xl shadow-sm p-4">
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
 <Scissors className="text-indigo-600" size={24}/>
 </div>
 <div>
 <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status === 'cutting').length}</p>
 <p className="text-sm text-slate-500">裁剪中</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-sm p-4">
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
 <Thread className="text-pink-600" size={24}/>
 </div>
 <div>
 <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status === 'sewing').length}</p>
 <p className="text-sm text-slate-500">缝纫中</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-sm p-4">
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
 <Flame className="text-cyan-600" size={24}/>
 </div>
 <div>
 <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status === 'ironing').length}</p>
 <p className="text-sm text-slate-500">熨烫中</p>
 </div>
 </div>
 </div>
 </div>

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

 <div className="p-4 space-y-4">
 {loading ? (<div className="text-center py-12">
 <div className="animate-spin h-8 w-8 text-cyan-600 mx-auto"/>
 </div>) : filteredOrders.length === 0 ? (<div className="text-center py-12 text-slate-500">暂无订单</div>) : (filteredOrders.map((order) => {
 const currentStep = getCurrentStepIndex(order.status);
 return (<div key={order.id} className="border border-slate-200 rounded-xl p-4 hover:border-cyan-300 cursor-pointer transition-colors" onClick={() => onOrderClick && onOrderClick(order)}>
 <div className="flex items-start justify-between mb-4">
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
 <p className="text-xs text-slate-500">耗时: {getProcessDuration(order)}</p>
 </div>
 </div>

 <div className="relative pl-8">
 <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
 <div className="flex flex-wrap items-center">
 {processSteps.slice(0, 7).map((step, index) => {
 const Icon = step.icon;
 const isCompleted = index < currentStep;
 const isCurrent = index === currentStep;
 return (<div key={step.status} className="flex items-center">
 <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${isCurrent ? 'bg-cyan-500 text-white' :
 isCompleted ? 'bg-green-500 text-white' :
 'bg-slate-200 text-slate-500'}`}>
 {isCompleted ? (<span className="text-xs">✓</span>) : (<Icon size={12}/>)}
 </div>
 {index < 6 && (<ArrowRight size={14} className={`mx-1 ${isCompleted ? 'text-green-500' : 'text-slate-300'}`}/>)}
 </div>);
 })}
 </div>
 </div>

 <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
 {order.current_handler?.charAt(0)}
 </div>
 <span className="text-sm text-slate-600">{order.current_handler}</span>
 </div>
 {isProcessing(order.status) && (<div className="flex items-center space-x-1 text-amber-600">
 <AlertCircle size={14}/>
 <span className="text-xs">加工中</span>
 </div>)}
 </div>
 </div>);
 }))}
 </div>
 </div>
 </div>);
}
export default ProcessTracking;