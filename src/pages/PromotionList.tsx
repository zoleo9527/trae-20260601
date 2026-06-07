
import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Select, message, Tooltip } from 'antd';
import { Plus, Eye, AlertCircle, User, ShoppingBag, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { promotionApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { PromotionDisplay } from '../../shared/types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export default function PromotionList() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PromotionDisplay[]>([]);
  const [filteredData, setFilteredData] = useState<PromotionDisplay[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const canCreate = user?.role === 'product_specialist';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [data, statusFilter, searchText]);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await promotionApi.getAll();
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
      pending: { color: 'orange', text: '待处理' },
      processing: { color: 'blue', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      has_issue: { color: 'red', text: '有问题' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: PromotionDisplay) => (
        <div className="font-medium text-gray-800">
          {record.status === 'has_issue' && (
            <Tooltip title="存在问题">
              <AlertCircle size={16} className="inline mr-2 text-red-500" />
            </Tooltip>
          )}
          {record.inspectionCount > 0 && record.status !== 'has_issue' && (
            <Tooltip title={`关联 ${record.inspectionCount} 条巡店整改`}>
              <AlertCircle size={16} className="inline mr-2 text-orange-500" />
            </Tooltip>
          )}
          {text}
        </div>
      ),
    },
    {
      title: '责任方',
      key: 'responsibility',
      width: 180,
      render: (_: any, record: PromotionDisplay) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <ShoppingBag size={12} className="text-green-600 mr-1" />
            <span className="text-gray-600">商品专员：</span>
            <span className="font-medium text-gray-800 ml-1">{record.productSpecialistName}</span>
          </div>
          <div className="flex items-center text-sm">
            <Store size={12} className="text-blue-600 mr-1" />
            <span className="text-gray-600">执行门店：</span>
            <span className="font-medium text-gray-800 ml-1">{record.storeName}</span>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '关联整改',
      dataIndex: 'inspectionCount',
      key: 'inspectionCount',
      width: 100,
      render: (count: number, record: PromotionDisplay) =>
        count > 0 ? (
          <Tooltip title="点击查看关联的巡店整改">
            <Tag 
              color="red" 
              className="cursor-pointer hover:opacity-80"
              onClick={(e) => { e.stopPropagation(); navigate('/inspection'); }}
            >
              {count} 条
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-gray-400">无</span>
        ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date: string) => {
        const isOverdue = dayjs().isAfter(dayjs(date));
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
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: PromotionDisplay) => (
        <Space>
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => navigate(`/promotion/${record.id}`)}>
            查看详情
          </Button>
          {user?.role === 'store_manager' && (record.status === 'pending' || record.status === 'processing') && (
            <Button type="primary" size="small" onClick={() => navigate(`/promotion/${record.id}`)}>
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">促销陈列管理</h1>
        {canCreate && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/promotion/create')}>
            新建促销陈列
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <Space wrap>
          <Search
            placeholder="搜索标题或门店"
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
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="completed">已完成</Option>
            <Option value="has_issue">有问题</Option>
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
        />
      </div>
    </div>
  );
}
