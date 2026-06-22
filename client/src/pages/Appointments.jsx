import React, { useEffect, useState } from 'react';
import {
  Table, Card, Space, Button, Tag, Input, Select, Modal,
  Form, DatePicker, Drawer, Descriptions, App, Tooltip, Popconfirm, List, Checkbox
} from 'antd';
import {
  SearchOutlined, EyeOutlined, PlusOutlined, ScheduleOutlined,
  CalendarOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined,
  PhoneOutlined, HomeOutlined, EditOutlined, CheckCircleOutlined,
  FormOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api.js';
import { APPOINTMENT_STATUS_MAP, STATUS_MAP } from '../constants.js';

const timeSlots = [
  '08:00-10:00', '09:00-11:00', '10:00-12:00',
  '14:00-16:00', '15:00-17:00', '16:00-18:00',
  '18:00-20:00'
];

const Appointments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [revisitModal, setRevisitModal] = useState(false);
  const [inspectors, setInspectors] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form] = Form.useForm();
  const [revisitForm] = Form.useForm();
  const { message, modal } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    api.get('/appointments', { params: { status } }).then(res => {
      let list = res;
      if (keyword) {
        list = list.filter(a =>
          (a.customer_name || '').includes(keyword) ||
          (a.customer_phone || '').includes(keyword) ||
          (a.hazard_name || '').includes(keyword) ||
          (a.appointment_no || '').includes(keyword)
        );
      }
      setData(list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get('/inspectors').then(setInspectors);
    api.get('/hazards', { params: { rectify_status: 'all' } })
      .then(h => setHazards(h.filter(x => ['pending', 'notified', 'scheduled'].includes(x.rectify_status))));
    api.get('/customers').then(setCustomers);
  }, [status]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      operator_id: 3,
      appointment_date: dayjs().add(3, 'day'),
      appointment_time_slot: '09:00-11:00'
    });
    setCreateModal(true);
  };

  const handleHazardSelect = (hazardId) => {
    const h = hazards.find(x => x.id === hazardId);
    if (h) {
      form.setFieldsValue({
        customer_id: h.customer_id,
        customer_name: h.customer_name,
        customer_phone: h.customer_phone
      });
      if (h.deadline) {
        form.setFieldsValue({ appointment_date: dayjs(h.deadline) });
      }
      if (h.handler_id) {
        form.setFieldsValue({ inspector_id: h.handler_id });
      }
    }
  };

  const submitAppointment = () => {
    form.validateFields().then(values => {
      api.post('/appointments', {
        appointment_no: `AP${dayjs().format('YYYYMMDDHHmmss')}`,
        hazard_record_id: values.hazard_record_id,
        customer_id: values.customer_id,
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        appointment_date: dayjs(values.appointment_date).format('YYYY-MM-DD'),
        appointment_time_slot: values.appointment_time_slot,
        operator_id: values.operator_id,
        inspector_id: values.inspector_id,
        remark: values.remark
      }).then(() => {
        message.success('复查预约创建成功，客户隐患状态已更新为「待复查」');
        setCreateModal(false);
        fetchData();
      });
    });
  };

  const openRevisit = (row) => {
    setDetail(row);
    revisitForm.resetFields();
    revisitForm.setFieldsValue({
      appointment_id: row.id,
      hazard_record_id: row.hazard_record_id,
      customer_id: row.customer_id,
      inspector_id: row.inspector_id,
      revisit_date: dayjs(),
      is_user_at_home: true,
      rectify_result: 'rectified'
    });
    setRevisitModal(true);
  };

  const submitRevisit = () => {
    revisitForm.validateFields().then(values => {
      const needConfirm = values.rectify_result === 'rectified' ?
        '确认隐患已整改合格，将结案归档' :
        values.rectify_result === 'refused' ?
        '确认用户拒不整改，将按程序上报' :
        !values.is_user_at_home ? '确认本次上门仍未遇用户' : null;

      const doSubmit = () => api.post('/revisits', {
        revisit_no: `RV${dayjs().format('YYYYMMDDHHmmss')}`,
        appointment_id: values.appointment_id,
        hazard_record_id: values.hazard_record_id,
        inspector_id: values.inspector_id,
        customer_id: values.customer_id,
        revisit_date: dayjs(values.revisit_date).format('YYYY-MM-DD HH:mm:ss'),
        is_user_at_home: values.is_user_at_home ? 1 : 0,
        rectify_result: values.is_user_at_home ? values.rectify_result : 'missed',
        description: values.description,
        next_action: values.next_action
      }).then(() => {
        message.success('复查记录已提交');
        setRevisitModal(false);
        fetchData();
      });

      if (needConfirm) {
        modal.confirm({ title: needConfirm, onOk: doSubmit });
      } else {
        doSubmit();
      }
    });
  };

  const columns = [
    {
      title: '预约编号', dataIndex: 'appointment_no', width: 180,
      render: t => <code style={{ color: '#722ed1' }}>{t}</code>
    },
    {
      title: '预约信息',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <strong>{dayjs(r.appointment_date).format('YYYY-MM-DD')}</strong>
            <Tag color="blue">{r.appointment_time_slot}</Tag>
          </Space>
          <span style={{ fontSize: 12, color: '#999' }}>
            📝 {r.hazard_name || '隐患复查'}
          </span>
        </Space>
      )
    },
    {
      title: '客户信息',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 500 }}>
            <UserOutlined style={{ marginRight: 4 }} />{r.customer_name}
          </span>
          <span style={{ color: '#999', fontSize: 12 }}>
            <PhoneOutlined /> {r.customer_phone}
          </span>
          <span style={{ color: '#999', fontSize: 12 }}>
            <HomeOutlined /> {r.customer_address}
          </span>
        </Space>
      )
    },
    {
      title: '负责人员',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          {r.inspector_name ? <Tag color="purple"><TeamOutlined /> {r.inspector_name}</Tag> : <span style={{ color: '#999' }}>未指派</span>}
          {r.operator_name && <span style={{ color: '#666', fontSize: 12 }}>客服：{r.operator_name}</span>}
        </Space>
      )
    },
    {
      title: '预约状态', dataIndex: 'status', width: 110,
      render: t => {
        const m = APPOINTMENT_STATUS_MAP[t];
        return <Tag color={m?.color}>{m?.text || t}</Tag>;
      }
    },
    {
      title: '备注', dataIndex: 'remark', ellipsis: true, width: 180,
      render: t => t || <span style={{ color: '#ccc' }}>—</span>
    },
    {
      title: '操作', width: 260, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
          </Tooltip>
          {r.status === 'scheduled' && (
            <>
              <Tooltip title="录入复查结果">
                <Button type="primary" size="small" icon={<FormOutlined />} onClick={() => openRevisit(r)}>
                  复查登记
                </Button>
              </Tooltip>
              <Popconfirm
                title="取消此预约？"
                okText="取消预约"
                cancelText="保留"
                onConfirm={() => {
                  api.patch(`/appointments/${r.id}`, { status: 'rescheduled' }).then(() => {
                    message.success('预约已取消');
                    fetchData();
                  });
                }}
              >
                <Button size="small" danger>取消</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <ScheduleOutlined style={{ color: '#13c2c2', marginRight: 8 }} />
          复查预约管理
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建复查预约
        </Button>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索客户/电话/隐患/编号"
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
              { value: 'all', label: '全部状态' },
              { value: 'pending', label: '待确认' },
              { value: 'scheduled', label: '✓ 已预约（待上门）' },
              { value: 'completed', label: '✓ 已完成' },
              { value: 'missed', label: '未遇' },
              { value: 'refused', label: '用户爽约' },
              { value: 'rescheduled', label: '已改期' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchData}>查询</Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条预约` }}
        />
      </Card>

      <Modal
        title="📅 新建复查预约（客服操作）"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={submitAppointment}
        okText="确认预约"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Card size="small" style={{ marginBottom: 16, background: '#f0f9ff' }} title="关联隐患" type="inner">
            <Form.Item name="hazard_record_id" label="选择待复查隐患" rules={[{ required: true, message: '请选择要复查的隐患' }]}>
              <Select
                placeholder="输入客户/隐患名称搜索"
                showSearch
                optionFilterProp="label"
                onChange={handleHazardSelect}
                options={hazards.map(h => ({
                  value: h.id,
                  label: `【${h.customer_name || '未知用户'}】${h.hazard_name} - 整改期限${h.deadline || '未设'}`,
                  customer_id: h.customer_id
                }))}
              />
            </Form.Item>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_id" label="客户ID" hidden><Input /></Form.Item>
              <Form.Item name="customer_name" label="客户姓名" rules={[{ required: true }]}>
                <Input placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="联系电话" rules={[{ required: true }]}>
                <Input placeholder="手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appointment_date" label="复查日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="appointment_time_slot" label="时间窗口" rules={[{ required: true }]}>
                <Select options={timeSlots.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="operator_id" label="客服经办人">
                <Select
                  placeholder="选择客服"
                  options={inspectors.map(i => ({ value: i.id, label: `${i.name} · ${i.employee_no}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inspector_id" label="上门安检员/维修工">
                <Select
                  allowClear
                  placeholder="指派上门人员"
                  options={inspectors.map(i => ({ value: i.id, label: `${i.name}（${i.area || '综合'}）` }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注说明">
            <Input.TextArea rows={2} placeholder="如：用户希望师傅带新软管上门；用户老伴住院需要避开上午等" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="复查预约详情"
        open={!!detail && !revisitModal}
        onClose={() => setDetail(null)}
        width={500}
        extra={detail?.status === 'scheduled' && (
          <Button type="primary" icon={<FormOutlined />} onClick={() => openRevisit(detail)}>
            复查登记
          </Button>
        )}
      >
        {detail && (
          <div>
            <Card style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #13c2c2' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
                <ScheduleOutlined style={{ color: '#13c2c2' }} /> {detail.appointment_no}
              </div>
              <Tag color={APPOINTMENT_STATUS_MAP[detail.status]?.color}>
                {APPOINTMENT_STATUS_MAP[detail.status]?.text}
              </Tag>
            </Card>

            <div className="section-title">预约信息</div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="复查日期">{dayjs(detail.appointment_date).format('YYYY年MM月DD日')}</Descriptions.Item>
              <Descriptions.Item label="时间段">{detail.appointment_time_slot}</Descriptions.Item>
              <Descriptions.Item label="涉及隐患">{detail.hazard_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注">{detail.remark || '无'}</Descriptions.Item>
            </Descriptions>

            <div className="section-title">客户信息</div>
            <Card size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{detail.customer_name}</Descriptions.Item>
                <Descriptions.Item label="电话">{detail.customer_phone}</Descriptions.Item>
                <Descriptions.Item label="地址">{detail.customer_address}</Descriptions.Item>
              </Descriptions>
            </Card>

            <div className="section-title">人员安排</div>
            <List size="small">
              <List.Item>
                <List.Item.Meta avatar={<TeamOutlined style={{ color: '#722ed1' }} />} title="上门安检员" description={detail.inspector_name || '待指派'} />
              </List.Item>
              <List.Item>
                <List.Item.Meta avatar={<ClockCircleOutlined style={{ color: '#1677ff' }} />} title="客服预约人" description={detail.operator_name || '—'} />
              </List.Item>
            </List>
          </div>
        )}
      </Drawer>

      <Modal
        title="🧪 复查结果登记"
        open={revisitModal}
        onCancel={() => setRevisitModal(false)}
        onOk={submitRevisit}
        okText="提交复查结论"
        width={720}
      >
        <Form form={revisitForm} layout="vertical">
          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="客户">{detail?.customer_name}</Descriptions.Item>
              <Descriptions.Item label="电话">{detail?.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{detail && `${dayjs(detail.appointment_date).format('YYYY-MM-DD')} ${detail.appointment_time_slot}`}</Descriptions.Item>
              <Descriptions.Item label="待复查隐患">{detail?.hazard_name}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Form.Item name="appointment_id" hidden><Input /></Form.Item>
          <Form.Item name="hazard_record_id" hidden><Input /></Form.Item>
          <Form.Item name="customer_id" hidden><Input /></Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="上门安检员" name="inspector_id" rules={[{ required: true }]}>
                <Select options={inspectors.map(i => ({ value: i.id, label: `${i.name}（${i.employee_no}）` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="复查时间" name="revisit_date" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_user_at_home" valuePropName="checked" extra="取消勾选则本次记为「未遇」，并安排改期">
            <CheckCircleOutlined /> <Checkbox checked={true} onChange={e => {
              if (!e.target.checked) revisitForm.setFieldsValue({ rectify_result: null });
            }}>✅ 用户在家（开门配合复查）</Checkbox>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(p, c) => p.is_user_at_home !== c.is_user_at_home}>
            {({ getFieldValue }) => !getFieldValue('is_user_at_home') ? null : (
              <>
                <div className="section-title" style={{ marginTop: 0 }}>复查结论</div>
                <Form.Item name="rectify_result" label="整改情况" rules={[{ required: true, message: '请选择整改结果' }]}>
                  <Select
                    options={[
                      { value: 'rectified', label: '✅ 已整改合格（符合安全标准，予以结案）' },
                      { value: 'partial', label: '⚠️ 部分整改（整改不彻底，仍需二次整改）' },
                      { value: 'refused', label: '❌ 用户拒不整改（按程序上报主管部门）' }
                    ]}
                  />
                </Form.Item>
              </>
            )}
          </Form.Item>

          <Form.Item label="现场描述/整改细节" name="description">
            <Input.TextArea rows={3} placeholder="详细说明复查现场情况：如已更换不锈钢波纹管，长度1.5米，管卡固定完好；现场试漏检测无泄漏；用户已签字确认等" />
          </Form.Item>

          <Form.Item label="后续处理建议" name="next_action">
            <Input.TextArea rows={2} placeholder="如：closed（结案）/ 10日内二次复查 / 转交维修队施工 / 上报社区和街道办等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Appointments;
