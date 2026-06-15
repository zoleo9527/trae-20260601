import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Layout from '@/components/Layout';
import OrderList from '@/components/OrderList';
import { apiRequest } from '@/utils/api';

const PROCESSOR_STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'PENDING_VALUATION', label: '待估价' },
  { key: 'VALUATED', label: '估价中' },
  { key: 'OBJECTED', label: '待重估' },
  { key: 'RE_VALUATED', label: '已重估' },
  { key: 'COMPLETED', label: '已完成' },
];

const ProcessorHome: NextPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    objected: 0,
    valuated: 0,
  });

  const loadOrders = async (status?: string) => {
    setLoading(true);
    try {
      const res = await apiRequest(
        `/api/orders${status && status !== 'all' ? `?status=${status}` : ''}`
      );
      if (res.success) {
        setOrders(res.data);
        const all = res.data;
        setStats({
          total: all.length,
          pending: all.filter((o: any) => o.status === 'PENDING_VALUATION')
            .length,
          objected: all.filter((o: any) => o.status === 'OBJECTED').length,
          valuated: all.filter(
            (o: any) => o.status === 'VALUATED' || o.status === 'RE_VALUATED'
          ).length,
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
            <h2 style={styles.pageTitle}>估价工作台</h2>
            <p style={styles.pageDesc}>
              设备检测、价格评估、响应异议
            </p>
          </div>
          <div style={styles.statsBar}>
            <div style={{ ...styles.statItem, ...styles.statItemUrgent }}>
              <div style={styles.statNum}>{stats.pending}</div>
              <div style={styles.statLabel}>待估价</div>
            </div>
            <div style={{ ...styles.statItem, ...styles.statItemWarning }}>
              <div style={styles.statNum}>{stats.objected}</div>
              <div style={styles.statLabel}>待重估</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNum}>{stats.valuated}</div>
              <div style={styles.statLabel}>已估价</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNum}>{stats.total}</div>
              <div style={styles.statLabel}>全部</div>
            </div>
          </div>
        </div>

        <div style={styles.pressureBox}>
          <div style={styles.pressureIcon}>⚡</div>
          <div>
            <div style={styles.pressureTitle}>现场压力提醒</div>
            <div style={styles.pressureText}>
              <strong>{stats.pending}</strong> 台待估价，
              <strong style={{ color: '#dc2626' }}> {stats.objected}</strong>{' '}
              台客户有异议需要重新估价
              <br />
              备注分"内部可见"和"客户可见"，客户可见的备注会同步到确认页面！
            </div>
          </div>
        </div>

        <div style={styles.filterBar}>
          {PROCESSOR_STATUS_FILTERS.map((f) => (
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
          <OrderList orders={orders} role="PROCESSOR" />
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
    minWidth: '80px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  statItemUrgent: {
    background: '#fee2e2',
  },
  statItemWarning: {
    background: '#fef3c7',
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
  pressureBox: {
    display: 'flex',
    gap: '12px',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '1px solid #fca5a5',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px',
  },
  pressureIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  pressureTitle: {
    fontWeight: 'bold',
    color: '#991b1b',
    fontSize: '14px',
    marginBottom: '4px',
  },
  pressureText: {
    color: '#7f1d1d',
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

export default ProcessorHome;
