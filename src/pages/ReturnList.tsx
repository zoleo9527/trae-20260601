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
  DatePicker,
  Segmented,
  Card,
  Statistic,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  ExclamationCircleOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ReturnRecord, RETURN_STATUS_LABELS } from '@shared/types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

type QuickTab = 'all' | 'pending' | 'waiting_customer' | 'disputed' | 'settled';
type DateQuickKey = 'today' | 'week' | 'month' | 'custom' | 'all';

const ReturnList: React.FC = () => {
  const { message: msg } = AntdApp.useApp();
  const navigate = useNavigate();
  const [list, setList] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [quickTab, setQuickTab] = useState<QuickTab>('all');
  const [dateQuickKey, setDateQuickKey] = useState<DateQuickKey>('all');
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [waitingCustomerCount, setWaitingCustomerCount] = useState(0);
  const [disputedCount, setDisputedCount] = useState(0);
  const [settledCount, setSettledCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadData();
  }, [quickTab, searchText, dateQuickKey, customDateRange]);

  const loadStats = async () => {
    const all = await api.getReturnRecords();
    setPendingCount(all.filter((r) => r.status === 'pending').length);
    setWaitingCustomerCount(
      all.filter((r) => r.status === 'confirmed' || r.status === 'disputed').length
    );
    setDisputedCount(all.filter((r) => r.status === 'disputed').length);
    setSettledCount(all.filter((r) => r.status === 'settled').length);
  };

  const getDateRange = (): { from?: string; to?: string } => {
    const today = dayjs();
    switch (dateQuickKey) {
      case 'today':
        return {
          from: today.startOf('day').toISOString(),
          to: today.endOf('day').toISOString(),
        };
      case 'week':
        return {
          from: today.startOf('week').toISOString(),
          to: today.endOf('week').toISOString(),
        };
      case 'month':
        return {
          from: today.startOf('month').toISOString(),
          to: today.endOf('month').toISOString(),
        };
      case 'custom':
        if (customDateRange && customDateRange[0] && customDateRange[1]) {
          return {
            from: customDateRange[0].startOf('day').toISOString(),
            to: customDateRange[1].endOf('day').toISOString(),
          };
        }
        return {};
      default:
        return {};
    }
  };

  const getStatusFilter = (): { status?: string; statuses?: string[] } => {
    switch (quickTab) {
      case 'pending':
        return { status: 'pending' };
      case 'waiting_customer':
        return { statuses: ['confirmed', 'disputed'] };
      case 'disputed':
        return { status: 'disputed' };
      case 'settled':
        return { status: 'settled' };
      default:
        return {};
    }
  };

  const loadData = async () => {
    setLoading(true);
    const dateRange = getDateRange();
    const statusFilter = getStatusFilter();
    const data = await api.getReturnRecords({
      ...statusFilter,
      search: searchText || undefined,
      returnDateFrom: dateRange.from,
      returnDateTo: dateRange.to,
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
      loadStats();
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

  const renderAmountColumn = (record: ReturnRecord) => {
    if (record.depositRefund > 0) {
      return (
        <span style={{ color: '#52c41a' }}>
          <ArrowDownOutlined /> ¥{record.depositRefund.toFixed(2)}
        </span>
      );
    }
    if (record.additionalPayment > 0) {
      return (
        <span style={{ color: '#ff4d4f' }}>
          <ArrowUpOutlined /> ¥{record.additionalPayment.toFixed(2)}
        </span>
      );
    }
    return <span style={{ color: '#8c8c8c' }}>两清</span>;
  };

  const tabOptions = [
    { label: '全部', value: 'all' },
    { label: `待确认 ${pendingCount > 0 ? `(${pendingCount})` : ''}`, value: 'pending' },
    {
      label: `待客户处理 ${waitingCustomerCount > 0 ? `(${waitingCustomerCount})` : ''}`,
      value: 'waiting_customer',
    },
    { label: `有异议 ${disputedCount > 0 ? `(${disputedCount})` : ''}`, value: 'disputed' },
    { label: `已结算 ${settledCount > 0 ? `(${settledCount})` : ''}`, value: 'settled' },
  ];

  const dateQuickOptions = [
    { label: '全部', value: 'all' },
    { label: '今日', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '自定义', value: 'custom' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small" onClick={() => setQuickTab('pending')} style={{ cursor: 'pointer', borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="待确认"
              value={pendingCount}
              valueStyle={{ color: '#faad14' }}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" onClick={() => setQuickTab('waiting_customer')} style={{ cursor: 'pointer', borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="待客户处理"
              value={waitingCustomerCount}
              valueStyle={{ color: '#1890ff' }}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" onClick={() => setQuickTab('disputed')} style={{ cursor: 'pointer', borderLeft: '4px solid #ff4d4f' }}>
            <Statistic
              title="有异议"
              value={disputedCount}
              valueStyle={{ color: '#ff4d4f' }}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" onClick={() => setQuickTab('settled')} style={{ cursor: 'pointer', borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="已结算"
              value={settledCount}
              valueStyle={{ color: '#52c41a' }}
              suffix="单"
            />
          </Card>
        </Col>
      </Row>

      <div className="page-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Segmented
              options={tabOptions}
              value={quickTab}
              onChange={(v) => setQuickTab(v as QuickTab)}
              size="middle"
            />
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/return/new')}>
                新增回场验收
              </Button>
            </Space>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space size={8} wrap>
              <span style={{ color: '#888', fontSize: 13 }}>回场时间:</span>
              <Segmented
                options={dateQuickOptions}
                value={dateQuickKey}
                onChange={(v) => setDateQuickKey(v as DateQuickKey)}
                size="small"
              />
              {dateQuickKey === 'custom' && (
                <RangePicker
                  size="small"
                  value={customDateRange}
                  onChange={(dates) => setCustomDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
                />
              )}
            </Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索合同号/客户/设备"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Table
            dataSource={list}
            rowKey="id"
            loading={loading}
            size="middle"
            columns={[
              { title: 'ID', dataIndex: 'id', width: 60 },
              { title: '合同编号', dataIndex: 'contractNo', width: 160, fixed: 'left' },
              { title: '客户名称', dataIndex: 'customerName', width: 180 },
              { title: '租赁设备', dataIndex: 'equipmentName', width: 160 },
              {
                title: '回场时间',
                dataIndex: 'returnTime',
                width: 160,
                sorter: (a, b) => dayjs(a.returnTime).valueOf() - dayjs(b.returnTime).valueOf(),
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
                title: '应收金额',
                dataIndex: 'totalRent',
                width: 110,
                align: 'right',
                render: (v, r) => `¥${((v || 0) + (r.extraDaysCost || 0) + (r.totalDeductions || 0)).toFixed(2)}`,
              },
              {
                title: '押金',
                dataIndex: 'deposit',
                width: 100,
                align: 'right',
                render: (v) => `¥${(v || 0).toLocaleString()}`,
              },
              {
                title: '应退/补交',
                dataIndex: 'depositRefund',
                width: 130,
                align: 'right',
                render: (_, r) => renderAmountColumn(r),
              },
              {
                title: '状态',
                dataIndex: 'status',
                width: 110,
                render: (v: keyof typeof RETURN_STATUS_LABELS) => (
                  <Space size={4}>
                    <Tag color={statusColor(v)}>{RETURN_STATUS_LABELS[v]}</Tag>
                    {v === 'disputed' && (
                      <Tooltip title="客户有异议，需跟进处理">
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                      </Tooltip>
                    )}
                  </Space>
                ),
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
            scroll={{ x: 1700 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReturnList;
