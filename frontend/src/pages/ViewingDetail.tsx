import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions,
  Tag,
  Timeline,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Alert,
  Empty,
  Card,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { viewingAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  ViewingRecord,
  Property,
  OperationLog,
  TimelineEvent,
  viewingStatusNames,
  interestLevelNames,
  decorationNames,
} from '../types';

const { TextArea } = Input;

const ViewingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ViewingRecord | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (viewingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [viewingRes, timelineRes] = await Promise.all([
        viewingAPI.get(viewingId),
        logsAPI.getTimeline('viewing', viewingId),
      ]);
      setViewing(viewingRes.data);
      setProperty(viewingRes.data.property || null);
      setTimeline(timelineRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载看房记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setCompleteLoading(true);
      await viewingAPI.complete(id, values);
      setCompleteModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      if (err.response) setError(err.response?.data?.error || '操作失败');
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消这个看房预约吗？',
      onOk: async () => {
        try {
          await viewingAPI.cancel(id);
          fetchData(id);
        } catch (err: any) {
          setError(err.response?.data?.error || '取消失败');
        }
      },
    });
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="错误" description={error} type="error" showIcon />;
  }

  if (!viewing) {
    return <Empty description="未找到看房记录" />;
  }

  const canComplete = user && viewing.consultantId === user.id && viewing.status === 'scheduled';
  const canCancel = user && viewing.consultantId === user.id && viewing.status === 'scheduled';

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/viewings')}>
            返回列表
          </Button>
          <h1 className="page-title">看房记录详情</h1>
          <Tag color={viewing.status === 'completed' ? 'green' : viewing.status === 'cancelled' ? 'red' : 'blue'}>
            {viewingStatusNames[viewing.status] || viewing.status}
          </Tag>
        </Space>
        {(canComplete || canCancel) && (
          <div className="action-bar">
            {canComplete && (
              <Button type="primary" onClick={() => { form.resetFields(); setCompleteModalVisible(true); }}>
                完成看房
              </Button>
            )}
            {canCancel && (
              <Button danger onClick={handleCancel}>
                取消预约
              </Button>
            )}
          </div>
        )}
      </div>

      {property && (
        <div className="detail-section">
          <h2 className="detail-section-title">关联房源</h2>
          <Card size="small" hoverable onClick={() => navigate(`/properties/${property.id}`)} style={{ cursor: 'pointer' }}>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="位置">{property.building} {property.floor}层 {property.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="面积">{property.area} ㎡</Descriptions.Item>
              <Descriptions.Item label="单价">¥{property.unitPrice}/㎡/月</Descriptions.Item>
              <Descriptions.Item label="装修">{decorationNames[property.decoration]}</Descriptions.Item>
              <Descriptions.Item label="朝向">{property.orientation}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      <div className="detail-section">
        <h2 className="detail-section-title">看房信息</h2>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="客户姓名">{viewing.customerName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{viewing.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="公司">{viewing.companyName || '-'}</Descriptions.Item>
          <Descriptions.Item label="预约时间">{formatDate(viewing.scheduledAt)}</Descriptions.Item>
          <Descriptions.Item label="实际看房时间">{viewing.actualAt ? formatDate(viewing.actualAt) : '-'}</Descriptions.Item>
          <Descriptions.Item label="顾问">{viewing.consultantName}</Descriptions.Item>
          <Descriptions.Item label="兴趣程度">
            <Tag color={viewing.interestLevel === 'high' ? 'red' : viewing.interestLevel === 'medium' ? 'orange' : 'default'}>
              {interestLevelNames[viewing.interestLevel] || viewing.interestLevel}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={viewing.status === 'completed' ? 'green' : viewing.status === 'cancelled' ? 'red' : 'blue'}>
              {viewingStatusNames[viewing.status]}
            </Tag>
          </Descriptions.Item>
          {viewing.needs && (
            <Descriptions.Item label="客户需求" span={2}>{viewing.needs}</Descriptions.Item>
          )}
          {viewing.feedback && (
            <Descriptions.Item label="看房反馈" span={2}>{viewing.feedback}</Descriptions.Item>
          )}
          {viewing.nextFollowUp && (
            <Descriptions.Item label="后续跟进" span={2}>{viewing.nextFollowUp}</Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">操作时间线</h2>
        <div className="timeline-container">
          {timeline.length > 0 ? (
            <Timeline
              items={timeline.map((event) => ({
                color: event.newStatus ? 'blue' : 'gray',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{event.title}</div>
                    <div style={{ color: '#666', margin: '4px 0' }}>{event.description}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {event.operator} · {formatDate(event.timestamp)}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无操作记录" />
          )}
        </div>
      </div>

      <Modal
        title="完成看房"
        open={completeModalVisible}
        onOk={handleComplete}
        onCancel={() => setCompleteModalVisible(false)}
        confirmLoading={completeLoading}
        okText="确认完成"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="feedback" label="看房反馈" rules={[{ required: true, message: '请输入看房反馈' }]}>
            <TextArea rows={3} placeholder="请记录客户看房后的反馈..." />
          </Form.Item>
          <Form.Item name="interestLevel" label="兴趣程度" rules={[{ required: true, message: '请选择兴趣程度' }]}>
            <Select placeholder="请选择">
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="nextFollowUp" label="后续跟进">
            <TextArea rows={2} placeholder="请输入后续跟进计划..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewingDetail;
