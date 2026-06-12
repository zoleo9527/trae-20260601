import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Input,
  Select,
  Form,
  Row,
  Col,
  Modal,
  message,
  Space,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { projectsApi } from '@/services/api';
import {
  Project,
  statusDisplay,
  roleNames,
} from '@/types';

const ProjectList = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();

  const fetchProjects = async (page = 1, pageSize = 10, values?: any) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...values,
      };
      const res = await projectsApi.list(params);
      setProjects(res.items);
      setPagination({ ...pagination, current: page, pageSize, total: res.total });
    } catch (error) {
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearch = (values: any) => {
    fetchProjects(1, pagination.pageSize, values);
  };

  const handleReset = () => {
    form.resetFields();
    fetchProjects(1, pagination.pageSize);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await projectsApi.create(values);
      message.success('创建项目成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('创建项目失败');
    }
  };

  const isPossiblyBlocked = (status: string) => {
    return [
      'arrangement_rejected',
      'arrangement_submitted',
      'arrangement_reviewing',
      'expert_signin_pending',
      'expert_signin_in_progress',
      'finance_pending',
    ].includes(status);
  };

  const columns = [
    {
      title: '项目编号',
      dataIndex: 'projectNo',
      key: 'projectNo',
      width: 140,
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div>
          <div>{text}</div>
          {isPossiblyBlocked(record.status) && (
            <Tag color="orange" icon={<WarningOutlined />} style={{ marginTop: 4 }}>
              需关注
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const sd = statusDisplay[status as keyof typeof statusDisplay];
        return <Tag color={sd?.color || 'default'}>{sd?.label || status}</Tag>;
      },
    },
    {
      title: '当前处理人',
      key: 'currentHandler',
      width: 160,
      render: (_: any, record: Project) => {
        if (record.currentHandlerName && record.currentHandlerRole) {
          return (
            <div>
              <div>{record.currentHandlerName}</div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {roleNames[record.currentHandlerRole]}
              </div>
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: '项目专员',
      dataIndex: 'projectSpecialistName',
      key: 'projectSpecialistName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const roleOptions = Object.entries(roleNames).map(([value, label]) => ({
    value,
    label,
  }));

  const statusOptions = Object.entries(statusDisplay).map(([value, obj]) => ({
    value,
    label: obj.label,
  }));

  return (
    <div>
      <Card
        title="项目管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建项目
          </Button>
        }
      >
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={8} md={6}>
              <Form.Item name="keyword" style={{ marginBottom: 0 }}>
                <Input placeholder="项目编号/名称" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Form.Item name="status" style={{ marginBottom: 0 }}>
                <Select placeholder="项目状态" allowClear options={statusOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Form.Item name="handlerRole" style={{ marginBottom: 0 }}>
                <Select placeholder="处理角色" allowClear options={roleOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={projects}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => fetchProjects(page, pageSize, form.getFieldsValue()),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="新建项目"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="projectNo"
            label="项目编号"
            rules={[{ required: true, message: '请输入项目编号' }]}
          >
            <Input placeholder="请输入项目编号" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectList;
