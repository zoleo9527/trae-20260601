import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Timeline,
  Tabs,
  Table,
  List,
  Avatar,
  Steps,
  Divider,
  Spin,
  message,
  Modal,
  Form,
  Select,
  Input,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  FileZipOutlined,
  FileTextOutlined,
  EditOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { ShootingSchedule, MaterialDelivery, ScriptVersion, TimelineEvent } from '@/types';

const { TextArea } = Input;

const projectStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待启动' },
  shooting: { color: 'blue', text: '拍摄中' },
  editing: { color: 'processing', text: '剪辑中' },
  delivering: { color: 'orange', text: '交付中' },
  completed: { color: 'green', text: '已完成' },
};

const priorityMap: Record<string, { color: string; text: string }> = {
  high: { color: 'red', text: '高优先级' },
  medium: { color: 'orange', text: '中优先级' },
  low: { color: 'green', text: '低优先级' },
};

const stepItems = [
  { title: '项目创建', status: 'finish' },
  { title: '脚本确认', status: 'finish' },
  { title: '拍摄排期', status: 'process' },
  { title: '素材拍摄', status: 'wait' },
  { title: '后期剪辑', status: 'wait' },
  { title: '素材交付', status: 'wait' },
  { title: '项目完成', status: 'wait' },
];

const getStepIndex = (status: string) => {
  const map: Record<string, number> = {
    pending: 1,
    shooting: 3,
    editing: 4,
    delivering: 5,
    completed: 6,
  };
  return map[status] || 0;
};

const scheduleStatusMap: Record<string, { color: string; text: string }> = {
  scheduled: { color: 'blue', text: '已排期' },
  in_progress: { color: 'processing', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
};

const deliveryStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待提交' },
  submitted: { color: 'blue', text: '已提交' },
  reviewing: { color: 'processing', text: '审核中' },
  approved: { color: 'green', text: '已通过' },
  revision_requested: { color: 'orange', text: '待修改' },
  rejected: { color: 'red', text: '已驳回' },
};

const timelineTypeColors: Record<string, string> = {
  status_change: '#1890ff',
  comment: '#52c41a',
  file_upload: '#722ed1',
  schedule_update: '#fa8c16',
  delivery_update: '#eb2f96',
};

