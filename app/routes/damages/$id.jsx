import { useState } from 'react';
import { Link, useLoaderData, redirect } from '@remix-run/react';
import { getDamageRecordById, updateDamageRecord, addDamageHistory } from '~/models/damage.server';
import { createOperationLog } from '~/models/log.server';
import { damageStatusMap, damageTypes, deliveryStatusMap } from '~/data/mockData';

export async function loader({ params }) {
  const { id } = params;
  const damage = await getDamageRecordById(id);
  return { damage };
}

export async function action({ request, params }) {
  const { id } = params;
  const formData = await request.formData();
  const actionType = formData.get('action');
  const remark = formData.get('remark') || '';
  
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  if (actionType === 'review') {
    await updateDamageRecord(id, { status: 'processing' });
    await addDamageHistory(id, {
      action: 'reviewed',
      user: '仓库主管',
      time: now,
      remark: '已审核通过，转客服处理',
    });
    await createOperationLog({
      userId: '1',
      action: 'review_damage',
      targetType: 'damage',
      targetId: id,
      remark: '审核破损记录',
    });
    return redirect(`/damages/${id}`);
  }
  
  if (actionType === 'process') {
    await addDamageHistory(id, {
      action: 'contacted',
      user: '客服小李',
      time: now,
      remark: remark || '已联系客户沟通解决方案',
    });
    await createOperationLog({
      userId: '3',
      action: 'contact_customer',
      targetType: 'damage',
      targetId: id,
      remark: '联系客户',
    });
    return redirect(`/damages/${id}`);
  }
  
  if (actionType === 'resolve') {
    await updateDamageRecord(id, { 
      status: 'resolved',
      resolvedAt: now,
    });
    await addDamageHistory(id, {
      action: 'resolved',
      user: '客服小李',
      time: now,
      remark: remark || '问题已解决',
    });
    await createOperationLog({
      userId: '3',
      action: 'resolve_damage',
      targetType: 'damage',
      targetId: id,
      remark: '完成破损处理',
    });
    return redirect(`/damages/${id}`);
  }
  
  return redirect(`/damages/${id}`);
}

