import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Search, RefreshCw, Edit2, Save, X } from 'lucide-react';
import axios from 'axios';
function FabricStock() {
 const [stocks, setStocks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [editingId, setEditingId] = useState(null);
 const [editData, setEditData] = useState({});
 useEffect(() => {
 fetchStocks();
 }, []);
 const fetchStocks = async () => {
 setLoading(true);
 try {
 const response = await axios.get('/api/fabric-stock');
 setStocks(response.data);
 }
 catch (error) {
 console.error('Failed to fetch fabric stock:', error);
 }
 setLoading(false);
 };
 const handleEdit = (stock) => {
 setEditingId(stock.id);
 setEditData({ ...stock });
 };
 const handleSave = async () => {
 try {
 await axios.put(`/api/fabric-stock/${editingId}`, {
 quantity: editData.quantity
 });
 fetchStocks();
 setEditingId(null);
 setEditData({});
 }
 catch (error) {
 console.error('Failed to update stock:', error);
 }
 };
 const filteredStocks = stocks.filter((stock) => stock.fabric_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 stock.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
 stock.texture.toLowerCase().includes(searchTerm.toLowerCase()));
 const getStockStatus = (quantity) => {
 if (quantity < 10)
 return { label: '库存不足', color: 'text-red-600 bg-red-100' };
 if (quantity < 30)
 return { label: '库存偏低', color: 'text-amber-600 bg-amber-100' };
 return { label: '库存充足', color: 'text-green-600 bg-green-100' };
 };
 return (<div className="p-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-800">面料库存</h1>
 <p className="text-slate-500">实时监控面料库存状态</p>
 </div>
 <div className="flex items-center space-x-3">
 <button onClick={fetchStocks} className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
 <RefreshCw size={18}/>
 <span>刷新</span>
 </button>
 <button className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
 <Plus size={18}/>
 <span>新增面料</span>
 </button>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm">
 <div className="p-4 border-b border-slate-200">
 <div className="relative max-w-md">
 <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
 <input type="text" placeholder="搜索面料名称、颜色、材质..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"/>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-slate-50">
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">面料名称</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">颜色</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">材质</th>
 <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">单价(元/米)</th>
 <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">库存(米)</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">状态</th>
 <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">操作</th>
 </tr>
 </thead>
 <tbody>
 {loading ? (<tr>
 <td colSpan="7" className="py-12 text-center text-slate-500">
 <RefreshCw className="inline-block animate-spin h-5 w-5 mr-2"/>
 加载中...
 </td>
 </tr>) : filteredStocks.length === 0 ? (<tr>
 <td colSpan="7" className="py-12 text-center text-slate-500">暂无数据</td>
 </tr>) : (filteredStocks.map((stock) => (<tr key={stock.id} className="border-b border-slate-100 hover:bg-slate-50">
 <td className="py-4 px-4">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
 <Package size={20} className="text-cyan-600"/>
 </div>
 <span className="font-medium text-slate-800">{stock.fabric_name}</span>
 </div>
 </td>
 <td className="py-4 px-4 text-slate-600">{stock.color}</td>
 <td className="py-4 px-4 text-slate-600">{stock.texture}</td>
 <td className="py-4 px-4 text-right text-slate-800">¥{stock.price_per_meter}</td>
 <td className="py-4 px-4">
 {editingId === stock.id ? (<div className="flex items-center justify-end space-x-2">
 <input type="number" value={editData.quantity} onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 0 })} className="w-20 px-2 py-1 border border-slate-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
 <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
 <Save size={16}/>
 </button>
 <button onClick={() => {
 setEditingId(null);
 setEditData({});
 }} className="p-1 text-slate-500 hover:bg-slate-100 rounded">
 <X size={16}/>
 </button>
 </div>) : (<span className={`text-right font-medium ${stock.quantity < 10 ? 'text-red-600' :
 stock.quantity < 30 ? 'text-amber-600' : 'text-green-600'}`}>
 {stock.quantity}
 </span>)}
 </td>
 <td className="py-4 px-4">
 <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(stock.quantity).color}`}>
 {stock.quantity < 10 && <AlertTriangle size={12}/>}
 <span>{getStockStatus(stock.quantity).label}</span>
 </span>
 </td>
 <td className="py-4 px-4 text-right">
 {editingId !== stock.id && (<button onClick={() => handleEdit(stock)} className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
 <Edit2 size={18}/>
 </button>)}
 </td>
 </tr>)))}
 </tbody>
 </table>
 </div>
 </div>
 </div>);
}
export default FabricStock;