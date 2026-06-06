import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  message,
  Timeline,
  Tabs,
  Divider,
  Spin,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  RollbackOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SendOutlined,
  HistoryOutlined,
  ProductOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { scheduleApi } from '@/services/api';
import type { ScheduleStatus, WorkflowRecord, LiveSchedule } from '@/types';

const { TextArea } = Input;

const statusMap: Record<ScheduleStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  PENDING_REVIEW: { text: '待复核', color: 'warning' },
  REVIEWED: { text: '已复核', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  LIVE: { text: '直播中', color: 'blue' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
  RETURNED: { text: '已退回', color: 'error' },
};

const actionTypeMap: Record<string, { text: string; color: string }> = {
  CREATE: { text: '创建', color: '#1890ff' },
  UPDATE: { text: '更新', color: '#52c41a' },
  SUBMIT: { text: '提交复核', color: '#faad14' },
  APPROVE: { text: '复核通过', color: '#52c41a' },
  REJECT: { text: '复核拒绝', color: '#ff4d4f' },
  RETURN: { text: '退回补录', color: '#ff4d4f' },
  SUPPLEMENT: { text: '补录完成', color: '#52c41a' },
  START_LIVE: { text: '开始直播', color: '#1890ff' },
  END_LIVE: { text: '结束直播', color: '#52c41a' },
  CANCEL: { text: '取消', color: '#ff4d4f' },
};

const ScheduleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<(LiveSchedule & { history: WorkflowRecord[] }) | null>(null);

  const [submitModal, setSubmitModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await scheduleApi.getDetail(id);
      setSchedule(res.data);
    } catch (e: any) {
      message.error(e.message || '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!schedule && loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!schedule) {
    return <div>排期不存在</div>;
  }

  const cfg = statusMap[schedule.status];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await scheduleApi.submitForReview(schedule.id, { remark: values.remark });
      message.success('提交复核成功');
      setSubmitModal(false);
      form.resetFields();
      fetchDetail();
    } catch (e: any) {
      message.error(e.message || '提交失败');
    }
  };

  const handleReturn = async () => {
    try {
      const values = await returnForm.validateFields();
      await scheduleApi.return(schedule.id, { remark: values.remark });
      message.success('已退回补录');
      setReturnModal(false);
      returnForm.resetFields();
      fetchDetail();
    } catch (e: any) {
      message.error(e.message || '退回失败');
    }
  };

  const handleApprove = async () => {
    try {
      await scheduleApi.approve(schedule.id, {});
      message.success('复核通过');
      fetchDetail();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleStartLive = async () => {
    try {
      await scheduleApi.startLive(schedule.id);
      message.success('直播已开始');
      fetchDetail();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleEndLive = async () => {
    try {
      await scheduleApi.endLive(schedule.id);
      message.success('直播已结束');
      fetchDetail();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleCancelSchedule = async () => {
    try {
      const values = await cancelForm.validateFields();
      await scheduleApi.cancel(schedule.id, { remark: values.remark });
      message.success('排期已取消');
      setCancelModal(false);
      cancelForm.resetFields();
      fetchDetail();
    } catch (e: any) {
      message.error(e.message || '取消失败');
    }
  };

  const renderActions = () => {
    const buttons: React.ReactNode[] = [];

    if (['DRAFT', 'RETURNED'].includes(schedule.status)) {
      buttons.push(
        <Button key="edit" icon={<EditOutlined />} onClick={() => navigate(`/schedules/${schedule.id}/edit`)}>
          编辑
        </Button>,
      );
      buttons.push(
        <Button key="submit" type="primary" icon={<SendOutlined />} onClick={() => setSubmitModal(true)}>
          提交复核
        </Button>,
      );
    }

    if (schedule.status === 'PENDING_REVIEW') {
      buttons.push(
        <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
          复核通过
        </Button>,
      );
      buttons.push(
        <Button key="return" danger icon={<RollbackOutlined />} onClick={() => setReturnModal(true)}>
          退回补录
        </Button>,
      );
    }

    if (schedule.status === 'APPROVED') {
      buttons.push(
        <Button key="start" type="primary" icon={<PlayCircleOutlined />} onClick={handleStartLive}>
          开始直播
        </Button>,
      );
    }

    if (schedule.status === 'LIVE') {
      buttons.push(
        <Button key="end" type="primary" icon={<StopOutlined />} onClick={handleEndLive}>
          结束直播
        </Button>,
      );
    }

    return buttons;
  };

  const productColumns = [
    {
      title: '序号',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 60,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      key: 'productSku',
      width: 150,
    },
    {
      title: '直播价',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 100,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '计划数量',
      dataIndex: 'plannedQuantity',
      key: 'plannedQuantity',
      width: 100,
    },
    {
      title: '状态',
      key: 'selected',
      width: 80,
      render: (_: any, record: any) =>
        record.isSelected ? <Tag color="success">已选</Tag> : <Tag>未选</Tag>,
    },
  ];

  const renderTimeline = () => (
    <Timeline
      items={schedule.history.map((record: WorkflowRecord) => ({
        color: actionTypeMap[record.actionType]?.color || 'blue',
        children: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Tag color={actionTypeMap[record.actionType]?.color}>
                {actionTypeMap[record.actionType]?.text || record.actionType}
              </Tag>
              <span style={{ color: '#999', fontSize: 12 }}>
                v{record.bizVersion} · {dayjs(record.actionAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: '#666' }}>操作人：</span>
              {record.actionBy}
            </div>
            {record.previousStatus && (
              <div style={{ marginBottom: 4, color: '#666' }}>
                {statusMap[record.previousStatus as ScheduleStatus]?.text} →{' '}
                {statusMap[record.newStatus as ScheduleStatus]?.text}
              </div>
            )}
            {record.remark && <div style={{ color: '#333' }}>备注：{record.remark}</div>}
            <div style={{ color: '#bbb', fontSize: 11, marginTop: 4 }}>
              幂等键: {record.idempotencyKey.slice(0, 20)}...
            </div>
          </div>
        ),
      }))}
    />
  );

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <ProductOutlined /> 基本信息
        </span>
      ),
      children: (
        <div>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="排期标题">{schedule.title}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag color={cfg.color}>{cfg.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="主播">{schedule.anchorName}</Descriptions.Item>
            <Descriptions.Item label="主播助理">{schedule.assistantName}</Descriptions.Item>
            <Descriptions.Item label="直播平台">{schedule.platform}</Descriptions.Item>
            <Descriptions.Item label="预计时长">{schedule.estimatedDuration} 分钟</Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {dayjs(schedule.startTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {dayjs(schedule.endTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="当前版本">v{schedule.currentVersion}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(schedule.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">选品列表</Divider>
          <Table
            columns={productColumns}
            dataSource={schedule.products.filter((p) => p.isSelected)}
            rowKey="productId"
            pagination={false}
            size="small"
          />
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> 操作历史
        </span>
      ),
      children: renderTimeline(),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/schedules')}>
          返回列表
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
          刷新
        </Button>
      </Space>

      <Card
        title={schedule.title}
        loading={loading}
        extra={
          <Space>
            <Tag color={cfg.color}>{cfg.text}</Tag>
            {renderActions()}
          </Space>
        }
      >
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Card>

      <Modal
        title="提交复核"
        open={submitModal}
        onOk={handleSubmit}
        onCancel={() => setSubmitModal(false)}
        okText="提交"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="remark"
            label="备注说明"
            rules={[{ required: true, message: '请输入备注' }]}
          >
            <TextArea rows={4} placeholder="请输入提交说明..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="退回补录"
        open={returnModal}
        onOk={handleReturn}
        onCancel={() => setReturnModal(false)}
        okText="确认退回"
        okButtonProps={{ danger: true }}
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item
            name="remark"
            label="退回原因"
            rules={[{ required: true, message: '请输入退回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明需要补录的内容..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="取消排期"
        open={cancelModal}
        onOk={handleCancelSchedule}
        onCancel={() => setCancelModal(false)}
        okText="确认取消"
        okButtonProps={{ danger: true }}
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            name="remark"
            label="取消原因"
            rules={[{ required: true, message: '请输入取消原因' }]}
          >
            <TextArea rows={4} placeholder="请输入取消排期的原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleDetail;
