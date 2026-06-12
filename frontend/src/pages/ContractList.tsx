import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Button, Spin, Empty } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { contractAPI } from '../services/api';
import { Contract, ContractStatus } from '../types';

const contractStatusNames: Record<ContractStatus, string> = {
  draft: '草稿',
  under_review: '审核中',
  approved: '已批准',
  signed: '已签署',
  rejected: '已拒绝',
  terminated: '已终止',
};

const contractStatusColors: Record<ContractStatus, string> = {
  draft: 'default',
  under_review: 'blue',
  approved: 'purple',
  signed: 'green',
  rejected: 'red',
  terminated: 'default',
};

const statusOptions = Object.entries(contractStatusNames).map(([value, label]) => ({
  value,
  label,
}));

const ContractList = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (status) params.status = status;
      const response = await contractAPI.list(params);
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [status]);

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
      width: 180,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '公司',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: '租期',
      key: 'leaseTerm',
      width: 100,
      render: (_: unknown, record: Contract) => `${record.leaseTerm}个月`,
    },
    {
      title: '月租金',
      dataIndex: 'monthlyRent',
      key: 'monthlyRent',
      width: 140,
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#f5222d' }}>¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '押金',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      width: 140,
      render: (amount: number) => `¥${amount.toLocaleString()}`,
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
      render: (display: { label: string; color: string } | undefined, record: Contract) => (
        <Tag color={display?.color || contractStatusColors[record.status]}>
          {display?.label || contractStatusNames[record.status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Contract) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/contracts/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">合同管理</h1>
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
        <Button icon={<ReloadOutlined />} onClick={() => { setStatus(''); fetchContracts(); }}>
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
            dataSource={contracts}
            rowKey="id"
            locale={{ emptyText: <Empty description="暂无合同" /> }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          />
        </div>
      )}
    </div>
  );
};

export default ContractList;
