import React, { useEffect, useState } from 'react';
import {
  Card, Descriptions, Row, Col, Table, Tag, Space, Button,
  Modal, Form, Input, Select, Checkbox, DatePicker, App, Divider,
  Badge, Tooltip, Drawer, List
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, UserOutlined,
  HomeOutlined, FormOutlined, PlusOutlined, SearchOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api.js';
import { VISIT_STATUS_MAP, SEVERITY_MAP, STATUS_MAP } from '../constants.js';

const { TextArea } = Input;

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [plan, setPlan] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [hazardTypes, setHazardTypes] = useState([]);
  const [recordForm] = Form.useForm();
  const [hazards, setHazards] = useState([]);

  const fetchData = () => {
    api.get(`/plans/${id}`).then(res => {
      setPlan(res.plan);
      setCustomers(res.customers);
    });
    api.get('/inspectors').then(setInspectors);
    api.get('/hazard-types').then(setHazardTypes);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const searchCustomers = () => {
    api.get('/customers', { params: { keyword: customerKeyword } }).then(res => {
      const existingIds = customers.map(c => c.customer_id);
      setAllCustomers(res.filter(c => !existingIds.includes(c.id)).slice(0, 50));
    });
  };

  const addCustomers = () => {
    if (!selectedCustomerIds.length) {
      message.warning('请先选择要添加的用户');
      return;
    }
    api.post(`/plans/${id}/customers`, { customer_ids: selectedCustomerIds }).then(() => {
      message.success(`成功添加 ${selectedCustomerIds.length} 名用户`);
      setAddModal(false);
      setSelectedCustomerIds([]);
      setCustomerKeyword('');
      fetchData();
    });
  };

  const openRecordModal = (pc) => {
    setCurrentCustomer(pc);
    recordForm.resetFields();
    recordForm.setFieldsValue({
      inspector_id: plan?.inspector_id,
      inspect_date: dayjs(),
      is_user_at_home: true
    });
    setHazards([]);
    setRecordModal(true);
  };

  const addHazardRow = () => {
    setHazards([...hazards, {
      uid: Date.now(),
      hazard_type_id: null,
      location: '',
      description: '',
      severity: 'medium',
      deadline: dayjs().add(7, 'day').format('YYYY-MM-DD')
    }]);
  };

  const updateHazardRow = (uid, field, value) => {
    setHazards(hazards.map(h => h.uid === uid ? { ...h, [field]: value } : h));
  };

  const removeHazardRow = (uid) => {
    setHazards(hazards.filter(h => h.uid !== uid));
  };

  const submitRecord = () => {
    recordForm.validateFields().then(values => {
      const isUserAtHome = values.is_user_at_home;
      const hazardList = isUserAtHome ? hazards.filter(h => h.hazard_type_id) : [];
      const overall = !isUserAtHome ? 'missed' :
        hazardList.length ? 'hazard' : 'normal';

      if (isUserAtHome && hazardList.length === 0) {
        modal.confirm({
          title: '确认未发现任何隐患？',
          content: `当前未录入隐患，将按「安检正常」归档。确认继续吗？`,
          okText: '确认正常',
          onOk: doSubmit
        });
      } else {
        doSubmit();
      }

      function doSubmit() {
        api.post('/inspection-records', {
          record_no: `REC${dayjs().format('YYYYMMDDHHmmss')}`,
          plan_customer_id: currentCustomer.id,
          inspector_id: values.inspector_id,
          customer_id: currentCustomer.customer_id,
          inspect_date: dayjs(values.inspect_date).format('YYYY-MM-DD HH:mm:ss'),
          is_user_at_home: isUserAtHome,
          meter_reading: isUserAtHome ? values.meter_reading : null,
          overall_status: overall,
          remark: values.remark || (isUserAtHome ? '' : '上门时无人在家，已贴通知条'),
          hazards: hazardList.map(h => {
            const type = hazardTypes.find(t => t.id === h.hazard_type_id);
            return {
              hazard_type_id: h.hazard_type_id,
              location: h.location,
              description: h.description,
              severity: type?.severity || h.severity,
              deadline: h.deadline
            };
          })
        }).then(() => {
          message.success('安检记录已提交');
          setRecordModal(false);
          fetchData();
          if (hazardList.length) {
            modal.success({
              title: `已发现 ${hazardList.length} 处隐患`,
              content: '请前往「整改通知」模块向用户发送整改要求，并在「复查预约」安排复查时间。',
              okText: '知道了'
            });
          }
        });
      }
    });
  };

  const stats = {
    total: customers.length,
    done: customers.filter(c => c.visit_status === 'completed').length,
    missed: customers.filter(c => c.visit_status === 'missed').length,
    pending: customers.filter(c => c.visit_status === 'pending').length
  };

  const columns = [
    {
      title: '客户信息', dataIndex: 'name',
      render: (t, r) => (
        <Space>
          <div>
            <div style={{ fontWeight: 500 }}>
              {t}
              <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>({r.gas_account})</span>
            </div>
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
              📞 {r.phone} · 🏠 {r.community} {r.building_no} {r.room_no}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '到访状态', width: 140, dataIndex: 'visit_status',
      render: (t, r) => {
        const m = VISIT_STATUS_MAP[t];
        return (
          <Space direction="vertical" size={2}>
            <Badge
              status={t === 'completed' ? 'success' : t === 'missed' ? 'warning' : 'default'}
              text={<Tag color={m?.color}>{m?.text}</Tag>}
            />
            {r.visit_times > 0 && (
              <span style={{ fontSize: 12, color: '#999' }}>
                已上门 {r.visit_times} 次
                {r.visit_times >= 3 && t === 'missed' && (
                  <Tag color="red" style={{ marginLeft: 4 }}>多次未遇</Tag>
                )}
              </span>
            )}
          </Space>
        );
      }
    },
    {
      title: '最近上门', width: 170,
      render: (_, r) => r.last_visit_time
        ? dayjs(r.last_visit_time).format('YYYY-MM-DD HH:mm')
        : <span style={{ color: '#999' }}>未到访</span>
    },
    {
      title: '操作', width: 200,
      render: (_, r) => (
        <Space>
          <Tooltip title="录入安检情况">
            <Button type="primary" icon={<FormOutlined />} size="small" onClick={() => openRecordModal(r)}>
              {r.visit_status === 'completed' ? '补充记录' : '录入安检'}
            </Button>
          </Tooltip>
          <Button size="small" onClick={() => navigate(`/customers/${r.customer_id}`)}>
            档案
          </Button>
        </Space>
      )
    }
  ];

  if (!plan) return <Card loading={true} style={{ margin: 20 }} />;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/plans')}>返回</Button>
          <div className="page-title">入户计划详情 - {plan.plan_name}</div>
        </Space>
        <Space>
          <Tag color={
            plan.status === 'completed' ? 'green' : plan.status === 'in_progress' ? 'blue' : 'default'
          }>
            {plan.status === 'completed' ? '已完成' : plan.status === 'in_progress' ? '进行中' : '待执行'}
          </Tag>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setAddModal(true);
            searchCustomers();
          }}>
            添加入户用户
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col md={16}>
          <Card style={{ borderRadius: 8 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="计划编号">{plan.plan_no}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{dayjs(plan.plan_date).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="负责安检员">{plan.inspector_name} · {plan.inspector_phone}</Descriptions.Item>
              <Descriptions.Item label="安检区域">{plan.area || '-'}</Descriptions.Item>
              {plan.remark && <Descriptions.Item label="备注" span={2}>{plan.remark}</Descriptions.Item>}
            </Descriptions>
          </Card>
        </Col>
        <Col md={8}>
          <Card style={{ borderRadius: 8 }}>
            <Row gutter={[12, 12]} style={{ textAlign: 'center' }}>
              <Col span={12}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{stats.total}</div>
                <div style={{ color: '#999', fontSize: 13 }}>总户数</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{stats.done}</div>
                <div style={{ color: '#999', fontSize: 13 }}>已完成</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#faad14' }}>{stats.missed}</div>
                <div style={{ color: '#999', fontSize: 13 }}>未遇数</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#bfbfbf' }}>{stats.pending}</div>
                <div style={{ color: '#999', fontSize: 13 }}>待访问</div>
              </Col>
            </Row>
            {stats.total > 0 && (
              <>
                <Divider style={{ margin: '14px 0' }} />
                <div style={{ background: '#f0f0f0', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round((stats.done + stats.missed) * 100 / stats.total)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #52c41a, #faad14)'
                  }} />
                </div>
                <div style={{ marginTop: 8, textAlign: 'center', color: '#666', fontSize: 12 }}>
                  进度 {Math.round((stats.done + stats.missed) * 100 / stats.total)}%
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }} title={`入户清单（${customers.length}）`}>
        <Table
          rowKey="id"
          dataSource={customers}
          columns={columns}
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
          locale={{ emptyText: '暂无入户用户，点击右上角「添加入户用户」导入' }}
        />
      </Card>

      <Modal
        title="选择用户加入此计划"
        open={addModal}
        width={720}
        onCancel={() => setAddModal(false)}
        okText={`添加 (${selectedCustomerIds.length})`}
        onOk={addCustomers}
      >
        <Space style={{ marginBottom: 12 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="按姓名/电话/地址搜索"
            value={customerKeyword}
            onChange={e => setCustomerKeyword(e.target.value)}
            onPressEnter={searchCustomers}
            style={{ width: 320 }}
            allowClear
          />
          <Button type="primary" onClick={searchCustomers} icon={<SearchOutlined />}>搜索</Button>
        </Space>
        <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
          {allCustomers.length === 0 ? (
            <div className="empty-tip">请输入关键词搜索，或所有用户已添加到此计划</div>
          ) : (
            <Checkbox.Group
              style={{ width: '100%' }}
              value={selectedCustomerIds}
              onChange={setSelectedCustomerIds}
            >
              <List
                size="small"
                dataSource={allCustomers}
                renderItem={c => (
                  <List.Item style={{ padding: '8px 16px' }}>
                    <Checkbox value={c.id} style={{ width: '100%' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
                        <span>
                          <UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                          <strong>{c.name}</strong>
                          <span style={{ color: '#999', marginLeft: 10 }}>{c.phone}</span>
                        </span>
                        <span style={{ color: '#666', fontSize: 12 }}>
                          <HomeOutlined /> {c.address}
                        </span>
                      </div>
                    </Checkbox>
                  </List.Item>
                )}
              />
            </Checkbox.Group>
          )}
        </div>
      </Modal>

      <Modal
        title={`录入安检信息 - ${currentCustomer?.name || ''}`}
        open={recordModal}
        onCancel={() => setRecordModal(false)}
        onOk={submitRecord}
        okText="提交安检记录"
        width={860}
      >
        <Form form={recordForm} layout="vertical">
          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="客户">{currentCustomer?.name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentCustomer?.phone}</Descriptions.Item>
              <Descriptions.Item label="燃气账户">{currentCustomer?.gas_account}</Descriptions.Item>
              <Descriptions.Item label="详细地址" span={3}>
                {currentCustomer?.community} {currentCustomer?.building_no} {currentCustomer?.room_no}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="安检员" name="inspector_id" rules={[{ required: true, message: '请选择' }]}>
                <Select options={inspectors.map(i => ({ value: i.id, label: `${i.name}（${i.employee_no}）` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="安检时间" name="inspect_date" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_user_at_home" valuePropName="checked">
            <Checkbox>✅ 用户在家（取消勾选则本次记为「未遇」）</Checkbox>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(p, c) => p.is_user_at_home !== c.is_user_at_home}
          >
            {({ getFieldValue }) => {
              const isHome = getFieldValue('is_user_at_home');
              return !isHome ? null : (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="气表读数" name="meter_reading">
                        <Input placeholder="如：2568.5 m³" />
                      </Form.Item>
                    </Col>
                    <Col span={12} />
                  </Row>

                  <Divider orientation="left" plain style={{ marginTop: 0 }}>
                    <Space>
                      <span style={{ fontWeight: 600 }}>🧯 隐患信息录入</span>
                      <Button size="small" icon={<PlusOutlined />} onClick={addHazardRow}>
                        添加隐患
                      </Button>
                    </Space>
                  </Divider>

                  {hazards.length === 0 && (
                    <div className="empty-tip" style={{ border: '1px dashed #eee', borderRadius: 6 }}>
                      未添加隐患记录。如无异常请直接提交（将记为「安检正常」）
                    </div>
                  )}

                  {hazards.map((h, idx) => {
                    const type = hazardTypes.find(t => t.id === h.hazard_type_id);
                    return (
                      <Card
                        key={h.uid}
                        size="small"
                        style={{ marginBottom: 12, borderLeft: `4px solid ${type?.severity === 'high' ? '#ff4d4f' : '#faad14'}` }}
                        title={
                          <Space>
                            <Tag color={type?.severity === 'high' ? 'red' : 'orange'}>
                              隐患 {idx + 1}
                            </Tag>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              {type ? `${type.name}（${type.category}）` : '请选择隐患类型'}
                              {type?.is_construction ? <Tag color="purple" style={{ marginLeft: 8 }}>需施工</Tag> : null}
                            </span>
                            <Button type="text" danger size="small" onClick={() => removeHazardRow(h.uid)}>删除</Button>
                          </Space>
                        }
                      >
                        <Row gutter={12}>
                          <Col span={10}>
                            <Select
                              placeholder="选择隐患类型"
                              value={h.hazard_type_id}
                              onChange={v => {
                                const t = hazardTypes.find(x => x.id === v);
                                updateHazardRow(h.uid, 'hazard_type_id', v);
                                if (t) updateHazardRow(h.uid, 'severity', t.severity);
                              }}
                              style={{ width: '100%' }}
                              options={hazardTypes.map(t => ({
                                value: t.id,
                                label: `${t.name} · ${t.category}${t.is_construction ? '（施工）' : ''}`
                              }))}
                            />
                          </Col>
                          <Col span={8}>
                            <Input
                              placeholder="隐患位置（如厨房灶具连接处）"
                              value={h.location}
                              onChange={e => updateHazardRow(h.uid, 'location', e.target.value)}
                            />
                          </Col>
                          <Col span={6}>
                            <DatePicker
                              style={{ width: '100%' }}
                              placeholder="整改期限"
                              value={h.deadline ? dayjs(h.deadline) : null}
                              onChange={d => updateHazardRow(h.uid, 'deadline', d ? d.format('YYYY-MM-DD') : null)}
                            />
                          </Col>
                          <Col span={24} style={{ marginTop: 8 }}>
                            <TextArea
                              rows={2}
                              placeholder="详细描述（如：橡胶软管老化明显，连接处出现裂纹）"
                              value={h.description}
                              onChange={e => updateHazardRow(h.uid, 'description', e.target.value)}
                            />
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}
                </>
              );
            }}
          </Form.Item>

          <Form.Item label="备注" name="remark" style={{ marginTop: 16 }}>
            <TextArea rows={2} placeholder="其他说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlanDetail;
