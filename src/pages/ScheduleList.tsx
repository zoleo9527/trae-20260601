import { Table, Tag, Button, Space, Select } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useApi } from '@/services/api';
import { statusDisplayMap } from '@/utils/stateMachine';
import type { ColumnsType } from 'antd/es/table';
import type { PrintSchedule } from '@/types';

const priorityMap = {
  normal: { text: '普通', color: 'default' },
  urgent: { text: '加急', color: 'orange' },
  emergency: { text: '特急', color: 'red' },
};

export default function ScheduleList() {
  const api = useApi();
  const schedules = api.getSchedules();

  const columns: ColumnsType<PrintSchedule> = [
    {
      title: '排产编号',
      dataIndex: 'scheduleNo',
      key: 'scheduleNo',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '尺寸',
      key: 'size',
      render: (_, record) => (
        <span>
          {record.width} × {record.height} {record.unit}
        </span>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: PrintSchedule['priority']) => (
        <Tag color={priorityMap[p].color}>{priorityMap[p].text}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={statusDisplayMap[s]?.color}>{statusDisplayMap[s]?.text}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Link to={`/schedules/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />}>
            查看
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>喷绘排产列表</h2>
        <Space>
          <Select
            placeholder="筛选状态"
            style={{ width: 150 }}
            allowClear
            options={Object.entries(statusDisplayMap).map(([key, value]) => ({
              value: key,
              label: value.text,
            }))}
          />
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={schedules}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
