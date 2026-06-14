import { useState } from 'react';
import type { PawnRecord, UserRole, OperationLog, PhotoItem } from '../types';
import { roleNames, statusNames, statusColors } from '../mockData';
import PhotoViewer from './PhotoViewer';
import '../styles/RecordDetailDrawer.css';

interface Props {
  record: PawnRecord;
  currentRole: UserRole;
  onClose: () => void;
  onUpdate: (record: PawnRecord) => void;
}

type ActionPanel = 'info' | 'storage' | 'photo' | 'history';

export default function RecordDetailDrawer({ record, currentRole, onClose, onUpdate }: Props) {
  const [activePanel, setActivePanel] = useState<ActionPanel>('info');
  const [viewerPhoto, setViewerPhoto] = useState<PhotoItem | null>(null);
  const [viewerPhotos, setViewerPhotos] = useState<PhotoItem[]>([]);

  const [storageLocation, setStorageLocation] = useState(record.storageLocation || '');
  const [storageRemark, setStorageRemark] = useState(record.storageRemark || '');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [photoRemark, setPhotoRemark] = useState(record.photoRemark || '');
  const [photoRejectReason, setPhotoRejectReason] = useState('');
  const [showPhotoRejectForm, setShowPhotoRejectForm] = useState(false);

  const [supplementRemark, setSupplementRemark] = useState('');
  const [showSupplement, setShowSupplement] = useState(false);

  const now = new Date().toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).replace(/\//g, '-');

  const operatorName = currentRole === 'counter' ? '李评估师' : currentRole === 'warehouse' ? '赵库管' : '孙会计';

  const addOperationLog = (operation: string, reason?: string, remark?: string): OperationLog => ({
    id: `LOG${Date.now()}`,
    operation,
    operator: operatorName,
    operatorRole: currentRole,
    operateTime: now,
    reason,
    remark
  });

  const handleStorageConfirm = () => {
    if (!storageLocation.trim()) {
      alert('请填写库位信息');
      return;
    }

    const updated: PawnRecord = {
      ...record,
      storageStatus: 'stored',
      storageLocation: storageLocation.trim(),
      storedBy: operatorName,
      storageTime: now,
      storageRemark: storageRemark.trim(),
      status: 'pending_photo',
      currentHandler: 'warehouse',
      operationLogs: [
        ...record.operationLogs,
        addOperationLog('入库完成', undefined, storageRemark.trim() || undefined)
      ],
      updatedAt: now
    };
    onUpdate(updated);
    setActivePanel('photo');
  };

  const handleStorageReject = () => {
    if (!rejectReason.trim()) {
      alert('请填写退回原因');
      return;
    }

    const updated: PawnRecord = {
      ...record,
      storageStatus: 'rejected',
      rejectReason: rejectReason.trim(),
      status: 'abnormal',
      abnormalReason: '入库被退回，需评估师重新核验',
      currentHandler: 'counter',
      operationLogs: [
        ...record.operationLogs,
        addOperationLog('入库退回', '入库被退回', rejectReason.trim())
      ],
      updatedAt: now
    };
    onUpdate(updated);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handlePhotoConfirm = () => {
    if (!record.photos || record.photos.length === 0) {
      alert('请先上传照片');
      return;
    }

    const updated: PawnRecord = {
      ...record,
      photoStatus: 'taken',
      photoTakenBy: operatorName,
      photoTime: now,
      photoRemark: photoRemark.trim(),
      status: 'pending_review',
      currentHandler: 'counter',
      operationLogs: [
        ...record.operationLogs,
        addOperationLog('照片留证完成', undefined, photoRemark.trim() || undefined)
      ],
      updatedAt: now
    };
    onUpdate(updated);
  };

  const handlePhotoReject = () => {
    if (!photoRejectReason.trim()) {
      alert('请填写退回原因');
      return;
    }

    const updated: PawnRecord = {
      ...record,
      photoStatus: 'rejected',
      photoRejectReason: photoRejectReason.trim(),
      status: 'abnormal',
      abnormalReason: '照片留证被退回，需重新拍摄',
      currentHandler: 'warehouse',
      operationLogs: [
        ...record.operationLogs,
        addOperationLog('照片留证退回', '照片质量不合格', photoRejectReason.trim())
      ],
      updatedAt: now
    };
    onUpdate(updated);
    setShowPhotoRejectForm(false);
    setPhotoRejectReason('');
  };

  const handlePhotoApprove = () => {
    const updated: PawnRecord = {
      ...record,
      status: 'pending_review',
      currentHandler: 'finance',
      operationLogs: [
        ...record.operationLogs,
        addOperationLog('照片审核通过', '照片清晰，信息完整，可进入财务环节')
      ],
      updatedAt: now
    };
    onUpdate(updated);
  };

  const handleFinanceConfirm = () => {
    const updated: PawnRecord = {
      ...record,
      financeConfirmed: true,
      financeConfirmedBy: operatorName,
      financeConfirmTime: now,
      status: 'completed',
      currentHandler: 'counter',
      operationLogs: [
        ...record.operationLogs,
        addOperationLog('财务确认放款', '手续齐全，同意放款', `¥${record.pawnAmount.toLocaleString()} 已划转客户账户`)
      ],
      updatedAt: now
    };
    onUpdate(updated);
  };

  const handleSupplementSave = () => {
    if (!supplementRemark.trim()) {
      alert('请填写补充备注');
      return;
    }

    const updated: PawnRecord = {
      ...record,
      operationLogs: [
        ...record.operationLogs,
        addOperationLog('补充备注', undefined, supplementRemark.trim())
      ],
      updatedAt: now
    };
    onUpdate(updated);
    setSupplementRemark('');
    setShowSupplement(false);
  };

  const handleAbnormalResolve = () => {
    if (record.storageStatus === 'rejected') {
      const updated: PawnRecord = {
        ...record,
        storageStatus: 'pending',
        rejectReason: undefined,
        status: 'pending_storage',
        abnormalReason: undefined,
        currentHandler: 'warehouse',
        operationLogs: [
          ...record.operationLogs,
          addOperationLog('异常处理完成', '已重新核验，可入库', '客户配合开箱检查，确认为正品')
        ],
        updatedAt: now
      };
      onUpdate(updated);
    } else if (record.photoStatus === 'rejected') {
      const updated: PawnRecord = {
        ...record,
        photoStatus: 'pending',
        photoRejectReason: undefined,
        status: 'pending_photo',
        abnormalReason: undefined,
        currentHandler: 'warehouse',
        operationLogs: [
          ...record.operationLogs,
          addOperationLog('异常处理完成', '已重新拍照', '照片已按要求重新拍摄')
        ],
        updatedAt: now
      };
      onUpdate(updated);
    }
  };

  const handlePhotoClick = (photo: PhotoItem) => {
    setViewerPhotos(record.photos || []);
    setViewerPhoto(photo);
  };

  const canHandleStorage = currentRole === 'warehouse' && record.storageStatus === 'pending';
  const canHandlePhoto = currentRole === 'warehouse' && record.photoStatus === 'pending';
  const canApprovePhoto = currentRole === 'counter' && record.photoStatus === 'taken' && record.status === 'pending_review';
  const canRejectPhoto = currentRole === 'counter' && record.photoStatus === 'taken' && record.status === 'pending_review';
  const canConfirmFinance = currentRole === 'finance' && record.status === 'pending_review' && record.photoStatus === 'taken' && !record.financeConfirmed;
  const canResolveAbnormal = currentRole === record.currentHandler && record.status === 'abnormal';

  const panels: { key: ActionPanel; label: string; icon: string }[] = [
    { key: 'info', label: '基本信息', icon: '📄' },
    { key: 'storage', label: '入库保管', icon: '📦' },
    { key: 'photo', label: '照片留证', icon: '📷' },
    { key: 'history', label: '历史记录', icon: '📋' }
  ];

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="record-detail-drawer">
        <div className="drawer-header">
          <div className="drawer-title">
            <h2>{record.pawnNo}</h2>
            <span 
              className="status-badge main-status"
              style={{ 
                backgroundColor: `${statusColors[record.status]}15`,
                color: statusColors[record.status] 
              }}
            >
              {statusNames[record.status]}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {record.status === 'abnormal' && (
          <div className="abnormal-alert">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <span className="alert-title">异常提醒</span>
              <span className="alert-desc">{record.abnormalReason}</span>
              {record.rejectReason && <span className="alert-reason">入库退回原因：{record.rejectReason}</span>}
              {record.photoRejectReason && <span className="alert-reason">照片退回原因：{record.photoRejectReason}</span>}
            </div>
            {canResolveAbnormal && (
              <button className="resolve-btn" onClick={handleAbnormalResolve}>
                标记已处理
              </button>
            )}
          </div>
        )}

        <div className="drawer-tabs">
          {panels.map(panel => (
            <button
              key={panel.key}
              className={`drawer-tab ${activePanel === panel.key ? 'active' : ''}`}
              onClick={() => setActivePanel(panel.key)}
            >
              <span className="tab-icon">{panel.icon}</span>
              <span>{panel.label}</span>
            </button>
          ))}
        </div>

        <div className="drawer-content">
          {activePanel === 'info' && (
            <div className="info-panel">
              <section className="info-section">
                <h3>当品信息</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">物品名称</span>
                    <span className="value">{record.itemName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">物品类别</span>
                    <span className="value">{record.itemCategory}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">评估价值</span>
                    <span className="value highlight">¥{record.estimatedValue.toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">典当金额</span>
                    <span className="value highlight primary">¥{record.pawnAmount.toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">典当日期</span>
                    <span className="value">{record.pawnDate}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">典当期限</span>
                    <span className="value">{record.duration}</span>
                  </div>
                </div>
              </section>

              <section className="info-section">
                <h3>客户信息</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">客户姓名</span>
                    <span className="value">{record.customerName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">联系电话</span>
                    <span className="value">{record.customerPhone}</span>
                  </div>
                </div>
              </section>

              {record.assessmentResult && (
                <section className="info-section">
                  <h3>评估信息</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">评估结果</span>
                      <span className="value success">{record.assessmentResult}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">评估师</span>
                      <span className="value">{record.assessedBy}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">评估时间</span>
                      <span className="value">{record.assessmentTime}</span>
                    </div>
                    {record.assessmentRemark && (
                      <div className="info-item full-width">
                        <span className="label">评估备注</span>
                        <span className="value">{record.assessmentRemark}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className="info-section">
                <h3>流程状态</h3>
                <div className="status-timeline">
                  <div className={`timeline-step ${record.assessmentResult ? 'done' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-content">
                      <span className="step-title">柜台评估</span>
                      <span className="step-time">{record.assessmentTime || '待处理'}</span>
                    </div>
                  </div>
                  <div className={`timeline-step ${record.storageStatus === 'stored' ? 'done' : record.storageStatus === 'rejected' ? 'rejected' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-content">
                      <span className="step-title">入库保管</span>
                      <span className="step-time">{record.storageTime || (record.storageStatus === 'rejected' ? '已退回' : '待处理')}</span>
                    </div>
                  </div>
                  <div className={`timeline-step ${record.photoStatus === 'taken' ? 'done' : record.photoStatus === 'rejected' ? 'rejected' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-content">
                      <span className="step-title">照片留证</span>
                      <span className="step-time">{record.photoTime || (record.photoStatus === 'rejected' ? '已退回' : '待处理')}</span>
                    </div>
                  </div>
                  <div className={`timeline-step ${record.financeConfirmed ? 'done' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-content">
                      <span className="step-title">财务放款</span>
                      <span className="step-time">{record.financeConfirmTime || '待处理'}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="info-section">
                <div className="section-header">
                  <h3>补充备注</h3>
                  <button 
                    className="btn-link"
                    onClick={() => setShowSupplement(!showSupplement)}
                  >
                    {showSupplement ? '取消' : '+ 添加备注'}
                  </button>
                </div>
                {showSupplement && (
                  <div className="supplement-form">
                    <textarea
                      placeholder="请输入补充备注内容..."
                      value={supplementRemark}
                      onChange={e => setSupplementRemark(e.target.value)}
                      rows={3}
                    />
                    <div className="form-actions">
                      <button className="btn-secondary" onClick={() => setShowSupplement(false)}>取消</button>
                      <button className="btn-primary" onClick={handleSupplementSave}>保存备注</button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activePanel === 'storage' && (
            <div className="storage-panel">
              <section className="info-section">
                <h3>入库信息</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">入库状态</span>
                    <span className={`value ${record.storageStatus === 'stored' ? 'success' : record.storageStatus === 'rejected' ? 'danger' : ''}`}>
                      {record.storageStatus === 'pending' ? '待入库' : 
                       record.storageStatus === 'stored' ? '已入库' : '已退回'}
                    </span>
                  </div>
                  {record.storedBy && (
                    <div className="info-item">
                      <span className="label">库管员</span>
                      <span className="value">{record.storedBy}</span>
                    </div>
                  )}
                  {record.storageTime && (
                    <div className="info-item">
                      <span className="label">入库时间</span>
                      <span className="value">{record.storageTime}</span>
                    </div>
                  )}
                  {record.storageLocation && (
                    <div className="info-item full-width">
                      <span className="label">库位信息</span>
                      <span className="value">{record.storageLocation}</span>
                    </div>
                  )}
                  {record.storageRemark && (
                    <div className="info-item full-width">
                      <span className="label">入库备注</span>
                      <span className="value">{record.storageRemark}</span>
                    </div>
                  )}
                  {record.rejectReason && (
                    <div className="info-item full-width">
                      <span className="label">退回原因</span>
                      <span className="value danger">{record.rejectReason}</span>
                    </div>
                  )}
                </div>
              </section>

              {canHandleStorage && (
                <section className="action-section">
                  <h3>入库处理</h3>
                  {!showRejectForm ? (
                    <div className="storage-form">
                      <div className="form-group">
                        <label>库位位置 <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="如：A区-03-12号保险柜"
                          value={storageLocation}
                          onChange={e => setStorageLocation(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>入库备注</label>
                        <textarea
                          placeholder="请输入入库相关备注信息..."
                          value={storageRemark}
                          onChange={e => setStorageRemark(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="form-actions">
                        <button className="btn-danger-outline" onClick={() => setShowRejectForm(true)}>
                          退回重检
                        </button>
                        <button className="btn-primary" onClick={handleStorageConfirm}>
                          确认入库
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="reject-form">
                      <div className="form-group">
                        <label>退回原因 <span className="required">*</span></label>
                        <textarea
                          placeholder="请详细说明退回原因，便于评估师跟进..."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setShowRejectForm(false)}>
                          取消
                        </button>
                        <button className="btn-danger" onClick={handleStorageReject}>
                          确认退回
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {activePanel === 'photo' && (
            <div className="photo-panel">
              <section className="info-section">
                <h3>照片留证信息</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">照片状态</span>
                    <span className={`value ${record.photoStatus === 'taken' ? 'success' : record.photoStatus === 'rejected' ? 'danger' : ''}`}>
                      {record.photoStatus === 'pending' ? '待拍照' : 
                       record.photoStatus === 'taken' ? '已拍照' : '已退回'}
                    </span>
                  </div>
                  {record.photoTakenBy && (
                    <div className="info-item">
                      <span className="label">拍摄人</span>
                      <span className="value">{record.photoTakenBy}</span>
                    </div>
                  )}
                  {record.photoTime && (
                    <div className="info-item">
                      <span className="label">拍摄时间</span>
                      <span className="value">{record.photoTime}</span>
                    </div>
                  )}
                  {record.photoRemark && (
                    <div className="info-item full-width">
                      <span className="label">照片备注</span>
                      <span className="value">{record.photoRemark}</span>
                    </div>
                  )}
                  {record.photoRejectReason && (
                    <div className="info-item full-width">
                      <span className="label">退回原因</span>
                      <span className="value danger">{record.photoRejectReason}</span>
                    </div>
                  )}
                </div>
              </section>

              {record.photos && record.photos.length > 0 && (
                <section className="info-section">
                  <h3>照片列表 ({record.photos.length}张)</h3>
                  <div className="photo-grid">
                    {record.photos.map(photo => (
                      <div 
                        key={photo.id} 
                        className="photo-card"
                        onClick={() => handlePhotoClick(photo)}
                      >
                        <div className="photo-preview">
                          <img src={photo.url} alt={photo.label} />
                        </div>
                        <div className="photo-info">
                          <span className="photo-label">{photo.label}</span>
                          <span className="photo-time">{photo.uploadTime}</span>
                          {photo.remark && <span className="photo-remark">{photo.remark}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {canHandlePhoto && (
                <section className="action-section">
                  <h3>照片处理</h3>
                  {!showPhotoRejectForm ? (
                    <div className="photo-form">
                      <div className="form-group">
                        <label>照片备注</label>
                        <textarea
                          placeholder="请输入照片相关备注信息..."
                          value={photoRemark}
                          onChange={e => setPhotoRemark(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="form-actions">
                        <button className="btn-danger-outline" onClick={() => setShowPhotoRejectForm(true)}>
                          退回重拍
                        </button>
                        <button 
                          className="btn-primary" 
                          onClick={handlePhotoConfirm}
                          disabled={!record.photos || record.photos.length === 0}
                        >
                          确认照片留证
                        </button>
                      </div>
                      <div className="photo-requirements">
                        <h4>📷 照片要求</h4>
                        <ul>
                          <li>物品正面照（清晰展示整体外观）</li>
                          <li>物品背面/细节照（品牌标识、编号）</li>
                          <li>编号/序列号特写（唯一标识）</li>
                          <li>封装后照片（含封条）</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="reject-form">
                      <div className="form-group">
                        <label>退回原因 <span className="required">*</span></label>
                        <textarea
                          placeholder="请详细说明退回原因，便于重拍..."
                          value={photoRejectReason}
                          onChange={e => setPhotoRejectReason(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setShowPhotoRejectForm(false)}>
                          取消
                        </button>
                        <button className="btn-danger" onClick={handlePhotoReject}>
                          确认退回
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {canApprovePhoto && (
                <section className="action-section">
                  <h3>照片审核</h3>
                  <div className="form-actions">
                    <button className="btn-danger-outline" onClick={() => setShowPhotoRejectForm(true)}>
                      退回重拍
                    </button>
                    <button className="btn-primary" onClick={handlePhotoApprove}>
                      审核通过
                    </button>
                  </div>
                </section>
              )}

              {canRejectPhoto && showPhotoRejectForm && (
                <section className="action-section">
                  <div className="reject-form">
                    <div className="form-group">
                      <label>退回原因 <span className="required">*</span></label>
                      <textarea
                        placeholder="请详细说明退回原因，便于重拍..."
                        value={photoRejectReason}
                        onChange={e => setPhotoRejectReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="form-actions">
                      <button className="btn-secondary" onClick={() => setShowPhotoRejectForm(false)}>
                        取消
                      </button>
                      <button className="btn-danger" onClick={handlePhotoReject}>
                        确认退回
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {canConfirmFinance && (
                <section className="action-section">
                  <h3>财务确认</h3>
                  <div className="finance-confirm">
                    <div className="finance-amount">
                      <span className="label">确认放款金额</span>
                      <span className="amount">¥{record.pawnAmount.toLocaleString()}</span>
                    </div>
                    <button className="btn-primary large" onClick={handleFinanceConfirm}>
                      确认放款
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}

          {activePanel === 'history' && (
            <div className="history-panel">
              <section className="info-section">
                <h3>操作历史记录</h3>
                <div className="operation-logs">
                  {record.operationLogs.map((log, index) => (
                    <div key={log.id} className="log-item">
                      <div className="log-left">
                        <div className="log-dot"></div>
                        {index < record.operationLogs.length - 1 && <div className="log-line"></div>}
                      </div>
                      <div className="log-content">
                        <div className="log-header">
                          <span className="log-operation">{log.operation}</span>
                          <span className="log-time">{log.operateTime}</span>
                        </div>
                        <div className="log-operator">
                          <span className="operator-name">{log.operator}</span>
                          <span className="operator-role">{roleNames[log.operatorRole]}</span>
                        </div>
                        {log.reason && (
                          <div className="log-reason">
                            <span className="reason-label">原因：</span>
                            <span>{log.reason}</span>
                          </div>
                        )}
                        {log.remark && (
                          <div className="log-remark">
                            <span className="remark-label">备注：</span>
                            <span>{log.remark}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {viewerPhoto && (
        <PhotoViewer
          photos={viewerPhotos}
          currentPhoto={viewerPhoto}
          onClose={() => setViewerPhoto(null)}
          onPhotoChange={setViewerPhoto}
        />
      )}
    </>
  );
}