const timelineTypeIcons: Record<string, React.ReactNode> = {
  status_change: <EditOutlined />,
  comment: <MessageOutlined />,
  file_upload: <FileZipOutlined />,
  schedule_update: <CalendarOutlined />,
  delivery_update: <FileZipOutlined />,
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getProjectById,
    fetchTimelineEvents,
    timelineEvents,
    fetchShootingSchedules,
    shootingSchedules,
    fetchMaterialDeliveries,
    materialDeliveries,
    fetchScriptVersions,
    scriptVersions,
    updateMaterialDelivery,
    addTimelineEvent,
    fetchProjects,
    projects,
  } = useStore();

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('timeline');

  const project = getProjectById(id || '');
  const projectTimeline = timelineEvents[id || ''] || [];
  const projectSchedules = shootingSchedules.filter((s) => s.projectId === id);
  const projectDeliveries = materialDeliveries.filter((m) => m.projectId === id);
  const projectScripts = scriptVersions[id || ''] || [];

  useEffect(() => {
    if (id) {
      fetchProjects();
      fetchTimelineEvents(id);
      fetchShootingSchedules();
      fetchMaterialDeliveries();
      fetchScriptVersions(id);
    }
  }, [id, fetchProjects, fetchTimelineEvents, fetchShootingSchedules, fetchMaterialDeliveries, fetchScriptVersions]);

  if (!project) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>加载中...</p>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(project.status);
  const steps = stepItems.map((item, index) => ({
    ...item,
    status: index < currentStepIndex ? 'finish' : index === currentStepIndex ? 'process' : 'wait',
  }));

  const scheduleColumns = [
    {
      title: '拍摄日期',
      dataIndex: 'shootDate',
      key: 'shootDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('YYYY-MM-DD')}
        </Space>
      ),
    },
    {
      title: '拍摄时间',
      dataIndex: 'shootTime',
      key: 'shootTime',
    },
    {
      title: '拍摄地点',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => (
        <Space>
          <EnvironmentOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = scheduleStatusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" size="small" onClick={() => navigate('/schedules')}>
          查看
        </Button>
      ),
    },
  ];

  const deliveryColumns = [
    {
      title: '素材类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {type === 'video' && <VideoCameraOutlined />}
          {type === 'image' && <FileZipOutlined />}
          {type === 'copy' && <FileTextOutlined />}
          {type === 'video' ? '视频' : type === 'image' ? '图片' : '文案'}
        </Space>
      ),
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
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (time?: string) => (time ? dayjs(time).format('MM-DD HH:mm') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = deliveryStatusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  const handleAddComment = async (values: any) => {
    await addTimelineEvent({
      projectId: id!,
      type: 'comment',
      title: '添加评论',
      description: values.comment,
      operator: '当前用户',
      operatorRole: 'director',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });
    message.success('评论已添加');
    setCommentModalOpen(false);
    commentForm.resetFields();
  };

  const handleQuickAction = async (type: string) => {
    if (type === 'comment') {
      setCommentModalOpen(true);
    }
  };

  const tabItems = [
    {
      key: 'timeline',
      label: '时间线',
      children: (
        <div style={{ maxHeight: 500, overflowY: 'auto', padding: '0 8px' }}>
          {projectTimeline.length > 0 ? (
            <Timeline
              mode="left"
              items={projectTimeline.map((event: TimelineEvent) => ({
                color: timelineTypeColors[event.type],
                dot: timelineTypeIcons[event.type],
                children: (
                  <div style={{ marginBottom: 16 }}>
                    <Space style={{ marginBottom: 4 }}>
                      <strong>{event.title}</strong>
                      <Tag color={timelineTypeColors[event.type]} style={{ marginLeft: 8 }}>
                        {event.operator}
                      </Tag>
                    </Space>
                    <p style={{ margin: '4px 0', color: '#666' }}>{event.description}</p>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                ),
              }))}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无时间线记录
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'schedules',
      label: `拍摄排期 (${projectSchedules.length})`,
      children: (
        <Table
          columns={scheduleColumns}
          dataSource={projectSchedules}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'deliveries',
      label: `素材交付 (${projectDeliveries.length})`,
      children: (
        <Table
          columns={deliveryColumns}
          dataSource={projectDeliveries}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'scripts',
      label: `脚本版本 (${projectScripts.length})`,
      children: (
        <List
          dataSource={projectScripts}
          renderItem={(item: ScriptVersion) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                title={
                  <Space>
                    <span>版本 {item.version}</span>
                    <Tag
                      color={
                        item.status === 'approved'
                          ? 'green'
                          : item.status === 'rejected'
                          ? 'red'
                          : item.status === 'pending_review'
                          ? 'orange'
                          : 'default'
                      }
                    >
                      {item.status === 'approved'
                        ? '已通过'
                        : item.status === 'rejected'
                        ? '已驳回'
                        : item.status === 'pending_review'
                        ? '待审核'
                        : '草稿'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{item.content}</p>
                    <Space size="small" style={{ fontSize: 12, color: '#999' }}>
                      <UserOutlined /> {item.createdBy}
                      <span>·</span>
                      <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                    </Space>
                    {item.remark && (
                      <p style={{ marginTop: 8, padding: 8, background: '#fff7e6', borderRadius: 4 }}>
                        <strong>备注：</strong>{item.remark}
                      </p>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2 style={{ margin: 0 }}>{project.name}</h2>
        <Tag color={projectStatusMap[project.status].color}>
          {projectStatusMap[project.status].text}
        </Tag>
        <Tag color={priorityMap[project.priority].color}>
          {priorityMap[project.priority].text}
        </Tag>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={4} bordered size="small">
          <Descriptions.Item label="品牌">{project.brandName}</Descriptions.Item>
          <Descriptions.Item label="达人">{project.talentName}</Descriptions.Item>
          <Descriptions.Item label="脚本版本">{project.scriptVersion}</Descriptions.Item>
          <Descriptions.Item label="截止日期">
            <span
              style={{
                color: dayjs(project.deadline).isBefore(dayjs()) ? '#ff4d4f' : undefined,
              }}
            >
              {dayjs(project.deadline).format('YYYY-MM-DD')}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            {dayjs(project.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间" span={2}>
            {dayjs(project.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">项目进度</Divider>
        <Steps current={currentStepIndex} items={steps} size="small" />
      </Card>

      <Card
        title="项目详情"
        extra={
          <Space>
            <Button type="primary" onClick={() => handleQuickAction('comment')}>
              添加评论
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="添加评论"
        open={commentModalOpen}
        onCancel={() => setCommentModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={commentForm} layout="vertical" onFinish={handleAddComment}>
          <Form.Item
            name="comment"
            label="评论内容"
            rules={[{ required: true, message: '请输入评论内容' }]}
          >
            <TextArea rows={4} placeholder="请输入评论内容" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCommentModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
