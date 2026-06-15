import React, { useState } from 'react';
import { useAppStore } from '../store/useStore';
import OrderCard from '../components/OrderCard';
import OrderDetailPanel from '../components/OrderDetailPanel';
import FilterBar from '../components/FilterBar';
import SiteCheckModal from './SiteCheckModal';
import { InstallationOrder } from '../types';
import { hasUnconfirmedAppointmentChanges } from '../utils/mockData';
import {
  List,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Check,
} from 'lucide-react';

interface InstallerViewProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const InstallerView: React.FC<InstallerViewProps> = ({ activeView, onViewChange }) => {
  const {
    getFilteredOrders,
    selectedOrderId,
    setSelectedOrderId,
    showOrderDetail,
    setShowOrderDetail,
    showSiteCheckModal,
    setShowSiteCheckModal,
    getOrderById,
    currentUser,
    updateOrderStatus,
    orders,
  } = useAppStore();

  const filteredOrders = getFilteredOrders();

  const myOrders = filteredOrders.filter((o) => o.assignee === currentUser?.id);

  const stats = [
    { label: '今日任务', value: myOrders.filter(o => o.appointmentDate === new Date().toISOString().split('T')[0]).length, icon: Calendar, color: 'text-primary' },
    { label: '待现场确认', value: myOrders.filter(o => o.status === 'assigned' || o.status === 'site_check_pending').length, icon: Clock, color: 'text-warning' },
    { label: '安装中', value: myOrders.filter(o => o.status === 'installation' || o.status === 'site_check_passed').length, icon: Play, color: 'text-info' },
    { label: '已完成', value: myOrders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: 'text-success' },
  ];

  const handleOrderClick = (order: InstallationOrder) => {
    setSelectedOrderId(order.id);
    setShowOrderDetail(true);
  };

  const handleStartSiteCheck = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowSiteCheckModal(true);
  };

  const handleStartInstallation = (orderId: string) => {
    updateOrderStatus(orderId, 'installation');
  };

  const handleCompleteInstallation = (orderId: string) => {
    updateOrderStatus(orderId, 'pending_review');
  };

  const getDisplayOrders = () => {
    switch (activeView) {
      case 'my_tasks':
        return myOrders.filter((o) =>
          ['assigned', 'site_check_pending', 'site_check_passed', 'installation'].includes(o.status)
        );
      case 'pending_check':
        return myOrders.filter((o) =>
          o.status === 'assigned' || o.status === 'site_check_pending'
        );
      case 'installation':
        return myOrders.filter((o) =>
          o.status === 'site_check_passed' || o.status === 'installation'
        );
      case 'completed':
        return myOrders.filter((o) => o.status === 'completed');
      case 'failed':
        return myOrders.filter((o) => o.status === 'site_check_failed');
      default:
        return myOrders;
    }
  };

  const displayOrders = getDisplayOrders();
  const selectedOrder = selectedOrderId ? getOrderById(selectedOrderId) : null;

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

        <div className="text-sm text-muted mb-4">
          我的任务共 <span className="font-semibold text-gray-700">{displayOrders.length}</span> 条
        </div>

        <FilterBar showAssigneeFilter={false} />

        <div className="order-list overflow-y-auto flex-1">
          {displayOrders.length === 0 ? (
            <div className="empty-state">
              <List size={48} className="text-gray-300" />
              <div className="empty-state-text mt-4">暂无任务</div>
            </div>
          ) : (
            displayOrders.map((order) => (
              <div key={order.id} className="relative">
                <OrderCard
                  order={order}
                  selected={selectedOrderId === order.id}
                  onClick={() => handleOrderClick(order)}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  {(order.status === 'assigned' || order.status === 'site_check_pending') && (
                    <button
                      className="quick-action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartSiteCheck(order.id);
                      }}
                    >
                      <CheckCircle size={12} />
                      现场确认
                    </button>
                  )}
                  {order.status === 'site_check_passed' && (
                    <button
                      className="quick-action-btn success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartInstallation(order.id);
                      }}
                    >
                      <Play size={12} />
                      开始安装
                    </button>
                  )}
                  {order.status === 'installation' && (
                    <button
                      className="quick-action-btn success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteInstallation(order.id);
                      }}
                    >
                      <Check size={12} />
                      安装完成
                    </button>
                  )}
                  {hasUnconfirmedAppointmentChanges(order) && order.status !== 'completed' && order.status !== 'rejected' && (
                    <button
                      className="quick-action-btn warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartSiteCheck(order.id);
                      }}
                    >
                      <AlertTriangle size={12} />
                      重新确认
                    </button>
                  )}
                </div>
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

      {showSiteCheckModal && selectedOrder && (
        <SiteCheckModal
          orderId={selectedOrder.id}
          onClose={() => setShowSiteCheckModal(false)}
        />
      )}
    </div>
  );
};

export default InstallerView;
