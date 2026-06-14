import { useEffect, useState } from 'react';
import { Table, Tag, DatePicker, Select, Button, Card, Space, Input, message, Tooltip } from 'antd';
import { DownloadOutlined, SearchOutlined, UserOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { carApi } from '../api';
import {
  AuthTokenPayload, OperationLogWithContext, CarStatus, CAR_STATUS_LABEL,
  OPERATION_LABEL, ROLE_LABEL, OperationType, UserRole, User, ApprovalStage, APPROVAL_STAGE_LABEL
} from '../types';
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

const HANDLER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'manager', label: '收车经理' },
  { value: 'appraiser', label: '评估师' },
  { value: 'finance', label: '金融专员' }
];

const STAGE_OPTIONS: { value: ApprovalStage; label: string }[] = [
  { value: 'manager', label: '收车经理阶段' },
  { value: 'appraiser', label: '评估师阶段' },
  { value: 'finance', label: '金融审批阶段' },
  { value: 'done', label: '已完成' },
  { value: 'terminal', label: '已终止' }
];

export default function LogList() {
  const [data, setData] = useState<OperationLogWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | undefined>();
  const [operationType, setOperationType] = useState<OperationType | undefined>();
  const [handlerRole, setHandlerRole] = useState<UserRole | undefined>();
  const [stage, setStage] = useState<ApprovalStage | undefined>();
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
        handlerRole,
        stage,
        from: dateRange?.[0]?.startOf('day').toISOString(),
        to: dateRange?.[1]?.endOf('day').toISOString()
      }) as OperationLogWithContext[];
      let filtered = list;
      if (keyword.trim()) {
        const k = keyword.toLowerCase();
        filtered = list.filter(l =>
          (l.carNo || '').toLowerCase().includes(k) ||
          l.operatorName.toLowerCase().includes(k) ||
          OPERATION_LABEL[l.operationType].toLowerCase().includes(k) ||
          (l.remark || '').toLowerCase().includes(k) ||
          (l.keyRemarksSummary || '').toLowerCase().includes(k) ||
          (l.currentHandlerName || '').toLowerCase().includes(k) ||
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
        to: dateRange?.[1]?.endOf('day').toISOString(),
        operatorId,
        operationType,
        handlerRole,
        stage
      });
      message.success('日志已导出');
    } catch (e: any) {
      message.error(e.message || '导出失败');
    } finally {
      setExportLoading(false);
    }
  }

  function renderHandler(log: OperationLogWithContext) {
    if (!log.currentHandlerName) return <span style={{ color: '#999' }}>-</span>;
    if (log.currentHandlerRole) {
      return (
        <Space size={4}>
          <UserOutlined style={{ color: '#888' }} />
          <span>{log.currentHandlerName}</span>
          <span className={`role-badge ${ROLE_CLASS[log.currentHandlerRole]}`}>{ROLE_LABEL[log.currentHandlerRole]}</span>
        </Space>
      );
    }
    return <span style={{ color: '#666' }}>{log.currentHandlerName}</span>;
  }

  const columns = [
    { title: '时间', dataIndex: 'createdAt', width: 170, render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '车源编号', dataIndex: 'carNo', width: 150, render: (v: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>{v || '-'}</Tag>
      )
    },
    { title: '操作人', dataIndex: 'operatorName', width: 150, render: (n: string, r: OperationLogWithContext) => (
      <span>{n}<span className={`role-badge ${ROLE_CLASS[r.operatorRole]}`}>{ROLE_LABEL[r.operatorRole]}</span></span>
    )},
    { title: '操作类型', dataIndex: 'operationType', width: 150, render: (t: OperationType) => OPERATION_LABEL[t] },
    { title: '状态流转', width: 210, render: (_: any, r: OperationLogWithContext) => (
      <Space size={4}>
        {r.fromStatus && <Tag color={STATUS_COLOR[r.fromStatus]}>{CAR_STATUS_LABEL[r.fromStatus]}</Tag>}
        {r.fromStatus && <span style={{ color: '#999' }}>→</span>}
        <Tag color={STATUS_COLOR[r.toStatus]}>{CAR_STATUS_LABEL[r.toStatus]}</Tag>
      </Space>
    )},
    {
      title: '审批阶段', dataIndex: 'approvalStage', width: 130,
      render: (s: ApprovalStage | undefined) => s ? (
        <Tag color={s === 'done' ? 'green' : s === 'terminal' ? 'default' : s === 'finance' ? 'magenta' : s === 'appraiser' ? 'cyan' : 'blue'}>
          {APPROVAL_STAGE_LABEL[s]}
        </Tag>
      ) : '-'
    },
    {
      title: '当前责任人', width: 180, render: (_: any, r: OperationLogWithContext) => renderHandler(r)
    },
    {
      title: '最近处理时间', dataIndex: 'latestHandledAt', width: 170,
      render: (t: string | undefined) => t ? (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#888' }} />
          <span>{dayjs(t).format('YYYY-MM-DD HH:mm')}</span>
        </Space>
      ) : '-'
    },
    { title: '关联价格', dataIndex: 'price', width: 110, render: (p: number | undefined) => p != null ? <span className="price-tag">¥{p.toLocaleString()}</span> : '-' },
    {
      title: '关键备注摘要', dataIndex: 'keyRemarksSummary', width: 280,
      render: (t: string | undefined, r: OperationLogWithContext) => {
        const txt = t && t !== '-' ? t : (r.remark || '');
        if (!txt) return <span style={{ color: '#ccc' }}>-</span>;
        return (
          <Tooltip title={txt}>
            <Space size={4}>
              <FileTextOutlined style={{ color: '#888' }} />
              <span style={{ maxWidth: 240, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                {txt}
              </span>
            </Space>
          </Tooltip>
        );
      }
    },
    {
      title: '操作备注', dataIndex: 'remark', width: 200,
      render: (t: string) => t ? (
        <Tooltip title={t}>
          <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t}
          </span>
        </Tooltip>
      ) : <span style={{ color: '#ccc' }}>-</span>
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle" align="center">
          <strong style={{ marginRight: 8 }}>交班视图：</strong>
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
          <Select
            placeholder="按当前责任角色筛选"
            allowClear
            style={{ width: 170 }}
            value={handlerRole}
            onChange={setHandlerRole}
            options={HANDLER_ROLE_OPTIONS}
          />
          <Select
            placeholder="按审批阶段筛选"
            allowClear
            style={{ width: 170 }}
            value={stage}
            onChange={setStage}
            options={STAGE_OPTIONS}
          />
          <Input prefix={<SearchOutlined />} placeholder="搜索车源/备注/责任人" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 240 }} allowClear />
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
          scroll={{ x: 1800 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条记录` }}
        />
      </Card>
    </div>
  );
}
