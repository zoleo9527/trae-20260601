import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Button, Spin, Empty } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { depositAPI } from '../services/api';
import { DepositRecord, DepositStatus, depositTypeNames } from '../types';

const depositStatusNames: Record<DepositStatus, string> = {
  unpaid: '未支付',
  paid: '已支付',
  refunding: '退款中',
  refunded: '已退还',
  deducted: '已扣除',
  disputed: '有争议',
};

const depositStatusColors: Record<DepositStatus, string> = {
  unpaid: 'orange',
  paid: 'green',
  refunding: 'blue',
  refunded: 'green',
  deducted: 'red',
  disputed: 'red',
};

const statusOptions = Object.entries(depositStatusNames).map(([value, label]) => ({
  value,
  label,
}));

const typeOptions = [
  { value: 'rent_deposit', label: '房租押金' },
  { value: 'utility_deposit', label: '水电押金' },
  { value: 'other', label: '其他押金' },
];

const DepositList = () => {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const params: { status?: string; type?: string } = {};
      if (status) params.status = status;
      if (type) params.type = type;
      const response = await depositAPI.list(params);
      setDeposits(response.data);
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [status, type]);

  const columns = [
    {
      title: '押金单号',
      dataIndex: 'depositNo',
      key: 'depositNo',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => depositTypeNames[type] || type,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#f5222d' }}>¥{amount.toLocaleString()}</span>
      ),
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
      render: (display: { label: string; color: string } | undefined, record: DepositRecord) => (
        <Tag color={display?.color || depositStatusColors[record.status]}>
          {display?.label || depositStatusNames[record.status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: DepositRecord) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/deposits/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">押金结算</h1>
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
        <Button icon={<ReloadOutlined />} onClick={() => { setStatus(''); setType(''); fetchDeposits(); }}>
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
            dataSource={deposits}
            rowKey="id"
            locale={{ emptyText: <Empty description="暂无押金记录" /> }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          />
        </div>
      )}
    </div>
  );
};

export default DepositList;
