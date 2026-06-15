import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import Layout from '@/components/Layout';
import {
  apiRequest,
  generateIdempotencyKey,
  formatDateTime,
  formatPrice,
} from '@/utils/api';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from '@/types/stateMachine';
import type { RecyclingOrder, AuditLog } from '@/types/models';

const ROLE_LABELS: Record<string, string> = {
  RECEPTIONIST: '前台',
  PROCESSOR: '处理人员',
  MANAGER: '店长',
};

const VALUATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  SUBMITTED: '待审批',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
};

const VALUATION_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  SUBMITTED: '#f59e0b',
  APPROVED: '#059669',
  REJECTED: '#dc2626',
};

const CONFIRMATION_STATUS_LABELS: Record<string, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  OBJECTED: '有异议',
  EXPIRED: '已过期',
};

const CONFIRMATION_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#059669',
  OBJECTED: '#dc2626',
  EXPIRED: '#9ca3af',
};

const ManagerOrderDetail: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<RecyclingOrder | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
  const [selectedConfirmationId, setSelectedConfirmationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'valuation' | 'confirmation' | 'audit'>('valuation');
  const [rejectReason, setRejectReason] = useState('');
  const [approvalRemark, setApprovalRemark] = useState('');
  const [approvalRemarkVisible, setApprovalRemarkVisible] = useState(true);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
        if (res.data.currentValuationId) {
          setSelectedValuationId(res.data.currentValuationId);
        }
        if (res.data.confirmations.length > 0) {
          setSelectedConfirmationId(res.data.confirmations[res.data.confirmations.length - 1].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!id) return;
    try {
      const res = await apiRequest(`/api/orders/${id}/audit`);
      if (res.success) {
        setAuditLogs(res.data);
      }
    } catch {}
  };

  useEffect(() => {
    loadOrder();
    loadAuditLogs();
  }, [id]);

  const handleApprove = async () => {
    if (!order || !selectedValuationId) return;

    const body: any = {
      action: 'approve',
      valuationId: selectedValuationId,
    };
    if (approvalRemark.trim()) {
      body.remark = approvalRemark.trim();
      body.isRemarkVisibleToCustomer = approvalRemarkVisible;
    }

    const res = await apiRequest(`/api/orders/${order.id}/valuation`, {
      method: 'POST',
      body,
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('估价审批通过');
      setApprovalRemark('');
      loadOrder();
      loadAuditLogs();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  const handleReject = async () => {
    if (!order || !selectedValuationId || !rejectReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }

    const body: any = {
      action: 'reject',
      valuationId: selectedValuationId,
      remark: rejectReason.trim(),
      isRemarkVisibleToCustomer: approvalRemarkVisible,
    };

    const res = await apiRequest(`/api/orders/${order.id}/valuation`, {
      method: 'POST',
      body,
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('估价已拒绝');
      setRejectReason('');
      loadOrder();
      loadAuditLogs();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  if (loading || !order) {
    return (
      <Layout activeTab="list">
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          加载中...
        </div>
      </Layout>
    );
  }

  const currentValuation = order.valuations.find((v) => v.id === order.currentValuationId);
  const selectedValuation = order.valuations.find((v) => v.id === selectedValuationId);
  const selectedConfirmation = order.confirmations.find((c) => c.id === selectedConfirmationId);
  const confirmationValuation = selectedConfirmation
    ? order.valuations.find((v) => v.id === selectedConfirmation.valuationId)
    : null;

  const canApprove = selectedValuation?.status === 'SUBMITTED';

  return (
    <Layout activeTab="list">
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <button style={styles.backBtn} onClick={() => router.push('/manager')}>
              ← 返回工作台
            </button>
            <h2 style={styles.title}>订单详情</h2>
            <div style={styles.subtitle}>
              {order.orderNo} · {order.customerName} · {order.device.brand} {order.device.model}
            </div>
          </div>
          <div style={styles.statusBadgeWrap}>
            <span
              style={{
                ...styles.statusBadge,
                background: STATUS_COLORS[order.status] + '20',
                color: STATUS_COLORS[order.status],
              }}
            >
              {STATUS_LABELS[order.status]}
            </span>
            {order.urgency !== 'NORMAL' && (
              <span style={styles.urgencyBadge}>⚡ {URGENCY_LABELS[order.urgency]}</span>
            )}
          </div>
        </div>

        {order.status === 'OBJECTED' && (
          <div style={styles.alertBox}>
            <div style={styles.alertIcon}>🚨</div>
            <div>
              <div style={styles.alertTitle}>客户有异议</div>
              <div style={styles.alertText}>
                {order.confirmations
                  .filter((c) => c.status === 'OBJECTED')
                  .map((c) => c.objectionContent)
                  .join('；') || '客户对估价提出异议，请关注'}
              </div>
            </div>
          </div>
        )}

        {selectedValuation?.status === 'SUBMITTED' && (
          <div style={styles.approvalNoticeBox}>
            <div style={styles.noticeIcon}>📋</div>
            <div>
              <div style={styles.noticeTitle}>待审批估价</div>
              <div style={styles.noticeText}>
                估价金额 {formatPrice(selectedValuation.estimatedPrice)}，请尽快审批，客户正在等待
              </div>
            </div>
          </div>
        )}

        <div style={styles.grid}>
          <div style={styles.mainCol}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>设备信息</h3>
              </div>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>设备</span>
                  <span style={styles.infoValue}>{order.device.brand} {order.device.model}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>序列号</span>
                  <span style={styles.infoValue}>{order.device.serialNumber}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>配置</span>
                  <span style={styles.infoValue}>{order.device.storage || '-'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>颜色</span>
                  <span style={styles.infoValue}>{order.device.color || '-'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>成色</span>
                  <span style={styles.infoValue}>{order.device.condition}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>原价</span>
                  <span style={styles.infoValue}>
                    {order.device.originalPrice ? formatPrice(order.device.originalPrice) : '-'}
                  </span>
                </div>
                <div style={{ ...styles.infoItem, gridColumn: 'span 2' }}>
                  <span style={styles.infoLabel}>故障</span>
                  <span style={styles.infoValue}>
                    {order.device.defects.length > 0 ? order.device.defects.join('、') : '无'}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.tabBar}>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'valuation' ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab('valuation')}
              >
                💰 估价历史（{order.valuations.length}）
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'confirmation' ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab('confirmation')}
              >
                📝 确认历史（{order.confirmations.length}）
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'audit' ? styles.tabBtnActive : {}) }}
                onClick={() => { setActiveTab('audit'); loadAuditLogs(); }}
              >
                📜 审计日志（{auditLogs.length}）
              </button>
            </div>

            {activeTab === 'valuation' && (
              <>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>估价版本列表</h3>
                  </div>
                  <div style={styles.versionList}>
                    {[...order.valuations]
                      .sort((a, b) => b.version - a.version)
                      .map((v) => (
                        <div
                          key={v.id}
                          style={{
                            ...styles.versionItem,
                            ...(selectedValuationId === v.id ? styles.versionItemActive : {}),
                          }}
                          onClick={() => setSelectedValuationId(v.id)}
                        >
                          <div style={styles.versionLeft}>
                            <span style={styles.versionLabel}>v{v.version}</span>
                            <span
                              style={{
                                ...styles.versionStatus,
                                color: VALUATION_STATUS_COLORS[v.status],
                              }}
                            >
                              {VALUATION_STATUS_LABELS[v.status]}
                            </span>
                            {v.id === order.currentValuationId && (
                              <span style={styles.currentTag}>当前</span>
                            )}
                          </div>
                          <div style={styles.versionRight}>
                            <span style={styles.versionPrice}>{formatPrice(v.estimatedPrice)}</span>
                            <span style={styles.versionMeta}>
                              {v.processorName} · {formatDateTime(v.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {selectedValuation && (
                  <div style={styles.card}>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.cardTitle}>
                        估价详情（v{selectedValuation.version}）
                      </h3>
                      <span
                        style={{
                          ...styles.valStatusBadge,
                          background: VALUATION_STATUS_COLORS[selectedValuation.status] + '20',
                          color: VALUATION_STATUS_COLORS[selectedValuation.status],
                        }}
                      >
                        {VALUATION_STATUS_LABELS[selectedValuation.status]}
                      </span>
                    </div>

                    <div style={styles.priceDisplay}>
                      <div style={styles.priceLabel}>回收价格</div>
                      <div style={styles.priceValue}>{formatPrice(selectedValuation.estimatedPrice)}</div>
                      <div style={styles.priceRange}>
                        价格区间：{formatPrice(selectedValuation.minPrice)} - {formatPrice(selectedValuation.maxPrice)}
                      </div>
                    </div>

                    <div style={styles.inspectionGrid}>
                      {[
                        { label: '屏幕', value: selectedValuation.inspectionItems.screen },
                        { label: '电池', value: selectedValuation.inspectionItems.battery },
                        { label: '外观', value: selectedValuation.inspectionItems.appearance },
                        { label: '功能', value: selectedValuation.inspectionItems.function },
                        { label: '防水', value: selectedValuation.inspectionItems.waterproof },
                        { label: 'ID锁', value: selectedValuation.inspectionItems.idLocked ? '已锁定' : '无锁', color: selectedValuation.inspectionItems.idLocked ? '#dc2626' : '#059669' },
                        { label: '网络锁', value: selectedValuation.inspectionItems.networkLocked ? '已锁定' : '无锁', color: selectedValuation.inspectionItems.networkLocked ? '#dc2626' : '#059669' },
                      ].map((item, i) => (
                        <div key={i} style={styles.inspectionItem}>
                          <span style={styles.inspectionLabel}>{item.label}</span>
                          <span style={{ ...styles.inspectionValue, color: item.color || '#1f2937' }}>{item.value || '-'}</span>
                        </div>
                      ))}
                    </div>

                    {selectedValuation.remarks.length > 0 && (
                      <>
                        <h4 style={styles.sectionTitle}>备注（{selectedValuation.remarks.length} 条）</h4>
                        <div style={styles.remarkList}>
                          {selectedValuation.remarks.map((r) => (
                            <div key={r.id} style={styles.remarkItem}>
                              <div style={styles.remarkHeader}>
                                <span style={styles.remarkAuthor}>
                                  {r.authorName}（{ROLE_LABELS[r.authorRole]}）
                                </span>
                                <div style={styles.remarkTags}>
                                  {r.isVisibleToCustomer ? (
                                    <span style={styles.tagCustomerVisible}>客户可见</span>
                                  ) : (
                                    <span style={styles.tagInternal}>内部</span>
                                  )}
                                  {r.isCritical && <span style={styles.tagCritical}>重要</span>}
                                </div>
                              </div>
                              <div style={styles.remarkContent}>{r.content}</div>
                              <div style={styles.remarkTime}>{formatDateTime(r.timestamp)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'confirmation' && (
              <>
                {order.confirmations.length > 0 ? (
                  <>
                    <div style={styles.card}>
                      <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>确认记录列表</h3>
                      </div>
                      <div style={styles.confirmList}>
                        {[...order.confirmations]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((c) => {
                            const cValuation = order.valuations.find((v) => v.id === c.valuationId);
                            return (
                              <div
                                key={c.id}
                                style={{
                                  ...styles.confirmItem,
                                  ...(selectedConfirmationId === c.id ? styles.confirmItemActive : {}),
                                }}
                                onClick={() => setSelectedConfirmationId(c.id)}
                              >
                                <div style={styles.confirmLeft}>
                                  <span
                                    style={{
                                      ...styles.confirmStatus,
                                      color: CONFIRMATION_STATUS_COLORS[c.status],
                                    }}
                                  >
                                    {CONFIRMATION_STATUS_LABELS[c.status]}
                                  </span>
                                  <span style={styles.confirmMethod}>
                                    {c.confirmationMethod === 'ON_SITE' ? '现场' : c.confirmationMethod === 'ONLINE' ? '线上' : '电话'}
                                  </span>
                                  {cValuation && (
                                    <span style={styles.confirmVersion}>v{cValuation.version}</span>
                                  )}
                                  {c.status === 'EXPIRED' && c.expiredAt && (
                                    <span style={styles.confirmExpired}>⏰ 已过期</span>
                                  )}
                                </div>
                                <div style={styles.confirmRight}>
                                  {c.confirmedPrice && (
                                    <span style={styles.confirmPrice}>{formatPrice(c.confirmedPrice)}</span>
                                  )}
                                  <span style={styles.confirmTime}>{formatDateTime(c.createdAt)}</span>
                                  {c.status === 'EXPIRED' && c.expiredAt && (
                                    <span style={styles.confirmExpiredTime}>到期：{formatDateTime(c.expiredAt)}</span>
                                  )}
                                  {c.status === 'PENDING' && c.expiredAt && (
                                    <span style={styles.confirmExpireAt}>有效期至：{formatDateTime(c.expiredAt)}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {selectedConfirmation && (
                      <div style={styles.card}>
                        <div style={styles.cardHeader}>
                          <h3 style={styles.cardTitle}>确认详情</h3>
                        </div>
                        <div style={styles.detailGrid}>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>状态</span>
                            <span style={{ ...styles.detailValue, color: CONFIRMATION_STATUS_COLORS[selectedConfirmation.status] }}>
                              {CONFIRMATION_STATUS_LABELS[selectedConfirmation.status]}
                            </span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>确认方式</span>
                            <span style={styles.detailValue}>
                              {selectedConfirmation.confirmationMethod === 'ON_SITE' ? '现场' : selectedConfirmation.confirmationMethod === 'ONLINE' ? '线上' : '电话'}
                            </span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>关联估价</span>
                            <span style={styles.detailValue}>
                              {confirmationValuation ? `v${confirmationValuation.version} · ${formatPrice(confirmationValuation.estimatedPrice)}` : '-'}
                            </span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>创建时间</span>
                            <span style={styles.detailValue}>{formatDateTime(selectedConfirmation.createdAt)}</span>
                          </div>
                          {selectedConfirmation.expiredAt && (
                            <div style={styles.detailItem}>
                              <span style={styles.detailLabel}>
                                {selectedConfirmation.status === 'EXPIRED' ? '到期时间' : '有效期至'}
                              </span>
                              <span style={{
                                ...styles.detailValue,
                                color: selectedConfirmation.status === 'EXPIRED' ? '#dc2626' : '#f59e0b',
                                fontWeight: '500',
                              }}>
                                {formatDateTime(selectedConfirmation.expiredAt)}
                              </span>
                            </div>
                          )}
                          {selectedConfirmation.confirmedPrice && (
                            <div style={styles.detailItem}>
                              <span style={styles.detailLabel}>确认价格</span>
                              <span style={{ ...styles.detailValue, color: '#059669', fontWeight: 'bold' }}>
                                {formatPrice(selectedConfirmation.confirmedPrice)}
                              </span>
                            </div>
                          )}
                          {selectedConfirmation.confirmedAt && (
                            <div style={styles.detailItem}>
                              <span style={styles.detailLabel}>确认时间</span>
                              <span style={styles.detailValue}>{formatDateTime(selectedConfirmation.confirmedAt)}</span>
                            </div>
                          )}
                        </div>

                        {selectedConfirmation.objectionContent && (
                          <div style={styles.objectionBox}>
                            <div style={styles.objectionTitle}>异议内容</div>
                            <div style={styles.objectionText}>{selectedConfirmation.objectionContent}</div>
                          </div>
                        )}

                        {confirmationValuation && (
                          <>
                            <h4 style={styles.sectionTitle}>
                              关联估价备注查看状态
                            </h4>
                            {confirmationValuation.remarks.filter((r) => r.isVisibleToCustomer).length > 0 ? (
                              <div style={styles.remarkList}>
                                {confirmationValuation.remarks
                                  .filter((r) => r.isVisibleToCustomer)
                                  .map((r) => {
                                    const isSeen = selectedConfirmation.seenValuationRemarks.includes(r.id);
                                    return (
                                      <div
                                        key={r.id}
                                        style={{
                                          ...styles.remarkItem,
                                          ...(isSeen ? styles.remarkItemSeen : {}),
                                        }}
                                      >
                                        <div style={styles.remarkHeader}>
                                          <span style={styles.remarkAuthor}>
                                            {r.authorName}（{ROLE_LABELS[r.authorRole]}）
                                          </span>
                                          <div style={styles.remarkTags}>
                                            {isSeen ? (
                                              <span style={styles.tagSeen}>客户已查看</span>
                                            ) : (
                                              <span style={styles.tagUnseen}>客户未查看</span>
                                            )}
                                            {r.isCritical && <span style={styles.tagCritical}>重要</span>}
                                          </div>
                                        </div>
                                        <div style={styles.remarkContent}>{r.content}</div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              <div style={styles.emptyRemark}>该估价无客户可见备注</div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.card}>
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📭</div>
                      <div>暂无确认记录</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'audit' && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>审计日志</h3>
                  <button style={styles.refreshBtn} onClick={loadAuditLogs}>
                    🔄 刷新
                  </button>
                </div>
                {auditLogs.length > 0 ? (
                  <div style={styles.auditList}>
                    {[...auditLogs]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((log) => (
                        <div key={log.id} style={styles.auditItem}>
                          <div style={styles.auditHeader}>
                            <span style={styles.auditAction}>{log.action}</span>
                            <span style={styles.auditMeta}>
                              {log.actorName}（{ROLE_LABELS[log.actorRole]}）· {formatDateTime(log.timestamp)}
                            </span>
                          </div>
                          {(log.oldValue || log.newValue) && (
                            <div style={styles.auditChange}>
                              {log.oldValue && (
                                <div style={styles.auditOld}>
                                  旧值：<code>{JSON.stringify(log.oldValue)}</code>
                                </div>
                              )}
                              {log.newValue && (
                                <div style={styles.auditNew}>
                                  新值：<code>{JSON.stringify(log.newValue)}</code>
                                </div>
                              )}
                            </div>
                          )}
                          <div style={styles.auditIdemKey}>
                            幂等键：{log.idempotencyKey}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📜</div>
                    <div>暂无审计日志</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={styles.sideCol}>
            {canApprove && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>审批操作</h3>
                </div>
                <div style={styles.actionList}>
                  <div style={styles.actionNotice}>
                    当前估价 v{selectedValuation!.version}，金额 {formatPrice(selectedValuation!.estimatedPrice)}
                  </div>
                  <div style={styles.remarkInputWrap}>
                    <label style={styles.label}>审批备注（可选）</label>
                    <textarea
                      style={styles.textarea}
                      placeholder="输入审批意见..."
                      value={approvalRemark}
                      onChange={(e) => setApprovalRemark(e.target.value)}
                    />
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={approvalRemarkVisible}
                        onChange={(e) => setApprovalRemarkVisible(e.target.checked)}
                      />
                      备注对客户可见
                    </label>
                  </div>
                  <button
                    style={{ ...styles.actionBtn, ...styles.actionBtnSuccess }}
                    onClick={handleApprove}
                  >
                    ✅ 审批通过
                  </button>
                  <div style={styles.divider} />
                  <div style={styles.remarkInputWrap}>
                    <label style={styles.label}>拒绝原因（必填）</label>
                    <textarea
                      style={styles.textarea}
                      placeholder="请说明拒绝原因..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <button
                    style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                  >
                    ❌ 审批拒绝
                  </button>
                </div>
              </div>
            )}

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>订单信息</h3>
              </div>
              <div style={styles.customerInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>客户</span>
                  <span style={styles.infoValue}>{order.customerName}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>电话</span>
                  <span style={styles.infoValue}>{order.customerPhone}</span>
                </div>
                {order.customerIdCard && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>身份证</span>
                    <span style={styles.infoValue}>{order.customerIdCard}</span>
                  </div>
                )}
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>来源</span>
                  <span style={styles.infoValue}>{order.source}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>前台</span>
                  <span style={styles.infoValue}>{order.receptionistName}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>创建</span>
                  <span style={styles.infoValue}>{formatDateTime(order.createdAt)}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>更新</span>
                  <span style={styles.infoValue}>{formatDateTime(order.updatedAt)}</span>
                </div>
              </div>
            </div>

            {currentValuation && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>当前估价摘要</h3>
                </div>
                <div style={styles.summaryPrice}>{formatPrice(currentValuation.estimatedPrice)}</div>
                <div style={styles.summaryMeta}>
                  v{currentValuation.version} · {VALUATION_STATUS_LABELS[currentValuation.status]} · {currentValuation.processorName}
                </div>
              </div>
            )}

            {order.tags.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>标签</h3>
                </div>
                <div style={styles.tags}>
                  {order.tags.map((tag, i) => (
                    <span key={i} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {},
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 0',
    marginBottom: '8px',
  },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
  statusBadgeWrap: { display: 'flex', gap: '8px' },
  statusBadge: { padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' },
  urgencyBadge: { padding: '6px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', fontSize: '13px', fontWeight: '500' },
  alertBox: { display: 'flex', gap: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  alertIcon: { fontSize: '24px', flexShrink: 0 },
  alertTitle: { fontWeight: 'bold', color: '#991b1b', fontSize: '14px', marginBottom: '4px' },
  alertText: { color: '#7f1d1d', fontSize: '13px', lineHeight: '1.6' },
  approvalNoticeBox: { display: 'flex', gap: '12px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  noticeIcon: { fontSize: '24px', flexShrink: 0 },
  noticeTitle: { fontWeight: 'bold', color: '#92400e', fontSize: '14px', marginBottom: '4px' },
  noticeText: { color: '#78350f', fontSize: '13px', lineHeight: '1.6' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px', alignSelf: 'flex-start' },
  card: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '12px', color: '#6b7280' },
  infoValue: { fontSize: '14px', color: '#1f2937', fontWeight: '500' },
  tabBar: { display: 'flex', gap: '4px', background: 'white', borderRadius: '10px', padding: '4px', border: '1px solid #e5e7eb' },
  tabBtn: { flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#6b7280', background: 'transparent', transition: 'all 0.2s' },
  tabBtnActive: { background: '#2563eb', color: 'white' },
  versionList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  versionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' },
  versionItemActive: { background: '#eff6ff', borderColor: '#3b82f6' },
  versionLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  versionLabel: { fontSize: '14px', fontWeight: 'bold', color: '#1f2937' },
  versionStatus: { fontSize: '12px', fontWeight: '500' },
  currentTag: { padding: '2px 6px', background: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontSize: '11px' },
  versionRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  versionPrice: { fontSize: '16px', fontWeight: 'bold', color: '#059669' },
  versionMeta: { fontSize: '11px', color: '#9ca3af' },
  valStatusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' },
  priceDisplay: { textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', marginBottom: '20px' },
  priceLabel: { fontSize: '14px', color: '#166534', marginBottom: '8px' },
  priceValue: { fontSize: '40px', fontWeight: 'bold', color: '#059669', marginBottom: '4px' },
  priceRange: { fontSize: '13px', color: '#16a34a' },
  inspectionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' },
  inspectionItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: '6px', fontSize: '13px' },
  inspectionLabel: { color: '#6b7280', width: '60px' },
  inspectionValue: { flex: 1, textAlign: 'right', fontWeight: '500' },
  sectionTitle: { fontSize: '14px', fontWeight: 'bold', color: '#374151', margin: '16px 0 12px 0' },
  remarkList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  remarkItem: { padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' },
  remarkItemSeen: { background: '#f0fdf4', borderColor: '#86efac' },
  remarkHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' },
  remarkAuthor: { fontSize: '13px', fontWeight: 'bold', color: '#1f2937' },
  remarkTags: { display: 'flex', gap: '4px' },
  tagCustomerVisible: { padding: '2px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '10px', fontWeight: '500' },
  tagInternal: { padding: '2px 6px', background: '#f3f4f6', color: '#4b5563', borderRadius: '4px', fontSize: '10px', fontWeight: '500' },
  tagCritical: { padding: '2px 6px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '10px', fontWeight: '500' },
  tagSeen: { padding: '2px 6px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '10px', fontWeight: '500' },
  tagUnseen: { padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '10px', fontWeight: '500' },
  remarkContent: { fontSize: '13px', color: '#374151', lineHeight: '1.6', marginBottom: '4px' },
  remarkTime: { fontSize: '11px', color: '#9ca3af' },
  confirmList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  confirmItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' },
  confirmItemActive: { background: '#eff6ff', borderColor: '#3b82f6' },
  confirmLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  confirmStatus: { fontSize: '13px', fontWeight: 'bold' },
  confirmMethod: { padding: '2px 8px', background: '#e5e7eb', color: '#4b5563', borderRadius: '6px', fontSize: '11px' },
  confirmVersion: { padding: '2px 8px', background: '#dbeafe', color: '#2563eb', borderRadius: '6px', fontSize: '11px' },
  confirmExpired: { padding: '2px 8px', background: '#e5e7eb', color: '#6b7280', borderRadius: '6px', fontSize: '10px', fontWeight: '500' },
  confirmRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  confirmPrice: { fontSize: '14px', fontWeight: 'bold', color: '#059669' },
  confirmTime: { fontSize: '11px', color: '#9ca3af' },
  confirmExpiredTime: { fontSize: '11px', color: '#9ca3af' },
  confirmExpireAt: { fontSize: '11px', color: '#f59e0b' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', color: '#6b7280' },
  detailValue: { fontSize: '14px', color: '#1f2937', fontWeight: '500' },
  objectionBox: { padding: '14px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5', marginTop: '8px' },
  objectionTitle: { fontSize: '13px', fontWeight: 'bold', color: '#991b1b', marginBottom: '6px' },
  objectionText: { fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' },
  emptyRemark: { padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', background: '#f9fafb', borderRadius: '8px' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  emptyIcon: { fontSize: '36px', marginBottom: '8px' },
  auditList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  auditItem: { padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' },
  auditHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' },
  auditAction: { fontSize: '14px', fontWeight: 'bold', color: '#1f2937' },
  auditMeta: { fontSize: '12px', color: '#6b7280' },
  auditChange: { marginBottom: '6px' },
  auditOld: { fontSize: '12px', color: '#9ca3af', marginBottom: '4px' },
  auditNew: { fontSize: '12px', color: '#374151' },
  auditIdemKey: { fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' },
  actionList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  actionNotice: { padding: '10px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '13px', color: '#78350f', textAlign: 'center' },
  remarkInputWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { display: 'block', fontSize: '13px', color: '#374151', fontWeight: '500' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' },
  actionBtn: { padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', textAlign: 'center' },
  actionBtnSuccess: { background: '#059669', color: 'white' },
  actionBtnDanger: { background: '#dc2626', color: 'white' },
  divider: { height: '1px', background: '#e5e7eb', margin: '4px 0' },
  customerInfo: { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
  summaryPrice: { fontSize: '32px', fontWeight: 'bold', color: '#059669', textAlign: 'center' },
  summaryMeta: { fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '4px' },
  refreshBtn: { padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#6b7280' },
  tags: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tag: { padding: '4px 10px', background: '#f3f4f6', color: '#4b5563', borderRadius: '6px', fontSize: '12px' },
};

export default ManagerOrderDetail;
