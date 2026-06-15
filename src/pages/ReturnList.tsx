import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  App as AntdApp,
  Input,
  Select,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ReturnRecord, RETURN_STATUS_LABELS } from '@shared/types';
import dayjs from 'dayjs';

const { Option } = Select;

const ReturnList: React.FC = () => {
  const { message: msg } = AntdApp.useApp();
  const navigate = useNavigate();
  const [list, setList] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => {
    loadData();
  }, [statusFilter, searchText]);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getReturnRecords({
      status: statusFilter,
      search: searchText || undefined,
    });
    setList(data);
    setLoading(false);
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'gold',
      confirmed: 'blue',
      customer_confirmed: 'cyan',
      disputed: 'red',
      settled: 'green',
    };
    return map[status] || 'default';
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReturnRecord(id);
      msg.success('删除成功');
      loadData();
    } catch (e: any) {
      msg.error('删除失败');
    }
  };

  const handleExport = async (record: ReturnRecord) => {
    const dir = await api.selectDirectory();
    if (!dir) return;
    const result = await api.exportSettlement(record.id, dir);
    if (result) {
      msg.success(`结算单已导出: ${result}`);
    } else {
      msg.error('导出失败');
    }
  };

  return (
    <div className="page-card">
      <div className="page-title">
        <span>回场结算管理</span>
        <Space>
          <Select
            placeholder="结算状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="pending">待确认</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="customer_confirmed">客户已确认</Option>
            <Option value="disputed">有异议</Option>
            <Option value="settled">已结算</Option>
          </Select>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索合同号/客户/设备"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/return/new')}>
            新增回场验收
          </Button>
        </Space>
      </div>

      <Table
        dataSource={list}
        rowKey="id"
        loading={loading}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          { title: '合同编号', dataIndex: 'contractNo', width: 160, fixed: 'left' },
          { title: '客户名称', dataIndex: 'customerName', width: 180 },
          { title: '租赁设备', dataIndex: 'equipmentName', width: 160 },
          {
            title: '回场时间',
            dataIndex: 'returnTime',
            width: 160,
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
          },
          {
            title: '租期(天)',
            dataIndex: 'rentDays',
            width: 80,
            align: 'center',
            render: (v, r) => (
              <div>
                <div>{v}</div>
                {r.extraDays > 0 && <div style={{ color: '#faad14', fontSize: 12 }}>超{r.extraDays}天</div>}
              </div>
            ),
          },
          {
            title: '油差补偿',
            dataIndex: 'fuelCompensation',
            width: 100,
            align: 'right',
            render: (v) => `¥${(v || 0).toFixed(2)}`,
          },
          {
            title: '超时费用',
            dataIndex: 'overHoursCost',
            width: 100,
            align: 'right',
            render: (v) => `¥${(v || 0).toFixed(2)}`,
          },
          {
            title: '损耗扣费',
            dataIndex: 'totalDamageDeductible',
            width: 100,
            align: 'right',
            render: (v) => (v > 0 ? <span style={{ color: '#ff4d4f' }}>¥{v.toFixed(2)}</span> : '-'),
          },
          {
            title: '押金',
            dataIndex: 'deposit',
            width: 100,
            align: 'right',
            render: (v) => `¥${(v || 0).toLocaleString()}`,
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (v: keyof typeof RETURN_STATUS_LABELS) => <Tag color={statusColor(v)}>{RETURN_STATUS_LABELS[v]}</Tag>,
          },
          {
            title: '操作',
            width: 220,
            fixed: 'right',
            render: (_, r) => (
              <Space size={4}>
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/return/${r.id}`)}>
                  详情
                </Button>
                {r.status !== 'settled' && (
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/return/${r.id}/edit`)}>
                    编辑
                  </Button>
                )}
                <Button type="link" size="small" icon={<FileExcelOutlined />} onClick={() => handleExport(r)}>
                  导出
                </Button>
                <Popconfirm title="确定删除此回场记录？将恢复合同状态" onConfirm={() => handleDelete(r.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        scroll={{ x: 1600 }}
      />
    </div>
  );
};

export default ReturnList;
