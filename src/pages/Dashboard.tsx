import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  Search,
  ClipboardList,
  Clock,
  CreditCard,
  FileCheck,
  Wrench,
  Package,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { OrderStatus } from '../types/order';
import { formatMoney } from '../utils/format';

const roleCards: Record<string, { key: OrderStatus; label: string; icon: React.ReactNode }[]> = {
  '客服': [
    { key: 'pending_assign', label: '待派单', icon: <Clock className="w-4 h-4 text-amber-500" /> },
    { key: 'pending_review', label: '待审核', icon: <FileCheck className="w-4 h-4 text-cyan-500" /> },
    { key: 'completed', label: '已完成', icon: <FileCheck className="w-4 h-4 text-green-500" /> },
  ],
  '工程师': [
    { key: 'pending_work', label: '待施工', icon: <Wrench className="w-4 h-4 text-blue-500" /> },
    { key: 'pending_charge', label: '待收费', icon: <CreditCard className="w-4 h-4 text-orange-500" /> },
    { key: 'pending_receipt', label: '待回单', icon: <FileCheck className="w-4 h-4 text-purple-500" /> },
    { key: 'pending_return', label: '待退回', icon: <Package className="w-4 h-4 text-pink-500" /> },
  ],
  '配件管理员': [
    { key: 'pending_return', label: '待配件确认', icon: <Package className="w-4 h-4 text-pink-500" /> },
  ],
};

const roleStatusFilters: Record<string, { key: OrderStatus | 'all'; label: string; icon: React.ReactNode }[]> = {
  '客服': [
    { key: 'all', label: '全部', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'pending_assign', label: '待派单', icon: <Clock className="w-4 h-4" /> },
    { key: 'pending_review', label: '待审核', icon: <Clock className="w-4 h-4" /> },
    { key: 'completed', label: '已完成', icon: <FileCheck className="w-4 h-4" /> },
  ],
  '工程师': [
    { key: 'all', label: '全部', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'pending_work', label: '待施工', icon: <Wrench className="w-4 h-4" /> },
    { key: 'working', label: '施工中', icon: <Wrench className="w-4 h-4" /> },
    { key: 'pending_charge', label: '待收费', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'pending_receipt', label: '待回单', icon: <FileCheck className="w-4 h-4" /> },
    { key: 'pending_return', label: '待退回', icon: <Package className="w-4 h-4" /> },
  ],
  '配件管理员': [
    { key: 'all', label: '全部', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'pending_return', label: '待配件确认', icon: <Package className="w-4 h-4" /> },
  ],
};

export const Dashboard = () => {
  const {
    currentRole,
    currentUser,
    searchKeyword,
    statusFilter,
    setSearchKeyword,
    setStatusFilter,
    getVisibleOrders,
    isOrderVisible,
  } = useOrderStore();

  const cards = roleCards[currentRole] || [];
  const statusFilters = roleStatusFilters[currentRole] || [];
  const visibleOrders = getVisibleOrders();

  const stats = useMemo(() => {
    const result: Record<string, number> = {};
    statusFilters.forEach((f) => {
      if (f.key === 'all') {
        result[f.key] = visibleOrders.length;
      } else {
        result[f.key] = visibleOrders.filter((o) => o.status === f.key).length;
      }
    });
    return result;
  }, [visibleOrders, statusFilters]);

  const todoStats = useMemo(() => {
    if (currentRole === '客服') {
      return visibleOrders.filter(
        (o) => o.status === 'pending_assign' || o.status === 'pending_review'
      ).length;
    } else if (currentRole === '工程师') {
      return visibleOrders.filter(
        (o) =>
          o.status === 'pending_work' ||
          o.status === 'working' ||
          o.status === 'pending_charge' ||
          o.status === 'pending_receipt' ||
          o.status === 'pending_return'
      ).length;
    } else if (currentRole === '配件管理员') {
      return visibleOrders.filter(
        (o) => o.status === 'pending_return' && o.partReturn.status === 'submitted'
      ).length;
    }
    return 0;
  }, [visibleOrders, currentRole, currentUser]);

  const filteredOrders = useMemo(() => {
    let result = [...visibleOrders];

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(kw) ||
          o.customer.name.toLowerCase().includes(kw) ||
          o.customer.phone.includes(kw) ||
          o.appliance.type.toLowerCase().includes(kw) ||
          o.appliance.brand.toLowerCase().includes(kw) ||
          o.appliance.fault.toLowerCase().includes(kw)
      );
    }

    result.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    return result;
  }, [visibleOrders, statusFilter, searchKeyword]);

  const navigate = useNavigate();
  const goToDetail = (id: string) => {
    navigate(`/order/${id}`);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          {currentRole === '客服' && <Phone className="w-4 h-4" />}
          {currentRole === '工程师' && <Wrench className="w-4 h-4" />}
          {currentRole === '配件管理员' && <Package className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm text-blue-800 font-medium">
            当前身份：{currentRole}（{currentUser}）
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            您有 <span className="font-bold">{todoStats}</span> 条待办事项
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((item) => (
          <div
            key={item.key}
            className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setStatusFilter(item.key)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{item.label}</span>
              {item.icon}
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-800">
              {visibleOrders.filter((o) => o.status === item.key).length}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">状态筛选：</span>
            <div className="flex gap-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                  <span
                    className={`text-xs ${
                      statusFilter === filter.key ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {stats[filter.key] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索工单号、客户、家电..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  工单信息
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  客户信息
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  分配工程师
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  收费金额
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    暂无工单数据
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => goToDetail(order.id)}
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800 text-sm">{order.id}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {order.appliance.brand} {order.appliance.type} -{' '}
                        {order.appliance.fault.slice(0, 20)}
                        {order.appliance.fault.length > 20 ? '...' : ''}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        创建于 {order.createdAt}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {order.customer.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {order.customer.phone}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.customer.address.slice(0, 15)}...
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {order.assignedTo || (
                        <span className="text-amber-600">未分配</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {order.charge.amount > 0 ? (
                        <div>
                          <span className="text-sm font-medium text-slate-800">
                            {formatMoney(order.charge.amount)}
                          </span>
                          {order.charge.confirmedAt && (
                            <div className="text-xs text-green-600 mt-0.5">已确认</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} size="sm" />
                      {order.status === 'pending_return' && order.partReturn.status === 'submitted' && (
                        <div className="text-xs text-pink-600 mt-1">待配件管理员确认</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToDetail(order.id);
                        }}
                      >
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 text-sm text-slate-500 flex items-center justify-between">
          <span>
            共 {filteredOrders.length} 条记录
            {searchKeyword && `（搜索：${searchKeyword}）`}
          </span>
          <span className="text-xs text-slate-400">
            提示：点击行或「查看详情」进入工单详情
          </span>
        </div>
      </div>
    </div>
  );
};
