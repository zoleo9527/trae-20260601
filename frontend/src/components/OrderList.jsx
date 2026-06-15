import { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight, Plus, RefreshCw, AlertCircle, Clock, Package, CheckCircle } from 'lucide-react';
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
const handlerOptions = ['导购', '量尺师', '裁剪工', '缝纫工', '熨烫工', '安装师傅', '采购'];
const quickFilters = [
 { label: '待处理', statuses: ['pending', 'measuring', 'measured', 'needs_revision'], color: 'bg-yellow-500' },
 { label: '面料相关', statuses: ['fabric_ordered', 'fabric_received'], color: 'bg-orange-500' },
 { label: '加工中', statuses: ['cutting', 'sewing', 'ironing'], color: 'bg-cyan-500' },
 { label: '安装中', statuses: ['installing'], color: 'bg-green-500' },
 { label: '问题订单', statuses: ['rejected', 'needs_revision'], color: 'bg-red-500' }
];
function OrderList({ onOrderClick, initialFilters }) {
 const [orders, setOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [handlerFilter, setHandlerFilter] = useState('');
 const [showFilters, setShowFilters] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [total, setTotal] = useState(0);
 useEffect(() => {
 if (initialFilters) {
 if (initialFilters.status) {
 setStatusFilter(initialFilters.status);
 }
 if (initialFilters.search) {
 setSearchTerm(initialFilters.search);
 }
 }
 }, []);
 useEffect(() => {
 fetchOrders();
 }, [searchTerm, statusFilter, handlerFilter, currentPage]);
 const fetchOrders = async () => {
 setLoading(true);
 try {
 const params = new URLSearchParams();
 if (searchTerm)
 params.append('search', searchTerm);
 if (statusFilter)
 params.append('status', statusFilter);
 if (handlerFilter)
 params.append('handler', handlerFilter);
 params.append('page', currentPage);
 params.append('limit', 10);
 const response = await axios.get(`/api/orders?${params.toString()}`);
 setOrders(response.data.orders);
 setTotal(response.data.total);
 }
 catch (error) {
 console.error('Failed to fetch orders:', error);
 }
 setLoading(false);
 };
 const formatDate = (dateString) => {
 const date = new Date(dateString);
 return date.toLocaleDateString('zh-CN', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
 };
 const handleQuickFilter = (statuses) => {
 setStatusFilter('');
 setCurrentPage(1);
 };
 const totalPages = Math.ceil(total / 10);
 return (<div className="p-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-800">订单列表</h1>
 <p className="text-slate-500">共 {total} 个订单</p>
 </div>
 <button className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
 <Plus size={18}/>
 <span>新建订单</span>
 </button>
 </div>

 <div className="flex flex-wrap gap-2 mb-6">
 {quickFilters.map((filter, index) => (<button key={index} onClick={() => handleQuickFilter(filter.statuses)} className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter.color} text-white hover:opacity-90`}>
 {index === 0 && <Clock size={14}/>}
 {index === 1 && <Package size={14}/>}
 {index === 2 && <AlertCircle size={14}/>}
 {index === 3 && <CheckCircle size={14}/>}
 {index === 4 && <AlertCircle size={14}/>}
 <span>{filter.label}</span>
 </button>))}
 </div>

 <div className="bg-white rounded-xl shadow-sm">
 <div className="p-4 border-b border-slate-200">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div className="relative flex-1 max-w-md">
 <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
 <input type="text" placeholder="搜索订单号、客户名、地址..." value={searchTerm} onChange={(e) => {
 setSearchTerm(e.target.value);
 setCurrentPage(1);
 }} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"/>
 </div>
 <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'border-slate-200 hover:bg-slate-50'}`}>
 <Filter size={18}/>
 <span>筛选</span>
 </button>
 <button onClick={() => {
 setSearchTerm('');
 setStatusFilter('');
 setHandlerFilter('');
 setCurrentPage(1);
 }} className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
 <RefreshCw size={18}/>
 <span>重置</span>
 </button>
 </div>

 {showFilters && (<div className="mt-4 pt-4 border-t border-slate-100">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-600 mb-2">状态</label>
 <select value={statusFilter} onChange={(e) => {
 setStatusFilter(e.target.value);
 setCurrentPage(1);
 }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
 <option value="">全部状态</option>
 {Object.entries(statusLabels).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-600 mb-2">处理人</label>
 <select value={handlerFilter} onChange={(e) => {
 setHandlerFilter(e.target.value);
 setCurrentPage(1);
 }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
 <option value="">全部人员</option>
 {handlerOptions.map((handler) => (<option key={handler} value={handler}>{handler}</option>))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-600 mb-2">快速筛选</label>
 <select onChange={(e) => {
 const value = e.target.value;
 if (value) {
 setStatusFilter(value);
 } else {
 setStatusFilter('');
 }
 setCurrentPage(1);
 }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
 <option value="">选择筛选条件</option>
 <option value="pending">待量尺</option>
 <option value="measuring">量尺中</option>
 <option value="measured">待复核</option>
 <option value="confirmed">待面料下单</option>
 <option value="fabric_ordered">面料已下单待到货</option>
 <option value="fabric_received">待加工</option>
 <option value="installing">安装中</option>
 </select>
 </div>
 </div>
 </div>)}
 </div>

 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-slate-50">
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">订单号</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">客户</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">电话</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">面料</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">当前处理人</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">状态</th>
 <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">金额</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">更新时间</th>
 <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">操作</th>
 </tr>
 </thead>
 <tbody>
 {loading ? (<tr>
 <td colSpan="9" className="py-12 text-center text-slate-500">
 <RefreshCw className="inline-block animate-spin h-5 w-5 mr-2"/>
 加载中...
 </td>
 </tr>) : orders.length === 0 ? (<tr>
 <td colSpan="9" className="py-12 text-center text-slate-500">暂无订单</td>
 </tr>) : (orders.map((order) => (<tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => onOrderClick && onOrderClick(order)}>
 <td className="py-3 px-4 text-sm font-medium text-slate-800">{order.order_no}</td>
 <td className="py-3 px-4 text-sm text-slate-800">{order.customer_name}</td>
 <td className="py-3 px-4 text-sm text-slate-600">{order.phone}</td>
 <td className="py-3 px-4 text-sm text-slate-600">{order.fabric_type}</td>
 <td className="py-3 px-4 text-sm text-slate-600">{order.current_handler}</td>
 <td className="py-3 px-4">
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
 {statusLabels[order.status]}
 </span>
 </td>
 <td className="py-3 px-4 text-sm font-medium text-slate-800 text-right">
 ¥{order.total_price?.toFixed(2)}
 </td>
 <td className="py-3 px-4 text-sm text-slate-500">
 {formatDate(order.updated_at)}
 </td>
 <td className="py-3 px-4 text-right">
 <ChevronRight size={18} className="inline text-slate-400"/>
 </td>
 </tr>)))}
 </tbody>
 </table>
 </div>

 {!loading && total > 10 && (<div className="p-4 border-t border-slate-200 flex items-center justify-between">
 <p className="text-sm text-slate-500">
 显示第 {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, total)} 条，共 {total} 条
 </p>
 <div className="flex items-center space-x-2">
 <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
 上一页
 </button>
 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
 const pageNum = i + Math.max(1, currentPage - 2);
 if (pageNum > totalPages)
 return null;
 return (<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 rounded-lg text-sm ${pageNum === currentPage
 ? 'bg-cyan-600 text-white'
 : 'border border-slate-200 hover:bg-slate-50'}`}>
 {pageNum}
 </button>);
 })}
 <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
 下一页
 </button>
 </div>
 </div>)}
 </div>
 </div>);
}
export default OrderList;