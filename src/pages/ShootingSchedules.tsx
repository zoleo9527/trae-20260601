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
  DatePicker,
  TimePicker,
  Input,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  VideoCameraOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { ShootingSchedule, Project } from '@/types';

const { TextArea } = Input;

const scheduleStatusMap: Record<string, { color: string; text: string }> = {
  scheduled: { color: 'blue', text: '已排期' },
  in_progress: { color: 'processing', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
};

export default function ShootingSchedules() {
  const navigate = useNavigate();
  const { shootingSchedules, projects, fetchShootingSchedules, fetchProjects, updateShootingSchedule, createShootingSchedule } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ShootingSchedule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchShootingSchedules();
    fetchProjects();
  }, [fetchShootingSchedules, fetchProjects]);

  const todayCount = shootingSchedules.filter((s) =>
    dayjs(s.shootDate).isSame(dayjs(), 'day')
  ).length;

  const weekCount = shootingSchedules.filter((s) =>
    dayjs(s.shootDate).isSame(dayjs(), 'week')
  ).length;

  const inProgressCount = shootingSchedules.filter((s) => s.status === 'in_progress').length;

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: ShootingSchedule) => {
    setEditingSchedule(record);
    form.setFieldsValue({
      ...record,
      shootDate: dayjs(record.shootDate),
      shootTime: dayjs(record.shootTime, 'HH:mm'),
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = async (id: string, status: ShootingSchedule['status']) => {
    await updateShootingSchedule(id, { status });
    message.success('状态更新成功');
  };

  const handleSubmit = async (values: any) => {
    const project = projects.find((p) => p.id === values.projectId) as Project;

    const data = {
      projectId: values.projectId,
      projectName: project?.name || '',
      brandName: project?.brandName || '',
      talentName: project?.talentName || '',
      shootDate: values.shootDate.format('YYYY-MM-DD'),
      shootTime: values.shootTime.format('HH:mm') + '-18:00',
      location: values.location,
      status: values.status || 'scheduled',
      equipment: values.equipment || [],
      notes: values.notes,
      assignee: values.assignee,
    };

    if (editingSchedule) {
      await updateShootingSchedule(editingSchedule.id, data);
      message.success('排期更新成功');
    } else {
      await createShootingSchedule(data as any);
      message.success('排期创建成功');
    }

    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string, record: ShootingSchedule) => (
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
      title: '拍摄日期',
      dataIndex: 'shootDate',
      key: 'shootDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('YYYY-MM-DD')}
          {dayjs(date).isSame(dayjs(), 'day') && (
            <Tag color="red">今天</Tag>
          )}
        </Space>
      ),
      sorter: (a: ShootingSchedule, b: ShootingSchedule) =>
        dayjs(a.shootDate).valueOf() - dayjs(b.shootDate).valueOf(),
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
      filters: Object.entries(scheduleStatusMap).map(([key, value]) => ({
        text: value.text,
        value: key,
      })),
      onFilter: (value: string, record: ShootingSchedule) => record.status === value,
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ShootingSchedule) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'scheduled' && (
            <Button
              type="link"
              size="small"
              icon={<VideoCameraOutlined />}
              onClick={() => handleStatusChange(record.id, 'in_progress')}
            >
              开始拍摄
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record.id, 'completed')}
            >
              完成拍摄
            </Button>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Popconfirm
              title="确定取消此排期吗？"
              onConfirm={() => handleStatusChange(record.id, 'cancelled')}
            >
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                取消
              </Button>
            </Popconfirm>
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
                title="今日拍摄"
                value={todayCount}
                prefix={<VideoCameraOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="本周拍摄"
                value={weekCount}
                prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="进行中"
                value={inProgressCount}
                prefix={<VideoCameraOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总排期"
                value={shootingSchedules.length}
                prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>拍摄排期管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建排期
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={shootingSchedules}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingSchedule ? '编辑排期' : '新建排期'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="projectId"
            label="关联项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择项目">
              {projects.map((project) => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name} - {project.brandName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="shootDate"
            label="拍摄日期"
            rules={[{ required: true, message: '请选择拍摄日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="shootTime"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="location"
            label="拍摄地点"
            rules={[{ required: true, message: '请输入拍摄地点' }]}
          >
            <Input placeholder="请输入拍摄地点" />
          </Form.Item>

          <Form.Item
            name="assignee"
            label="负责人"
            rules={[{ required: true, message: '请输入负责人' }]}
          >
            <Input placeholder="请输入负责人" />
          </Form.Item>

          <Form.Item
            name="equipment"
            label="所需设备"
          >
            <Select mode="tags" placeholder="输入设备名称后按回车">
              <Select.Option value="相机A7R4">相机A7R4</Select.Option>
              <Select.Option value="补光灯x3">补光灯x3</Select.Option>
              <Select.Option value="背景板">背景板</Select.Option>
              <Select.Option value="麦克风">麦克风</Select.Option>
              <Select.Option value="无人机">无人机</Select.Option>
              <Select.Option value="稳定器">稳定器</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingSchedule ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
