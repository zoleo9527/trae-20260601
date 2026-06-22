import React, { useEffect, useState } from 'react';
import {
  Card, Descriptions, Row, Col, Tabs, Tag, Space, Table,
  Avatar, Button, Empty, Tooltip, Timeline, Badge
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, PhoneOutlined,
  FormOutlined, AlertOutlined, FileTextOutlined, ScheduleOutlined,
  AuditOutlined, CustomerServiceOutlined, CalendarOutlined,
  HomeOutlined, EyeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api.js';
import {
  STATUS_MAP, SEVERITY_MAP, VISIT_STATUS_MAP,
  APPOINTMENT_STATUS_MAP, NOTICE_METHOD_MAP, VISIT_PURPOSE_MAP,
  VISIT_METHOD_MAP, HAZARD_CATEGORY_MAP
} from '../constants.js';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/customers/${id}`).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Card loading={true} style={{ margin: 20 }} />;
  if (!data) return <Empty description="客户不存在" />;

  const { customer, records, hazards, notices, appointments, visits } = data;

  const recordColumns = [
    {
      title: '安检日期', dataIndex: 'inspect_date', width: 160,
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '安检员', dataIndex: 'inspector_name', width: 100
    },
    {
      title: '用户在家', dataIndex: 'is_user_at_home', width: 90,
      render: t => t ? <Tag color="green">✓ 在家</Tag> : <Tag color="orange">✗ 未遇</Tag>
    },
    {
      title: '气表读数', dataIndex: 'meter_reading', width: 110,
      render: t => t ? `${t} m³` : '—'
    },
    {
      title: '安检结论', dataIndex: 'overall_status', width: 120,
      render: t => ({
        normal: <Tag color="green" icon={<EyeOutlined />}>安检正常</Tag>,
        hazard: <Tag color="red" icon={<AlertOutlined />}>发现隐患</Tag>,
        missed: <Tag color="orange" icon={<HomeOutlined />}>上门未遇</Tag>
      }[t])
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true }
  ];

  const hazardColumns = [
    {
      title: '隐患名称',
      render: (_, r) => (
        <Space>
          <AlertOutlined style={{ color: SEVERITY_MAP[r.severity]?.color === 'red' ? '#ff4d4f' : '#faad14' }} />
          <span style={{ fontWeight: 500 }}>{r.hazard_name}</span>
          <Tag color={HAZARD_CATEGORY_MAP[r.category] || '#1677ff'}>{r.category}</Tag>
          {r.is_construction ? <Tag color="purple">需施工</Tag> : null}
        </Space>
      )
    },
    {
      title: '严重等级', dataIndex: 'severity', width: 100,
      render: t => <Tag color={SEVERITY_MAP[t]?.color}>{SEVERITY_MAP[t]?.text}</Tag>
    },
    {
      title: '整改状态', dataIndex: 'rectify_status', width: 120,
      render: t => <Tag color={STATUS_MAP[t]?.color}>{STATUS_MAP[t]?.text}</Tag>
    },
    {
      title: '整改期限', dataIndex: 'deadline', width: 120,
      render: t => t ? (
        <Badge
          status={dayjs(t).isBefore(dayjs(), 'day') ? 'error' : 'processing'}
          text={dayjs(t).format('YYYY-MM-DD')}
        />
      ) : '—'
    },
    {
      title: '发现位置', dataIndex: 'location',
      render: t => t || '—'
    }
  ];

  const noticeColumns = [
    {
      title: '通知编号', dataIndex: 'notice_no', width: 170,
      render: t => <code style={{ color: '#1677ff' }}>{t}</code>
    },
    {
      title: '出具日期', dataIndex: 'issue_date', width: 160,
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '送达方式', dataIndex: 'notice_method', width: 110,
      render: t => <Tag>{NOTICE_METHOD_MAP[t] || t}</Tag>
    },
    {
      title: '整改期限', dataIndex: 'deadline', width: 120,
      render: t => dayjs(t).format('YYYY-MM-DD')
    },
    {
      title: '用户签收', dataIndex: 'customer_signature', width: 110,
      render: t => t ? <Tag color="green">✓ {t}</Tag> : <Tag color="orange">未签收</Tag>
    }
  ];

  const appointmentColumns = [
    {
      title: '预约编号', dataIndex: 'appointment_no', width: 170,
      render: t => <code style={{ color: '#722ed1' }}>{t}</code>
    },
    {
      title: '预约时间',
      render: (_, r) => (
        <Space>
          <CalendarOutlined />
          {dayjs(r.appointment_date).format('YYYY-MM-DD')}
          <Tag color="blue">{r.appointment_time_slot}</Tag>
        </Space>
      )
    },
    {
      title: '上门人员', dataIndex: 'inspector_name', width: 110,
      render: t => t || '未指派'
    },
    {
      title: '状态', dataIndex: 'status', width: 110,
      render: t => <Tag color={APPOINTMENT_STATUS_MAP[t]?.color}>{APPOINTMENT_STATUS_MAP[t]?.text}</Tag>
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true }
  ];

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>返回列表</Button>
          <div className="page-title">客户档案详情</div>
        </Space>
        <Space>
          <Button type="primary" onClick={() => navigate('/visits')}>
            <CustomerServiceOutlined /> 发起回访
          </Button>
        </Space>
      </div>

      <Card
        style={{ marginBottom: 20, borderRadius: 8 }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={24} align="middle">
          <Col>
            <Avatar size={72} style={{ background: '#1677ff' }} icon={<UserOutlined style={{ fontSize: 32 }} />} />
          </Col>
          <Col flex="1">
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              {customer.name}
              <Tag color="blue" style={{ marginLeft: 16, fontSize: 14 }}>
                <FormOutlined /> 账户：{customer.gas_account}
              </Tag>
            </div>
            <Space size={24} wrap>
              <span><PhoneOutlined style={{ color: '#1677ff' }} /> {customer.phone}</span>
              <span>
                <HomeOutlined style={{ color: '#52c41a' }} />
                {customer.community} {customer.building_no} {customer.room_no}
              </span>
            </Space>
            <div style={{ color: '#999', marginTop: 4 }}>完整地址：{customer.address}</div>
          </Col>
          <Col>
            <Row gutter={24}>
              <Col style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{records.length}</div>
                <div style={{ color: '#999', fontSize: 13 }}>安检记录</div>
              </Col>
              <Col style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}>{hazards.filter(h => h.rectify_status !== 'rectified' && h.rectify_status !== 'waived').length}</div>
                <div style={{ color: '#999', fontSize: 13 }}>待处理隐患</div>
              </Col>
              <Col style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#13c2c2' }}>{appointments.filter(a => a.status === 'scheduled').length}</div>
                <div style={{ color: '#999', fontSize: 13 }}>待复查</div>
              </Col>
              <Col style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}>{visits.length}</div>
                <div style={{ color: '#999', fontSize: 13 }}>回访次数</div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 8 }}
        tabBarExtraContent={
          <Space>
            <Tooltip title={`共 ${records.length} 次安检`}>
              <Tag color="blue"><FormOutlined /> {records.length}</Tag>
            </Tooltip>
            <Tooltip title={`共 ${hazards.length} 项隐患`}>
              <Tag color="red"><AlertOutlined /> {hazards.length}</Tag>
            </Tooltip>
            <Tooltip title={`共 ${notices.length} 份通知书`}>
              <Tag color="purple"><FileTextOutlined /> {notices.length}</Tag>
            </Tooltip>
            <Tooltip title={`共 ${appointments.length} 次预约`}>
              <Tag color="cyan"><ScheduleOutlined /> {appointments.length}</Tag>
            </Tooltip>
          </Space>
        }
      >
        <Tabs
          size="large"
          defaultActiveKey="records"
          items={[
            {
              key: 'records',
              label: <span><FormOutlined /> 安检记录（{records.length}）</span>,
              children: records.length ? (
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={records}
                  columns={recordColumns}
                  pagination={false}
                />
              ) : <Empty description="暂无安检记录" />
            },
            {
              key: 'hazards',
              label: <span style={{ color: hazards.some(h => !['rectified', 'waived'].includes(h.rectify_status)) ? '#ff4d4f' : undefined }}>
                <AlertOutlined /> 隐患记录（{hazards.length}）
              </span>,
              children: hazards.length ? (
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={hazards}
                  columns={hazardColumns}
                  pagination={false}
                />
              ) : <Empty description="暂无隐患记录，用户用气状态良好 ✓" />
            },
            {
              key: 'notices',
              label: <span><FileTextOutlined /> 整改通知书（{notices.length}）</span>,
              children: notices.length ? (
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={notices}
                  columns={noticeColumns}
                  pagination={false}
                  expandable={{
                    expandedRowRender: r => (
                      <Card size="small" style={{ background: '#fafafa' }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>📋 整改要求：</div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{r.rectify_requirement}</div>
                      </Card>
                    )
                  }}
                />
              ) : <Empty description="暂无整改通知书" />
            },
            {
              key: 'appointments',
              label: <span><ScheduleOutlined /> 复查预约（{appointments.length}）</span>,
              children: appointments.length ? (
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={appointments}
                  columns={appointmentColumns}
                  pagination={false}
                />
              ) : <Empty description="暂无复查预约" />
            },
            {
              key: 'timeline',
              label: <span><AuditOutlined /> 全流程时间线</span>,
              children: (
                <div style={{ padding: '24px 16px' }}>
                  <Timeline
                    mode="left"
                    items={[
                      ...records.map(r => ({
                        color: r.overall_status === 'normal' ? 'green' : r.overall_status === 'missed' ? 'gray' : 'red',
                        label: dayjs(r.inspect_date).format('YYYY-MM-DD HH:mm'),
                        children: (
                          <Card size="small" style={{ marginBottom: 8 }}>
                            <Tag color="blue"><FormOutlined /> 入户安检</Tag>
                            <div style={{ marginTop: 6 }}>
                              安检员：{r.inspector_name || '-'} ·
                              {r.is_user_at_home ? ' 用户在家' : ' 用户未在家'} ·
                              {r.overall_status === 'normal' ? ' ✅ 安检正常' : r.overall_status === 'hazard' ? ' ⚠️ 发现隐患' : ' 上门未遇'}
                            </div>
                            {r.remark && <div style={{ color: '#666', marginTop: 4 }}>{r.remark}</div>}
                          </Card>
                        )
                      })),
                      ...hazards.slice(0, 1).map(r => ({
                        color: '#ff4d4f',
                        label: '（隐患台账）',
                        children: (
                          <Card size="small" style={{ marginBottom: 8 }}>
                            <Tag color={SEVERITY_MAP[r.severity]?.color}><AlertOutlined /> {r.hazard_name}</Tag>
                            <Tag color={STATUS_MAP[r.rectify_status]?.color} style={{ marginLeft: 8 }}>
                              {STATUS_MAP[r.rectify_status]?.text}
                            </Tag>
                            <div style={{ marginTop: 6, color: '#666' }}>{r.description}</div>
                          </Card>
                        )
                      })),
                      ...notices.map(n => ({
                        color: '#1677ff',
                        label: dayjs(n.issue_date).format('YYYY-MM-DD HH:mm'),
                        children: (
                          <Card size="small" style={{ marginBottom: 8 }}>
                            <Tag color="blue"><FileTextOutlined /> 整改通知 · {NOTICE_METHOD_MAP[n.notice_method]}</Tag>
                            <div style={{ marginTop: 6 }}>
                              整改截止：{dayjs(n.deadline).format('YYYY-MM-DD')}
                              {n.customer_signature ? ` · 已签收：${n.customer_signature}` : ' · 未签收'}
                            </div>
                          </Card>
                        )
                      })),
                      ...appointments.map(a => ({
                        color: '#13c2c2',
                        label: dayjs(a.appointment_date).format('YYYY-MM-DD') + ' ' + a.appointment_time_slot,
                        children: (
                          <Card size="small" style={{ marginBottom: 8 }}>
                            <Tag color="cyan"><ScheduleOutlined /> 复查预约</Tag>
                            <Tag color={APPOINTMENT_STATUS_MAP[a.status]?.color} style={{ marginLeft: 8 }}>
                              {APPOINTMENT_STATUS_MAP[a.status]?.text}
                            </Tag>
                            <div style={{ marginTop: 6 }}>安检员：{a.inspector_name || '待指派'}</div>
                          </Card>
                        )
                      })),
                      ...visits.map(v => ({
                        color: '#722ed1',
                        label: dayjs(v.visit_date).format('YYYY-MM-DD HH:mm'),
                        children: (
                          <Card size="small" style={{ marginBottom: 8 }}>
                            <Tag color="purple">
                              <CustomerServiceOutlined /> 客户回访 · {VISIT_METHOD_MAP[v.visit_method]}
                            </Tag>
                            <div style={{ marginTop: 6 }}>
                              目的：{Object.values(VISIT_PURPOSE_MAP).find((_, i) => Object.keys(VISIT_PURPOSE_MAP)[i] === v.visit_purpose) || v.visit_purpose}
                              {v.satisfaction_level && <span style={{ marginLeft: 16, color: '#52c41a' }}>✓ 满意</span>}
                            </div>
                            <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>{v.visit_content}</div>
                          </Card>
                        )
                      }))
                    ].sort((a, b) => {
                      const ta = a.label + (a.children?.key || '');
                      const tb = b.label + (b.children?.key || '');
                      return ta.localeCompare(tb);
                    }).reverse()}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default CustomerDetail;
