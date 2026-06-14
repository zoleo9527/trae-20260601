import { useEffect, useState } from 'react';
import { Table, Tag, DatePicker, Select, Button, Card, Space, Input, message } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { carApi } from '../api';
import { AuthTokenPayload, OperationLog, CarStatus, CAR_STATUS_LABEL, OPERATION_LABEL, ROLE_LABEL, OperationType, UserRole, User } from '../types';
import dayjs from 'dayjs';

const STATUS_COLOR: Record<CarStatus, string> = {
  draft: 'default',
  manager_pending: 'blue',
  appraiser_pending: 'cyan',
  finance_pending: 'magenta',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default'
};

const ROLE_CLASS: Record<UserRole, string> = {
  admin: 'role-admin',
  manager: 'role-manager',
  appraiser: 'role-appraiser',
  finance: 'role-finance'
};

export default function LogList() {
  const [data, setData] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | undefined>();
  const [operationType, setOperationType] = useState<OperationType | undefined>();
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const m = await carApi.meta();
        setMeta(m);
        setUsers(m.users || []);
      } catch {}
      load();
    })();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await carApi.logs({
        operatorId,
        operationType,
        from: dateRange?.[0]?.startOf('day').toISOString(),
        to: dateRange?.[1]?.endOf('day').toISOString()
      });
      let filtered = list;
      if (keyword.trim()) {
        const k = keyword.toLowerCase();
        filtered = list.filter(l =>
          l.operatorName.toLowerCase().includes(k) ||
          OPERATION_LABEL[l.operationType].toLowerCase().includes(k) ||
          (l.remark || '').toLowerCase().includes(k) ||
          (l.toStatus && CAR_STATUS_LABEL[l.toStatus].toLowerCase().includes(k))
        );
      }
      setData(filtered);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      setExportLoading(true);
      await carApi.downloadLogs({
        from: dateRange?.[0]?.startOf('day').toISOString(),
        to: dateRange?.[1]?.endOf('day').toISOString()
      });
      message.success('日志已导出');
    } catch (e: any) {
      message.error(e.message || '导出失败');
    } finally {
      setExportLoading(false);
    }
  }

  const columns = [
    { title: '时间', dataIndex: 'createdAt', width: 170, render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: '操作人', dataIndex: 'operatorName', width: 140, render: (n: string, r: OperationLog) => (
      <span>{n}<span className={`role-badge ${ROLE_CLASS[r.operatorRole]}`}>{ROLE_LABEL[r.operatorRole]}</span></span>
    )},
    { title: '操作类型', dataIndex: 'operationType', width: 160, render: (t: OperationType) => OPERATION_LABEL[t] },
    { title: '状态流转', width: 220, render: (_: any, r: OperationLog) => (
      <Space>
        {r.fromStatus && <Tag color={STATUS_COLOR[r.fromStatus]}>{CAR_STATUS_LABEL[r.fromStatus]}</Tag>}
        {r.fromStatus && <span style={{ color: '#999' }}>→</span>}
        <Tag color={STATUS_COLOR[r.toStatus]}>{CAR_STATUS_LABEL[r.toStatus]}</Tag>
      </Space>
    )},
    { title: '关联价格', dataIndex: 'price', width: 120, render: (p: number | undefined) => p != null ? <span className="price-tag">¥{p.toLocaleString()}</span> : '-' },
    { title: '备注', dataIndex: 'remark', render: (t: string) => t || <span style={{ color: '#ccc' }}>-</span> }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <DatePicker.RangePicker onChange={setDateRange} />
          <Select
            placeholder="按操作人筛选"
            allowClear
            style={{ width: 160 }}
            value={operatorId}
            onChange={setOperatorId}
            options={users.map(u => ({ value: u.id, label: `${u.name}（${ROLE_LABEL[u.role]}）` }))}
          />
          <Select
            placeholder="按操作类型筛选"
            allowClear
            style={{ width: 180 }}
            value={operationType}
            onChange={setOperationType}
            options={Object.entries(OPERATION_LABEL).map(([v, l]) => ({ value: v as OperationType, label: l }))}
          />
          <Input prefix={<SearchOutlined />} placeholder="搜索备注/操作人" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220 }} allowClear />
          <Button type="primary" onClick={load}>查询</Button>
          <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={handleExport}>导出 CSV</Button>
        </Space>
      </Card>
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条记录` }}
        />
      </Card>
    </div>
  );
}
