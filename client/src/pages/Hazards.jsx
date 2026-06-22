import React, { useEffect, useState } from 'react';
import {
  Table, Card, Space, Button, Tag, Input, Select, Tooltip, Modal,
  Form, Drawer, Descriptions, Badge, Row, Col, List, App, Dropdown, message
} from 'antd';
import {
  SearchOutlined, FilterOutlined, EyeOutlined, AlertOutlined,
  EditOutlined, ClockCircleOutlined, FireOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, UserSwitchOutlined, PhoneOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api.js';
import {
  STATUS_MAP, SEVERITY_MAP, HAZARD_CATEGORY_MAP,
  NOTICE_METHOD_MAP
} from '../constants.js';

const Hazards = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ rectify_status: 'all', severity: 'all', is_construction: 'all', keyword: '' });
  const [detail, setDetail] = useState(null);
  const [noticeDrawer, setNoticeDrawer] = useState(false);
  const [hazardTypes, setHazardTypes] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [editForm] = Form.useForm();
  const [noticeForm] = Form.useForm();
  const { modal } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    api.get('/hazards', { params: filters }).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get('/hazard-types').then(setHazardTypes);
    api.get('/inspectors').then(setInspectors);
  }, [filters]);

  const openDetail = (row) => {
    setDetail(row);
    setNoticeDrawer(false);
  };

  const openNoticeDrawer = (row) => {
    setDetail(row);
    noticeForm.resetFields();
    noticeForm.setFieldsValue({
      hazard_record_id: row.id,
      customer_id: row.customer_id,
      issue_date: dayjs(),
      deadline: row.deadline ? dayjs(row.deadline) : dayjs().add(7, 'day'),
      notice_method: 'onsite',
      rectify_requirement: `根据《城镇燃气管理条例》相关规定，请您于 ${row.deadline || dayjs().add(7, 'day').format('YYYY-MM-DD')} 前完成以下隐患的整改工作：\n\n【${row.hazard_name}】\n${row.description || hazardTypes.find(t => t.id === row.hazard_type_id)?.description || '请及时整改，确保用气安全。'}\n\n如您需要协助，请拨打燃气公司客服热线：95xxx\n感谢您的配合！`
    });
    setNoticeDrawer(true);
  };

  const submitNotice = () => {
    noticeForm.validateFields().then(values => {
      api.post('/notices', {
        notice_no: `NT${dayjs().format('YYYYMMDDHHmmss')}`,
        hazard_record_id: values.hazard_record_id,
        customer_id: values.customer_id,
        issue_date: dayjs(values.issue_date).format('YYYY-MM-DD HH:mm:ss'),
        deadline: dayjs(values.deadline).format('YYYY-MM-DD'),
        rectify_requirement: values.rectify_requirement,
        notice_method: values.notice_method,
        operator_id: values.operator_id,
        customer_signature: values.customer_signature
      }).then(() => {
        App.useApp().message?.success('整改通知已发送，隐患状态已更新为「已通知」');
        setNoticeDrawer(false);
        fetchData();
      });
    });
  };

  const changeStatus = (row, newStatus) => {
    const label = STATUS_MAP[newStatus]?.text;
    modal.confirm({
      title: `确认将隐患状态改为「${label}」？`,
      content: row.description || row.hazard_name,
      okText: '确认',
      onOk: () => {
        api.patch(`/hazards/${row.id}`, { rectify_status: newStatus }).then(() => {
          message.success(`状态已更新为「${label}」`);
          fetchData();
        });
      }
    });
  };

  const quickActions = (row) => ([
    {
      key: 'refused',
      icon: <UserSwitchOutlined />,
      label: '用户拒不整改',
      disabled: row.rectify_status === 'rectified'
    },
    {
      key: 'unreachable',
      icon: <PhoneOutlined />,
      label: '用户联系不上',
      disabled: row.rectify_status === 'rectified'
    },
    { type: 'divider' },
    {
      key: 'scheduled',
      icon: <ClockCircleOutlined />,
      label: '已安排复查',
      disabled: row.rectify_status === 'rectified'
    },
    {
      key: 'rectified',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      label: '已完成整改（结案）',
      danger: row.rectify_status === 'rectified'
    }
  ]);

  const columns = [
    {
      title: '隐患信息',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Space>
            <AlertOutlined style={{ color: SEVERITY_MAP[r.severity]?.color === 'red' ? '#ff4d4f' : '#faad14' }} />
            <span style={{ fontWeight: 500 }}>{r.hazard_name}</span>
            <Tag color={SEVERITY_MAP[r.severity]?.color}>{SEVERITY_MAP[r.severity]?.text}</Tag>
            {r.is_construction ? <Tag color="purple">需施工</Tag> : null}
          </Space>
          <span style={{ color: '#999', fontSize: 12 }}>📍 {r.location || '未记录位置'} · 类别：{r.category}</span>
        </Space>
      ),
      onCell: r => ({ style: { minWidth: 260 } })
    },
    {
      title: '关联客户',
      render: (_, r) => (
        <Space direction="vertical" size={1}>
          <span style={{ fontWeight: 500 }}>{r.customer_name || <Tag color="default">未关联</Tag>}</span>
          <span style={{ color: '#999', fontSize: 12 }}>📞 {r.customer_phone || '-'}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{r.customer_address}</span>
        </Space>
      )
    },
    {
      title: '发现日期',
      dataIndex: 'inspect_date',
      width: 120,
      render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-'
    },
    {
      title: '整改状态',
      width: 130,
      dataIndex: 'rectify_status',
      filters: Object.entries(STATUS_MAP).map(([k, v]) => ({ text: v.text, value: k })),
      onFilter: (v, r) => r.rectify_status === v,
      render: t => {
        const m = STATUS_MAP[t];
        return (
          <Tag color={m?.color} icon={
            t === 'rectified' ? <CheckCircleOutlined /> :
            t === 'refused' ? <UserSwitchOutlined /> :
            t === 'unreachable' ? <PhoneOutlined /> :
            t === 'pending' ? <ClockCircleOutlined /> :
            t === 'scheduled' ? <ClockCircleOutlined /> : null
          }>
            {m?.text || t}
          </Tag>
        );
      }
    },
    {
      title: '整改期限',
      width: 130,
      dataIndex: 'deadline',
      render: t => {
        if (!t) return <span style={{ color: '#999' }}>未设定</span>;
        const isOver = dayjs(t).isBefore(dayjs(), 'day');
        const isSoon = dayjs(t).diff(dayjs(), 'day') <= 2 && !isOver;
        return (
          <Space>
            <span style={{ color: isOver ? '#ff4d4f' : isSoon ? '#faad14' : '#666' }}>
              {dayjs(t).format('MM-DD')}
            </span>
            {isOver && <Tag color="red">逾期</Tag>}
            {isSoon && !isOver && <Tag color="orange">临近</Tag>}
          </Space>
        );
      }
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
          </Tooltip>
          {!['rectified', 'waived', 'scheduled'].includes(r.rectify_status) && (
            <Tooltip title="发送整改通知">
              <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openNoticeDrawer(r)}>
                发通知
              </Button>
            </Tooltip>
          )}
          <Dropdown
            menu={{
              items: quickActions(r),
              onClick: ({ key }) => changeStatus(r, key)
            }}
            trigger={['click']}
          >
            <Button size="small">状态变更 ▾</Button>
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <AlertOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          隐患记录台账
        </div>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索客户/地址/隐患名称"
            style={{ width: 260 }}
            allowClear
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select
            style={{ width: 150 }}
            value={filters.rectify_status}
            onChange={v => setFilters({ ...filters, rectify_status: v })}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'pending', label: '⏳ 待处理' },
              { value: 'notified', label: '📢 已通知' },
              { value: 'scheduled', label: '📅 待复查' },
              { value: 'unreachable', label: '📵 联系不上' },
              { value: 'refused', label: '❌ 拒不整改' },
              { value: 'partial', label: '⚠️ 部分整改' },
              { value: 'rectified', label: '✅ 已整改' },
              { value: 'waived', label: '— 可忽略' }
            ]}
          />
          <Select
            style={{ width: 130 }}
            value={filters.severity}
            onChange={v => setFilters({ ...filters, severity: v })}
            options={[
              { value: 'all', label: '全部等级' },
              { value: 'high', label: '🔴 严重/高危' },
              { value: 'medium', label: '🟠 一般' },
              { value: 'low', label: '🟢 轻微' }
            ]}
          />
          <Select
            style={{ width: 150 }}
            value={filters.is_construction}
            onChange={v => setFilters({ ...filters, is_construction: v })}
            options={[
              { value: 'all', label: '全部类型' },
              { value: '1', label: '🛠️ 需施工（维修）' },
              { value: '0', label: '🏠 用户自改' }
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
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条隐患记录` }}
        />
      </Card>

      <Drawer
        title="隐患详情"
        open={!!detail && !noticeDrawer}
        onClose={() => setDetail(null)}
        width={560}
        extra={
          <Space>
            {detail && !['rectified', 'waived', 'scheduled'].includes(detail.rectify_status) && (
              <Button type="primary" icon={<EditOutlined />} onClick={() => openNoticeDrawer(detail)}>
                发送整改通知
              </Button>
            )}
          </Space>
        }
      >
        {detail && (
          <div>
            <Card style={{
              marginBottom: 16,
              borderLeft: `4px solid ${HAZARD_CATEGORY_MAP[detail.category] || '#1677ff'}`,
              borderRadius: 8
            }}>
              <Row gutter={[12, 8]}>
                <Col span={14}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                    <FireOutlined style={{ color: SEVERITY_MAP[detail.severity]?.color }} /> {detail.hazard_name}
                  </div>
                  <Tag color={SEVERITY_MAP[detail.severity]?.color}>
                    严重等级：{SEVERITY_MAP[detail.severity]?.text}
                  </Tag>
                  <Tag color="blue">{detail.category}</Tag>
                  {detail.is_construction ? <Tag color="purple">需维修施工</Tag> : <Tag color="green">用户可自改</Tag>}
                </Col>
                <Col span={10} style={{ textAlign: 'right' }}>
                  <Badge
                    status={
                      detail.rectify_status === 'rectified' ? 'success' :
                      ['unreachable', 'refused'].includes(detail.rectify_status) ? 'error' :
                      detail.rectify_status === 'scheduled' ? 'processing' : 'warning'
                    }
                    text={<Tag color={STATUS_MAP[detail.rectify_status]?.color}>
                      状态：{STATUS_MAP[detail.rectify_status]?.text}
                    </Tag>}
                  />
                </Col>
              </Row>
            </Card>

            <div className="section-title">隐患说明</div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="隐患编号">#{detail.id}</Descriptions.Item>
              <Descriptions.Item label="发现位置">{detail.location || '未记录'}</Descriptions.Item>
              <Descriptions.Item label="详细描述">
                <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(0,0,0,0.8)' }}>
                  {detail.description || '无详细描述'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="整改期限">
                {detail.deadline ? dayjs(detail.deadline).format('YYYY-MM-DD') : '未设定'}
                {detail.deadline && dayjs(detail.deadline).isBefore(dayjs(), 'day') && (
                  <Tag color="red" style={{ marginLeft: 8 }}>已逾期</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="安检单号">{detail.record_no || '独立记录'}</Descriptions.Item>
            </Descriptions>

            {detail.customer_name && (
              <>
                <div className="section-title">关联客户</div>
                <Card size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="姓名">{detail.customer_name}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{detail.customer_phone}</Descriptions.Item>
                    <Descriptions.Item label="详细地址">{detail.customer_address}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </>
            )}

            {detail.handler_name && (
              <div className="section-title">处理人员</div>
            )}
            {detail.handler_name && (
              <Tag icon={<UserSwitchOutlined />} color="purple">维修：{detail.handler_name}</Tag>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        title="🖊️ 出具整改通知书"
        open={noticeDrawer}
        onClose={() => setNoticeDrawer(false)}
        width={560}
        extra={<Button type="primary" onClick={submitNotice}>提交通知书</Button>}
      >
        {detail && (
          <Form form={noticeForm} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: '#fff7e6' }}>
              <Row gutter={12}>
                <Col span={8}>
                  <div className="detail-label">客户姓名</div>
                  <div className="detail-value">{detail.customer_name}</div>
                </Col>
                <Col span={8}>
                  <div className="detail-label">联系电话</div>
                  <div className="detail-value">{detail.customer_phone}</div>
                </Col>
                <Col span={8}>
                  <div className="detail-label">隐患</div>
                  <div className="detail-value">
                    <Tag color={SEVERITY_MAP[detail.severity]?.color}>{detail.hazard_name}</Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            <Form.Item name="hazard_record_id" hidden><Input /></Form.Item>
            <Form.Item name="customer_id" hidden><Input /></Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="出具日期" name="issue_date" rules={[{ required: true }]}>
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="整改截止日期" name="deadline" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="送达方式" name="notice_method" rules={[{ required: true }]}>
                  <Select options={Object.entries(NOTICE_METHOD_MAP).map(([k, v]) => ({ value: k, label: v }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="经办人（客服）" name="operator_id">
                  <Select
                    allowClear
                    placeholder="选择经办人"
                    options={inspectors.filter(i => i.area?.includes('客服') || true).map(i => ({
                      value: i.id, label: `${i.name} · ${i.employee_no}`
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="整改要求/告知内容" name="rectify_requirement" rules={[{ required: true }]}>
              <Input.TextArea rows={8} placeholder="请填写具体的整改要求、法律法规依据、整改建议等" />
            </Form.Item>

            <Form.Item label="用户签字（可选）" name="customer_signature">
              <Input placeholder="如用户现场签收，填写姓名" />
            </Form.Item>

            <AlertOutlined />
            <div style={{
              marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 12, color: '#666'
            }}>
              <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 6 }} />
              提交后隐患状态将自动变更为「已通知」，并在整改台账中展示。
              请同步在「复查预约」模块安排后续上门复查。
            </div>
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export default Hazards;
