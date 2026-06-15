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
import type { RecyclingOrder, ValuationRemark } from '@/types/models';

const ROLE_LABELS: Record<string, string> = {
  RECEPTIONIST: '前台',
  PROCESSOR: '处理人员',
  MANAGER: '店长',
};

const ConfirmationDetail: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<RecyclingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [objectionContent, setObjectionContent] = useState('');
  const [confirmationMethod, setConfirmationMethod] = useState<'ONLINE' | 'ON_SITE' | 'PHONE'>('ON_SITE');
  const [selectedConfirmationId, setSelectedConfirmationId] = useState<string | null>(null);
  const [showRemarkConfirm, setShowRemarkConfirm] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
        if (res.data.confirmations.length > 0) {
          setSelectedConfirmationId(res.data.confirmations[res.data.confirmations.length - 1].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleInitiateConfirmation = async () => {
    if (!order) return;

    const res = await apiRequest(`/api/orders/${order.id}/confirmation`, {
      method: 'POST',
      body: {
        action: 'initiate',
        confirmationMethod,
      },
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('客户确认已发起，请注意展示可见备注给客户');
      loadOrder();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  const handleConfirm = async () => {
    if (!order || !selectedConfirmationId) return;

    const currentConfirmation = order.confirmations.find(
      (c) => c.id === selectedConfirmationId
    );
    const currentValuation = order.valuations.find(
      (v) => v.id === order.currentValuationId
    );

    const res = await apiRequest(`/api/orders/${order.id}/confirmation`, {
      method: 'POST',
      body: {
        action: 'confirm',
        confirmationId: selectedConfirmationId,
        confirmedPrice: currentValuation?.estimatedPrice,
        seenRemarkIds: currentValuation?.remarks
          .filter((r) => r.isVisibleToCustomer)
          .map((r) => r.id),
      },
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('客户确认成功！');
      loadOrder();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  const handleObject = async () => {
    if (!order || !selectedConfirmationId || !objectionContent.trim()) {
      alert('请填写异议内容');
      return;
    }

    const res = await apiRequest(`/api/orders/${order.id}/confirmation`, {
      method: 'POST',
      body: {
        action: 'object',
        confirmationId: selectedConfirmationId,
        objectionContent: objectionContent.trim(),
      },
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('异议已记录，已通知处理人员重新估价');
      setObjectionContent('');
      loadOrder();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  const handleMarkRemarksSeen = async (remarkIds: string[]) => {
    if (!order || !selectedConfirmationId) return;

    const res = await apiRequest(`/api/orders/${order.id}/confirmation`, {
      method: 'POST',
      body: {
        action: 'mark_seen',
        confirmationId: selectedConfirmationId,
        remarkIds,
      },
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('已标记客户查看');
      loadOrder();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  const handleComplete = async () => {
    if (!order) return;

    if (!confirm('确定完成此回收单吗？完成后将无法修改。')) return;

    const res = await apiRequest(`/api/orders/${order.id}`, {
      method: 'PATCH',
      body: {
        status: 'COMPLETED',
      },
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('回收单已完成');
      loadOrder();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  if (loading || !order) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          加载中...
        </div>
      </Layout>
    );
  }

  const currentValuation = order.valuations.find(
    (v) => v.id === order.currentValuationId
  );
  const selectedConfirmation = order.confirmations.find(
    (c) => c.id === selectedConfirmationId
  );
  const visibleRemarks =
    currentValuation?.remarks.filter((r) => r.isVisibleToCustomer) || [];
  const seenRemarkIds = new Set(
    selectedConfirmation?.seenValuationRemarks || []
  );
  const allVisibleSeen =
    visibleRemarks.length > 0 &&
    visibleRemarks.every((r) => seenRemarkIds.has(r.id));

  const canInitiate =
    order.status === 'VALUATED' || order.status === 'RE_VALUATED';
  const canConfirm =
    order.status === 'PENDING_CONFIRMATION' && selectedConfirmation?.status === 'PENDING';
  const canObject =
    order.status === 'PENDING_CONFIRMATION' && selectedConfirmation?.status === 'PENDING';
  const canComplete = order.status === 'CONFIRMED';

  return (
    <Layout activeTab="list">
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <button style={styles.backBtn} onClick={() => router.back()}>
              ← 返回
            </button>
            <h2 style={styles.title}>客户确认</h2>
            <div style={styles.subtitle}>
              {order.orderNo} · {order.customerName} ·{' '}
              {order.device.brand} {order.device.model}
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
              <span style={styles.urgencyBadge}>
                ⚡ {URGENCY_LABELS[order.urgency]}
              </span>
            )}
          </div>
        </div>

        {order.status === 'PENDING_CONFIRMATION' && (
          <div style={styles.noticeBox}>
            <div style={styles.noticeIcon}>📢</div>
            <div>
              <div style={styles.noticeTitle}>客户在场，请谨慎操作</div>
              <div style={styles.noticeText}>
                请确保客户已查看所有可见备注，并点击"客户已查看备注"按钮确认。
                <br />
                每一步操作都会记录审计日志，成为后续责任判定依据。
              </div>
            </div>
          </div>
        )}

        {order.status === 'OBJECTED' && selectedConfirmation && (
          <div style={styles.alertBox}>
            <div style={styles.alertIcon}>🚨</div>
            <div>
              <div style={styles.alertTitle}>客户有异议</div>
              <div style={styles.alertText}>
                {selectedConfirmation.objectionContent}
              </div>
              <div style={styles.alertMeta}>
                提交时间：{formatDateTime(selectedConfirmation.confirmedAt || selectedConfirmation.createdAt)}
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
                  <span style={styles.infoValue}>
                    {order.device.brand} {order.device.model}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>序列号</span>
                  <span style={styles.infoValue}>
                    {order.device.serialNumber}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>配置</span>
                  <span style={styles.infoValue}>
                    {order.device.storage || '-'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>颜色</span>
                  <span style={styles.infoValue}>
                    {order.device.color || '-'}
                  </span>
                </div>
                <div style={{ ...styles.infoItem, gridColumn: 'span 2' }}>
                  <span style={styles.infoLabel}>故障</span>
                  <span style={styles.infoValue}>
                    {order.device.defects.length > 0
                      ? order.device.defects.join('、')
                      : '无'}
                  </span>
                </div>
              </div>
            </div>

            {currentValuation && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>
                    当前估价（v{currentValuation.version}）
                  </h3>
                  <div style={styles.valuationStatus}>
                    状态:{' '}
                    <span
                      style={{
                        color:
                          currentValuation.status === 'APPROVED'
                            ? '#059669'
                            : '#f59e0b',
                        fontWeight: 'bold',
                      }}
                    >
                      {currentValuation.status === 'APPROVED'
                        ? '已通过'
                        : currentValuation.status}
                    </span>
                  </div>
                </div>

                <div style={styles.priceDisplay}>
                  <div style={styles.priceLabel}>回收价格</div>
                  <div style={styles.priceValue}>
                    {formatPrice(currentValuation.estimatedPrice)}
                  </div>
                  <div style={styles.priceRange}>
                    价格区间：{formatPrice(currentValuation.minPrice)} -{' '}
                    {formatPrice(currentValuation.maxPrice)}
                  </div>
                </div>

                <h4 style={styles.sectionTitle}>检测结果</h4>
                <div style={styles.inspectionList}>
                  <div style={styles.inspectionRow}>
                    <span style={styles.inspectionLabel}>屏幕</span>
                    <span style={styles.inspectionValue}>
                      {currentValuation.inspectionItems.screen}
                    </span>
                  </div>
                  <div style={styles.inspectionRow}>
                    <span style={styles.inspectionLabel}>电池</span>
                    <span style={styles.inspectionValue}>
                      {currentValuation.inspectionItems.battery}
                    </span>
                  </div>
                  <div style={styles.inspectionRow}>
                    <span style={styles.inspectionLabel}>外观</span>
                    <span style={styles.inspectionValue}>
                      {currentValuation.inspectionItems.appearance}
                    </span>
                  </div>
                  <div style={styles.inspectionRow}>
                    <span style={styles.inspectionLabel}>功能</span>
                    <span style={styles.inspectionValue}>
                      {currentValuation.inspectionItems.function}
                    </span>
                  </div>
                  <div style={styles.inspectionRow}>
                    <span style={styles.inspectionLabel}>防水</span>
                    <span style={styles.inspectionValue}>
                      {currentValuation.inspectionItems.waterproof}
                    </span>
                  </div>
                  <div style={styles.inspectionRow}>
                    <span style={styles.inspectionLabel}>ID锁</span>
                    <span
                      style={{
                        ...styles.inspectionValue,
                        color: currentValuation.inspectionItems.idLocked
                          ? '#dc2626'
                          : '#059669',
                      }}
                    >
                      {currentValuation.inspectionItems.idLocked
                        ? '已锁定'
                        : '无锁'}
                    </span>
                  </div>
                </div>

                <h4 style={styles.sectionTitle}>
                  客户可见备注（共 {visibleRemarks.length} 条）
                </h4>
                {visibleRemarks.length > 0 ? (
                  <div style={styles.remarkList}>
                    {visibleRemarks.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          ...styles.remarkItem,
                          ...(seenRemarkIds.has(r.id)
                            ? styles.remarkItemSeen
                            : {}),
                        }}
                      >
                        <div style={styles.remarkHeader}>
                          <span style={styles.remarkAuthor}>
                            {r.authorName}（{ROLE_LABELS[r.authorRole]}）
                          </span>
                          <div style={styles.remarkTags}>
                            {seenRemarkIds.has(r.id) ? (
                              <span style={styles.remarkTagSeen}>已查看</span>
                            ) : (
                              <span style={styles.remarkTagUnseen}>
                                待查看
                              </span>
                            )}
                            {r.isCritical && (
                              <span style={styles.remarkTagCritical}>
                                重要
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={styles.remarkContent}>{r.content}</div>
                        <div style={styles.remarkTime}>
                          {formatDateTime(r.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyRemark}>
                    暂无可向客户展示的备注
                  </div>
                )}

                {order.status === 'PENDING_CONFIRMATION' &&
                  visibleRemarks.length > 0 &&
                  !allVisibleSeen && (
                    <button
                      style={styles.markSeenBtn}
                      onClick={() =>
                        handleMarkRemarksSeen(
                          visibleRemarks.map((r) => r.id)
                        )
                      }
                    >
                      👁️ 客户已查看全部备注
                    </button>
                  )}
              </div>
            )}

            {order.confirmations.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>
                    确认历史（共 {order.confirmations.length} 次）
                  </h3>
                </div>
                <div style={styles.historyList}>
                  {[...order.confirmations]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        style={{
                          ...styles.historyItem,
                          ...(selectedConfirmationId === c.id
                            ? styles.historyItemActive
                            : {}),
                        }}
                        onClick={() => setSelectedConfirmationId(c.id)}
                      >
                        <div style={styles.historyLeft}>
                          <span
                            style={{
                              ...styles.historyStatus,
                              color:
                                c.status === 'CONFIRMED'
                                  ? '#059669'
                                  : c.status === 'OBJECTED'
                                  ? '#dc2626'
                                  : '#f59e0b',
                            }}
                          >
                            {c.status === 'PENDING'
                              ? '待确认'
                              : c.status === 'CONFIRMED'
                              ? '已确认'
                              : c.status === 'OBJECTED'
                              ? '有异议'
                              : '已过期'}
                          </span>
                          <span style={styles.historyMethod}>
                            {c.confirmationMethod === 'ON_SITE'
                              ? '现场'
                              : c.confirmationMethod === 'ONLINE'
                              ? '线上'
                              : '电话'}
                          </span>
                        </div>
                        <div style={styles.historyRight}>
                          {c.confirmedPrice && (
                            <span style={styles.historyPrice}>
                              {formatPrice(c.confirmedPrice)}
                            </span>
                          )}
                          <span style={styles.historyTime}>
                            {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div style={styles.sideCol}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>常用动作</h3>
              </div>
              <div style={styles.actionList}>
                {canInitiate && (
                  <>
                    <div style={styles.methodSelect}>
                      <label style={styles.label}>确认方式</label>
                      <select
                        style={styles.select}
                        value={confirmationMethod}
                        onChange={(e) =>
                          setConfirmationMethod(
                            e.target.value as any
                          )
                        }
                      >
                        <option value="ON_SITE">现场确认</option>
                        <option value="ONLINE">线上确认</option>
                        <option value="PHONE">电话确认</option>
                      </select>
                    </div>
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...styles.actionBtnPrimary,
                      }}
                      onClick={handleInitiateConfirmation}
                    >
                      📢 发起客户确认
                    </button>
                  </>
                )}

                {canConfirm && (
                  <button
                    style={{
                      ...styles.actionBtn,
                      ...styles.actionBtnSuccess,
                    }}
                    onClick={handleConfirm}
                    disabled={!allVisibleSeen && visibleRemarks.length > 0}
                  >
                    ✅ 客户确认接受价格
                  </button>
                )}

                {canObject && (
                  <>
                    <textarea
                      style={styles.textarea}
                      placeholder="请记录客户异议内容..."
                      value={objectionContent}
                      onChange={(e) => setObjectionContent(e.target.value)}
                    />
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...styles.actionBtnDanger,
                      }}
                      onClick={handleObject}
                      disabled={!objectionContent.trim()}
                    >
                      ❌ 客户有异议
                    </button>
                  </>
                )}

                {canComplete && (
                  <button
                    style={{
                      ...styles.actionBtn,
                      ...styles.actionBtnSuccess,
                    }}
                    onClick={handleComplete}
                  >
                    🎉 完成回收
                  </button>
                )}

                {!canInitiate &&
                  !canConfirm &&
                  !canObject &&
                  !canComplete && (
                    <div style={styles.noAction}>
                      当前状态无可用操作
                    </div>
                  )}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>客户信息</h3>
              </div>
              <div style={styles.customerInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>姓名</span>
                  <span style={styles.infoValue}>{order.customerName}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>电话</span>
                  <span style={styles.infoValue}>{order.customerPhone}</span>
                </div>
                {order.customerIdCard && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>身份证</span>
                    <span style={styles.infoValue}>
                      {order.customerIdCard}
                    </span>
                  </div>
                )}
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>来源</span>
                  <span style={styles.infoValue}>{order.source}</span>
                </div>
              </div>
            </div>

            {order.tags.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>标签</h3>
                </div>
                <div style={styles.tags}>
                  {order.tags.map((tag, i) => (
                    <span key={i} style={styles.tag}>
                      {tag}
                    </span>
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
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  statusBadgeWrap: {
    display: 'flex',
    gap: '8px',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
  },
  urgencyBadge: {
    padding: '6px 14px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
  },
  noticeBox: {
    display: 'flex',
    gap: '12px',
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px',
  },
  noticeIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  noticeTitle: {
    fontWeight: 'bold',
    color: '#1e40af',
    fontSize: '14px',
    marginBottom: '4px',
  },
  noticeText: {
    color: '#1e3a8a',
    fontSize: '13px',
    lineHeight: '1.7',
  },
  alertBox: {
    display: 'flex',
    gap: '12px',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px',
  },
  alertIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  alertTitle: {
    fontWeight: 'bold',
    color: '#991b1b',
    fontSize: '14px',
    marginBottom: '4px',
  },
  alertText: {
    color: '#7f1d1d',
    fontSize: '13px',
    lineHeight: '1.6',
    marginBottom: '6px',
  },
  alertMeta: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '20px',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sideCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'sticky',
    top: '20px',
    alignSelf: 'flex-start',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  valuationStatus: {
    fontSize: '13px',
    color: '#6b7280',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '500',
  },
  priceDisplay: {
    textAlign: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  priceLabel: {
    fontSize: '14px',
    color: '#166534',
    marginBottom: '8px',
  },
  priceValue: {
    fontSize: '40px',
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: '4px',
  },
  priceRange: {
    fontSize: '13px',
    color: '#16a34a',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    margin: '16px 0 12px 0',
  },
  inspectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inspectionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    fontSize: '13px',
  },
  inspectionLabel: {
    color: '#6b7280',
    width: '60px',
  },
  inspectionValue: {
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  remarkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  remarkItem: {
    padding: '14px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    transition: 'all 0.2s',
  },
  remarkItemSeen: {
    background: '#f0fdf4',
    borderColor: '#86efac',
  },
  remarkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  remarkAuthor: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  remarkTags: {
    display: 'flex',
    gap: '6px',
  },
  remarkTagSeen: {
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
  },
  remarkTagUnseen: {
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
  },
  remarkTagCritical: {
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
  },
  remarkContent: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '8px',
  },
  remarkTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  emptyRemark: {
    padding: '20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  markSeenBtn: {
    width: '100%',
    marginTop: '12px',
    padding: '12px',
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 14px',
    background: '#f9fafb',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  historyItemActive: {
    background: '#eff6ff',
    borderColor: '#3b82f6',
  },
  historyLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  historyStatus: {
    fontSize: '13px',
    fontWeight: 'bold',
  },
  historyMethod: {
    padding: '2px 8px',
    background: '#e5e7eb',
    color: '#4b5563',
    borderRadius: '6px',
    fontSize: '11px',
  },
  historyRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  historyPrice: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#059669',
  },
  historyTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  methodSelect: {
    marginBottom: '4px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#374151',
    marginBottom: '6px',
    fontWeight: '500',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    boxSizing: 'border-box',
  },
  actionBtn: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  actionBtnPrimary: {
    background: '#2563eb',
    color: 'white',
  },
  actionBtnSuccess: {
    background: '#059669',
    color: 'white',
  },
  actionBtnDanger: {
    background: '#dc2626',
    color: 'white',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    marginBottom: '8px',
  },
  noAction: {
    padding: '20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  customerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  tags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tag: {
    padding: '4px 10px',
    background: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '6px',
    fontSize: '12px',
  },
};

export default ConfirmationDetail;
