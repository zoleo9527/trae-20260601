import {
    CalendarOutlined,
    CheckOutlined,
    EyeOutlined,
    ToolOutlined, WarningOutlined,
} from '@ant-design/icons';
import { Button, Card, Space, Table, Tabs, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ALERT_TYPE_LABELS = { reschedule: '改期提醒', consumable_change: '耗材变更', missed_followup: '遗漏随访' };
const ALERT_TYPE_COLORS = { reschedule: 'orange', consumable_change: 'blue', missed_followup: 'red' };
const ALERT_TYPE_ICONS = {
  reschedule: <CalendarOutlined />,
  consumable_change: <ToolOutlined />,
  missed_followup: <WarningOutlined />,
};

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, [tab]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab === 'unread') params.is_read = 0;
      if (tab === 'read') params.is_read = 1;
      const { data } = await api.get('/alerts', { params });
      setAlerts(Array.isArray(data) ? data : data.items || []);
    } catch {
      message.error('获取提醒列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      message.success('已标记为已读');
      fetchAlerts();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const handleMarkAllRead = async () => {
    const unreadAlerts = alerts.filter((a) => !a.is_read);
    try {
      await Promise.all(unreadAlerts.map((a) => api.put(`/alerts/${a.id}/read`)));
      message.success('已全部标记为已读');
      fetchAlerts();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    {
      title: '提醒类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (v) => (
        <Tag color={ALERT_TYPE_COLORS[v]} icon={ALERT_TYPE_ICONS[v]}>
          {ALERT_TYPE_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: '关联患者',
      key: 'patient',
      width: 100,
      render: (_, record) => (
        record.patient_id ? (
          <a onClick={() => navigate(`/patient/${record.patient_id}`)}>
            {record.patient_name || `患者ID: ${record.patient_id}`}
          </a>
        ) : '-'
      ),
    },
    {
      title: '消息内容',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'is_read',
      key: 'is_read',
      width: 80,
      render: (v) => v ? <Tag>已读</Tag> : <Tag color="blue">未读</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {!record.is_read && (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleMarkRead(record.id)}>
              标记已读
            </Button>
          )}
          {record.patient_id && (
            <Button type="link" size="small" onClick={() => navigate(`/patient/${record.patient_id}`)}>
              查看患者
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: '未读' },
    { key: 'read', label: '已读' },
  ];

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs activeKey={tab} onChange={setTab} items={tabItems} style={{ marginBottom: 0 }} />
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={handleMarkAllRead}>
            全部标记已读
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={alerts}
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        rowClassName={(record) => (!record.is_read ? 'row-unread' : '')}
      />
    </Card>
  );
}
