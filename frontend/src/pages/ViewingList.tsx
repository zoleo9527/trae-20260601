import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Button, Space, Spin, Empty } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { viewingAPI } from '../services/api';
import { ViewingRecord, viewingStatusNames, interestLevelNames } from '../types';

const statusOptions = Object.entries(viewingStatusNames).map(([value, label]) => ({
  value,
  label,
}));

const ViewingList = () => {
  const navigate = useNavigate();
  const [viewings, setViewings] = useState<ViewingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fetchViewings = async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (status) params.status = status;
      const response = await viewingAPI.list(params);
      setViewings(response.data);
    } catch (error) {
      console.error('Failed to fetch viewings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewings();
  }, [status]);

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: 140,
    },
    {
      title: '公司',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: '预约时间',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '顾问',
      dataIndex: 'consultantName',
      key: 'consultantName',
      width: 100,
    },
    {
      title: '兴趣程度',
      dataIndex: 'interestLevel',
      key: 'interestLevel',
      width: 100,
      render: (level: string) => {
        const colorMap: Record<string, string> = { high: 'red', medium: 'orange', low: 'default' };
        return <Tag color={colorMap[level] || 'default'}>{interestLevelNames[level] || level}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const colorMap: Record<string, string> = {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
          no_show: 'default',
        };
        return <Tag color={colorMap[s] || 'default'}>{viewingStatusNames[s] || s}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: ViewingRecord) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/viewings/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">看房记录</h1>
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
        <Button icon={<ReloadOutlined />} onClick={() => { setStatus(''); fetchViewings(); }}>
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
            dataSource={viewings}
            rowKey="id"
            locale={{ emptyText: <Empty description="暂无看房记录" /> }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          />
        </div>
      )}
    </div>
  );
};

export default ViewingList;
