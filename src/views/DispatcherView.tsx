import React, { useState } from 'react';
import { useAppStore } from '../store/useStore';
import OrderCard from '../components/OrderCard';
import OrderDetailPanel from '../components/OrderDetailPanel';
import FilterBar from '../components/FilterBar';
import BatchEntryModal from './BatchEntryModal';
import {
  Plus,
  List,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCheck,
  Users,
} from 'lucide-react';
import { InstallationOrder, OrderStatus } from '../types';

interface DispatcherViewProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const DispatcherView: React.FC<DispatcherViewProps> = ({ activeView, onViewChange }) => {
  const {
    orders,
    getFilteredOrders,
    selectedOrderId,
    setSelectedOrderId,
    showOrderDetail,
    setShowOrderDetail,
    showBatchEntry,
    setShowBatchEntry,
    getOrderById,
    getUsersByRole,
    assignOrder,
    createOrder,
  } = useAppStore();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    productType: '',
    appointmentDate: '',
    appointmentTime: '',
  });

  const filteredOrders = getFilteredOrders();
  const selectedOrder = selectedOrderId ? getOrderById(selectedOrderId) : null;

  const stats = [
    { label: '今日预约', value: orders.filter(o => o.appointmentDate === new Date().toISOString().split('T')[0]).length, icon: Calendar, color: 'text-primary' },
    { label: '待派单', value: orders.filter(o => o.status === 'scheduled').length, icon: FileCheck, color: 'text-primary' },
    { label: '待现场确认', value: orders.filter(o => o.status === 'site_check_pending').length, icon: Clock, color: 'text-warning' },
    { label: '已完成', value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: 'text-success' },
    { label: '已延期', value: orders.filter(o => o.status === 'delayed').length, icon: AlertTriangle, color: 'text-warning' },
    { label: '已驳回', value: orders.filter(o => o.status === 'rejected').length, icon: XCircle, color: 'text-danger' },
  ];

  const handleOrderClick = (order: InstallationOrder) => {
    setSelectedOrderId(order.id);
    setShowOrderDetail(true);
  };

  const handleQuickAdd = () => {
    if (quickAddData.customerName && quickAddData.customerPhone && quickAddData.appointmentDate) {
      createOrder(quickAddData);
      setQuickAddData({
        customerName: '',
        customerPhone: '',
        address: '',
        productType: '',
        appointmentDate: '',
        appointmentTime: '',
      });
      setShowQuickAdd(false);
    }
  };

  const handleQuickAssign = (orderId: string) => {
    const installers = getUsersByRole('installer');
    if (installers.length > 0) {
      assignOrder(orderId, installers[0].id, installers[0].name);
    }
  };

  const getDisplayOrders = () => {
    switch (activeView) {
      case 'all':
        return filteredOrders;
      case 'scheduled':
        return filteredOrders.filter(o => o.status === 'scheduled');
      case 'assigned':
        return filteredOrders.filter(o => o.status === 'assigned');
      case 'site_check':
        return filteredOrders.filter(o => o.status === 'site_check_pending' || o.status === 'site_check_passed' || o.status === 'site_check_failed');
      case 'delayed':
        return filteredOrders.filter(o => o.status === 'delayed');
      case 'completed':
        return filteredOrders.filter(o => o.status === 'completed');
      default:
        return filteredOrders;
    }
  };

  const displayOrders = getDisplayOrders();

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stat-card">
                <div className="flex items-center">
                  <div className="stat-card-label">{stat.label}</div>
                  <Icon size={18} className={`stat-card-icon ${stat.color}`} />
                </div>
                <div className="stat-card-value">{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            className="btn btn-primary"
            onClick={() => setShowBatchEntry(true)}
          >
            <Plus size={16} />
            批量录入
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            <Plus size={16} />
            快速录入
          </button>
          <div className="text-sm text-muted ml-2">
            共 <span className="font-semibold text-gray-700">{displayOrders.length}</span> 条记录
          </div>
        </div>

        {showQuickAdd && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">客户姓名 *</label>
                  <input
                    className="input input-sm"
                    placeholder="请输入客户姓名"
                    value={quickAddData.customerName}
                    onChange={(e) => setQuickAddData({ ...quickAddData, customerName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">联系电话 *</label>
                  <input
                    className="input input-sm"
                    placeholder="请输入联系电话"
                    value={quickAddData.customerPhone}
                    onChange={(e) => setQuickAddData({ ...quickAddData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">产品类型</label>
                  <input
                    className="input input-sm"
                    placeholder="如：智能马桶"
                    value={quickAddData.productType}
                    onChange={(e) => setQuickAddData({ ...quickAddData, productType: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">预约日期 *</label>
                  <input
                    type="date"
                    className="input input-sm"
                    value={quickAddData.appointmentDate}
                    onChange={(e) => setQuickAddData({ ...quickAddData, appointmentDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">预约时间</label>
                  <input
                    className="input input-sm"
                    placeholder="如：09:00-11:00"
                    value={quickAddData.appointmentTime}
                    onChange={(e) => setQuickAddData({ ...quickAddData, appointmentTime: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">安装地址</label>
                  <input
                    className="input input-sm"
                    placeholder="请输入安装地址"
                    value={quickAddData.address}
                    onChange={(e) => setQuickAddData({ ...quickAddData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowQuickAdd(false)}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleQuickAdd}
                  disabled={!quickAddData.customerName || !quickAddData.customerPhone || !quickAddData.appointmentDate}
                >
                  确认录入
                </button>
              </div>
            </div>
          </div>
        )}

        <FilterBar />

        <div className="order-list overflow-y-auto flex-1">
          {displayOrders.length === 0 ? (
            <div className="empty-state">
              <List size={48} className="text-gray-300" />
              <div className="empty-state-text mt-4">暂无订单记录</div>
            </div>
          ) : (
            displayOrders.map((order) => (
              <div key={order.id} className="relative">
                <OrderCard
                  order={order}
                  selected={selectedOrderId === order.id}
                  onClick={() => handleOrderClick(order)}
                />
                {order.status === 'scheduled' && (
                  <div className="absolute top-3 right-3">
                    <button
                      className="quick-action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAssign(order.id);
                      }}
                    >
                      <Users size={12} />
                      快速派单
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showOrderDetail && selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetail(false);
            setSelectedOrderId(null);
          }}
        />
      )}

      {showBatchEntry && <BatchEntryModal />}
    </div>
  );
};

export default DispatcherView;
