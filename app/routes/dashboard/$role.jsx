import { Link, useNavigate, useLoaderData } from '@remix-run/react';
import { getUserById } from '~/models/user.server';
import { getDeliveryRecords, getPendingDeliveries, getDeliveriesInTransit } from '~/models/delivery.server';
import { getDamageRecords, getPendingDamageRecords, getProcessingDamageRecords } from '~/models/damage.server';
import { getOperationLogs } from '~/models/log.server';
import { deliveryStatusMap, damageStatusMap } from '~/data/mockData';

export async function loader({ params, request }) {
  const { role } = params;
  
  const cookieHeader = request.headers.get('Cookie');
  const userIdMatch = cookieHeader?.match(/userId=(\d+)/);
  const userId = userIdMatch ? userIdMatch[1] : '1';
  
  const user = await getUserById(userId);
  
  const [
    allDeliveries,
    pendingDeliveries,
    inTransitDeliveries,
    allDamages,
    pendingDamages,
    processingDamages,
    logs,
  ] = await Promise.all([
    getDeliveryRecords(),
    getPendingDeliveries(),
    getDeliveriesInTransit(),
    getDamageRecords(),
    getPendingDamageRecords(),
    getProcessingDamageRecords(),
    getOperationLogs(),
  ]);
  
  return {
    user,
    role,
    allDeliveries,
    pendingDeliveries,
    inTransitDeliveries,
    allDamages,
    pendingDamages,
    processingDamages,
    logs,
  };
}

