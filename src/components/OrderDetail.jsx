import { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, MapPin, Clock, FileText, AlertTriangle, CheckCircle, XCircle, Package, Scissors, Truck, Plus, Edit3, RefreshCw } from 'lucide-react';
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

function OrderDetail({ order, onBack }) {
 const [orderDetail, setOrderDetail] = useState(null);
 const [tracking, setTracking] = useState([]);
 const [fabricStock, setFabricStock] = useState([]);
 const [fabricOrder, setFabricOrder] = useState(null);
 const [loading, setLoading] = useState(true);
 const [showActionModal, setShowActionModal] = useState(false);
 const [showFabricOrderModal, setShowFabricOrderModal] = useState(false);
 const [showRemarkModal, setShowRemarkModal] = useState(false);
 const [actionType, setActionType] = useState('');
 const [actionNote, setActionNote] = useState('');
 const [fabricOrderData, setFabricOrderData] = useState({ fabric_id: '', quantity: '', supplier: '' });
 const [remarkContent, setRemarkContent] = useState('');

 useEffect(() => {
 if (order?.id) {
 fetchOrderDetail(order.id);
 }
 fetchFabricStock();
 }, [order]);

 const fetchOrderDetail = async (id) => {
 setLoading(true);
 try {
 const response = await axios.get(`/api/orders/${id}`);
 setOrderDetail(response.data);
 setTracking(response.data.tracking || []);
 setFabricOrder(response.data.fabric_order || null);
 }
 catch (error) {
 console.error('Failed to fetch order detail:', error);
 }
 setLoading(false);
 };

 const fetchFabricStock = async () => {
 try {
 const response = await axios.get('/api/fabric-stock');
 setFabricStock(response.data);
 } catch (error) {
 console.error('Failed to fetch fabric stock:', error);
 }
 };

 const formatDate = (dateString) => {
 const date = new Date(dateString);
 return date.toLocaleString('zh-CN', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
 };

 const handleAction = async (type) => {
 setActionType(type);
 setShowActionModal(true);
 };

 const handleFabricOrder = () => {
 setShowFabricOrderModal(true);
 };

 const handleAddRemark = () => {
 setShowRemarkModal(true);
 };

 const confirmAction = async () => {
 try {
 if (actionType === 'reject') {
 await axios.put(`/api/orders/${orderDetail.id}/reject`, {
 reason: actionNote,
 next_handler: '导购'
 });
 }
 else if (actionType === 'review_approve') {
 await axios.put(`/api/orders/${orderDetail.id}/review`, {
 is_approved: true,
 note: actionNote
 });
 }
 else if (actionType === 'review_reject') {
 await axios.put(`/api/orders/${orderDetail.id}/review`, {
 is_approved: false,
 note: actionNote
 });
 }
 else if (actionType === 'fabric_receive') {
 await axios.put(`/api/orders/${orderDetail.id}/fabric-receive`, {
 note: actionNote
 });
 }
 else {
 const statusMap = {
 start_measure: 'measuring',
 complete_measure: 'measured',
 start_cut: 'cutting',
 start_sew: 'sewing',
 start_iron: 'ironing',
 start_install: 'installing',
 complete_install: 'completed'
 };
 const handlerMap = {
 start_measure: '量尺师',
 complete_measure: '量尺师',
 start_cut: '裁剪工',
 start_sew: '缝纫工',
 start_iron: '熨烫工',
 start_install: '安装师傅',
 complete_install: '安装师傅'
 };
 await axios.put(`/api/orders/${orderDetail.id}`, {
 status: statusMap[actionType],
 current_handler: handlerMap[actionType],
 note: actionNote
 });
 }
 fetchOrderDetail(orderDetail.id);
 setShowActionModal(false);
 setActionNote('');
 }
 catch (error) {
 console.error('Failed to update order:', error);
 }
 };

 const submitFabricOrder = async () => {
 try {
 await axios.post('/api/fabric-order', {
 order_id: orderDetail.id,
 fabric_id: parseInt(fabricOrderData.fabric_id),
 quantity: parseInt(fabricOrderData.quantity),
 supplier: fabricOrderData.supplier,
 note: `面料下单: ${fabricOrderData.supplier}，数量 ${fabricOrderData.quantity}米`
 });
 fetchOrderDetail(orderDetail.id);
 setShowFabricOrderModal(false);
 setFabricOrderData({ fabric_id: '', quantity: '', supplier: '' });
 } catch (error) {
 console.error('Failed to create fabric order:', error);
 }
 };

 const submitRemark = async () => {
 try {
 await axios.put(`/api/orders/${orderDetail.id}`, {
 status: orderDetail.status,
 current_handler: orderDetail.current_handler,
 note: remarkContent
 });
 fetchOrderDetail(orderDetail.id);
 setShowRemarkModal(false);
 setRemarkContent('');
 } catch (error) {
 console.error('Failed to add remark:', error);
 }
 };

 const getAvailableActions = () => {
 const status = orderDetail?.status;
 const actions = [];
 if (status === 'pending') {
 actions.push({ type: 'start_measure', label: '开始量尺', icon: Clock });
 }
 else if (status === 'measuring') {
 actions.push({ type: 'complete_measure', label: '完成量尺', icon: CheckCircle });
 actions.push({ type: 'reject', label: '退回订单', icon: XCircle });
 }
 else if (status === 'measured') {
 actions.push({ type: 'review_approve', label: '复核通过', icon: CheckCircle });
 actions.push({ type: 'review_reject', label: '复核不通过', icon: AlertTriangle });
 }
 else if (status === 'needs_revision') {
 actions.push({ type: 'start_measure', label: '重新量尺', icon: Clock });
 }
 else if (status === 'confirmed') {
 actions.push({ type: 'fabric_order', label: '面料下单', icon: Package });
 }
 else if (status === 'fabric_ordered') {
 actions.push({ type: 'fabric_receive', label: '到货登记', icon: Truck });
 }
 else if (status === 'fabric_received') {
 actions.push({ type: 'start_cut', label: '开始裁剪', icon: Scissors });
 }
 else if (status === 'cutting') {
 actions.push({ type: 'start_sew', label: '开始缝纫', icon: Scissors });
 }
 else if (status === 'sewing') {
 actions.push({ type: 'start_iron', label: '开始熨烫', icon: Package });
 }
 else if (status === 'ironing') {
 actions.push({ type: 'start_install', label: '开始安装', icon: Truck });
 }
 else if (status === 'installing') {
 actions.push({ type: 'complete_install', label: '完成安装', icon: CheckCircle });
 }
 else if (status === 'rejected') {
 actions.push({ type: 'start_measure', label: '重新处理', icon: Clock });
 }
 return actions;
 };

 if (loading) {
 return (<div className="p-6 flex items-center justify-center">
 <RefreshCw className="animate-spin h-8 w-8 text-cyan-600"/>
 </div>);
 }

 if (!orderDetail) {
 return (<div className="p-6">
 <button onClick={onBack} className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-4">
 <ArrowLeft size={20}/>
 <span>返回订单列表</span>
 </button>
 <div className="text-center py-12">订单不存在</div>
 </div>);
 }

 return (<div className="p-6">
 <button onClick={onBack} className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-6">
 <ArrowLeft size={20}/>
 <span>返回订单列表</span>
 </button>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white rounded-xl shadow-sm p-6">
 <div className="flex items-start justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-slate-800">{orderDetail.order_no}</h1>
 <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[orderDetail.status]}`}>
 {statusLabels[orderDetail.status]}
 </span>
 </div>
 <div className="text-right">
 <p className="text-2xl font-bold text-cyan-600">¥{orderDetail.total_price?.toFixed(2)}</p>
 <p className="text-sm text-slate-500">订单总额</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex items-start space-x-3">
 <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <User size={20} className="text-cyan-600"/>
 </div>
 <div>
 <p className="text-sm text-slate-500">客户姓名</p>
 <p className="font-medium text-slate-800">{orderDetail.customer_name}</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <Phone size={20} className="text-green-600"/>
 </div>
 <div>
 <p className="text-sm text-slate-500">联系电话</p>
 <p className="font-medium text-slate-800">{orderDetail.phone}</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <MapPin size={20} className="text-orange-600"/>
 </div>
 <div>
 <p className="text-sm text-slate-500">安装地址</p>
 <p className="font-medium text-slate-800">{orderDetail.address}</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <FileText size={20} className="text-purple-600"/>
 </div>
 <div>
 <p className="text-sm text-slate-500">面料类型</p>
 <p className="font-medium text-slate-800">{orderDetail.fabric_type}</p>
 </div>
 </div>
 </div>

 {fabricOrder && (<div className="mt-6 pt-6 border-t border-slate-200">
 <h3 className="text-sm font-semibold text-slate-800 mb-4">面料采购信息</h3>
 <div className="bg-orange-50 rounded-lg p-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-slate-500">供应商</p>
 <p className="font-medium text-slate-800">{fabricOrder.supplier}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500">下单数量</p>
 <p className="font-medium text-slate-800">{fabricOrder.quantity} 米</p>
 </div>
 <div>
 <p className="text-xs text-slate-500">采购单状态</p>
 <p className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${fabricOrder.status === 'ordered' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
 {fabricOrder.status === 'ordered' ? '待到货' : '已到货'}
 </p>
 </div>
 <div>
 <p className="text-xs text-slate-500">下单时间</p>
 <p className="font-medium text-slate-800">{formatDate(fabricOrder.created_at)}</p>
 </div>
 </div>
 </div>
 </div>)}

 <div className="mt-6 pt-6 border-t border-slate-200">
 <h3 className="text-sm font-semibold text-slate-800 mb-4">处理人</h3>
 <div className="flex items-center space-x-3">
 <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
 {orderDetail.current_handler?.charAt(0)}
 </div>
 <div>
 <p className="font-medium text-slate-800">{orderDetail.current_handler}</p>
 <p className="text-sm text-slate-500">当前处理</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-slate-800">订单进度跟踪</h2>
 <button onClick={handleAddRemark} className="flex items-center space-x-1 px-3 py-1.5 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
 <Edit3 size={14}/>
 <span>补录备注</span>
 </button>
 </div>
 <div className="relative">
 <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
 <div className="space-y-4">
 {tracking.slice().reverse().map((item, index) => (<div key={item.id} className="relative pl-12">
 <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${index === 0 ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 bg-white'}`}>
 {index === 0 && (<div className="w-2 h-2 bg-white rounded-full"></div>)}
 </div>
 <div className="bg-slate-50 rounded-lg p-3">
 <div className="flex items-center justify-between mb-1">
 <span className="font-medium text-slate-800">{item.action}</span>
 <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
 </div>
 <p className="text-sm text-slate-600">{item.note}</p>
 <div className="flex items-center space-x-2 mt-2">
 <span className="text-xs text-slate-500">处理人:</span>
 <span className="text-xs font-medium text-cyan-600">{item.handler}</span>
 </div>
 </div>
 </div>))}
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-white rounded-xl shadow-sm p-6">
 <h2 className="text-lg font-semibold text-slate-800 mb-4">可执行操作</h2>
 <div className="space-y-3">
 {getAvailableActions().map((action) => {
 const Icon = action.icon;
 if (action.type === 'fabric_order') {
 return (<button key={action.type} onClick={handleFabricOrder} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg border border-orange-200 hover:bg-orange-50 text-orange-600 transition-colors">
 <Icon size={18}/>
 <span>{action.label}</span>
 </button>);
 }
 if (action.type === 'fabric_receive') {
 return (<button key={action.type} onClick={() => handleAction(action.type)} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg border border-green-200 hover:bg-green-50 text-green-600 transition-colors">
 <Icon size={18}/>
 <span>{action.label}</span>
 </button>);
 }
 return (<button key={action.type} onClick={() => handleAction(action.type)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors ${action.type === 'reject' || action.type === 'review_reject'
 ? 'border-red-200 hover:bg-red-50 text-red-600'
 : 'border-cyan-200 hover:bg-cyan-50 text-cyan-600'}`}>
 <Icon size={18}/>
 <span>{action.label}</span>
 </button>);
 })}
 {getAvailableActions().length === 0 && (<p className="text-center text-slate-500 py-4">暂无可用操作</p>)}
 </div>
 </div>

 <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white">
 <h3 className="font-semibold mb-2">快速信息</h3>
 <p className="text-sm opacity-90">当前订单状态: {statusLabels[orderDetail.status]}</p>
 <p className="text-sm opacity-90 mt-1">处理人: {orderDetail.current_handler}</p>
 <p className="text-sm opacity-90 mt-1">创建时间: {formatDate(orderDetail.created_at)}</p>
 </div>
 </div>
 </div>

 {showActionModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
 <h3 className="text-lg font-semibold text-slate-800 mb-4">
 {actionType === 'reject' ? '退回订单' :
 actionType === 'review_approve' ? '复核通过' :
 actionType === 'review_reject' ? '复核不通过' :
 actionType === 'fabric_receive' ? '到货登记' : '执行操作'}
 </h3>
 <div className="mb-4">
 <label className="block text-sm font-medium text-slate-600 mb-2">备注说明</label>
 <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="请输入操作说明..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" rows={3}/>
 </div>
 <div className="flex space-x-3">
 <button onClick={() => {
 setShowActionModal(false);
 setActionNote('');
 }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
 取消
 </button>
 <button onClick={confirmAction} className={`flex-1 px-4 py-2 rounded-lg transition-colors ${actionType === 'reject' || actionType === 'review_reject'
 ? 'bg-red-600 text-white hover:bg-red-700'
 : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>
 确认
 </button>
 </div>
 </div>
 </div>)}

 {showFabricOrderModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
 <h3 className="text-lg font-semibold text-slate-800 mb-4">面料下单</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-slate-600 mb-2">选择面料</label>
 <select value={fabricOrderData.fabric_id} onChange={(e) => setFabricOrderData({ ...fabricOrderData, fabric_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
 <option value="">请选择面料</option>
 {fabricStock.map((fabric) => (<option key={fabric.id} value={fabric.id}>
 {fabric.fabric_name} - {fabric.color} (库存: {fabric.quantity}米)
 </option>))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-600 mb-2">下单数量(米)</label>
 <input type="number" value={fabricOrderData.quantity} onChange={(e) => setFabricOrderData({ ...fabricOrderData, quantity: e.target.value })} placeholder="请输入数量" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-600 mb-2">供应商</label>
 <input type="text" value={fabricOrderData.supplier} onChange={(e) => setFabricOrderData({ ...fabricOrderData, supplier: e.target.value })} placeholder="请输入供应商名称" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
 </div>
 </div>
 <div className="flex space-x-3 mt-6">
 <button onClick={() => {
 setShowFabricOrderModal(false);
 setFabricOrderData({ fabric_id: '', quantity: '', supplier: '' });
 }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
 取消
 </button>
 <button onClick={submitFabricOrder} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
 确认下单
 </button>
 </div>
 </div>
 </div>)}

 {showRemarkModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
 <h3 className="text-lg font-semibold text-slate-800 mb-4">补录备注</h3>
 <div className="mb-4">
 <label className="block text-sm font-medium text-slate-600 mb-2">备注内容</label>
 <textarea value={remarkContent} onChange={(e) => setRemarkContent(e.target.value)} placeholder="请输入备注内容..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" rows={4}/>
 </div>
 <div className="flex space-x-3">
 <button onClick={() => {
 setShowRemarkModal(false);
 setRemarkContent('');
 }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
 取消
 </button>
 <button onClick={submitRemark} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
 保存备注
 </button>
 </div>
 </div>
 </div>)}
 </div>);
}

export default OrderDetail;