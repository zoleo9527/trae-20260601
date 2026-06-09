import { useEffect, useState } from 'react';
import { useStore } from '../stores/appStore';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function SalesList() {
  const { sales, fetchSales, resetSale, cancelSale, loading } = useStore();
  const { currentUser } = useStore();

  const [filters, setFilters] = useState({
    status: '',
    date: '',
    customerId: '',
  });

  useEffect(() => {
    fetchSales(filters);
  }, [filters]);

  const handleReset = async (id) => {
    if (!confirm('确定要重置此单据吗？')) return;
    try {
      await resetSale(id, currentUser.id);
      // store 层已处理列表刷新和 currentSale 同步
      alert('单据已重置为草稿');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('确定要取消此销售单吗？')) return;
    try {
      await cancelSale(id, currentUser.id);
      // store 层已处理列表刷新和 currentSale 同步
      alert('销售单已取消');
    } catch (err) {
      alert(err.message);
    }
  };

  const canReset = (status) => status === 'rejected' || status === 'cancelled';
  const canCancel = (status) => status === 'draft' || status === 'pending_confirmation';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">销售单列表</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending_confirmation">待农技员确认</option>
              <option value="pending_warehouse">待仓管出库</option>
              <option value="completed">已完成</option>
              <option value="rejected">已退回</option>
              <option value="cancelled">已取消</option>
              <option value="stock_insufficient">库存不足</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">日期</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="col-span-2 flex items-end">
            <button
              onClick={() => setFilters({ status: '', date: '', customerId: '' })}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">赊账</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                  暂无销售单
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {sale.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {sale.customer_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    ¥{sale.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="px-6 py-4">
                    {sale.is_credit ? (
                      <span className="text-sm text-orange-600">是</span>
                    ) : (
                      <span className="text-sm text-gray-400">否</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/trace/${sale.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye size={18} />
                      </Link>

                      {canReset(sale.status) && (
                        <button
                          onClick={() => handleReset(sale.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="重置"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}

                      {canCancel(sale.status) && (
                        <button
                          onClick={() => handleCancel(sale.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="取消"
                        >
                          <AlertTriangle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
