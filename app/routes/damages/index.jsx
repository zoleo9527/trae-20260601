import { useState } from 'react';
import { Link, useLoaderData } from '@remix-run/react';
import { getDamageRecords } from '~/models/damage.server';
import { damageStatusMap, damageTypes } from '~/data/mockData';

export async function loader() {
  const damages = await getDamageRecords();
  return { damages };
}

export default function DamageListPage() {
  const { damages } = useLoaderData();
  const [filterStatus, setFilterStatus] = useState('all');
  
  const filteredDamages = filterStatus === 'all' 
    ? damages 
    : damages.filter(d => d.status === filterStatus);
  
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

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/dashboard/warehouse" style={styles.backLink}>← 返回</Link>
        <h1 style={styles.title}>⚠️ 破损登记管理</h1>
        <div style={styles.headerRight}>
          <Link to="/damages/report" style={styles.newBtn}>+ 新建登记</Link>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.filterBar}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === 'all' ? '#667eea' : '#f0f0f0', color: filterStatus === 'all' ? '#fff' : '#666' }}
          >
            全部 ({damages.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === 'pending' ? '#FF9800' : '#f0f0f0', color: filterStatus === 'pending' ? '#fff' : '#666' }}
          >
            待审核 ({damages.filter(d => d.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === 'processing' ? '#2196F3' : '#f0f0f0', color: filterStatus === 'processing' ? '#fff' : '#666' }}
          >
            处理中 ({damages.filter(d => d.status === 'processing').length})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === 'resolved' ? '#4CAF50' : '#f0f0f0', color: filterStatus === 'resolved' ? '#fff' : '#666' }}
          >
            已解决 ({damages.filter(d => d.status === 'resolved').length})
          </button>
        </div>

        {filteredDamages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <p>暂无破损记录</p>
          </div>
        ) : (
          <div style={styles.damageList}>
            {filteredDamages.map((damage) => (
              <Link 
                key={damage.id} 
                to={`/damages/${damage.id}`}
                style={styles.damageCard}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardLeft}>
                    <span style={styles.damageId}>{damage.id}</span>
                    <span style={styles.damageType}>
                      {getDamageTypeLabel(damage.damageType)}
                    </span>
                  </div>
                  <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(damage.status) }}>
                    {damageStatusMap[damage.status]}
                  </span>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.customerInfo}>
                    <div style={styles.customerName}>{damage.order?.customerName}</div>
                    <div style={styles.productInfo}>
                      {damage.order?.productName} - 破损 {damage.damageQuantity}{damage.order?.unit}
                    </div>
                  </div>
                  <div style={styles.damageDesc}>{damage.damageDescription}</div>
                </div>
                <div style={styles.cardFooter}>
                  <span style={styles.reportTime}>上报时间: {formatTime(damage.reportedAt)}</span>
                  <span style={styles.reporter}>上报人: {damage.reporter?.name}</span>
                </div>
              </Link>
            ))}
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
    width: '100px',
    textAlign: 'right',
  },
  newBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  main: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  filterBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  damageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  damageCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardLeft: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  damageId: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  damageType: {
    padding: '2px 8px',
    background: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '12px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
    fontWeight: '500',
  },
  cardContent: {
    marginBottom: '12px',
  },
  customerInfo: {
    marginBottom: '8px',
  },
  customerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  productInfo: {
    fontSize: '14px',
    color: '#666',
  },
  damageDesc: {
    fontSize: '14px',
    color: '#e74c3c',
    lineHeight: '1.5',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid #eee',
  },
  reportTime: {
    fontSize: '12px',
    color: '#999',
  },
  reporter: {
    fontSize: '12px',
    color: '#999',
  },
};