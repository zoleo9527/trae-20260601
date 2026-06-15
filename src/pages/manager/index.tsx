import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Layout from '@/components/Layout';
import OrderList from '@/components/OrderList';
import { apiRequest } from '@/utils/api';

const MANAGER_STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'SUBMITTED', label: '待审批' },
  { key: 'PENDING_CONFIRMATION', label: '待确认' },
  { key: 'OBJECTED', label: '有异议' },
  { key: 'CONFIRMED', label: '已确认' },
  { key: 'COMPLETED', label: '已完成' },
];

const ManagerHome: NextPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pendingApproval: 0,
    objected: 0,
    completed: 0,
    totalValue: 0,
  });

  const loadOrders = async (status?: string) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/orders`);
      if (res.success) {
        setAllOrders(res.data);
        let filtered = res.data;
        if (status && status !== 'all') {
          if (status === 'SUBMITTED') {
            filtered = res.data.filter((o: any) => {
              const currentValuation = o.valuations?.find(
                (v: any) => v.id === o.currentValuationId
              );
              return currentValuation?.status === 'SUBMITTED';
            });
          } else {
            filtered = res.data.filter(
              (o: any) => o.status === status
            );
          }
        }
        setOrders(filtered);
        const all = res.data;
        const pendingApproval = all.filter((o: any) => {
          const v = o.valuations?.find(
            (v: any) => v.id === o.currentValuationId
          );
          return v?.status === 'SUBMITTED';
        }).length;
        setStats({
          total: all.length,
          pendingApproval,
          objected: all.filter((o: any) => o.status === 'OBJECTED').length,
          completed: all.filter((o: any) => o.status === 'COMPLETED').length,
          totalValue: all
            .filter((o: any) => o.status === 'COMPLETED')
            .reduce((sum: number, o: any) => sum + (o.currentPrice || 0), 0),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(activeFilter);
  }, [activeFilter]);

  return (
    <Layout activeTab="list">
      <div>
        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.pageTitle}>店长工作台</h2>
            <p style={styles.pageDesc}>
              审批估价、全局监控、审计追踪
            </p>
          </div>
          <div style={styles.statsBar}>
            <div style={{ ...styles.statItem, ...styles.statItemUrgent }}>
              <div style={styles.statNum}>{stats.pendingApproval}</div>
              <div style={styles.statLabel}>待审批</div>
            </div>
            <div style={{ ...styles.statItem, ...styles.statItemWarning }}>
              <div style={styles.statNum}>{stats.objected}</div>
              <div style={styles.statLabel}>有异议</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNum}>{stats.completed}</div>
              <div style={styles.statLabel}>已完成</div>
            </div>
            <div style={{ ...styles.statItem, ...styles.statItemSuccess }}>
              <div style={styles.statNum}>
                ¥{stats.totalValue.toLocaleString()}
              </div>
              <div style={styles.statLabel}>回收总额</div>
            </div>
          </div>
        </div>

        <div style={styles.noticeBox}>
          <div style={styles.noticeIcon}>📋</div>
          <div>
            <div style={styles.noticeTitle}>店长职责提醒</div>
            <div style={styles.noticeText}>
              • 请及时审批估价单，避免客户长时间等待
              <br />
              • 客户异议单请优先处理，必要时介入沟通
              <br />
              • 审计日志可追溯所有操作，关注异常状态变更
            </div>
          </div>
        </div>

        <div style={styles.filterBar}>
          {MANAGER_STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              style={{
                ...styles.filterBtn,
                ...(activeFilter === f.key ? styles.filterBtnActive : {}),
              }}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : (
          <OrderList orders={orders} role="MANAGER" />
        )}
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  pageDesc: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  statsBar: {
    display: 'flex',
    gap: '12px',
  },
  statItem: {
    padding: '12px 20px',
    background: 'white',
    borderRadius: '10px',
    textAlign: 'center',
    minWidth: '100px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  statItemUrgent: {
    background: '#fee2e2',
  },
  statItemWarning: {
    background: '#fef3c7',
  },
  statItemSuccess: {
    background: '#d1fae5',
  },
  statNum: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  noticeBox: {
    display: 'flex',
    gap: '12px',
    background: '#ecfdf5',
    border: '1px solid #6ee7b7',
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
    color: '#065f46',
    fontSize: '14px',
    marginBottom: '4px',
  },
  noticeText: {
    color: '#064e3b',
    fontSize: '13px',
    lineHeight: '1.7',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#6b7280',
  },
  filterBtnActive: {
    background: '#2563eb',
    borderColor: '#2563eb',
    color: 'white',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
};

export default ManagerHome;
