import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Descriptions, Tag, Button, Space, Steps, Timeline, Divider,
  Modal, Form, InputNumber, Input, Select, message, Tooltip, Popconfirm, Empty, Typography, Spin
} from 'antd';
import {
  ArrowLeftOutlined, CheckOutlined, CloseOutlined, CommentOutlined,
  DownloadOutlined, CarOutlined, UserOutlined, DollarOutlined
} from '@ant-design/icons';
import { carApi } from '../api';
import { AuthTokenPayload, CarSource, OperationLog, CarStatus, CAR_STATUS_LABEL, OPERATION_LABEL, ROLE_LABEL } from '../types';
import dayjs from 'dayjs';

const STATUS_COLOR: Record<CarStatus, string> = {
  draft: 'default',
  manager_pending: 'blue',
  appraiser_pending: 'cyan',
  finance_pending: 'magenta',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default'
};

const WORKFLOW_STEPS = [
  { key: 'draft', title: '草稿' },
  { key: 'manager_pending', title: '收车经理审核' },
  { key: 'appraiser_pending', title: '评估师估价' },
  { key: 'finance_pending', title: '金融审批' },
  { key: 'approved', title: '审批通过' }
];

function stepIndex(status: CarStatus): number {
  if (status === 'rejected' || status === 'cancelled') return -1;
  return WORKFLOW_STEPS.findIndex(s => s.key === status);
}

