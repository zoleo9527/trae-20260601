import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Palette,
  Clock,
  LogOut,
  Upload,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Order, OrderStatus, STATUS_LABELS, TOOTH_TYPES, SHADE_OPTIONS } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';

export default function CustomerService() {
  const navigate = useNavigate();
  const {
    initMockData,
    getOrdersForCustomerService,
    setCurrentRole,
    currentRole,
    currentUser,
    setCurrentUser,
  } = useAppStore();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    toothType: '',
    shade: '',
    deliveryDate: '',
  });

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('CUSTOMER_SERVICE');
    }
    if (!currentUser) {
      setCurrentUser('客服小王');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const result = getOrdersForCustomerService({
    page,
    pageSize,
    keyword: keyword || undefined,
    status: statusFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handleLogout = () => {
    setCurrentRole(null);
    navigate('/');
  };

  const handleCreateOrder = () => {
    if (!formData.customerName || !formData.toothType || !formData.shade || !formData.deliveryDate) {
      return;
    }

    useAppStore.getState().createOrder({
      customerName: formData.customerName,
      toothType: formData.toothType,
      shade: formData.shade,
      deliveryDate: formData.deliveryDate,
    });

    setShowCreateModal(false);
    setFormData({ customerName: '', toothType: '', shade: '', deliveryDate: '' });
  };

  const handleResetFilter = () => {
    setKeyword('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleUpload = (order: Order) => {
    navigate(`/customer-service/order/${order.id}`);
  };

  const stats = [
    { label: '全部订单', value: result.total, color: 'text-primary-600', bg: 'bg-primary-50' },
    {
      label: '待上传扫描',
      value: useAppStore.getState().orders.filter((o) => o.status === 'PENDING').length,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: '处理中',
      value: useAppStore
        .getState()
        .orders.filter((o) =>
          ['SCAN_UPLOADED', 'PROCESSING', 'ASSIGNED', 'IN_PRODUCTION'].includes(o.status)
        ).length,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '已完成',
      value: useAppStore.getState().orders.filter((o) => o.status === 'COMPLETED').length,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">接单客服工作台</h1>
                <p className="text-xs text-neutral-500">订单管理 · 扫描上传</p>
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
                  <FileText size={24} className={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">订单列表</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
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
                  <option value="" className="text-neutral-900">全部状态</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value} className="text-neutral-900">
                      {label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-white/60" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                  />
                  <span className="text-white/60">至</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                  />
                </div>
                <button
                  onClick={handleResetFilter}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                >
                  <Filter size={16} />
                  重置
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white text-primary-600 font-medium hover:bg-primary-50 transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  新建订单
                </button>
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
                    <td colSpan={7} className="px-6 py-16 text-center text-neutral-500">
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
                        <span className="inline-flex items-center gap-1.5 text-neutral-700">
                          <Palette size={14} className="text-primary-500" />
                          {order.toothType}
                        </span>
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
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpload(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors"
                          >
                            <Upload size={14} />
                            上传扫描
                          </button>
                        )}
                        {order.status !== 'PENDING' && (
                          <button
                            onClick={() => handleUpload(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 text-neutral-600 text-sm font-medium hover:bg-neutral-100 transition-colors"
                          >
                            <FileText size={14} />
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">新建订单</h3>
              <p className="text-sm text-neutral-500 mt-1">请填写订单基本信息</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  客户姓名 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="请输入客户姓名"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  义齿类型 <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.toothType}
                  onChange={(e) => setFormData({ ...formData, toothType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">请选择义齿类型</option>
                  {TOOTH_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  色号 <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.shade}
                  onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">请选择色号</option>
                  {SHADE_OPTIONS.map((shade) => (
                    <option key={shade} value={shade}>
                      {shade}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  交付日期 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={
                  !formData.customerName ||
                  !formData.toothType ||
                  !formData.shade ||
                  !formData.deliveryDate
                }
                className="px-5 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建订单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
