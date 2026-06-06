import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  message,
  Progress,
  Row,
  Col,
  Statistic,
  Descriptions,
} from 'antd';
import {
  VideoCameraOutlined,
  FileImageOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { MaterialDelivery } from '@/types';

const { TextArea } = Input;

const deliveryStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待提交' },
  submitted: { color: 'blue', text: '已提交' },
  reviewing: { color: 'processing', text: '审核中' },
  approved: { color: 'green', text: '已通过' },
  revision_requested: { color: 'orange', text: '待修改' },
  rejected: { color: 'red', text: '已驳回' },
};

const deliveryTypeMap: Record<string, { icon: React.ReactNode; text: string }> = {
  video: { icon: <VideoCameraOutlined />, text: '视频' },
  image: { icon: <FileImageOutlined />, text: '图片' },
  copy: { icon: <FileTextOutlined />, text: '文案' },
};

export default function MaterialDeliveries() {
  const navigate = useNavigate();
  const {
    materialDeliveries,
    fetchMaterialDeliveries,
    submitDelivery,
    reviewDelivery,
    loading,
  } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<MaterialDelivery | null>(null);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    fetchMaterialDeliveries();
  }, [fetchMaterialDeliveries]);

  const pendingReview = materialDeliveries.filter(
    (m) => m.status === 'reviewing' || m.status === 'submitted'
  ).length;

  const revisionNeeded = materialDeliveries.filter(
    (m) => m.status === 'revision_requested'
  ).length;

  const approved = materialDeliveries.filter((m) => m.status === 'approved').length;

  const overdue = materialDeliveries.filter(
    (m) => dayjs(m.deadline).isBefore(dayjs()) && m.status !== 'approved'
  ).length;

  const handleSubmit = async (id: string) => {
    try {
      await submitDelivery(id);
      message.success('素材已提交');
    } catch (error) {
      message.error('提交失败');
    }
  };

  const handleReview = (record: MaterialDelivery) => {
    setSelectedDelivery(record);
    reviewForm.resetFields();
    setIsModalOpen(true);
  };

  const handleView = (record: MaterialDelivery) => {
    setSelectedDelivery(record);
    setViewModalOpen(true);
  };

  const handleReviewSubmit = async (values: any) => {
    if (!selectedDelivery) return;

    try {
      await reviewDelivery(selectedDelivery.id, {
        status: values.status,
        feedback: values.feedback,
      });

      message.success('审核完成');
      setIsModalOpen(false);
      reviewForm.resetFields();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusProgress = (status: string) => {
    const progressMap: Record<string, number> = {
      pending: 0,
      submitted: 25,
      reviewing: 50,
      revision_requested: 75,
      approved: 100,
      rejected: 100,
    };
    return progressMap[status] || 0;
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string, record: MaterialDelivery) => (
        <a onClick={() => navigate(`/projects/${record.projectId}`)}>{text}</a>
      ),
    },
    {
      title: '品牌',
      dataIndex: 'brandName',
      key: 'brandName',
    },
    {
      title: '达人',
      dataIndex: 'talentName',
      key: 'talentName',
    },
    {
      title: '素材类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const info = deliveryTypeMap[type];
        return (
          <Space>
            {info.icon}
            {info.text}
          </Space>
        );
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string, record: MaterialDelivery) => (
        <Space>
          <ClockCircleOutlined
            style={{
              color:
                dayjs(date).isBefore(dayjs()) && record.status !== 'approved'
                  ? '#ff4d4f'
                  : undefined,
            }}
          />
          <span
            style={{
              color:
                dayjs(date).isBefore(dayjs()) && record.status !== 'approved'
                  ? '#ff4d4f'
                  : undefined,
            }}
          >
            {dayjs(date).format('YYYY-MM-DD')}
            {dayjs(date).isBefore(dayjs()) && record.status !== 'approved' && (
              <Tag color="red">已逾期</Tag>
            )}
          </span>
        </Space>
      ),
      sorter: (a: MaterialDelivery, b: MaterialDelivery) =>
        dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = deliveryStatusMap[status];
        return (
          <Space direction="vertical" size="small" style={{ width: 120 }}>
            <Tag color={info.color}>{info.text}</Tag>
            <Progress
              percent={getStatusProgress(status)}
              size="small"
              showInfo={false}
              strokeColor={
                status === 'approved'
                  ? '#52c41a'
                  : status === 'rejected'
                  ? '#ff4d4f'
                  : '#1890ff'
              }
            />
          </Space>
        );
      },
      filters: Object.entries(deliveryStatusMap).map(([key, value]) => ({
        text: value.text,
        value: key,
      })),
      onFilter: (value: React.Key | boolean, record: MaterialDelivery) => record.status === String(value),
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MaterialDelivery) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {(record.status === 'submitted' || record.status === 'reviewing') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleReview(record)}
            >
              审核
            </Button>
          )}
          {['pending', 'revision_requested', 'rejected'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSubmit(record.id)}
            >
              {record.status === 'pending' ? '提交' : '重新提交'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="待审核"
                value={pendingReview}
                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="待修改"
                value={revisionNeeded}
                prefix={<EditOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已通过"
                value={approved}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已逾期"
                value={overdue}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>素材交付管理</h2>
        </div>

        <Table
          columns={columns}
          dataSource={materialDeliveries}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      <Modal
        title="素材详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedDelivery && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="项目名称">{selectedDelivery.projectName}</Descriptions.Item>
            <Descriptions.Item label="品牌">{selectedDelivery.brandName}</Descriptions.Item>
            <Descriptions.Item label="达人">{selectedDelivery.talentName}</Descriptions.Item>
            <Descriptions.Item label="素材类型">
              {deliveryTypeMap[selectedDelivery.type].text}
            </Descriptions.Item>
            <Descriptions.Item label="版本">{selectedDelivery.version}</Descriptions.Item>
            <Descriptions.Item label="文件名">{selectedDelivery.fileName}</Descriptions.Item>
            <Descriptions.Item label="文件大小">{formatFileSize(selectedDelivery.size)}</Descriptions.Item>
            <Descriptions.Item label="提交人">{selectedDelivery.submitter}</Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {selectedDelivery.submittedAt
                ? dayjs(selectedDelivery.submittedAt).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核人">{selectedDelivery.reviewer || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {selectedDelivery.reviewedAt
                ? dayjs(selectedDelivery.reviewedAt).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="截止日期">
              {dayjs(selectedDelivery.deadline).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={deliveryStatusMap[selectedDelivery.status].color}>
                {deliveryStatusMap[selectedDelivery.status].text}
              </Tag>
            </Descriptions.Item>
            {selectedDelivery.feedback && (
              <Descriptions.Item label="审核意见">{selectedDelivery.feedback}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="素材审核"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleReviewSubmit}
        >
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Select.Option value="approved">通过</Select.Option>
              <Select.Option value="revision_requested">要求修改</Select.Option>
              <Select.Option value="rejected">驳回</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="feedback"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的审核意见" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交审核
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
