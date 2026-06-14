import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Button, Tag, Empty, Typography, message } from 'antd';
import { CarOutlined, ClockCircleOutlined, CheckCircleOutlined, StopOutlined, PlusOutlined, ArrowRightOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { carApi } from '../api';
import { AuthTokenPayload, CarSource, CarStatus, CAR_STATUS_LABEL, ROLE_LABEL } from '../types';
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

export default function Dashboard({ user }: { user: AuthTokenPayload }) {
  const navigate = useNavigate();
  const [allCars, setAllCars] = useState<CarSource[]>([]);
  const [pendingCars, setPendingCars] = useState<CarSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [all, pending] = await Promise.all([
        carApi.list({ scope: 'all' }),
        carApi.list({ scope: 'pending' })
      ]);
      setAllCars(all);
      setPendingCars(pending);
    } finally {
      setLoading(false);
    }
  }

  function countByStatus(status: CarStatus) {
    return allCars.filter(c => c.currentStatus === status).length;
  }

  function roleSpecificCards() {
    if (user.role === 'manager') {
      return (
        <>
          <Col span={6}><Card className="stat-card"><Statistic title="我待处理的车源" value={pendingCars.length} prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="需估价的车源" value={countByStatus('appraiser_pending')} prefix={<CarOutlined style={{ color: '#13c2c2' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="已审批通过" value={countByStatus('approved')} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="已驳回/取消" value={countByStatus('rejected') + countByStatus('cancelled')} prefix={<StopOutlined style={{ color: '#ff4d4f' }} />} /></Card></Col>
        </>
      );
    }
    if (user.role === 'appraiser') {
      return (
        <>
          <Col span={6}><Card className="stat-card"><Statistic title="我需现场估价" value={pendingCars.length} prefix={<CarOutlined style={{ color: '#13c2c2' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="待金融审批" value={countByStatus('finance_pending')} prefix={<ClockCircleOutlined style={{ color: '#eb2f96' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="已通过收购" value={countByStatus('approved')} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="流转中车源" value={allCars.length} prefix={<FileTextOutlined />} /></Card></Col>
        </>
      );
    }
    if (user.role === 'finance') {
      return (
        <>
          <Col span={6}><Card className="stat-card"><Statistic title="我待审批" value={pendingCars.length} prefix={<ClockCircleOutlined style={{ color: '#eb2f96' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="已通过收购" value={countByStatus('approved')} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="待现场评估" value={countByStatus('appraiser_pending')} prefix={<CarOutlined style={{ color: '#13c2c2' }} />} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="已驳回" value={countByStatus('rejected')} prefix={<StopOutlined style={{ color: '#ff4d4f' }} />} /></Card></Col>
        </>
      );
    }
    return (
      <>
        <Col span={6}><Card className="stat-card"><Statistic title="车源总数" value={allCars.length} prefix={<CarOutlined />} /></Card></Col>
        <Col span={6}><Card className="stat-card"><Statistic title="流转中" value={countByStatus('manager_pending') + countByStatus('appraiser_pending') + countByStatus('finance_pending')} prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />} /></Card></Col>
        <Col span={6}><Card className="stat-card"><Statistic title="已通过" value={countByStatus('approved')} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
        <Col span={6}><Card className="stat-card"><Statistic title="已驳回/取消" value={countByStatus('rejected') + countByStatus('cancelled')} prefix={<StopOutlined style={{ color: '#ff4d4f' }} />} /></Card></Col>
      </>
    );
  }

  function roleQuickActions() {
    const base = [];
    if (user.role === 'manager' || user.role === 'admin') {
      base.push(<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>录入新车源</Button>);
    }
    base.push(<Button key="pending" icon={<ClockCircleOutlined />} onClick={() => navigate('/cars', { state: { scope: 'pending' } })}>处理我的待办 ({pendingCars.length})</Button>);
    base.push(<Button key="all" icon={<CarOutlined />} onClick={() => navigate('/cars')}>查看全部车源</Button>);
    base.push(<Button key="logs" icon={<FileTextOutlined />} onClick={() => navigate('/logs')}>操作日志</Button>);
    base.push(<Button key="export-logs" icon={<DownloadOutlined />} onClick={() => carApi.downloadLogs()}>导出日志 CSV</Button>);
    return base;
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Typography.Title level={4} style={{ margin: 0 }}>
              欢迎，{user.name}
              <span className={`role-badge role-${user.role}`} style={{ marginLeft: 12 }}>{ROLE_LABEL[user.role]}工作台</span>
            </Typography.Title>
            <Typography.Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
              {user.role === 'manager' && '你可以录入车源、审核车源并给出收车估价、分配评估师'}
              {user.role === 'appraiser' && '你可以对待估价车源进行现场评估、提交估价、补充备注'}
              {user.role === 'finance' && '你可以基于前面的全部流转历史，给出最终审批价'}
              {user.role === 'admin' && '你拥有完整操作权限，可以查看和导出所有记录'}
            </Typography.Text>
          </Col>
          <Col>
            <div style={{ display: 'flex', gap: 8 }}>{roleQuickActions()}</div>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>{roleSpecificCards()}</Row>

      <Row gutter={16}>
        <Col span={pendingCars.length ? 14 : 24}>
          <Card title={pendingCars.length ? `我的待办（${pendingCars.length}）` : '暂无待办任务'} extra={<Button type="link" onClick={() => navigate('/cars')}>查看全部 <ArrowRightOutlined /></Button>}>
            {pendingCars.length === 0 ? (
              <Empty description="没有需要你处理的车源" />
            ) : (
              <List
                loading={loading}
                dataSource={pendingCars.slice(0, 6)}
                renderItem={(car) => (
                  <List.Item
                    className="car-card"
                    style={{ borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 8, padding: '12px 16px' }}
                    actions={[<Button type="link" onClick={() => navigate(`/cars/${car.id}`)}>立即处理 <ArrowRightOutlined /></Button>]}
                  >
                    <List.Item.Meta
                      avatar={<CarOutlined style={{ fontSize: 28, color: '#1677ff' }} />}
                      title={
                        <span>
                          {car.brand} {car.model}
                          <Tag color={STATUS_COLOR[car.currentStatus]} style={{ marginLeft: 8 }}>{CAR_STATUS_LABEL[car.currentStatus]}</Tag>
                        </span>
                      }
                      description={
                        <div>
                          <div>{car.carNo} · {car.year}年 · {car.mileage.toLocaleString()}公里 · 车牌 {car.plateNumber || '-'}</div>
                          <div style={{ marginTop: 4 }}>更新于 {dayjs(car.updatedAt).format('MM-DD HH:mm')}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={10} style={{ display: pendingCars.length ? 'block' : 'none' }}>
          <Card title="最近流转的车源">
            <List
              size="small"
              dataSource={allCars.slice(0, 8)}
              renderItem={(car) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '8px 0' }}
                  onClick={() => navigate(`/cars/${car.id}`)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{car.brand} {car.model}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{car.carNo}</div>
                  </div>
                  <Tag color={STATUS_COLOR[car.currentStatus]}>{CAR_STATUS_LABEL[car.currentStatus]}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

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
