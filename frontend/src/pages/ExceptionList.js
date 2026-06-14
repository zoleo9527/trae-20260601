import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Row,
  Col,
  Statistic,
  Tag,
  Modal,
  Form,
  InputNumber,
  message
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { exceptionApi, authApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

function ExceptionList() {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exceptions, setExceptions] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    type: undefined,
    status: undefined,
    priority: undefined
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [createForm] = Form.useForm();

  useEffect(() => {
    fetchExceptions();
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const response = await exceptionApi.getList({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setExceptions(response.data.exceptions || []);
      setStats(response.data.stats || {});
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('获取异常列表失败:', error);
      message.error('获取异常列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authApi.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  const handleCreate = async () => {
    const values = await createForm.validateFields();

    try {
      await exceptionApi.create({
        ...values,
        discovered_by: user?.id,
        discovered_by_name: user?.name
      });
      message.success('异常记录创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchExceptions();
    } catch (error) {
      console.error('创建异常记录失败:', error);
      message.error('创建异常记录失败');
    }
  };

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize
    }));
  };

  const getTypeLabel = (type) => {
    const labels = {
      registration_absent: '报名后缺席',
      homework_not_submitted: '作业未提交',
      certificate_error: '证书信息错误',
      certificate_duplicate: '证书重复发放',
      certificate_missed: '证书漏发'
    };
    return labels[type] || type;
  };

  const columns = [
    { title: '异常编号', dataIndex: 'exception_number', key: 'exception_number', width: 140 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="orange">{getTypeLabel(type)}</Tag>
      )
    },
    { title: '培训项目', dataIndex: 'project_name', key: 'project_name', ellipsis: true },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => <StatusBadge type="priority" status={priority} />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="exception" status={status} />
    },
    {
      title: '发现时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/exceptions/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="异常总数"
              value={stats.total || 0}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="待处理"
              value={(stats.discovered || 0) + (stats.assigned || 0)}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.processing || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolved || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="异常处理"
        extra={
          permissions.exceptions?.includes('assign') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              报告异常
            </Button>
          )
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="异常类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              options={[
                { value: 'registration_absent', label: '报名后缺席' },
                { value: 'homework_not_submitted', label: '作业未提交' },
                { value: 'certificate_error', label: '证书信息错误' },
                { value: 'certificate_duplicate', label: '证书重复发放' },
                { value: 'certificate_missed', label: '证书漏发' }
              ]}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'discovered', label: '待处理' },
                { value: 'assigned', label: '已分配' },
                { value: 'processing', label: '处理中' },
                { value: 'resolved', label: '已解决' },
                { value: 'closed', label: '已关闭' }
              ]}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="优先级"
              allowClear
              style={{ width: '100%' }}
              value={filters.priority}
              onChange={(value) => setFilters({ ...filters, priority: value })}
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' }
              ]}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={exceptions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="报告异常"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        okText="提交"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="type"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select
              options={[
                { value: 'registration_absent', label: '报名后缺席' },
                { value: 'homework_not_submitted', label: '作业未提交' },
                { value: 'certificate_error', label: '证书信息错误' },
                { value: 'certificate_duplicate', label: '证书重复发放' },
                { value: 'certificate_missed', label: '证书漏发' }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="project_id"
            label="培训项目ID"
            rules={[{ required: true, message: '请输入培训项目ID' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="project_name"
            label="培训项目名称"
            rules={[{ required: true, message: '请输入培训项目名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="异常描述"
            rules={[{ required: true, message: '请输入异常描述' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' }
              ]}
            />
          </Form.Item>
          <Form.Item name="assigned_to" label="分配给">
            <Select
              allowClear
              options={users
                .filter(u => u.role !== 'training_manager')
                .map(u => ({
                  value: u.id,
                  label: `${u.name} (${u.role === 'department_head' ? '部门负责人' : '讲师'})`
                }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ExceptionList;