export default function DamageDetailPage() {
  const { damage } = useLoaderData();
  const [remark, setRemark] = useState('');
  const [processingRemark, setProcessingRemark] = useState('');
  
  if (!damage) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <Link to="/damages" style={styles.backLink}>← 返回</Link>
          <h1 style={styles.title}>破损记录详情</h1>
          <div style={styles.headerRight}></div>
        </header>
        <main style={styles.main}>
          <div style={styles.notFound}>记录不存在</div>
        </main>
      </div>
    );
  }
  
  const extractSourceInfo = () => {
    if (!damage.history || damage.history.length === 0) return null;
    const firstHistory = damage.history[0];
    if (!firstHistory.remark) return null;
    
    const remark = firstHistory.remark;
    const isSignFlow = remark.includes('【签收转破损】');
    const isDirectReport = remark.includes('【独立上报】');
    
    if (isSignFlow) {
      const signerMatch = remark.match(/签收人:\s*([^，,]+)/);
      const timeMatch = remark.match(/签收时间:\s*([^，,]+)/);
      return {
        source: 'sign_flow',
        sourceLabel: '📦 签收转破损',
        signerName: signerMatch ? signerMatch[1].trim() : '',
        signerPhone: damage.delivery?.signerPhone || '',
        signedAt: timeMatch ? timeMatch[1].trim() : '',
        triggerReason: '签收时发现破损',
      };
    } else if (isDirectReport) {
      return {
        source: 'direct_report',
        sourceLabel: '📝 独立上报',
        signerName: damage.delivery?.signerName || '',
        signerPhone: damage.delivery?.signerPhone || '',
        signedAt: firstHistory.time ? formatTime(firstHistory.time) : '',
        triggerReason: '独立上报破损',
      };
    }
    return null;
  };
  
  const sourceInfo = extractSourceInfo();
  
  const getDamageTypeLabel = (value) => {
    const type = damageTypes.find(t => t.value === value);
    return type ? type.label : value;
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pending: '#FF9800',
      processing: '#2196F3',
      resolved: '#4CAF50',
    };
    return colors[status] || '#9E9E9E';
  };
  
  const getActionIcon = (action) => {
    const icons = {
      reported: '📝',
      reviewed: '✅',
      assigned: '🔄',
      contacted: '📞',
      resolved: '🎉',
    };
    return icons[action] || '📌';
  };
  
  const getActionLabel = (action) => {
    const labels = {
      reported: '上报破损',
      reviewed: '审核通过',
      assigned: '转派处理',
      contacted: '联系客户',
      resolved: '处理完成',
    };
    return labels[action] || action;
  };

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/damages" style={styles.backLink}>← 返回列表</Link>
        <h1 style={styles.title}>⚠️ 破损记录详情</h1>
        <div style={styles.headerRight}>
          <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(damage.status) }}>
            {damageStatusMap[damage.status]}
          </span>
        </div>
      </header>

      <main style={styles.main}>
        {sourceInfo && (
          <div style={styles.sourceBanner}>
            <div style={styles.sourceHeader}>
              <span style={styles.sourceIcon}>{sourceInfo.source === 'sign_flow' ? '📦' : '📝'}</span>
              <span style={styles.sourceTitle}>{sourceInfo.sourceLabel}</span>
            </div>
            <div style={styles.sourceDetails}>
              {sourceInfo.signerName && (
                <div style={styles.sourceItem}>
                  <span style={styles.sourceLabel}>签收人</span>
                  <span>{sourceInfo.signerName} {sourceInfo.signerPhone && `(${sourceInfo.signerPhone})`}</span>
                </div>
              )}
              {sourceInfo.signedAt && (
                <div style={styles.sourceItem}>
                  <span style={styles.sourceLabel}>签收时间</span>
                  <span>{sourceInfo.signedAt}</span>
                </div>
              )}
              <div style={styles.sourceItem}>
                <span style={styles.sourceLabel}>触发原因</span>
                <span>{sourceInfo.triggerReason}</span>
              </div>
            </div>
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>基本信息</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>记录编号</span>
              <span style={styles.infoValue}>{damage.id}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>破损类型</span>
              <span style={styles.infoValue}>{getDamageTypeLabel(damage.damageType)}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>上报时间</span>
              <span style={styles.infoValue}>{formatTime(damage.reportedAt)}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>上报人</span>
              <span style={styles.infoValue}>{damage.reporter?.name}</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>订单信息</h2>
          <div style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <span style={styles.orderId}>销售订单: {damage.order?.id}</span>
              <span style={{ ...styles.statusBadge, backgroundColor: damage.delivery?.status === 'damaged' ? '#F44336' : '#4CAF50' }}>
                {deliveryStatusMap[damage.delivery?.status] || '未知'}
              </span>
            </div>
            <div style={styles.orderContent}>
              <div style={styles.orderRow}>
                <span style={styles.orderLabel}>客户</span>
                <span>{damage.order?.customerName}</span>
              </div>
              <div style={styles.orderRow}>
                <span style={styles.orderLabel}>商品</span>
                <span>{damage.order?.productName} x {damage.order?.quantity}{damage.order?.unit}</span>
              </div>
              <div style={styles.orderRow}>
                <span style={styles.orderLabel}>收货地址</span>
                <span>{damage.delivery?.deliveryAddress}</span>
              </div>
              <div style={styles.orderRow}>
                <span style={styles.orderLabel}>签收人</span>
                <span>{damage.delivery?.signerName} ({damage.delivery?.signerPhone})</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>破损详情</h2>
          <div style={styles.damageDetail}>
            <div style={styles.damageQuantityBadge}>
              破损数量: {damage.damageQuantity}{damage.order?.unit}
            </div>
            <div style={styles.damageDesc}>
              {damage.damageDescription}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>现场照片</h2>
          <div style={styles.photosGrid}>
            {damage.photos && damage.photos.length > 0 ? (
              damage.photos.map((photo, index) => (
                <div key={index} style={styles.photoItem}>
                  <div style={styles.photoPlaceholder}>
                    <span>🖼️</span>
                  </div>
                  <div style={styles.photoName}>照片{index + 1}</div>
                </div>
              ))
            ) : (
              <div style={styles.noPhotos}>
                <span>📷</span>
                <p>暂无照片</p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>处理流转历史</h2>
          <div style={styles.timeline}>
            {damage.history && damage.history.length > 0 ? (
              damage.history.map((item, index) => (
                <div key={index} style={styles.timelineItem}>
                  <div style={styles.timelineLine}>
                    <div style={styles.timelineDot}>{getActionIcon(item.action)}</div>
                    {index < damage.history.length - 1 && <div style={styles.timelineConnector}></div>}
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineAction}>{getActionLabel(item.action)}</span>
                      <span style={styles.timelineUser}>{item.user}</span>
                    </div>
                    <div style={styles.timelineTime}>{formatTime(item.time)}</div>
                    <div style={styles.timelineRemark}>{item.remark}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noHistory}>暂无处理记录</div>
            )}
          </div>
        </div>

        {damage.status !== 'resolved' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>处理操作</h2>
            
            {damage.status === 'pending' && (
              <div style={styles.actionPanel}>
                <form method="post" style={styles.actionForm}>
                  <input type="hidden" name="action" value="review" />
                  <button type="submit" style={styles.actionBtnPrimary}>
                    ✅ 审核通过并转客服处理
                  </button>
                </form>
              </div>
            )}
            
            {damage.status === 'processing' && (
              <div style={styles.actionPanel}>
                <form method="post" style={styles.actionForm}>
                  <input type="hidden" name="action" value="process" />
                  <div style={styles.formGroup}>
                    <label style={styles.label}>处理备注</label>
                    <textarea
                      name="remark"
                      value={processingRemark}
                      onChange={(e) => setProcessingRemark(e.target.value)}
                      placeholder="请输入处理内容，如：已联系客户..."
                      rows={3}
                      style={styles.textarea}
                    />
                  </div>
                  <button type="submit" style={styles.actionBtnSecondary}>
                    📞 添加处理记录
                  </button>
                </form>
                
                <form method="post" style={styles.actionForm}>
                  <input type="hidden" name="action" value="resolve" />
                  <div style={styles.formGroup}>
                    <label style={styles.label}>解决备注</label>
                    <textarea
                      name="remark"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="请输入解决方案..."
                      rows={3}
                      style={styles.textarea}
                    />
                  </div>
                  <button type="submit" style={styles.actionBtnPrimary}>
                    🎉 标记为已解决
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: '#fff',
    padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    fontSize: '14px',
    color: '#667eea',
    textDecoration: 'none',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  headerRight: {
    width: '150px',
    textAlign: 'right',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
    fontWeight: '500',
  },
  main: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sourceBanner: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '20px',
    color: '#fff',
  },
  sourceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sourceIcon: {
    fontSize: '20px',
  },
  sourceTitle: {
    fontSize: '16px',
    fontWeight: '600',
  },
  sourceDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  sourceItem: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
  },
  sourceLabel: {
    opacity: 0.8,
  },
  notFound: {
    background: '#fff',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    color: '#999',
  },
  section: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#999',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1a1a2e',
    fontWeight: '500',
  },
  orderCard: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  orderId: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  orderContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  orderRow: {
    display: 'flex',
    gap: '12px',
  },
  orderLabel: {
    fontSize: '13px',
    color: '#666',
    minWidth: '60px',
  },
  damageDetail: {
    background: '#fff3e0',
    borderLeft: '4px solid #ff9800',
    padding: '16px',
    borderRadius: '0 8px 8px 0',
  },
  damageQuantityBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: '#ff9800',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  damageDesc: {
    fontSize: '14px',
    color: '#e65100',
    lineHeight: '1.6',
  },
  photosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  photoItem: {
    aspectRatio: '1',
    border: '1px solid #eee',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '100%',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fa',
    fontSize: '32px',
  },
  photoName: {
    padding: '8px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#666',
    background: '#fff',
  },
  noPhotos: {
    gridColumn: '1 / -1',
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontSize: '24px',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '24px',
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: '24px',
    paddingLeft: '24px',
  },
  timelineLine: {
    position: 'absolute',
    left: '-24px',
    top: '0',
    bottom: '-24px',
    width: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timelineDot: {
    width: '32px',
    height: '32px',
    background: '#fff',
    border: '2px solid #667eea',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    zIndex: 1,
  },
  timelineConnector: {
    flex: 1,
    width: '2px',
    background: '#e0e0e0',
    marginTop: '8px',
  },
  timelineContent: {
    background: '#f8f9fa',
    padding: '12px 16px',
    borderRadius: '8px',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  timelineAction: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  timelineUser: {
    fontSize: '12px',
    color: '#667eea',
  },
  timelineTime: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '4px',
  },
  timelineRemark: {
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.5',
  },
  noHistory: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
  },
  actionPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actionForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  actionBtnPrimary: {
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    padding: '12px',
    background: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};