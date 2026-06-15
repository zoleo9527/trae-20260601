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
import type { RecyclingOrder, Valuation } from '@/types/models';

const ROLE_LABELS: Record<string, string> = {
  RECEPTIONIST: '前台',
  PROCESSOR: '处理人员',
  MANAGER: '店长',
};

const ValuationDetail: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<RecyclingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedValuationId, setSelectedValuationId] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState({
    estimatedPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    screen: '',
    battery: '',
    appearance: '',
    function: '',
    waterproof: '',
    idLocked: false,
    networkLocked: false,
    remark: '',
    isRemarkVisibleToCustomer: true,
    isRemarkCritical: false,
  });
  const [newRemark, setNewRemark] = useState('');
  const [newRemarkVisible, setNewRemarkVisible] = useState(true);
  const [newRemarkCritical, setNewRemarkCritical] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
        if (res.data.currentValuationId) {
          setSelectedValuationId(res.data.currentValuationId);
        } else if (res.data.valuations.length > 0) {
          setSelectedValuationId(res.data.valuations[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (selectedValuationId && order) {
      const v = order.valuations.find((v) => v.id === selectedValuationId);
      if (v) {
        setFormData({
          estimatedPrice: v.estimatedPrice,
          minPrice: v.minPrice,
          maxPrice: v.maxPrice,
          screen: v.inspectionItems.screen,
          battery: v.inspectionItems.battery,
          appearance: v.inspectionItems.appearance,
          function: v.inspectionItems.function,
          waterproof: v.inspectionItems.waterproof,
          idLocked: v.inspectionItems.idLocked,
          networkLocked: v.inspectionItems.networkLocked,
          remark: '',
          isRemarkVisibleToCustomer: true,
          isRemarkCritical: false,
        });
      }
    }
  }, [selectedValuationId, order]);

  const handleAction = async (action: string) => {
    if (!order) return;

    const body: any = { action };

    if (action === 'create' || action === 'revaluate') {
      body.estimatedPrice = formData.estimatedPrice;
      body.minPrice = formData.minPrice;
      body.maxPrice = formData.maxPrice;
      body.inspectionItems = {
        screen: formData.screen,
        battery: formData.battery,
        appearance: formData.appearance,
        function: formData.function,
        waterproof: formData.waterproof,
        idLocked: formData.idLocked,
        networkLocked: formData.networkLocked,
      };
      if (formData.remark) {
        body.remark = formData.remark;
        body.isRemarkVisibleToCustomer = formData.isRemarkVisibleToCustomer;
        body.isRemarkCritical = formData.isRemarkCritical;
      }
    } else if (action === 'submit' || action === 'approve' || action === 'reject') {
      body.valuationId = selectedValuationId;
      if (action === 'submit') {
        body.estimatedPrice = formData.estimatedPrice;
        body.minPrice = formData.minPrice;
        body.maxPrice = formData.maxPrice;
        body.inspectionItems = {
          screen: formData.screen,
          battery: formData.battery,
          appearance: formData.appearance,
          function: formData.function,
          waterproof: formData.waterproof,
          idLocked: formData.idLocked,
          networkLocked: formData.networkLocked,
        };
      }
      if (formData.remark) {
        body.remark = formData.remark;
        body.isRemarkVisibleToCustomer = formData.isRemarkVisibleToCustomer;
        body.isRemarkCritical = formData.isRemarkCritical;
      }
    }

    const res = await apiRequest(`/api/orders/${order.id}/valuation`, {
      method: 'POST',
      body,
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert(res.idempotent ? '操作已执行（幂等返回）' : '操作成功');
      loadOrder();
    } else {
      alert('操作失败: ' + res.error);
    }
  };

  const handleAddRemark = async () => {
    if (!order || !selectedValuationId || !newRemark.trim()) return;

    const res = await apiRequest(`/api/orders/${order.id}/valuation`, {
      method: 'POST',
      body: {
        action: 'add_remark',
        valuationId: selectedValuationId,
        content: newRemark,
        isVisibleToCustomer: newRemarkVisible,
        isCritical: newRemarkCritical,
      },
      idempotencyKey: generateIdempotencyKey(),
    });

    if (res.success) {
      alert('备注添加成功');
      setNewRemark('');
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

  const selectedValuation = order.valuations.find(
    (v) => v.id === selectedValuationId
  );
  const sortedValuations = [...order.valuations].sort(
    (a, b) => b.version - a.version
  );

  const canCreateNew =
    order.status === 'PENDING_VALUATION' || order.status === 'OBJECTED';
  const canSubmit =
    selectedValuation?.status === 'DRAFT';
  const currentUser =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('currentUser') || '{}')
      : null;
  const isProcessor = currentUser?.role === 'PROCESSOR';
  const isManager = currentUser?.role === 'MANAGER';
  const canApprove =
    isManager && selectedValuation?.status === 'SUBMITTED';

  return (
    <Layout activeTab="list">
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <button style={styles.backBtn} onClick={() => router.back()}>
              ← 返回
            </button>
            <h2 style={styles.title}>估价处理</h2>
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

        {order.status === 'OBJECTED' && (
          <div style={styles.alertBox}>
            <div style={styles.alertIcon}>🚨</div>
            <div>
              <div style={styles.alertTitle}>客户有异议，需要重新估价！</div>
              <div style={styles.alertText}>
                {order.confirmations[order.confirmations.length - 1]
                  ?.objectionContent || '客户对价格有异议，请重新评估'}
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
                  <span style={styles.infoLabel}>品类</span>
                  <span style={styles.infoValue}>{order.device.category}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>品牌型号</span>
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
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>购买日期</span>
                  <span style={styles.infoValue}>
                    {order.device.purchaseDate || '-'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>原价</span>
                  <span style={styles.infoValue}>
                    {order.device.originalPrice
                      ? formatPrice(order.device.originalPrice)
                      : '-'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>IMEI</span>
                  <span style={styles.infoValue}>
                    {order.device.imei || '-'}
                  </span>
                </div>
                <div style={{ ...styles.infoItem, gridColumn: 'span 2' }}>
                  <span style={styles.infoLabel}>故障描述</span>
                  <span style={styles.infoValue}>
                    {order.device.defects.length > 0
                      ? order.device.defects.join('、')
                      : '无'}
                  </span>
                </div>
                <div style={{ ...styles.infoItem, gridColumn: 'span 2' }}>
                  <span style={styles.infoLabel}>配件</span>
                  <span style={styles.infoValue}>
                    {order.device.accessories.length > 0
                      ? order.device.accessories.join('、')
                      : '无'}
                  </span>
                </div>
              </div>
            </div>

            {selectedValuation ? (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>
                    估价详情（版本 v{selectedValuation.version}）
                  </h3>
                  <div style={styles.valuationStatus}>
                    状态:{' '}
                    <span
                      style={{
                        color:
                          selectedValuation.status === 'APPROVED'
                            ? '#059669'
                            : selectedValuation.status === 'REJECTED'
                            ? '#dc2626'
                            : '#f59e0b',
                        fontWeight: 'bold',
                      }}
                    >
                      {selectedValuation.status === 'DRAFT'
                        ? '草稿'
                        : selectedValuation.status === 'SUBMITTED'
                        ? '待审批'
                        : selectedValuation.status === 'APPROVED'
                        ? '已通过'
                        : '已拒绝'}
                    </span>
                  </div>
                </div>

                <div style={styles.priceSection}>
                  <div style={styles.priceInput}>
                    <label style={styles.label}>估价（元）</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={formData.estimatedPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedPrice: Number(e.target.value),
                        })
                      }
                      disabled={!canSubmit && !canCreateNew}
                    />
                  </div>
                  <div style={styles.priceRange}>
                    <div style={styles.priceInput}>
                      <label style={styles.label}>最低价</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.minPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minPrice: Number(e.target.value),
                          })
                        }
                        disabled={!canSubmit && !canCreateNew}
                      />
                    </div>
                    <div style={styles.priceInput}>
                      <label style={styles.label}>最高价</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.maxPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxPrice: Number(e.target.value),
                          })
                        }
                        disabled={!canSubmit && !canCreateNew}
                      />
                    </div>
                  </div>
                </div>

                <h4 style={styles.sectionTitle}>检测项目</h4>
                <div style={styles.inspectionGrid}>
                  <div style={styles.inspectionItem}>
                    <label style={styles.label}>屏幕</label>
                    <input
                      style={styles.input}
                      value={formData.screen}
                      onChange={(e) =>
                        setFormData({ ...formData, screen: e.target.value })
                      }
                      disabled={!canSubmit && !canCreateNew}
                      placeholder="如：完好、有划痕等"
                    />
                  </div>
                  <div style={styles.inspectionItem}>
                    <label style={styles.label}>电池</label>
                    <input
                      style={styles.input}
                      value={formData.battery}
                      onChange={(e) =>
                        setFormData({ ...formData, battery: e.target.value })
                      }
                      disabled={!canSubmit && !canCreateNew}
                      placeholder="如：健康度85%、循环次数100等"
                    />
                  </div>
                  <div style={styles.inspectionItem}>
                    <label style={styles.label}>外观</label>
                    <input
                      style={styles.input}
                      value={formData.appearance}
                      onChange={(e) =>
                        setFormData({ ...formData, appearance: e.target.value })
                      }
                      disabled={!canSubmit && !canCreateNew}
                      placeholder="如：轻微使用痕迹等"
                    />
                  </div>
                  <div style={styles.inspectionItem}>
                    <label style={styles.label}>功能</label>
                    <input
                      style={styles.input}
                      value={formData.function}
                      onChange={(e) =>
                        setFormData({ ...formData, function: e.target.value })
                      }
                      disabled={!canSubmit && !canCreateNew}
                      placeholder="如：全部正常等"
                    />
                  </div>
                  <div style={styles.inspectionItem}>
                    <label style={styles.label}>防水</label>
                    <input
                      style={styles.input}
                      value={formData.waterproof}
                      onChange={(e) =>
                        setFormData({ ...formData, waterproof: e.target.value })
                      }
                      disabled={!canSubmit && !canCreateNew}
                      placeholder="如：完好、未检测、已破坏等"
                    />
                  </div>
                  <div style={styles.inspectionItem}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.idLocked}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            idLocked: e.target.checked,
                          })
                        }
                        disabled={!canSubmit && !canCreateNew}
                      />
                      ID锁
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.networkLocked}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            networkLocked: e.target.checked,
                          })
                        }
                        disabled={!canSubmit && !canCreateNew}
                      />
                      网络锁
                    </label>
                  </div>
                </div>

                <h4 style={styles.sectionTitle}>备注（当前估价）</h4>
                <textarea
                  style={styles.textarea}
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData({ ...formData, remark: e.target.value })
                  }
                  disabled={!canSubmit && !canCreateNew}
                  placeholder="填写备注说明..."
                />
                {(canSubmit || canCreateNew) && (
                  <div style={styles.remarkOptions}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.isRemarkVisibleToCustomer}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isRemarkVisibleToCustomer: e.target.checked,
                          })
                        }
                      />
                      客户可见
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.isRemarkCritical}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isRemarkCritical: e.target.checked,
                          })
                        }
                      />
                      关键备注
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>📝</div>
                <div style={styles.emptyText}>暂无估价记录，请创建新估价</div>
              </div>
            )}

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>估价历史（共 {order.valuations.length} 版）</h3>
              </div>
              <div style={styles.historyList}>
                {sortedValuations.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      ...styles.historyItem,
                      ...(selectedValuationId === v.id
                        ? styles.historyItemActive
                        : {}),
                    }}
                    onClick={() => setSelectedValuationId(v.id)}
                  >
                    <div style={styles.historyLeft}>
                      <span style={styles.historyVersion}>v{v.version}</span>
                      <span
                        style={{
                          ...styles.historyStatus,
                          color:
                            v.status === 'APPROVED'
                              ? '#059669'
                              : v.status === 'REJECTED'
                              ? '#dc2626'
                              : '#f59e0b',
                        }}
                      >
                        {v.status === 'DRAFT'
                          ? '草稿'
                          : v.status === 'SUBMITTED'
                          ? '待审批'
                          : v.status === 'APPROVED'
                          ? '已通过'
                          : '已拒绝'}
                      </span>
                      <span style={styles.historyPrice}>
                        {formatPrice(v.estimatedPrice)}
                      </span>
                    </div>
                    <div style={styles.historyRight}>
                      <span style={styles.historyProcessor}>
                        {v.processorName}
                      </span>
                      <span style={styles.historyTime}>
                        {formatDateTime(v.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedValuation && selectedValuation.remarks.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>备注列表</h3>
                </div>
                <div style={styles.remarkList}>
                  {selectedValuation.remarks.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        ...styles.remarkItem,
                        ...(r.isCritical ? styles.remarkItemCritical : {}),
                      }}
                    >
                      <div style={styles.remarkHeader}>
                        <span style={styles.remarkAuthor}>
                          {r.authorName}（{ROLE_LABELS[r.authorRole]}）
                        </span>
                        <div style={styles.remarkTags}>
                          {r.isVisibleToCustomer && (
                            <span style={styles.remarkTagVisible}>
                              客户可见
                            </span>
                          )}
                          {!r.isVisibleToCustomer && (
                            <span style={styles.remarkTagInternal}>
                              内部可见
                            </span>
                          )}
                          {r.isCritical && (
                            <span style={styles.remarkTagCritical}>
                              关键
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
              </div>
            )}

            {selectedValuation && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>添加备注</h3>
                </div>
                <textarea
                  style={styles.textarea}
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="添加新的备注说明..."
                />
                <div style={styles.remarkOptions}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newRemarkVisible}
                      onChange={(e) => setNewRemarkVisible(e.target.checked)}
                    />
                    客户可见
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newRemarkCritical}
                      onChange={(e) => setNewRemarkCritical(e.target.checked)}
                    />
                    关键备注
                  </label>
                  <button style={styles.addRemarkBtn} onClick={handleAddRemark}>
                    添加备注
                  </button>
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
                {canCreateNew && isProcessor && (
                  <button
                    style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }}
                    onClick={() =>
                      handleAction(
                        order.status === 'OBJECTED' ? 'revaluate' : 'create'
                      )
                    }
                  >
                    {order.status === 'OBJECTED' ? '🔄 重新估价' : '➕ 创建估价'}
                  </button>
                )}
                {canSubmit && isProcessor && (
                  <button
                    style={{ ...styles.actionBtn, ...styles.actionBtnSuccess }}
                    onClick={() => handleAction('submit')}
                  >
                    ✅ 提交估价审批
                  </button>
                )}
                {canApprove && (
                  <>
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...styles.actionBtnSuccess,
                      }}
                      onClick={() => handleAction('approve')}
                    >
                      ✅ 审批通过
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                      onClick={() => handleAction('reject')}
                    >
                      ❌ 审批拒绝
                    </button>
                  </>
                )}
                {!canCreateNew && !canSubmit && !canApprove && (
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
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>创建时间</span>
                  <span style={styles.infoValue}>
                    {formatDateTime(order.createdAt)}
                  </span>
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
  priceSection: {
    marginBottom: '20px',
  },
  priceInput: {
    marginBottom: '12px',
  },
  priceRange: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#374151',
    marginBottom: '6px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    margin: '16px 0 12px 0',
  },
  inspectionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  inspectionItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
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
  },
  remarkOptions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  emptyCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
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
  historyVersion: {
    fontWeight: 'bold',
    color: '#1f2937',
    fontSize: '14px',
  },
  historyStatus: {
    fontSize: '12px',
    fontWeight: '500',
  },
  historyPrice: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#059669',
  },
  historyRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  historyProcessor: {
    fontSize: '12px',
    color: '#6b7280',
  },
  historyTime: {
    fontSize: '11px',
    color: '#9ca3af',
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
    borderLeft: '3px solid #d1d5db',
  },
  remarkItemCritical: {
    background: '#fef2f2',
    borderLeftColor: '#dc2626',
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
  remarkTagVisible: {
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '11px',
  },
  remarkTagInternal: {
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '6px',
    fontSize: '11px',
  },
  remarkTagCritical: {
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    fontSize: '11px',
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
  addRemarkBtn: {
    marginLeft: 'auto',
    padding: '8px 16px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
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

export default ValuationDetail;