export default function DashboardPage() {
  const {
    user,
    role,
    pendingDeliveries,
    inTransitDeliveries,
    pendingDamages,
    processingDamages,
    logs,
  } = useLoaderData();
  
  const navigate = useNavigate();
  
  const roleConfig = {
    warehouse: {
      name: '仓库主管',
      icon: '🏭',
      mainActions: [
        { label: '待出库订单', count: pendingDeliveries.length, path: '/deliveries/sign', bgColor: '#4CAF50' },
        { label: '运输中订单', count: inTransitDeliveries.length, path: '/deliveries/sign', bgColor: '#2196F3' },
        { label: '待审核破损', count: pendingDamages.length, path: '/damages', bgColor: '#FF9800' },
      ],
    },
    driver: {
      name: '司机',
      icon: '🚛',
      mainActions: [
        { label: '待签收订单', count: inTransitDeliveries.length, path: '/deliveries/sign', bgColor: '#2196F3' },
        { label: '待上报破损', count: pendingDamages.length, path: '/damages/report', bgColor: '#F44336' },
      ],
    },
    customer: {
      name: '客服',
      icon: '📞',
      mainActions: [
        { label: '待处理破损', count: processingDamages.length, path: '/damages', bgColor: '#FF9800' },
        { label: '待审核破损', count: pendingDamages.length, path: '/damages', bgColor: '#FFC107' },
      ],
    },
  };

  const config = roleConfig[role] || roleConfig.warehouse;
  
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

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
        <div style={styles.headerLeft}>
          <div style={styles.logo}>📦 建材仓配</div>
          <div style={styles.date}>{today}</div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={styles.roleIcon}>{config.icon}</span>
            <span>{user?.name || config.name}</span>
          </div>
          <button
            onClick={() => navigate('/')}
            style={styles.logoutBtn}
          >
            退出登录
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>今日待处理</h2>
          <div style={styles.cards}>
            {config.mainActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                style={{ ...styles.card, backgroundColor: action.bgColor }}
              >
                <div style={styles.cardIcon}>{action.count > 0 ? '🔥' : '📋'}</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardTitle}>{action.label}</div>
                  <div style={styles.cardCount}>{action.count} 件</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>快速入口</h2>
          </div>
          <div style={styles.quickActions}>
            <QuickAction
              icon="📦"
              label="送货签收"
              desc="处理订单签收"
              path="/deliveries/sign"
              visible={role !== 'customer'}
            />
            <QuickAction
              icon="⚠️"
              label="破损登记"
              desc="上报/处理破损"
              path="/damages"
              visible={true}
            />
            <QuickAction
              icon="📊"
              label="操作日志"
              desc="查看操作记录"
              path="/logs"
              visible={role === 'warehouse'}
            />
          </div>
        </div>

        {(role === 'warehouse' || role === 'driver') && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>今日配送任务</h2>
              <Link to="/deliveries/sign" style={styles.viewAll}>查看全部</Link>
            </div>
            <div style={styles.taskList}>
              {(pendingDeliveries.concat(inTransitDeliveries)).slice(0, 3).map((delivery) => (
                <div key={delivery.id} style={styles.taskItem}>
                  <div style={styles.taskHeader}>
                    <span style={styles.taskId}>{delivery.id}</span>
                    <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(delivery.status) }}>
                      {deliveryStatusMap[delivery.status]}
                    </span>
                  </div>
                  <div style={styles.taskInfo}>
                    <div style={styles.taskCustomer}>{delivery.order?.customerName}</div>
                    <div style={styles.taskProduct}>{delivery.order?.productName} x {delivery.order?.quantity}{delivery.order?.unit}</div>
                    <div style={styles.taskAddress}>📍 {delivery.deliveryAddress}</div>
                  </div>
                  <div style={styles.taskTime}>
                    计划: {formatTime(delivery.plannedTime)}
                  </div>
                  {delivery.status === 'in_transit' && (
                    <Link to="/deliveries/sign" style={styles.signBtn}>
                      立即签收
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {role !== 'driver' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>破损处理进度</h2>
              <Link to="/damages" style={styles.viewAll}>查看全部</Link>
            </div>
            <div style={styles.taskList}>
              {(pendingDamages.concat(processingDamages)).slice(0, 3).map((damage) => (
                <div key={damage.id} style={styles.taskItem}>
                  <div style={styles.taskHeader}>
                    <span style={styles.taskId}>{damage.id}</span>
                    <span style={{ ...styles.statusBadge, backgroundColor: getDamageStatusColor(damage.status) }}>
                      {damageStatusMap[damage.status]}
                    </span>
                  </div>
                  <div style={styles.taskInfo}>
                    <div style={styles.taskCustomer}>{damage.order?.customerName}</div>
                    <div style={styles.taskProduct}>{damage.order?.productName}</div>
                    <div style={styles.damageDesc}>{damage.damageDescription}</div>
                  </div>
                  <div style={styles.taskTime}>
                    上报时间: {formatTime(damage.reportedAt)}
                  </div>
                  <Link to={`/damages/${damage.id}`} style={styles.detailBtn}>
                    查看详情
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {role === 'warehouse' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>最近操作</h2>
            </div>
            <div style={styles.logList}>
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <span style={styles.logTime}>{formatTime(log.time)}</span>
                  <span style={styles.logUser}>{log.user?.name}</span>
                  <span style={styles.logAction}>{log.remark}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function QuickAction({ icon, label, desc, path, visible }) {
  if (!visible) return null;
  
  return (
    <Link to={path} style={styles.quickAction}>
      <div style={styles.quickIcon}>{icon}</div>
      <div style={styles.quickLabel}>{label}</div>
      <div style={styles.quickDesc}>{desc}</div>
    </Link>
  );
}

function getStatusColor(status) {
  const colors = {
    pending: '#9E9E9E',
    in_transit: '#2196F3',
    signed: '#4CAF50',
    damaged: '#F44336',
  };
  return colors[status] || '#9E9E9E';
}

function getDamageStatusColor(status) {
  const colors = {
    pending: '#FF9800',
    processing: '#2196F3',
    resolved: '#4CAF50',
  };
  return colors[status] || '#9E9E9E';
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
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  date: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#f5f7fa',
    borderRadius: '20px',
  },
  roleIcon: {
    fontSize: '18px',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
  },
  main: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 20px',
  },
  viewAll: {
    fontSize: '14px',
    color: '#667eea',
    textDecoration: 'none',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    borderRadius: '12px',
    color: '#fff',
    textDecoration: 'none',
    transition: 'transform 0.2s',
  },
  cardIcon: {
    fontSize: '32px',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '4px',
  },
  cardCount: {
    fontSize: '28px',
    fontWeight: '700',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
  },
  quickAction: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'transform 0.2s',
  },
  quickIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  quickLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  quickDesc: {
    fontSize: '12px',
    color: '#666',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskItem: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  taskId: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
  },
  taskInfo: {
    marginBottom: '8px',
  },
  taskCustomer: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  taskProduct: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  },
  taskAddress: {
    fontSize: '12px',
    color: '#999',
  },
  damageDesc: {
    fontSize: '13px',
    color: '#e74c3c',
    marginTop: '4px',
  },
  taskTime: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '12px',
  },
  signBtn: {
    display: 'inline-block',
    padding: '8px 16px',
    background: '#667eea',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  detailBtn: {
    display: 'inline-block',
    padding: '8px 16px',
    background: '#f0f0f0',
    color: '#666',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    background: '#f8f9fa',
    borderRadius: '6px',
  },
  logTime: {
    fontSize: '12px',
    color: '#999',
    minWidth: '100px',
  },
  logUser: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a1a2e',
    minWidth: '100px',
  },
  logAction: {
    fontSize: '13px',
    color: '#666',
  },
};