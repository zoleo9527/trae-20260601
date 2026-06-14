import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  DatePicker,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Badge
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trainingApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

function TrainingList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    status: undefined,
    type: undefined,
    format: undefined,
    search: ''
  });

  useEffect(() => {
    fetchProjects();
  }, [pagination.page, filters]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await trainingApi.getProjects({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setProjects(response.data.projects || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('获取培训项目列表失败:', error);
      message.error('获取培训项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProjects();
  };

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize
    }));
  };

  const columns = [
    {
      title: '培训项目',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/training/${record.id}`)}>
          {text}
        </a>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'required' ? 'blue' : 'green'}>
          {type === 'required' ? '必修' : '选修'}
        </Tag>
      )
    },
    {
      title: '形式',
      dataIndex: 'format',
      key: 'format',
      render: (format) => {
        const formatMap = { online: '线上', offline: '线下', hybrid: '混合' };
        return formatMap[format] || format;
      }
    },
    {
      title: '培训时间',
      key: 'date',
      render: (_, record) => (
        <span>
          {dayjs(record.start_date).format('YYYY-MM-DD')} 至 {dayjs(record.end_date).format('YYYY-MM-DD')}
        </span>
      )
    },
    {
      title: '讲师',
      dataIndex: 'instructor_name',
      key: 'instructor_name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge type="training" status={status} />
    },
    {
      title: '报名/参训',
      key: 'registration',
      render: (_, record) => {
        const regStats = record.registration_stats || {};
        return (
          <span>
            {regStats.attended || 0}/{regStats.total || 0}
          </span>
        );
      }
    },
    {
      title: '证书',
      key: 'certificate',
      render: (_, record) => {
        const certStats = record.certificate_stats || {};
        return (
          <span>
            已发放: {certStats.issued || 0} / 待处理: {certStats.pending || 0}
          </span>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/training/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="培训项目管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            新建培训
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索培训项目..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="培训状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'planning', label: '规划中' },
                { value: 'registration', label: '报名中' },
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' }
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="培训类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              options={[
                { value: 'required', label: '必修' },
                { value: 'elective', label: '选修' }
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="培训形式"
              allowClear
              style={{ width: '100%' }}
              value={filters.format}
              onChange={(value) => setFilters({ ...filters, format: value })}
              options={[
                { value: 'online', label: '线上' },
                { value: 'offline', label: '线下' },
                { value: 'hybrid', label: '混合' }
              ]}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={projects}
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
    </div>
  );
}

export default TrainingList;
