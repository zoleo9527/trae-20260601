import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Layout from '@/components/Layout';
import OrderList from '@/components/OrderList';
import { apiRequest } from '@/utils/api';
import { STATUS_LABELS } from '@/types/stateMachine';

const RECEPTIONIST_STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'VALUATED,PENDING_CONFIRMATION', label: '待确认' },
  { key: 'CONFIRMED', label: '已确认' },
  { key: 'OBJECTED', label: '有异议' },
  { key: 'RE_VALUATED', label: '已重估' },
  { key: 'COMPLETED', label: '已完成' },
];

const ReceptionistHome: NextPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pendingConfirmation: 0,
    objected: 0,
    confirmed: 0,
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
          pendingConfirmation: all.filter(
            (o: any) => o.status === 'PENDING_CONFIRMATION'
          ).length,
          objected: all.filter((o: any) => o.status === 'OBJECTED').length,
          confirmed: all.filter((o: any) => o.status === 'CONFIRMED').length,
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
            <h2 style={styles.pageTitle}>前台工作台</h2>
            <p style={styles.pageDesc}>
              管理回收单、发起客户确认、跟进客户异议
            </p>
          </div>
          <div style={styles.statsBar}>
            <div style={styles.statItem}>
              <div style={styles.statNum}>{stats.pendingConfirmation}</div>
              <div style={styles.statLabel}>待确认</div>
            </div>
            <div style={{ ...styles.statItem, ...styles.statItemWarning }}>
              <div style={styles.statNum}>{stats.objected}</div>
              <div style={styles.statLabel}>有异议</div>
            </div>
            <div style={{ ...styles.statItem, ...styles.statItemSuccess }}>
              <div style={styles.statNum}>{stats.confirmed}</div>
              <div style={styles.statLabel}>已确认</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNum}>{stats.total}</div>
              <div style={styles.statLabel}>全部</div>
            </div>
          </div>
        </div>

        <div style={styles.alertBox}>
          <div style={styles.alertIcon}>📢</div>
          <div>
            <div style={styles.alertTitle}>现场注意事项</div>
            <div style={styles.alertText}>
              • 客户确认时务必让客户看到所有可见备注，点击"客户已查看"标记
              <br />
              • 客户有异议时请完整记录异议内容，必要时上传照片
              <br />
              • 每一步操作都会记录审计日志，请谨慎操作
            </div>
          </div>
        </div>

        <div style={styles.filterBar}>
          {RECEPTIONIST_STATUS_FILTERS.map((f) => (
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
          <OrderList orders={orders} role="RECEPTIONIST" />
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
  alertBox: {
    display: 'flex',
    gap: '12px',
    background: '#dbeafe',
    border: '1px solid #93c5fd',
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
    color: '#1e40af',
    fontSize: '14px',
    marginBottom: '4px',
  },
  alertText: {
    color: '#1e3a8a',
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

export default ReceptionistHome;
