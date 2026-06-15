import { Link, useLoaderData } from '@remix-run/react';
import { getOperationLogs } from '~/models/log.server';

export async function loader() {
  const logs = await getOperationLogs();
  return { logs };
}

export default function LogsPage() {
  const { logs } = useLoaderData();
  
  const getActionLabel = (action) => {
    const labels = {
      dispatch: '出库配送',
      sign: '客户签收',
      report_damage: '上报破损',
      review_damage: '审核破损',
      contact_customer: '联系客户',
      resolve_damage: '完成处理',
    };
    return labels[action] || action;
  };
  
  const getActionIcon = (action) => {
    const icons = {
      dispatch: '📦',
      sign: '✏️',
      report_damage: '⚠️',
      review_damage: '✅',
      contact_customer: '📞',
      resolve_damage: '🎉',
    };
    return icons[action] || '📌';
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
        <h1 style={styles.title}>📊 操作日志</h1>
        <div style={styles.headerRight}></div>
      </header>

      <main style={styles.main}>
        {logs.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <p>暂无操作记录</p>
          </div>
        ) : (
          <div style={styles.logTable}>
            <div style={styles.tableHeader}>
              <div style={styles.th}>时间</div>
              <div style={styles.th}>操作人</div>
              <div style={styles.th}>操作类型</div>
              <div style={styles.th}>目标</div>
              <div style={styles.th}>备注</div>
            </div>
            {logs.map((log) => (
              <div key={log.id} style={styles.tableRow}>
                <div style={styles.td}>{formatTime(log.time)}</div>
                <div style={styles.td}>{log.user?.name}</div>
                <div style={styles.td}>
                  <span style={styles.actionIcon}>{getActionIcon(log.action)}</span>
                  <span>{getActionLabel(log.action)}</span>
                </div>
                <div style={styles.td}>
                  <span style={styles.targetBadge}>
                    {log.target_type === 'delivery' ? '送货单' : '破损记录'}
                  </span>
                  <span style={styles.targetId}>{log.target_id}</span>
                </div>
                <div style={styles.td}>{log.remark}</div>
              </div>
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
  },
  main: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  emptyState: {
    background: '#fff',
    borderRadius: '12px',
    padding: '60px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  logTable: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '150px 120px 120px 200px 1fr',
    padding: '12px 16px',
    background: '#f8f9fa',
    borderBottom: '1px solid #eee',
  },
  th: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '150px 120px 120px 200px 1fr',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  td: {
    fontSize: '14px',
    color: '#333',
  },
  actionIcon: {
    marginRight: '6px',
  },
  targetBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px',
  },
  targetId: {
    fontSize: '13px',
    color: '#666',
  },
};
