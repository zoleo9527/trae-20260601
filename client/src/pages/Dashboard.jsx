import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Tag, Space, List, Button } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  AlertOutlined,
  FireOutlined,
  ScheduleOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import api from '../api.js';
import { STATUS_MAP, SEVERITY_MAP, HAZARD_CATEGORY_MAP } from '../constants.js';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [hazards, setHazards] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(setStats);
    api.get('/hazards', { params: { rectify_status: 'all' } }).then(data => setHazards(data.slice(0, 6)));
    api.get('/appointments').then(data => setAppointments(data.slice(0, 5)));
    api.get('/visits').then(data => setVisits(data.filter(v => v.status === 'pending').slice(0, 5)));
  }, []);

  const getCategoryOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['隐患总数', '已整改'], top: 0 },
    grid: { left: 50, right: 20, bottom: 30, top: 50 },
    xAxis: {
      type: 'category',
      data: stats.hazardByCategory?.map(c => c.category) || [],
      axisLabel: { interval: 0, rotate: 0 }
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '隐患总数',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#ff7a45' },
        data: stats.hazardByCategory?.map(c => c.cnt) || []
      },
      {
        name: '已整改',
        type: 'bar',
        stack: 'total2',
        itemStyle: { color: '#52c41a' },
        data: stats.hazardByCategory?.map(c => c.rectified_cnt) || []
      }
    ]
  });

  const getStatusOption = () => {
    const colors = {
      pending: '#bfbfbf',
      notified: '#1677ff',
      scheduled: '#13c2c2',
      unreachable: '#722ed1',
      refused: '#eb2f96',
      partial: '#faad14',
      rectified: '#52c41a',
      waived: '#8c8c8c'
    };
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        data: stats.statusBreakdown?.map(s => ({
          value: s.cnt,
          name: STATUS_MAP[s.status]?.text || s.status,
          itemStyle: { color: colors[s.status] || '#1677ff' }
        })) || []
      }]
    };
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="服务客户"
              value={stats.totalCustomers || 0}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>户</span>}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="安检计划"
              value={stats.totalPlans || 0}
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>个 · 今日{stats.todayPlans || 0}</span>}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理隐患"
              value={stats.pendingHazards || 0}
              prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            >
              <div style={{ marginTop: 8 }}>
                <Tag color="red">高危 {stats.highHazards || 0}</Tag>
                <Tag color="orange">需施工 {stats.pendingHazards ? stats.pendingHazards - (stats.completedRevisit || 0) : 0}</Tag>
              </div>
            </Statistic>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="复查预约"
              value={stats.pendingAppointments || 0}
              prefix={<ScheduleOutlined style={{ color: '#13c2c2' }} />}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>待上门</span>}
              valueStyle={{ color: '#13c2c2' }}
            >
              <div style={{ marginTop: 8 }}>
                <Tag color="orange"><HomeOutlined /> 多次未遇 {stats.missedVisits || 0}</Tag>
                <Tag color="green"><CheckCircleOutlined /> 已整改 {stats.completedRevisit || 0}</Tag>
              </div>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} md={14}>
          <Card
            title={<><FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />隐患类型分布</>}
            extra={<Button type="link" onClick={() => navigate('/hazards')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <ReactECharts option={getCategoryOption()} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card
            title={<><AlertOutlined style={{ color: '#faad14', marginRight: 8 }} />整改状态概览</>}
            extra={<Button type="link" onClick={() => navigate('/hazards')}>全部隐患</Button>}
          >
            <ReactECharts option={getStatusOption()} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card
            title={<><AlertOutlined style={{ color: '#ff7a45', marginRight: 8 }} />最新隐患记录</>}
            extra={<Button type="link" onClick={() => navigate('/hazards')}>全部 <ArrowRightOutlined /></Button>}
            bodyStyle={{ padding: 0 }}
          >
            <List
              dataSource={hazards}
              locale={{ emptyText: '暂无隐患数据' }}
              renderItem={item => (
                <List.Item
                  style={{ padding: '14px 24px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                  onClick={() => navigate('/hazards')}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: HAZARD_CATEGORY_MAP[item.category] || '#1677ff',
                        color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 18
                      }}>⚠️</div>
                    }
                    title={
                      <Space wrap>
                        <span>{item.hazard_name}</span>
                        <Tag color={SEVERITY_MAP[item.severity]?.color}>
                          {SEVERITY_MAP[item.severity]?.text}
                        </Tag>
                        <Tag color={STATUS_MAP[item.rectify_status]?.color}>
                          {STATUS_MAP[item.rectify_status]?.text}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ color: 'rgba(0,0,0,0.65)' }}>
                          📍 {item.customer_name || '未关联客户'} · {item.customer_address || ''}
                        </div>
                        <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 4, fontSize: 12 }}>
                          ⏰ 整改期限：{item.deadline ? dayjs(item.deadline).format('YYYY-MM-DD') : '未设定'}
                          {item.deadline && dayjs(item.deadline).isBefore(dayjs(), 'day') && (
                            <span style={{ color: '#ff4d4f', marginLeft: 8 }}>· 已逾期</span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card
            title={<><ScheduleOutlined style={{ color: '#13c2c2', marginRight: 8 }} />近期复查预约</>}
            extra={<Button type="link" onClick={() => navigate('/appointments')}>全部</Button>}
            bodyStyle={{ padding: 0 }}
          >
            <List
              dataSource={appointments}
              locale={{ emptyText: '暂无预约' }}
              renderItem={item => (
                <List.Item style={{ padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={<div style={{ width: 36, textAlign: 'center', color: '#1677ff' }}>
                      <div style={{ fontSize: 11, lineHeight: '14px' }}>{dayjs(item.appointment_date).format('MM')}月</div>
                      <div style={{ fontSize: 20, fontWeight: 600, lineHeight: '24px' }}>{dayjs(item.appointment_date).format('DD')}</div>
                    </div>}
                    title={<Space size={4}>
                      <span style={{ fontWeight: 500 }}>{item.customer_name}</span>
                      <Tag color="blue" style={{ marginLeft: 8 }}>{item.appointment_time_slot}</Tag>
                    </Space>}
                    description={
                      <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>
                        📝 {item.hazard_name || '隐患复查'}<br />
                        👷 安检员：{item.inspector_name || '未指派'}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card
            title={<><CustomerServiceOutlined style={{ color: '#722ed1', marginRight: 8 }} />待跟进回访</>}
            extra={<Button type="link" onClick={() => navigate('/visits')}>全部</Button>}
            bodyStyle={{ padding: 0 }}
          >
            <List
              dataSource={visits}
              locale={{ emptyText: '暂无待跟进' }}
              renderItem={item => (
                <List.Item style={{ padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>{item.customer_name}</span>
                        <Tag color="orange">跟进中</Tag>
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
                        📞 {item.visit_method === 'phone' ? '电话回访' : item.visit_method === 'onsite' ? '上门' : '短信'}
                        <br />
                        <span style={{ color: '#999' }}>下一步：{item.follow_up || '-'}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
