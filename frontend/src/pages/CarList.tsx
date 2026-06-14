import { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Input, Button, Select, Space, Card, message } from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { carApi } from '../api';
import { AuthTokenPayload, CarSource, CarStatus, CAR_STATUS_LABEL } from '../types';
import dayjs from 'dayjs';
import CreateCarModal from '../components/CreateCarModal';

const STATUS_COLOR: Record<CarStatus, string> = {
  draft: 'default',
  manager_pending: 'blue',
  appraiser_pending: 'cyan',
  finance_pending: 'magenta',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default'
};

export default function CarList({ user }: { user: AuthTokenPayload }) {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [data, setData] = useState<CarSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [scope, setScope] = useState<'all' | 'pending' | 'mine'>(location.state?.scope || 'all');
  const [statusFilter, setStatusFilter] = useState<CarStatus | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => { load(); }, [scope, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const list = await carApi.list({ scope, status: statusFilter, keyword });
      setData(list);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() { load(); }

  const columns = useMemo(() => [
    { title: '车源编号', dataIndex: 'carNo', width: 150, render: (t: string, r: CarSource) => <a onClick={() => navigate(`/cars/${r.id}`)}>{t}</a> },
    { title: '车辆信息', render: (_: any, r: CarSource) => (
      <div>
        <div style={{ fontWeight: 500 }}>{r.brand} {r.model}</div>
        <div style={{ color: '#999', fontSize: 12 }}>{r.year}年 · {r.mileage.toLocaleString()}公里 · {r.color || '-'}</div>
      </div>
    )},
    { title: '车牌/VIN', render: (_: any, r: CarSource) => (
      <div>
        <div>{r.plateNumber || '-'}</div>
        <div style={{ color: '#999', fontSize: 12 }}>{r.vin || '-'}</div>
      </div>
    )},
    { title: '车主信息', render: (_: any, r: CarSource) => (
      <div>
        <div>{r.ownerName || '-'}</div>
        <div style={{ color: '#999', fontSize: 12 }}>{r.ownerPhone || '-'}</div>
      </div>
    )},
    { title: '价格', render: (_: any, r: CarSource) => (
      <div style={{ textAlign: 'right' }}>
        {r.finalPrice != null && <div className="price-tag">¥{r.finalPrice.toLocaleString()}</div>}
        {r.finalPrice == null && r.appraiserPrice != null && <div className="price-tag">¥{r.appraiserPrice.toLocaleString()} <span style={{ color: '#999', fontSize: 11 }}>评估</span></div>}
        {r.finalPrice == null && r.appraiserPrice == null && r.managerPrice != null && <div className="price-tag">¥{r.managerPrice.toLocaleString()} <span style={{ color: '#999', fontSize: 11 }}>经理</span></div>}
        {r.finalPrice == null && r.appraiserPrice == null && r.managerPrice == null && r.expectedPrice != null && <div style={{ color: '#999' }}>期望: ¥{r.expectedPrice.toLocaleString()}</div>}
        {r.finalPrice == null && r.appraiserPrice == null && r.managerPrice == null && r.expectedPrice == null && <div style={{ color: '#ccc' }}>-</div>}
      </div>
    )},
    { title: '状态', dataIndex: 'currentStatus', width: 150, render: (s: CarStatus) => <Tag color={STATUS_COLOR[s]}>{CAR_STATUS_LABEL[s]}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160, render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm') }
  ], [navigate]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索品牌/车型/编号/车牌/车主"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            value={scope}
            onChange={(v) => setScope(v)}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: '全部车源' },
              { value: 'pending', label: '我的待办' },
              { value: 'mine', label: '我创建的' }
            ]}
          />
          <Select
            placeholder="按状态筛选"
            allowClear
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            style={{ width: 200 }}
            options={Object.entries(CAR_STATUS_LABEL).map(([v, l]) => ({ value: v as CarStatus, label: l }))}
          />
          <Button onClick={handleSearch}>查询</Button>
          {(user.role === 'manager' || user.role === 'admin') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>录入新车源</Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={() => carApi.downloadLogs()}>导出日志</Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          onRow={(r) => ({ onClick: () => navigate(`/cars/${r.id}`), style: { cursor: 'pointer' } })}
        />
      </Card>

      <CreateCarModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(car) => {
          message.success('车源已创建');
          setCreateOpen(false);
          load();
          navigate(`/cars/${car.id}`);
        }}
        user={user}
      />
    </div>
  );
}
