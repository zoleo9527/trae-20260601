import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Button, Spin, Empty } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { handoverAPI } from '../services/api';
import { HandoverForm, HandoverStatus } from '../types';

const handoverStatusNames: Record<HandoverStatus, string> = {
  pending: '待交接',
  in_progress: '交接中',
  completed: '已完成',
  disputed: '有争议',
};

const handoverStatusColors: Record<HandoverStatus, string> = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  disputed: 'red',
};

const statusOptions = Object.entries(handoverStatusNames).map(([value, label]) => ({
  value,
  label,
}));

const typeOptions = [
  { value: 'move_in', label: '入住交接' },
  { value: 'move_out', label: '退租交接' },
];

const HandoverList = () => {
  const navigate = useNavigate();
  const [handovers, setHandovers] = useState<HandoverForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');

  const fetchHandovers = async () => {
    setLoading(true);
    try {
      const params: { status?: string; type?: string } = {};
      if (status) params.status = status;
      if (type) params.type = type;
      const response = await handoverAPI.list(params);
      setHandovers(response.data);
    } catch (error) {
      console.error('Failed to fetch handovers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, [status, type]);

  const columns = [
    {
      title: '交接单号',
      dataIndex: 'handoverNo',
      key: 'handoverNo',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'move_in' ? 'blue' : 'orange'}>
          {type === 'move_in' ? '入住交接' : '退租交接'}
        </Tag>
      ),
    },
    {
      title: '客户姓名',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 120,
    },
    {
      title: '交接日期',
      dataIndex: 'handoverDate',
      key: 'handoverDate',
      width: 180,
      render: (text: string) => new Date(text).toLocaleDateString('zh-CN'),
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'statusDisplay',
      key: 'status',
      width: 110,
      render: (display: { label: string; color: string } | undefined, record: HandoverForm) => (
        <Tag color={display?.color || handoverStatusColors[record.status]}>
          {display?.label || handoverStatusNames[record.status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: HandoverForm) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/handover/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">物业交接</h1>
      </div>

      <div className="filter-bar">
        <Select
          placeholder="选择状态"
          value={status || undefined}
          onChange={setStatus}
          allowClear
          style={{ width: 150 }}
          options={statusOptions}
        />
        <Select
          placeholder="选择类型"
          value={type || undefined}
          onChange={setType}
          allowClear
          style={{ width: 150 }}
          options={typeOptions}
        />
        <Button icon={<ReloadOutlined />} onClick={() => { setStatus(''); setType(''); fetchHandovers(); }}>
          重置
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={handovers}
            rowKey="id"
            locale={{ emptyText: <Empty description="暂无交接单" /> }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          />
        </div>
      )}
    </div>
  );
};

export default HandoverList;
