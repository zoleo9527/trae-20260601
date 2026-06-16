import { useState } from 'react';
import { Plus, Search, Package, MapPin, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { reasonOptions } from '../data/mockData';

export default function StockRequestPage() {
  const { stores, products, currentUser, addStockRequest } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState(currentUser.storeId?.toString() || '');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [requestQty, setRequestQty] = useState('');
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [affectsBusiness, setAffectsBusiness] = useState(false);

  const filteredProducts = products.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !selectedProduct || !requestQty || !reason) return;
    
    addStockRequest({
      storeId: Number(selectedStore),
      userId: currentUser.id,
      productId: Number(selectedProduct),
      requestQty: Number(requestQty),
      reason: reason === '其他' ? otherReason : reason,
      affectsBusiness,
      expectedDate,
    });

    setShowForm(false);
    setSelectedProduct('');
    setRequestQty('');
    setReason('');
    setOtherReason('');
    setExpectedDate('');
    setAffectsBusiness(false);
  };

  const product = products.find(p => p.id === Number(selectedProduct));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">缺货申领</h2>
          <p className="text-gray-500 mt-1">提交门店缺货申请，等待审核</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          新建申领
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">创建缺货申领</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店</label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">请选择门店</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索商品..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {searchTerm && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p.id.toString());
                          setSearchTerm('');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                      >
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{p.name} ({p.spec})</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedProduct && !searchTerm && (
                  <p className="mt-2 text-sm text-gray-600">
                    {product?.name} · {product?.spec} · {product?.category}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申领数量</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={requestQty}
                    onChange={(e) => setRequestQty(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="ml-2 text-gray-500">{product?.unit}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期望到货日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="affects-business"
                checked={affectsBusiness}
                onChange={(e) => setAffectsBusiness(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded"
              />
              <label htmlFor="affects-business" className="ml-2 flex items-center text-sm font-medium text-gray-700">
                <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />
                影响营业
              </label>
              <p className="ml-2 text-sm text-gray-500">勾选此项将优先处理</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">缺货原因</label>
              <div className="flex flex-wrap gap-2">
                {reasonOptions.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      reason === r
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {reason === '其他' && (
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="请输入具体原因..."
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                提交申领
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">商品库存列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">冷链</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 mr-3 text-primary-600" />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.spec}</td>
                  <td className="px-6 py-4 text-gray-600">{product.unit}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    {product.isCold ? (
                      <span className="flex items-center text-blue-600">
                        <MapPin className="w-4 h-4 mr-1" /> 是
                      </span>
                    ) : (
                      <span className="text-gray-400">否</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setShowForm(true);
                        setSelectedProduct(product.id.toString());
                      }}
                      className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      申领
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
