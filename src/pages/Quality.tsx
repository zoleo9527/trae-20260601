import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  FileText,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { OrderStatus, STATUS_LABELS } from '@/types';

export default function Quality() {
  const navigate = useNavigate();
  const {
    initMockData,
    getOrdersForQuality,
    setCurrentRole,
    currentRole,
    currentUser,
    setCurrentUser,
  } = useAppStore();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('QUALITY');
    }
    if (!currentUser) {
      setCurrentUser('质检小张');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const result = getOrdersForQuality({
    page,
    pageSize,
    keyword: keyword || undefined,
    status: statusFilter || undefined,
  });

  const handleLogout = () => {
    setCurrentRole(null);
    navigate('/');
  };

  const handleCheck = (orderId: string) => {
    navigate(`/quality/order/${orderId}`);
  };

  const stats = [
    { label: '全部订单', value: result.total, color: 'text-primary-600', bg: 'bg-primary-50' },
    {
      label: '待质检',
      value: useAppStore.getState().orders.filter((o) => o.status === 'PENDING_INSPECTION').length,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: '已通过',
      value: useAppStore.getState().orders.filter((o) => o.status === 'COMPLETED').length,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      label: '已返工',
      value: useAppStore.getState().orders.filter((o) => o.status === 'REWORK').length,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">质检工作台</h1>
                <p className="text-xs text-neutral-500">质量检验 · 返工管理</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Shield size={24} className={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">质检订单列表</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
                  />
                  <input
                    type="text"
                    placeholder="搜索订单号/客户/义齿类型"
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(1);
                    }}
                    className="w-64 pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as OrderStatus | '');
                    setPage(1);
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                >
                  <option value="" className="text-neutral-900">
                    全部状态
                  </option>
                  {(['PENDING_INSPECTION', 'COMPLETED', 'REWORK'] as OrderStatus[]).map(
                    (status) => (
                      <option key={status} value={status} className="text-neutral-900">
                        {STATUS_LABELS[status]}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    客户姓名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    义齿类型
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    色号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    交付日期
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    返工次数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {result.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-neutral-300" />
                        <p>暂无订单数据</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  result.data.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-primary-600">{order.orderNo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User size={14} className="text-primary-600" />
                          </div>
                          <span className="text-neutral-900">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-neutral-700">{order.toothType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-medium text-sm">
                          {order.shade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-neutral-700">
                          <Clock size={14} className="text-neutral-400" />
                          {order.deliveryDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.reworkCount > 0 ? (
                          <span className="px-2.5 py-1 rounded-md bg-danger-100 text-danger-700 font-medium text-sm">
                            {order.reworkCount} 次
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status === 'PENDING_INSPECTION' && (
                          <button
                            onClick={() => handleCheck(order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors"
                          >
                            <CheckCircle size={14} />
                            开始质检
                          </button>
                        )}
                        {order.status !== 'PENDING_INSPECTION' && (
                          <button
                            onClick={() => handleCheck(order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 text-neutral-600 text-sm font-medium hover:bg-neutral-100 transition-colors"
                          >
                            <XCircle size={14} />
                            查看详情
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            pageSize={pageSize}
            totalItems={result.total}
            onPageChange={setPage}
          />
        </div>
      </main>
    </div>
  );
}