export default function CarDetail({ user }: { user: AuthTokenPayload }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState<CarSource | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [modalType, setModalType] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);
  const [meta, setMeta] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => { load(); loadMeta(); }, [id]);

  async function loadMeta() {
    try { setMeta(await carApi.meta()); } catch {}
  }

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await carApi.get(id);
      setCar(data.car);
      setLogs(data.logs);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !car) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" tip="加载中..." /></div>;

  const currentCar: CarSource = car;
  const currentStep = stepIndex(currentCar.currentStatus);
  const isRejected = currentCar.currentStatus === 'rejected';
  const isCancelled = currentCar.currentStatus === 'cancelled';
  const isApproved = currentCar.currentStatus === 'approved';
  const isTerminal = isRejected || isCancelled || isApproved;

  function canManager(): boolean {
    return (user.role === 'manager' || user.role === 'admin') && ['draft', 'manager_pending'].includes(currentCar.currentStatus);
  }
  function canAppraiser(): boolean {
    return (user.role === 'appraiser' || user.role === 'admin') && currentCar.currentStatus === 'appraiser_pending';
  }
  function canFinance(): boolean {
    return (user.role === 'finance' || user.role === 'admin') && currentCar.currentStatus === 'finance_pending';
  }
  function canSubmit(): boolean {
    return currentCar.currentStatus === 'draft' && (currentCar.createdBy === user.userId || user.role === 'admin');
  }
  function canCancel(): boolean {
    return !isTerminal && (currentCar.createdBy === user.userId || user.role === 'admin');
  }

  async function openAction(type: string) {
    form.resetFields();
    setModalType(type);
  }

  async function handleExport() {
    if (!id) return;
    try {
      setExportLoading(true);
      await carApi.downloadExport(id);
      message.success('审批单已导出');
    } catch (e: any) {
      message.error(e.message || '导出失败');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleAction() {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      let result: CarSource | null = null;
      if (modalType === 'submit') result = await carApi.submit(id, values.remark);
      else if (modalType === 'manager_approve') result = await carApi.managerApprove(id, values.managerPrice, values.remark, values.assignAppraiserId);
      else if (modalType === 'manager_reject') result = await carApi.managerReject(id, values.remark);
      else if (modalType === 'appraiser_submit') result = await carApi.appraiserSubmit(id, values.appraiserPrice, values.remark);
      else if (modalType === 'appraiser_reject') result = await carApi.appraiserReject(id, values.remark);
      else if (modalType === 'finance_approve') result = await carApi.financeApprove(id, values.finalPrice, values.remark);
      else if (modalType === 'finance_reject') result = await carApi.financeReject(id, values.remark);
      else if (modalType === 'cancel') result = await carApi.cancel(id, values.remark);

      if (result) {
        message.success('操作成功');
        setModalType(null);
        load();
      }
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddComment() {
    if (!id) return;
    try {
      const values = await commentForm.validateFields();
      setActionLoading(true);
      await carApi.addComment(id, values.remark);
      message.success('备注已添加');
      commentForm.resetFields();
      load();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || '添加失败');
    } finally {
      setActionLoading(false);
    }
  }

  const actionButtons = (
    <Space wrap>
      {canSubmit() && <Button type="primary" onClick={() => openAction('submit')}>提交收车经理审核</Button>}
      {canManager() && (
        <>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => openAction('manager_approve')}>经理审核通过并估价</Button>
          <Button danger icon={<CloseOutlined />} onClick={() => openAction('manager_reject')}>驳回</Button>
        </>
      )}
      {canAppraiser() && (
        <>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => openAction('appraiser_submit')}>提交现场评估价</Button>
          <Button danger icon={<CloseOutlined />} onClick={() => openAction('appraiser_reject')}>驳回</Button>
        </>
      )}
      {canFinance() && (
        <>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => openAction('finance_approve')}>审批通过并定价</Button>
          <Button danger icon={<CloseOutlined />} onClick={() => openAction('finance_reject')}>驳回</Button>
        </>
      )}
      {canCancel() && <Popconfirm title="确认取消该车源？" onConfirm={() => openAction('cancel')}><Button>取消车源</Button></Popconfirm>}
      <Tooltip title="导出审批单（交班用）">
        <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={handleExport}>导出审批单</Button>
      </Tooltip>
    </Space>
  );

  function renderFormContent() {
    if (modalType === 'submit') {
      return <Form.Item label="备注" name="remark"><Input.TextArea rows={3} placeholder="说明为什么提交、来自哪个渠道、车主诉求等" /></Form.Item>;
    }
    if (modalType === 'manager_approve') {
      return (
        <>
          <Form.Item label="收车经理估价(元)" name="managerPrice" rules={[{ required: true, message: '请输入估价' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：163000" />
          </Form.Item>
          <Form.Item label="分配评估师" name="assignAppraiserId">
            <Select placeholder="默认分配给首位评估师">
              {meta?.users?.filter((u: any) => u.role === 'appraiser').map((u: any) => (
                <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="审核备注" name="remark"><Input.TextArea rows={3} placeholder="说明车况判断、价格依据、评估注意事项" /></Form.Item>
        </>
      );
    }
    if (['manager_reject', 'appraiser_reject', 'finance_reject'].includes(modalType || '')) {
      return <Form.Item label="驳回原因" name="remark" rules={[{ required: true, message: '请填写驳回原因' }]}><Input.TextArea rows={4} placeholder="必须填写原因，方便交班追溯" /></Form.Item>;
    }
    if (modalType === 'appraiser_submit') {
      return (
        <>
          <Form.Item label="现场评估价(元)" name="appraiserPrice" rules={[{ required: true, message: '请输入现场评估价' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：160000" />
          </Form.Item>
          <Form.Item label="评估备注" name="remark"><Input.TextArea rows={4} placeholder="详细记录车况：外观、内饰、发动机、变速箱、事故、补漆、轮胎等" /></Form.Item>
        </>
      );
    }
    if (modalType === 'finance_approve') {
      return (
        <>
          <Form.Item label="最终审批价(元)" name="finalPrice" rules={[{ required: true, message: '请输入审批价' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：160000" />
          </Form.Item>
          <Form.Item label="审批备注" name="remark"><Input.TextArea rows={3} placeholder="结合历史记录给出审批意见" /></Form.Item>
        </>
      );
    }
    if (modalType === 'cancel') {
      return <Form.Item label="取消原因" name="remark"><Input.TextArea rows={3} placeholder="填写取消原因" /></Form.Item>;
    }
    return null;
  }

  const modalTitle: Record<string, string> = {
    submit: '提交收车经理审核',
    manager_approve: '收车经理审核通过',
    manager_reject: '收车经理驳回',
    appraiser_submit: '评估师提交现场估价',
    appraiser_reject: '评估师驳回',
    finance_approve: '金融审批通过',
    finance_reject: '金融审批驳回',
    cancel: '取消车源'
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {currentCar.brand} {currentCar.model}
            <Tag color={STATUS_COLOR[currentCar.currentStatus]} style={{ marginLeft: 12 }}>{CAR_STATUS_LABEL[currentCar.currentStatus]}</Tag>
          </Typography.Title>
        </Space>
        {actionButtons}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ marginTop: 0 }}>审批流转进度</Typography.Title>
        {isRejected || isCancelled ? (
          <AlertBox type={isRejected ? 'error' : 'warning'} title={CAR_STATUS_LABEL[currentCar.currentStatus]} log={logs.find(l => l.toStatus === currentCar.currentStatus)} />
        ) : (
          <Steps
            className="workflow-steps"
            current={currentStep}
            status={isApproved ? 'finish' : 'process'}
            items={WORKFLOW_STEPS.map(s => ({ title: s.title }))}
          />
        )}
      </Card>

      <Row gutter={16}>
        <Col span={14}>
          <Card title={<span><CarOutlined style={{ color: '#1677ff' }} /> 车辆与车主信息</span>} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="车源编号">{currentCar.carNo}</Descriptions.Item>
              <Descriptions.Item label="品牌/车型">{currentCar.brand} {currentCar.model}</Descriptions.Item>
              <Descriptions.Item label="年款/里程">{currentCar.year}年 / {currentCar.mileage.toLocaleString()}公里</Descriptions.Item>
              <Descriptions.Item label="颜色">{currentCar.color || '-'}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{currentCar.plateNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="VIN">{currentCar.vin || '-'}</Descriptions.Item>
              <Descriptions.Item label="车主">{currentCar.ownerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentCar.ownerPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源渠道">{currentCar.sourceChannel || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(currentCar.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<span><DollarOutlined style={{ color: '#cf1322' }} /> 价格记录</span>} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="车主期望价">{currentCar.expectedPrice ? <span className="price-tag">¥{currentCar.expectedPrice.toLocaleString()}</span> : '-'}</Descriptions.Item>
              <Descriptions.Item label="收车经理估价">{currentCar.managerPrice ? <span className="price-tag">¥{currentCar.managerPrice.toLocaleString()}</span> : '-'}</Descriptions.Item>
              <Descriptions.Item label="评估师现场价">{currentCar.appraiserPrice ? <span className="price-tag">¥{currentCar.appraiserPrice.toLocaleString()}</span> : '-'}</Descriptions.Item>
              <Descriptions.Item label="最终审批价">{currentCar.finalPrice ? <span className="price-tag">¥{currentCar.finalPrice.toLocaleString()}</span> : '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {!isTerminal && (
            <Card title={<span><CommentOutlined /> 添加交班备注（不改变状态）</span>}>
              <Form form={commentForm} layout="vertical" onFinish={handleAddComment}>
                <Form.Item name="remark" rules={[{ required: true, message: '请输入备注内容' }]}>
                  <Input.TextArea rows={3} placeholder="补充说明车况、车主诉求、待办事项等，供下一位处理人查看" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={actionLoading}>添加备注</Button>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Col>

        <Col span={10}>
          <Card title={<span><UserOutlined style={{ color: '#1677ff' }} /> 完整流转历史（按时间顺序）</span>} extra={<Tag color="blue">{logs.length} 条记录</Tag>}>
            {logs.length === 0 ? (
              <Empty description="暂无流转记录" />
            ) : (
              <Timeline
                mode="left"
                items={logs.map(log => ({
                  color: log.operationType.includes('reject') ? 'red' : log.operationType === 'cancel' ? 'gray' : log.operationType === 'add_comment' ? 'gray' : 'blue',
                  label: <div style={{ fontSize: 12, color: '#999' }}>{dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {log.operatorName}
                        <span className={`role-badge role-${log.operatorRole}`}>{ROLE_LABEL[log.operatorRole]}</span>
                        <span style={{ marginLeft: 8 }}>{OPERATION_LABEL[log.operationType]}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {log.fromStatus && <Tag color={STATUS_COLOR[log.fromStatus]}>{CAR_STATUS_LABEL[log.fromStatus]}</Tag>}
                        {log.fromStatus && <span style={{ margin: '0 6px' }}>→</span>}
                        <Tag color={STATUS_COLOR[log.toStatus]}>{CAR_STATUS_LABEL[log.toStatus]}</Tag>
                        {log.price != null && <span className="price-tag" style={{ marginLeft: 8 }}>¥{log.price.toLocaleString()}</span>}
                      </div>
                      {log.remark && <div className="timeline-remark">{log.remark}</div>}
                    </div>
                  )
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        open={!!modalType}
        title={modalTitle[modalType || '']}
        onCancel={() => setModalType(null)}
        onOk={handleAction}
        confirmLoading={actionLoading}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        maskClosable={false}
      >
        {modalType && (
          <div style={{ padding: '8px 0' }}>
            <AlertInfo car={car} user={user} type={modalType} />
            <Divider style={{ margin: '12px 0' }} />
            <Form form={form} layout="vertical">
              {renderFormContent()}
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AlertInfo({ car, user, type }: { car: CarSource; user: AuthTokenPayload; type: string }) {
  if (type === 'manager_approve') {
    return (
      <div style={{ background: '#e6f4ff', padding: 12, borderRadius: 6, fontSize: 13 }}>
        <div><b>车源：</b>{car.brand} {car.model} ({car.year}年 / {car.mileage.toLocaleString()}公里)</div>
        {car.expectedPrice && <div><b>车主期望：</b><span className="price-tag">¥{car.expectedPrice.toLocaleString()}</span></div>}
        <div style={{ color: '#666', marginTop: 4 }}>审核通过后将流转至「评估师待估价」状态</div>
      </div>
    );
  }
  if (type === 'appraiser_submit') {
    return (
      <div style={{ background: '#e6fffb', padding: 12, borderRadius: 6, fontSize: 13 }}>
        <div><b>车源：</b>{car.brand} {car.model}</div>
        {car.managerPrice && <div><b>收车经理估价：</b><span className="price-tag">¥{car.managerPrice.toLocaleString()}</span></div>}
        {car.expectedPrice && <div><b>车主期望：</b>¥{car.expectedPrice.toLocaleString()}</div>}
        <div style={{ color: '#666', marginTop: 4 }}>提交后将流转至「金融专员待审批」状态，金融专员可看到你这次的完整记录</div>
      </div>
    );
  }
  if (type === 'finance_approve') {
    return (
      <div style={{ background: '#fff0f6', padding: 12, borderRadius: 6, fontSize: 13 }}>
        <div><b>车源：</b>{car.brand} {car.model}</div>
        {car.managerPrice && <div><b>收车经理估价：</b>¥{car.managerPrice.toLocaleString()}</div>}
        {car.appraiserPrice && <div><b>评估师现场价：</b>¥{car.appraiserPrice.toLocaleString()}</div>}
        {car.expectedPrice && <div><b>车主期望：</b>¥{car.expectedPrice.toLocaleString()}</div>}
        <div style={{ color: '#666', marginTop: 4 }}>审批通过后进入「可收购」终态，价格锁定</div>
      </div>
    );
  }
  return null;
}

function AlertBox({ type, title, log }: { type: 'error' | 'warning'; title: string; log?: OperationLog }) {
  const color = type === 'error' ? '#fff1f0' : '#fffbe6';
  const border = type === 'error' ? '#ffa39e' : '#ffe58f';
  return (
    <div style={{ background: color, border: `1px solid ${border}`, padding: 16, borderRadius: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {log && (
        <div style={{ fontSize: 13 }}>
          <div>
            <b>{log.operatorName}</b>
            <span className={`role-badge role-${log.operatorRole}`}>{ROLE_LABEL[log.operatorRole]}</span>
            <span style={{ marginLeft: 8 }}>{OPERATION_LABEL[log.operationType]}</span>
            <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>{dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>
          {log.remark && <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `3px solid ${border}` }}>{log.remark}</div>}
        </div>
      )}
    </div>
  );
}
