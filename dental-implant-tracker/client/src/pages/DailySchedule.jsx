import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, DatePicker, Empty, Row, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Text } = Typography;

const NODE_TYPE_LABELS = {
  film: '拍片', consultation: '方案沟通', surgery1: '一期手术',
  suture_removal: '拆线', surgery2: '二期手术', crown: '戴牙冠',
};

const STATUS_LABELS = { planned: '已计划', completed: '已完成', cancelled: '已取消', rescheduled: '已改期' };
const STATUS_COLORS = { planned: 'blue', completed: 'green', cancelled: 'default', rescheduled: 'orange' };

const NODE_TYPE_BG = {
  film: '#e6f7ff', consultation: '#f6ffed', surgery1: '#fff1f0',
  suture_removal: '#fff7e6', surgery2: '#fff1f0', crown: '#f9f0ff',
};
const NODE_TYPE_BORDER = {
  film: '#91d5ff', consultation: '#b7eb8f', surgery1: '#ffa39e',
  suture_removal: '#ffd591', surgery2: '#ffa39e', crown: '#d3adf7',
};

export default function DailySchedule() {
  const navigate = useNavigate();
  const [date, setDate] = useState(dayjs());
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, [date]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/schedules/daily', { params: { date: date.format('YYYY-MM-DD') } });
      setNodes(Array.isArray(data) ? data : []);
    } catch {
      setNodes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <CalendarOutlined style={{ fontSize: 20, marginRight: 8 }} />
            <Text strong style={{ fontSize: 16 }}>每日手术安排</Text>
          </Col>
          <Col>
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              allowClear={false}
              format="YYYY年MM月DD日"
            />
          </Col>
          <Col>
            <Tag color={date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? 'green' : 'default'}>
              {date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? '今天' : ''}
            </Tag>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}><Spin size="large" /></div>
      ) : nodes.length === 0 ? (
        <Card>
          <Empty description="当日暂无手术安排" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {nodes.map((node) => (
            <Col xs={24} sm={12} lg={8} key={node.id}>
              <Card
                hoverable
                style={{
                  borderLeft: `4px solid ${NODE_TYPE_BORDER[node.node_type] || '#d9d9d9'}`,
                  background: NODE_TYPE_BG[node.node_type] || '#fafafa',
                }}
                onClick={() => navigate(`/patient/${node.patient_id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    <UserOutlined style={{ marginRight: 6 }} />
                    {node.patient_name}
                  </Text>
                  <Tag color={STATUS_COLORS[node.status]}>
                    {STATUS_LABELS[node.status] || node.status}
                  </Tag>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Tag style={{ fontSize: 13 }}>
                    {NODE_TYPE_LABELS[node.node_type] || node.node_type}
                  </Tag>
                </div>
                {node.doctor_name && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>医生：{node.doctor_name}</Text>
                  </div>
                )}
                {node.consumable_name && (
                  <div style={{ marginBottom: 4 }}>
                    <Tag style={{ fontSize: 12 }}>耗材：{node.consumable_name}</Tag>
                  </div>
                )}
                {node.planned_date && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      计划日期：{dayjs(node.planned_date).format('YYYY-MM-DD')}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
