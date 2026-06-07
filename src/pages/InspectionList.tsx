
import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Select, message, Alert, Tooltip } from 'antd';
import { Plus, Eye, AlertTriangle, RotateCcw, User, ClipboardList, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inspectionApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { InspectionRectification } from '../../shared/types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export default function InspectionList() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InspectionRectification[]>([]);
  const [filteredData, setFilteredData] = useState<InspectionRectification[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const canCreate = user?.role === 'supervisor';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [data, statusFilter, searchText]);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await inspectionApi.getAll();
      setData(list);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...data];
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchText) {
      const text = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(text) ||
          item.storeName.toLowerCase().includes(text)
      );
    }
    setFilteredData(result);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待整改' },
      processing: { color: 'blue', text: '整改中' },
      reviewing: { color: 'purple', text: '待审核' },
      completed: { color: 'green', text: '已完成' },
      rejected: { color: 'red', text: '已退回' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    {
      title: '问题标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: InspectionRectification) => (
        <div className="font-medium text-gray-800">
          {record.status === 'rejected' && (
            <Tooltip title="已被退回，请重新整改">
              <RotateCcw size={16} className="inline mr-2 text-red-500 animate-spin-slow" />
            </Tooltip>
          )}
          {record.rejectCount > 0 && record.status !== 'rejected' && (
            <Tooltip title={`历史退回 ${record.rejectCount} 次`}>
              <AlertTriangle size={16} className="inline mr-2 text-orange-500" />
            </Tooltip>
          )}
          {text}
        </div>
      ),
    },
    {
      title: '关联促销',
      dataIndex: 'promotionTitle',
      key: 'promotionTitle',
      width: 180,
      render: (title: string, record: InspectionRectification) =>
        title ? (
          <Tooltip title="点击查看关联的促销陈列">
            <Tag 
              color="blue" 
              className="cursor-pointer hover:opacity-80"
              onClick={(e) => { e.stopPropagation(); navigate(`/promotion/${record.promotionId}`); }}
            >
              {title}
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-gray-400">无</span>
        ),
    },
    {
      title: '责任方',
      key: 'responsibility',
      width: 180,
      render: (_: any, record: InspectionRectification) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <ClipboardList size={12} className="text-orange-600 mr-1" />
            <span className="text-gray-600">督导：</span>
            <span className="font-medium text-gray-800 ml-1">{record.supervisorName}</span>
          </div>
          <div className="flex items-center text-sm">
            <Store size={12} className="text-green-600 mr-1" />
            <span className="text-gray-600">整改门店：</span>
            <span className="font-medium text-gray-800 ml-1">{record.storeName}</span>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '退回次数',
      dataIndex: 'rejectCount',
      key: 'rejectCount',
      width: 100,
      render: (count: number, record: InspectionRectification) =>
        count > 0 ? (
          <Tag color={count >= 2 ? 'red' : 'orange'} icon={<AlertTriangle size={12} />}>
            {count} 次
            {count >= 2 && <span className="ml-1">（高风险）</span>}
          </Tag>
        ) : (
          <span className="text-gray-400">0</span>
        ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date: string, record: InspectionRectification) => {
        const isOverdue = dayjs().isAfter(dayjs(date)) && record.status !== 'completed';
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {dayjs(date).format('YYYY-MM-DD')}
            {isOverdue && <span className="ml-1 text-xs">（已逾期）</span>}
          </span>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: InspectionRectification) => (
        <Space>
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => navigate(`/inspection/${record.id}`)}>
            查看
          </Button>
          {user?.role === 'store_manager' && (record.status === 'pending' || record.status === 'rejected' || record.status === 'processing') && (
            <Button type="primary" size="small" onClick={() => navigate(`/inspection/${record.id}`)}>
              整改
            </Button>
          )}
          {user?.role === 'supervisor' && record.status === 'reviewing' && (
            <Button type="primary" size="small" onClick={() => navigate(`/inspection/${record.id}`)}>
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const rejectedCount = data.filter((i) => i.status === 'rejected').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">巡店整改管理</h1>
        {canCreate && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/inspection/create')}>
            发起巡店整改
          </Button>
        )}
      </div>

      {rejectedCount > 0 && (
        <Alert
          message={`有 ${rejectedCount} 条整改已被退回，请及时处理`}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <Space wrap>
          <Search
            placeholder="搜索问题标题或门店"
            allowClear
            style={{ width: 260 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setStatusFilter}
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待整改</Option>
            <Option value="processing">整改中</Option>
            <Option value="reviewing">待审核</Option>
            <Option value="rejected">已退回</Option>
            <Option value="completed">已完成</Option>
          </Select>
        </Space>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => (record.status === 'rejected' ? '!bg-red-50' : '')}
        />
      </div>
    </div>
  );
}
