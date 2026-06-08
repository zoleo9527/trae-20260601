import { useEffect, useState, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { dashboardApi } from '../api';
import './Dashboard.css';

interface StatItem {
  key: string;
  label: string;
  value: number;
  unit: string;
  level: 'green' | 'orange' | 'red';
}

interface Alert {
  id: number;
  alert_type: string;
  severity: string;
  container_no?: string;
  from_status?: string;
  to_status?: string;
  reason?: string;
  detail?: string;
  changed_at?: string;
  planned_date?: string;
  missed_reason?: string;
  plan_type?: string;
  dispute_reason?: string;
  total_fee?: number;
  changed_by?: string;
  slot_code?: string;
  allowed_type?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lastRefreshRef = useRef(dayjs());

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const statsRes: any = await dashboardApi.getStats();
      const alertsRes: any = await dashboardApi.getRecentAlerts({ limit: 20 });

      const sd = statsRes?.data || statsRes || {};
      const containers = sd.containers || {};
      const fees = sd.fees || {};
      const inspections = sd.inspections || {};
      const allocations = sd.allocations || {};
      const slots = sd.slots || {};

      const alertItems: Alert[] = Array.isArray(alertsRes?.data)
        ? alertsRes.data
        : Array.isArray(alertsRes)
          ? alertsRes
          : [];

      const statItems: StatItem[] = [
        {
          key: 'in_yard',
          label: '场内集装箱',
          value: containers.inYard ?? 0,
          unit: '箱',
          level: 'green',
        },
        {
          key: 'misplaced',
          label: '错放集装箱',
          value: containers.misplaced ?? 0,
          unit: '箱',
          level: (containers.misplaced ?? 0) > 3 ? 'red' : (containers.misplaced ?? 0) > 0 ? 'orange' : 'green',
        },
        {
          key: 'overdue',
          label: '逾期费用',
          value: fees.overdueCount ?? 0,
          unit: '笔',
          level: (fees.overdueCount ?? 0) > 5 ? 'red' : (fees.overdueCount ?? 0) > 2 ? 'orange' : 'green',
        },
        {
          key: 'missed',
          label: '漏检通知',
          value: inspections.missed ?? 0,
          unit: '项',
          level: (inspections.missed ?? 0) > 2 ? 'red' : (inspections.missed ?? 0) > 0 ? 'orange' : 'green',
        },
        {
          key: 'pending',
          label: '待分配',
          value: allocations.pending ?? 0,
          unit: '箱',
          level: (allocations.pending ?? 0) > 3 ? 'orange' : 'green',
        },
      ];

      setStats(statItems);
      setAlerts(alertItems);
      lastRefreshRef.current = dayjs();
    } catch (err: any) {
      setError(err.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const misplaced = stats.find((s) => s.key === 'misplaced')?.value ?? 0;
  const overdue = stats.find((s) => s.key === 'overdue')?.value ?? 0;
  const missed = stats.find((s) => s.key === 'missed')?.value ?? 0;
  const isUnderPressure = misplaced > 3 || overdue > 5 || missed > 2;

  const getAlertLabel = (alert: Alert): string => {
    switch (alert.alert_type) {
      case 'STATUS_CHANGE':
        return `箱号 ${alert.container_no || ''} 状态从 ${alert.from_status || ''} 变更为 ${alert.to_status || ''}${alert.reason ? '，原因：' + alert.reason : ''}`;
      case 'MISPLACED':
        return `箱号 ${alert.container_no || ''} 在位 ${alert.slot_code || ''} 错放（允许类型：${alert.allowed_type || ''}）`;
      case 'MISSED_INSPECTION':
        return `箱号 ${alert.container_no || ''} ${alert.plan_type || ''}查验漏通知${alert.missed_reason ? '，原因：' + alert.missed_reason : ''}`;
      case 'FEE_DISPUTE':
        return `箱号 ${alert.container_no || ''} 费用争议 ¥${alert.total_fee || 0}${alert.dispute_reason ? '，原因：' + alert.dispute_reason : ''}`;
      default:
        return `告警：${alert.container_no || ''} ${alert.reason || alert.detail || ''}`;
    }
  };

  const getAlertTime = (alert: Alert): string => {
    return alert.changed_at || alert.planned_date || '';
  };

  const getSeverityClass = (severity: string) => {
    if (severity === 'danger' || severity === 'critical') return 'dashboard__alert-type--critical';
    if (severity === 'warning') return 'dashboard__alert-type--warning';
    return 'dashboard__alert-type--info';
  };

  const getSeverityLabel = (severity: string) => {
    if (severity === 'danger' || severity === 'critical') return '严重';
    if (severity === 'warning') return '警告';
    return '信息';
  };

  if (loading) {
    return <div className="dashboard__loading">正在加载运行数据...</div>;
  }

  return (
    <div className="dashboard">
      {isUnderPressure && (
        <div className="dashboard__pressure-bar">
          <span className="dashboard__pressure-icon">⚠</span>
          运行压力警告：系统检测到异常指标，请及时处理！
          错放 {misplaced} 箱 | 逾期 {overdue} 笔 | 漏检 {missed} 项
        </div>
      )}

      {error && <div className="dashboard__error">{error}</div>}

      <div className="dashboard__stats">
        {stats.map((stat) => (
          <div key={stat.key} className={`dashboard__stat-card dashboard__stat-card--${stat.level}`}>
            <div className="dashboard__stat-label">{stat.label}</div>
            <div className="dashboard__stat-value">
              {stat.value}
              <span className="dashboard__stat-unit">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard__section">
        <div className="dashboard__section-title">最近告警</div>
        {alerts.length === 0 ? (
          <div style={{ color: '#5a7a9a', fontSize: 13, padding: '12px 0' }}>暂无告警信息</div>
        ) : (
          <ul className="dashboard__alert-list">
            {alerts.map((alert, idx) => (
              <li key={alert.id || idx} className="dashboard__alert-item">
                <span className="dashboard__alert-time">
                  {getAlertTime(alert) ? dayjs(getAlertTime(alert)).format('MM-DD HH:mm') : '--'}
                </span>
                <span className={`dashboard__alert-type ${getSeverityClass(alert.severity)}`}>
                  {getSeverityLabel(alert.severity)}
                </span>
                <span className="dashboard__alert-type-tag">{alert.alert_type === 'STATUS_CHANGE' ? '状态' : alert.alert_type === 'MISPLACED' ? '错放' : alert.alert_type === 'MISSED_INSPECTION' ? '漏检' : alert.alert_type === 'FEE_DISPUTE' ? '费用' : '其他'}</span>
                <span className="dashboard__alert-msg">{getAlertLabel(alert)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dashboard__refresh-info">
        上次刷新：{lastRefreshRef.current.format('HH:mm:ss')} | 每10秒自动刷新
      </div>
    </div>
  );
}
