import React, { useState } from 'react';
import { useAppStore } from '../store/useStore';
import { ORDER_STATUS_LABELS, InstallationOrder, SiteConditionRecord } from '../types';
import { getStatusBadgeClass, formatDateTime, getFieldLabel, getPriorityLabel, hasOrderChanges } from '../utils/mockData';
import {
  X,
  MapPin,
  Phone,
  User,
  Calendar,
  Clock,
  Tag,
  FileText,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OrderDetailPanelProps {
  order: InstallationOrder;
  onClose?: () => void;
}

const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({ order, onClose }) => {
  const { currentUser, updateOrder, assignOrder, getUsersByRole, delayOrder } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: order.address,
    appointmentDate: order.appointmentDate,
    appointmentTime: order.appointmentTime,
    productType: order.productType,
    productModel: order.productModel,
    remarks: order.remarks,
    internalNotes: order.internalNotes,
  });
  const [expandedSiteCheck, setExpandedSiteCheck] = useState<string | null>(
    order.siteChecks.length > 0 ? order.siteChecks[order.siteChecks.length - 1].id : null
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [newDate, setNewDate] = useState('');

  const installerUsers = getUsersByRole('installer');
  const hasChanges = hasOrderChanges(order);

  const handleSave = () => {
    updateOrder(order.id, editData);
    setIsEditing(false);
  };

  const handleAssign = (userId: string, userName: string) => {
    assignOrder(order.id, userId, userName);
    setShowAssignModal(false);
  };

  const handleDelay = () => {
    delayOrder(order.id, delayReason, newDate || undefined);
    setShowDelayModal(false);
    setDelayReason('');
    setNewDate('');
  };

  const canEdit = currentUser?.role === 'dispatcher';
  const canAssign = currentUser?.role === 'dispatcher';
  const canDelay = currentUser?.role === 'dispatcher' || currentUser?.role === 'installer';

  return (
    <div className="order-detail-panel">
      <div className="detail-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{order.orderNo}</span>
            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <div className="text-xs text-muted mt-1">
            版本 v{order.version}
            {hasChanges && (
              <span className="change-indicator ml-2">
                <AlertTriangle size={10} />
                预约已变更
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="detail-body">
        {hasChanges && (
          <div className="alert alert-warning">
            <div className="flex items-center gap-2 font-medium mb-1">
              <AlertTriangle size={16} />
              预约信息已变更
            </div>
            <div className="text-sm">
              现场确认后预约信息有改动，请师傅注意核对最新信息。
            </div>
          </div>
        )}

        <div className="detail-section">
          <div className="detail-section-title">
            <User size={14} />
            客户信息
            {canEdit && (
              <button
                className="btn btn-ghost btn-sm ml-auto"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 size={12} />
                {isEditing ? '取消' : '编辑'}
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">客户姓名</label>
                  <input
                    className="input input-sm"
                    value={editData.customerName}
                    onChange={(e) =>
                      setEditData({ ...editData, customerName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">联系电话</label>
                  <input
                    className="input input-sm"
                    value={editData.customerPhone}
                    onChange={(e) =>
                      setEditData({ ...editData, customerPhone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">安装地址</label>
                <input
                  className="input input-sm"
                  value={editData.address}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">预约日期</label>
                  <input
                    type="date"
                    className="input input-sm"
                    value={editData.appointmentDate}
                    onChange={(e) =>
                      setEditData({ ...editData, appointmentDate: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">预约时间</label>
                  <input
                    className="input input-sm"
                    value={editData.appointmentTime}
                    onChange={(e) =>
                      setEditData({ ...editData, appointmentTime: e.target.value })
                    }
                    placeholder="如：09:00-11:00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">产品类型</label>
                  <input
                    className="input input-sm"
                    value={editData.productType}
                    onChange={(e) =>
                      setEditData({ ...editData, productType: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">产品型号</label>
                  <input
                    className="input input-sm"
                    value={editData.productModel}
                    onChange={(e) =>
                      setEditData({ ...editData, productModel: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">客户备注</label>
                <textarea
                  className="textarea input-sm"
                  value={editData.remarks}
                  onChange={(e) =>
                    setEditData({ ...editData, remarks: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">内部备注</label>
                <textarea
                  className="textarea input-sm"
                  value={editData.internalNotes}
                  onChange={(e) =>
                    setEditData({ ...editData, internalNotes: e.target.value })
                  }
                />
              </div>
              <button className="btn btn-primary btn-sm w-full" onClick={handleSave}>
                保存修改
              </button>
            </div>
          ) : (
            <>
              <div className="detail-item">
                <span className="detail-label">客户姓名</span>
                <span className="detail-value font-medium">
                  {order.customerName}
                  <span className={`tag priority-${order.priority} ml-2`}>
                    {getPriorityLabel(order.priority)}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">
                  <Phone size={12} className="inline mr-1" />
                  电话
                </span>
                <span className="detail-value">{order.customerPhone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">
                  <MapPin size={12} className="inline mr-1" />
                  地址
                </span>
                <span className="detail-value">{order.address}</span>
              </div>
            </>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <Calendar size={14} />
            安装预约
          </div>
          <div className="detail-item">
            <span className="detail-label">
              <Calendar size={12} className="inline mr-1" />
              预约日期
            </span>
            <span className="detail-value font-medium">{order.appointmentDate}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">
              <Clock size={12} className="inline mr-1" />
              预约时间
            </span>
            <span className="detail-value">{order.appointmentTime}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">
              <Tag size={12} className="inline mr-1" />
              产品
            </span>
            <span className="detail-value">
              {order.productType} - {order.productModel}
            </span>
          </div>
          {order.remarks && (
            <div className="detail-item">
              <span className="detail-label">
                <FileText size={12} className="inline mr-1" />
                备注
              </span>
              <span className="detail-value">{order.remarks}</span>
            </div>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <User size={14} />
            人员信息
          </div>
          <div className="detail-item">
            <span className="detail-label">调度员</span>
            <span className="detail-value">{order.dispatcherName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">安装师傅</span>
            <span className="detail-value">
              {order.assigneeName || (
                <span className="text-muted">未分配</span>
              )}
            </span>
          </div>
        </div>

        {order.siteChecks.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">
              <CheckCircle size={14} />
              现场条件确认
              <span className="badge badge-gray ml-2">
                {order.siteChecks.length} 次
              </span>
            </div>
            {order.siteChecks
              .slice()
              .reverse()
              .map((check, index) => (
                <SiteCheckItemView
                  key={check.id}
                  check={check}
                  isExpanded={expandedSiteCheck === check.id}
                  onToggle={() =>
                    setExpandedSiteCheck(
                      expandedSiteCheck === check.id ? null : check.id
                    )
                  }
                  isLatest={index === 0}
                />
              ))}
          </div>
        )}

        {order.delayReason && (
          <div className="detail-section">
            <div className="detail-section-title">
              <AlertTriangle size={14} />
              延期原因
            </div>
            <div className="text-sm text-warning">{order.delayReason}</div>
          </div>
        )}

        {order.rejectionReason && (
          <div className="detail-section">
            <div className="detail-section-title">
              <XCircle size={14} />
              驳回原因
            </div>
            <div className="text-sm text-danger">{order.rejectionReason}</div>
          </div>
        )}

        {order.reviewNote && (
          <div className="detail-section">
            <div className="detail-section-title">
              <FileText size={14} />
              复核意见
            </div>
            <div className="text-sm">{order.reviewNote}</div>
          </div>
        )}

        {order.internalNotes && (
          <div className="detail-section">
            <div className="detail-section-title">
              <FileText size={14} />
              内部备注
            </div>
            <div className="text-sm text-muted">{order.internalNotes}</div>
          </div>
        )}

        {order.changeLogs.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">
              <History size={14} />
              变更记录
            </div>
            <div className="timeline">
              {order.changeLogs
                .slice()
                .reverse()
                .slice(0, 10)
                .map((log) => (
                  <div key={log.id} className="timeline-item">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {getFieldLabel(log.field)}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {log.oldValue || '无'} →{' '}
                      <span className="text-primary">{log.newValue || '无'}</span>
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {log.operatorName}（{log.operatorRole === 'dispatcher' ? '调度' : log.operatorRole === 'installer' ? '师傅' : '客服'}）
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="detail-actions">
        {canAssign && !order.assignee && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAssignModal(true)}
          >
            派单
          </button>
        )}
        {canDelay && order.status !== 'completed' && order.status !== 'rejected' && (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setShowDelayModal(true)}
          >
            延期
          </button>
        )}
        {canEdit && order.status === 'site_check_failed' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => updateOrder(order.id, { status: 'scheduled' })}
          >
            重新预约
          </button>
        )}
      </div>

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" style={{ width: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">指派安装师傅</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssignModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-2">
                {installerUsers.map((user) => (
                  <button
                    key={user.id}
                    className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => handleAssign(user.id, user.name)}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted">安装师傅</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDelayModal && (
        <div className="modal-overlay" onClick={() => setShowDelayModal(false)}>
          <div className="modal-content" style={{ width: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">延期安装</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDelayModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">新预约日期（可选）</label>
                <input
                  type="date"
                  className="input"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">延期原因</label>
                <textarea
                  className="textarea"
                  placeholder="请输入延期原因..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDelayModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDelay}
                disabled={!delayReason}
              >
                确认延期
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SiteCheckItemViewProps {
  check: SiteConditionRecord;
  isExpanded: boolean;
  onToggle: () => void;
  isLatest: boolean;
}

const SiteCheckItemView: React.FC<SiteCheckItemViewProps> = ({
  check,
  isExpanded,
  onToggle,
  isLatest,
}) => {
  const passedCount = check.items.filter((i) => i.passed).length;
  const totalCount = check.items.length;

  return (
    <div
      className={`border rounded-lg mb-2 ${check.overallResult === 'passed' ? 'border-green-200' : 'border-red-200'}`}
    >
      <div
        className="p-3 cursor-pointer flex items-center gap-3"
        onClick={onToggle}
      >
        {check.overallResult === 'passed' ? (
          <CheckCircle size={18} className="text-success" />
        ) : (
          <XCircle size={18} className="text-danger" />
        )}
        <div className="flex-1">
          <div className="text-sm font-medium">
            {check.overallResult === 'passed' ? '现场确认通过' : '现场确认不通过'}
            {isLatest && <span className="badge badge-primary ml-2">最新</span>}
            {check.hasOrderChanges && (
              <span className="change-indicator ml-2">
                <AlertTriangle size={10} />
                预约已变更
              </span>
            )}
          </div>
          <div className="text-xs text-muted mt-1">
            {formatDateTime(check.checkedAt)} · {passedCount}/{totalCount} 项通过 · 版本 v{check.orderVersion}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 border-t pt-3">
          {check.items.map((item) => (
            <div
              key={item.id}
              className={`site-check-item ${item.passed === null ? '' : item.passed ? 'passed' : 'failed'}`}
            >
              {item.passed === null ? (
                <div className="w-4 h-4 rounded-full bg-gray-300" />
              ) : item.passed ? (
                <CheckCircle size={16} className="text-success flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-danger flex-shrink-0" />
              )}
              <div className="site-check-item-content">
                <div className="site-check-item-name">{item.name}</div>
                {item.remark && (
                  <div className="site-check-item-remark">{item.remark}</div>
                )}
              </div>
            </div>
          ))}
          {check.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <div className="text-xs text-muted mb-1">备注说明</div>
              <div>{check.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderDetailPanel;
