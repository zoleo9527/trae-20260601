import React, { useEffect, useState } from 'react';
import {
  Table, Card, Space, Button, Tag, Input, Select, Modal, Form,
  Drawer, Descriptions, Radio, Rate, Row, Col, App, DatePicker, Tooltip
} from 'antd';
import {
  SearchOutlined, EyeOutlined, CustomerServiceOutlined, PlusOutlined,
  PhoneOutlined, MessageOutlined, WechatOutlined, MailOutlined,
  TeamOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api.js';
import { VISIT_METHOD_MAP, VISIT_PURPOSE_MAP } from '../constants.js';

const purposeList = [
  { value: 'hazard_warning', label: '⚠️ 隐患告知/跟踪', color: 'red' },
  { value: 'satisfaction', label: '😊 满意度回访', color: 'green' },
  { value: 'safety_education', label: '📢 安全用气教育', color: 'blue' },
  { value: 'contact_retry', label: '📞 再次联系用户', color: 'orange' },
  { value: 'complaint_handle', label: '📋 投诉/建议处理', color: 'purple' },
  { value: 'other', label: '📝 其他事项', color: 'default' }
];

const methodIcons = {
  phone: <PhoneOutlined />,
  onsite: <TeamOutlined />,
  sms: <MessageOutlined />,
  wechat: <WechatOutlined />,
  email: <MailOutlined />
};

const satisfactionMap = {
  very_satisfied: { text: '非常满意', rate: 5, color: '#52c41a' },
  satisfied: { text: '满意', rate: 4, color: '#1677ff' },
  neutral: { text: '一般', rate: 3, color: '#faad14' },
  dissatisfied: { text: '不满意', rate: 2, color: '#ff7a45' },
  very_dissatisfied: { text: '非常不满意', rate: 1, color: '#ff4d4f' }
};

const Visits = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [records, setRecords] = useState([]);
  const [form] = Form.useForm();
  const [editFollowup, setEditFollowup] = useState(null);
  const [editForm] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    api.get('/visits', { params: { status } }).then(res => {
      let list = res;
      if (keyword) {
        list = list.filter(v =>
          (v.customer_name || '').includes(keyword) ||
          (v.customer_phone || '').includes(keyword) ||
          (v.visit_content || '').includes(keyword) ||
          (v.customer_feedback || '').includes(keyword)
        );
      }
      setData(list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get('/customers').then(setCustomers);
    api.get('/inspectors').then(setInspectors);
  }, [status, keyword]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      visit_date: dayjs(),
      visit_method: 'phone',
      visit_purpose: 'hazard_warning',
      status: 'completed'
    });
    setCreateModal(true);
  };

  const onCustomerChange = (cid) => {
    const c = customers.find(x => x.id === cid);
    if (c) {
      api.get(`/customers/${c.id}`).then(res => {
        setRecords(res.records.map(r => ({
          value: r.id,
          label: `${dayjs(r.inspect_date).format('MM-DD')} ${r.overall_status === 'hazard' ? '有隐患' : r.overall_status === 'missed' ? '未遇' : '正常'} ${r.record_no}`
        })));
      });
    }
  };

  const submitVisit = () => {
    form.validateFields().then(values => {
      const satisfaction = values.satisfaction_level;
      const map = { 5: 'very_satisfied', 4: 'satisfied', 3: 'neutral', 2: 'dissatisfied', 1: 'very_dissatisfied' };
      api.post('/visits', {
        visit_no: `CV${dayjs().format('YYYYMMDDHHmmss')}`,
        customer_id: values.customer_id,
        record_id: values.record_id || null,
        operator_id: values.operator_id || null,
        visit_date: dayjs(values.visit_date).format('YYYY-MM-DD HH:mm:ss'),
        visit_method: values.visit_method,
        visit_purpose: values.visit_purpose,
        visit_content: values.visit_content,
        customer_feedback: values.customer_feedback,
        satisfaction_level: satisfaction ? map[satisfaction] : null,
        status: values.status,
        follow_up: values.follow_up
      }).then(() => {
        message.success('回访记录已保存');
        setCreateModal(false);
        fetchData();
      });
    });
  };

  const doEditFollowup = () => {
    editForm.validateFields().then(values => {
      api.patch(`/visits/${editFollowup.id}`, values).then(() => {
        message.success('跟进信息已更新');
        setEditFollowup(null);
        fetchData();
      });
    });
  };

  const purposeBadge = (v) => {
    const p = purposeList.find(x => x.value === v);
    return <Tag color={p?.color}>{p?.label || v}</Tag>;
  };

  const columns = [
    {
      title: '回访编号', dataIndex: 'visit_no', width: 170,
      render: t => <code style={{ color: '#722ed1' }}>{t}</code>
    },
    {
      title: '回访客户',
      render: (_, r) => (
        <Space direction="vertical" size={1}>
          <span style={{ fontWeight: 500 }}>{r.customer_name}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{r.customer_phone}</span>
        </Space>
      )
    },
    {
      title: '回访目的', dataIndex: 'visit_purpose', width: 160,
      render: t => purposeBadge(t)
    },
    {
      title: '方式', dataIndex: 'visit_method', width: 100,
      render: t => (
        <Tag icon={methodIcons[t]} color="blue">
          {VISIT_METHOD_MAP[t] || t}
        </Tag>
      )
    },
    {
      title: '回访内容', dataIndex: 'visit_content', ellipsis: true,
      render: t => <span style={{ color: 'rgba(0,0,0,0.7)' }}>{t}</span>
    },
    {
      title: '客户反馈',
      render: (_, r) => {
        const s = satisfactionMap[r.satisfaction_level];
        return (
          <Space direction="vertical" size={0}>
            {r.customer_feedback ? (
              <span style={{ color: 'rgba(0,0,0,0.7)', fontSize: 12, maxWidth: 200 }}>
                {r.customer_feedback.length > 24 ? r.customer_feedback.slice(0, 24) + '...' : r.customer_feedback}
              </span>
            ) : s ? (
              <Rate disabled allowHalf value={s.rate} style={{ fontSize: 14 }} />
            ) : (
              <span style={{ color: '#ccc' }}>—</span>
            )}
          </Space>
        );
      }
    },
    {
      title: '回访时间', dataIndex: 'visit_date', width: 160,
      sorter: (a, b) => dayjs(a.visit_date).valueOf() - dayjs(b.visit_date).valueOf(),
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: t => t === 'completed'
        ? <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>
        : <Tag color="orange" icon={<ClockCircleOutlined />}>跟进中</Tag>
    },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="查看完整记录">
            <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
          </Tooltip>
          {r.status === 'pending' && (
            <Tooltip title="更新跟进">
              <Button type="link" icon={<EditOutlined />} onClick={() => {
                setEditFollowup(r);
                editForm.setFieldsValue({
                  status: r.status,
                  follow_up: r.follow_up,
                  customer_feedback: r.customer_feedback,
                  satisfaction_level: satisfactionMap[r.satisfaction_level]?.rate
                });
              }}>更新</Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <CustomerServiceOutlined style={{ color: '#722ed1', marginRight: 8 }} />
          客户回访管理
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增回访记录
        </Button>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索客户/电话/内容"
            style={{ width: 280 }}
            allowClear
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Select
            style={{ width: 150 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: '全部回访' },
              { value: 'pending', label: '⏳ 跟进中' },
              { value: 'completed', label: '✓ 已完成' }
            ]}
          />
        </Space>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条回访记录` }}
        />
      </Card>

      <Modal
        title="📞 新增客户回访"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={submitVisit}
        okText="保存回访记录"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_id" label="回访客户" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="选择客户"
                  optionFilterProp="label"
                  onChange={onCustomerChange}
                  options={customers.map(c => ({
                    value: c.id,
                    label: `${c.name} (${c.phone}) · ${c.community || c.address.slice(0, 20)}`
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="record_id" label="关联安检单号（可选）">
                <Select
                  allowClear
                  placeholder="关联到具体安检记录"
                  options={records}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="visit_date" label="回访时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="visit_method" label="回访方式" rules={[{ required: true }]}>
                <Select options={Object.entries(VISIT_METHOD_MAP).map(([k, v]) => ({
                  value: k, label: `${methodIcons[k]} ${v}`
                }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="operator_id" label="客服人员">
                <Select
                  allowClear
                  options={inspectors.map(i => ({ value: i.id, label: `${i.name} · ${i.employee_no}` }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="visit_purpose" label="回访目的" rules={[{ required: true }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={purposeList.map(p => ({ label: p.label, value: p.value }))}
            />
          </Form.Item>

          <Form.Item name="visit_content" label="回访内容" rules={[{ required: true, message: '请填写回访沟通的主要内容' }]}>
            <Input.TextArea rows={3} placeholder="详细填写本次回访沟通的主要内容..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="customer_feedback" label="客户反馈">
                <Input.TextArea rows={2} placeholder="客户口头或书面的反馈内容" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="satisfaction_level" label="满意度">
                <Rate allowHalf />
              </Form.Item>
              <Form.Item name="status" label="处理状态">
                <Radio.Group options={[
                  { label: '本次完成', value: 'completed' },
                  { label: '需继续跟进', value: 'pending' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="follow_up" label="下一步跟进计划（选填）" extra="如需持续跟进，请填写具体时间/事项">
            <Input.TextArea rows={2} placeholder="如：6月24日复查前再次电话提醒；下周安排安检员再次上门..." />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="回访记录详情"
        open={!!detail && !editFollowup}
        onClose={() => setDetail(null)}
        width={560}
      >
        {detail && (
          <div>
            <Card
              style={{
                marginBottom: 16, borderRadius: 8,
                borderLeft: `4px solid ${detail.status === 'completed' ? '#52c41a' : '#faad14'}`
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {purposeBadge(detail.visit_purpose)}
                <Tag color={detail.status === 'completed' ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                  {detail.status === 'completed' ? '已完成' : '跟进中'}
                </Tag>
              </div>
              <Space>
                <Tag icon={methodIcons[detail.visit_method]}>
                  {VISIT_METHOD_MAP[detail.visit_method]}
                </Tag>
                <span style={{ color: '#999' }}>
                  {dayjs(detail.visit_date).format('YYYY-MM-DD HH:mm')}
                </span>
              </Space>
            </Card>

            <div className="section-title">客户信息</div>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="客户">{detail.customer_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="客服人员" span={2}>{detail.operator_name || '—'}</Descriptions.Item>
            </Descriptions>

            <div className="section-title">回访内容</div>
            <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
              <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{detail.visit_content || '—'}</div>
            </Card>

            <div className="section-title">客户反馈</div>
            <Card size="small" style={{ marginBottom: 12, background: '#f0f9ff' }}>
              {detail.customer_feedback && (
                <p style={{ lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {detail.customer_feedback}
                </p>
              )}
              {detail.satisfaction_level && satisfactionMap[detail.satisfaction_level] && (
                <div style={{ marginTop: detail.customer_feedback ? 10 : 0 }}>
                  <Rate
                    disabled
                    allowHalf
                    value={satisfactionMap[detail.satisfaction_level].rate}
                  />
                  <span style={{ marginLeft: 10, color: satisfactionMap[detail.satisfaction_level].color }}>
                    {satisfactionMap[detail.satisfaction_level].text}
                  </span>
                </div>
              )}
              {!detail.customer_feedback && !detail.satisfaction_level && <span style={{ color: '#999' }}>—</span>}
            </Card>

            {detail.follow_up && (
              <>
                <div className="section-title">后续跟进</div>
                <Card size="small" style={{ background: '#fff7e6', whiteSpace: 'pre-wrap' }}>
                  {detail.follow_up}
                </Card>
              </>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="更新回访跟进信息"
        open={!!editFollowup}
        onCancel={() => setEditFollowup(null)}
        onOk={doEditFollowup}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="customer_feedback" label="客户反馈补充">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="satisfaction_level" label="满意度">
            <Rate allowHalf />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group options={[
              { label: '仍需跟进', value: 'pending' },
              { label: '已完成', value: 'completed' }
            ]} />
          </Form.Item>
          <Form.Item name="follow_up" label="下一步计划">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Visits;
