import React, { useState } from 'react';
import { useAppStore } from '../store/useStore';
import OrderCard from '../components/OrderCard';
import OrderDetailPanel from '../components/OrderDetailPanel';
import FilterBar from '../components/FilterBar';
import { InstallationOrder } from '../types';
import {
  List,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCheck,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react';

interface CustomerServiceViewProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const CustomerServiceView: React.FC<CustomerServiceViewProps> = ({ activeView, onViewChange }) => {
  const {
    getFilteredOrders,
    selectedOrderId,
    setSelectedOrderId,
    showOrderDetail,
    setShowOrderDetail,
    getOrderById,
    completeReview,
    rejectOrder,
    orders,
  } = useAppStore();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const filteredOrders = getFilteredOrders();

  const stats = [
    { label: '待复核', value: orders.filter(o => o.status === 'pending_review').length, icon: Clock, color: 'text-warning' },
    { label: '已驳回', value: orders.filter(o => o.status === 'rejected').length, icon: XCircle, color: 'text-danger' },
    { label: '已完成', value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: 'text-success' },
    { label: '现场确认回看', value: orders.filter(o => o.siteChecks.length > 0).length, icon: FileCheck, color: 'text-info' },
  ];

  const handleOrderClick = (order: InstallationOrder) => {
    setSelectedOrderId(order.id);
    setShowOrderDetail(true);
  };

  const handleReview = (passed: boolean) => {
    if (!selectedOrderId) return;
    completeReview(selectedOrderId, passed, reviewNote);
    setShowReviewModal(false);
    setReviewNote('');
  };

  const handleReject = () => {
    if (!selectedOrderId) return;
    rejectOrder(selectedOrderId, reviewNote);
    setShowReviewModal(false);
    setReviewNote('');
  };

  const getDisplayOrders = () => {
    switch (activeView) {
      case 'pending_review':
        return filteredOrders.filter(o => o.status === 'pending_review');
      case 'rejected':
        return filteredOrders.filter(o => o.status === 'rejected');
      case 'site_check_review':
        return filteredOrders.filter(o => o.siteChecks.length > 0);
      case 'completed':
        return filteredOrders.filter(o => o.status === 'completed');
      default:
        return filteredOrders;
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
          共 <span className="font-semibold text-gray-700">{displayOrders.length}</span> 条记录
        </div>

        <FilterBar />

        <div className="order-list overflow-y-auto flex-1">
          {displayOrders.length === 0 ? (
            <div className="empty-state">
              <List size={48} className="text-gray-300" />
              <div className="empty-state-text mt-4">暂无记录</div>
            </div>
          ) : (
            displayOrders.map((order) => (
              <div key={order.id} className="relative">
                <OrderCard
                  order={order}
                  selected={selectedOrderId === order.id}
                  onClick={() => handleOrderClick(order)}
                />
                {order.status === 'pending_review' && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      className="quick-action-btn success"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order.id);
                        setShowReviewModal(true);
                      }}
                    >
                      <ThumbsUp size={12} />
                      复核
                    </button>
                  </div>
                )}
                {order.status === 'site_check_failed' && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      className="quick-action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order.id);
                        setReviewNote('');
                        setShowReviewModal(true);
                      }}
                    >
                      <MessageSquare size={12} />
                      处理
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

      {showReviewModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div
            className="modal-content"
            style={{ width: '450px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                {selectedOrder.status === 'pending_review' ? '安装质量复核' : '问题处理'}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowReviewModal(false)}
              >
                <XCircle size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium">{selectedOrder.orderNo}</div>
                <div className="text-xs text-muted mt-1">
                  {selectedOrder.customerName} · {selectedOrder.productType}
                </div>
              </div>

              {selectedOrder.siteChecks.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">最近一次现场确认</div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedOrder.siteChecks[selectedOrder.siteChecks.length - 1].overallResult === 'passed' ? (
                        <>
                          <CheckCircle size={16} className="text-success" />
                          <span className="text-sm font-medium text-success">现场确认通过</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-danger" />
                          <span className="text-sm font-medium text-danger">现场确认不通过</span>
                        </>
                      )}
                    </div>
                    {selectedOrder.siteChecks[selectedOrder.siteChecks.length - 1].notes && (
                      <div className="text-xs text-muted">
                        {selectedOrder.siteChecks[selectedOrder.siteChecks.length - 1].notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">处理意见</label>
                <textarea
                  className="textarea"
                  placeholder="请输入复核意见或处理说明..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowReviewModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
              >
                <ThumbsDown size={16} />
                驳回
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleReview(true)}
              >
                <ThumbsUp size={16} />
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerServiceView;
