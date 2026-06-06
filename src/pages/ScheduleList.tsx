import { useState } from 'react';
import { Table, Button, Tag, Space, Select, Input, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { ScheduleStatus } from '@/types';

const { Search } = Input;

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

const ScheduleList = () => {
  const navigate = useNavigate();
  const schedules = useStore((state) => state.schedules);
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | undefined>();
  const [searchText, setSearchText] = useState('');

  const filteredSchedules = schedules.filter((s) => {
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchSearch =
      !searchText ||
      s.title.toLowerCase().includes(searchText.toLowerCase()) ||
      s.anchorName.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: schedules.length,
    pending: schedules.filter((s) => s.status === 'PENDING_REVIEW').length,
    live: schedules.filter((s) => s.status === 'LIVE').length,
    returned: schedules.filter((s) => s.status === 'RETURNED').length,
    completed: schedules.filter((s) => s.status === 'COMPLETED').length,
  };

  const columns = [
    {
      title: '排期标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/schedules/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '主播',
      dataIndex: 'anchorName',
      key: 'anchorName',
      width: 120,
    },
    {
      title: '主播助理',
      dataIndex: 'assistantName',
      key: 'assistantName',
      width: 120,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
    },
    {
      title: '直播时间',
      key: 'time',
      width: 220,
      render: (_: any, record: any) => (
        <div>
          <div>{dayjs(record.startTime).format('YYYY-MM-DD HH:mm')}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            时长: {record.estimatedDuration}分钟
          </div>
        </div>
      ),
    },
    {
      title: '选品数量',
      key: 'productCount',
      width: 100,
      render: (_: any, record: any) => record.products.filter((p: any) => p.isSelected).length,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ScheduleStatus) => {
        const cfg = statusMap[status];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '版本',
      dataIndex: 'currentVersion',
      key: 'currentVersion',
      width: 80,
      render: (v: number) => `v${v}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/schedules/${record.id}`)}
          >
            详情
          </Button>
          {['DRAFT', 'RETURNED'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/schedules/${record.id}/edit`)}
            >
              编辑
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic title="总排期数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待复核" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="直播中" value={stats.live} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已退回" value={stats.returned} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="直播排期列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/schedules/new')}>
              新建排期
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="搜索排期标题或主播"
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(statusMap).map(([key, val]) => ({
              value: key,
              label: val.text,
            }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredSchedules}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default ScheduleList;
