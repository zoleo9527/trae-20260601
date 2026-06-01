import {
    BellOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Card, Col, List, Row, Spin, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Text } = Typography;

const NODE_TYPE_LABELS = {
  film: '拍片',
  consultation: '方案沟通',
  surgery1: '一期手术',
  suture_removal: '拆线',
  surgery2: '二期手术',
  crown: '戴牙冠',
};

const STATUS_COLORS = {
  planned: 'blue',
  completed: 'green',
  cancelled: 'default',
  rescheduled: 'orange',
};

const STATUS_LABELS = {
  planned: '已计划',
  completed: '已完成',
  cancelled: '已取消',
  rescheduled: '已改期',
};

const ALERT_TYPE_LABELS = {
  reschedule: '改期提醒',
  consumable_change: '耗材变更',
  missed_followup: '遗漏随访',
};

const ALERT_TYPE_COLORS = {
  reschedule: 'orange',
  consumable_change: 'blue',
  missed_followup: 'red',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, todaySurgeries: 0, pendingAlerts: 0, stockWarnings: 0 });
  const [todayNodes, setTodayNodes] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const today = dayjs().format('YYYY-MM-DD');

      const patientsReq = api.get('/patients').catch(() => ({ data: [] }));
      const alertsReq = api.get('/alerts', { params: { is_read: 0 } }).catch(() => ({ data: [] }));
      const consumablesReq = api.get('/consumables', { params: { status: 'available' } }).catch(() => ({ data: [] }));

      const [patientsRes, alertsRes, consumablesRes] = await Promise.all([
        user.role === 'frontdesk' || user.role === 'doctor' ? patientsReq : { data: [] },
        alertsReq,
        consumablesReq,
      ]);

      let dailyNodes = [];
      if (user.role === 'frontdesk' || user.role === 'doctor') {
        const dailyRes = await api.get('/schedules/daily', { params: { date: today } }).catch(() => ({ data: [] }));
        dailyNodes = Array.isArray(dailyRes.data) ? dailyRes.data : [];
      }

      const patientList = Array.isArray(patientsRes.data) ? patientsRes.data : [];
      const alertList = Array.isArray(alertsRes.data) ? alertsRes.data : [];
      const availableConsumables = Array.isArray(consumablesRes.data) ? consumablesRes.data : [];

      setStats({
        patients: patientList.length,
        todaySurgeries: dailyNodes.length,
        pendingAlerts: alertList.length,
        stockWarnings: availableConsumables.filter((c) => c.stock_qty <= 2).length,
      });
      setTodayNodes(dailyNodes);
      setRecentAlerts(alertList.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic title="总患者数" value={stats.patients} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic title="今日手术" value={stats.todaySurgeries} prefix={<CalendarOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic title="待处理提醒" value={stats.pendingAlerts} prefix={<BellOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic title="库存预警" value={stats.stockWarnings} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={<span><CalendarOutlined style={{ marginRight: 8 }} />今日手术安排</span>}
            extra={<a onClick={() => navigate('/schedule')}>查看全部</a>}
          >
            {todayNodes.length === 0 ? (
              <Text type="secondary">今日暂无手术安排</Text>
            ) : (
              <List
                dataSource={todayNodes}
                renderItem={(node) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/patient/${node.patient_id}`)}
                  >
                    <List.Item.Meta
                      avatar={<ClockCircleOutlined style={{ fontSize: 20, color: STATUS_COLORS[node.status] || '#999' }} />}
                      title={
                        <span>
                          {node.patient_name}
                          <Tag color={STATUS_COLORS[node.status]} style={{ marginLeft: 8 }}>
                            {STATUS_LABELS[node.status] || node.status}
                          </Tag>
                        </span>
                      }
                      description={`${NODE_TYPE_LABELS[node.node_type] || node.node_type} | ${node.planned_date ? dayjs(node.planned_date).format('YYYY-MM-DD') : '日期待定'}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<span><BellOutlined style={{ marginRight: 8 }} />最近提醒</span>}
            extra={<a onClick={() => navigate('/alerts')}>查看全部</a>}
          >
            {recentAlerts.length === 0 ? (
              <Text type="secondary">暂无提醒</Text>
            ) : (
              <List
                dataSource={recentAlerts}
                renderItem={(alert) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <span>
                          <Tag color={ALERT_TYPE_COLORS[alert.type]}>{ALERT_TYPE_LABELS[alert.type] || alert.type}</Tag>
                          {alert.patient_name || (alert.patient_id ? `患者ID: ${alert.patient_id}` : '')}
                        </span>
                      }
                      description={alert.message}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(alert.created_at).format('MM-DD HH:mm')}
                    </Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
