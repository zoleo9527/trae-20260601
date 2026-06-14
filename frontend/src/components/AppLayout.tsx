import { ReactNode, useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Button, Dropdown, Badge, Drawer, List, Tag, Empty, Tooltip, App } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  ReloadOutlined,
  SwitcherOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  SwapOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { Role } from 'shared';
import { useUserStore, ROLE_USERS } from '../store/user';
import { roleMap, exceptionLevelMap, formatDateTime } from '../utils/constants';
import { getExceptions, resetAllData } from '../api';
import type { ExceptionRecord, TrainingSchedule, ExamBatch, PhysicalForm } from 'shared';
import { getSchedules, getExamBatches, getPhysicalForms } from '../api';
import { subjectMap } from '../utils/constants';

const { Header, Sider, Content } = Layout;

interface Props {
  role: Role;
}

export default function AppLayout({ role }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const setRole = useUserStore((s) => s.setRole);
  const { message, modal } = App.useApp();

  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bgData, setBgData] = useState<{
    schedules: TrainingSchedule[];
    examBatches: ExamBatch[];
    physicalForms: PhysicalForm[];
  }>({ schedules: [], examBatches: [], physicalForms: [] });
  const [bgOpen, setBgOpen] = useState(false);

  useEffect(() => {
    loadExceptions();
    loadBackground();
  }, [role]);

  const loadExceptions = async () => {
    try {
      const list = await getExceptions({ resolved: false });
      setExceptions(list);
    } catch {}
  };

  const loadBackground = async () => {
    try {
      const [schedules, examBatches, physicalForms] = await Promise.all([
        getSchedules(),
        getExamBatches(),
        getPhysicalForms(),
      ]);
      setBgData({ schedules, examBatches, physicalForms });
    } catch {}
  };

  const handleReset = () => {
    modal.confirm({
      title: '确认重置所有数据？',
      content: '此操作将清空所有操作痕迹，恢复到初始默认数据（含顺利/拖延/补录/驳回/待复核记录），不可撤销。',
      okText: '确认重置',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await resetAllData();
          message.success('数据已重置为默认状态');
          loadExceptions();
          loadBackground();
          setTimeout(() => window.location.reload(), 600);
        } catch (e: any) {
          message.error(e.message || '重置失败');
        }
      },
    });
  };

  const switchRole = (target: Role) => {
    setRole(target, ROLE_USERS[target].user);
    navigate(`/${target}`);
    message.success(`已切换到${roleMap[target].label}入口`);
  };

  const menuItemsByRole: Record<Role, { key: string; icon: ReactNode; label: ReactNode }[]> = {
    registrar: [
      { key: `/registrar`, icon: <DashboardOutlined />, label: <Link to="/registrar">工作台</Link> },
      { key: `/registrar/registrations`, icon: <FileTextOutlined />, label: <Link to="/registrar/registrations">报名资料处理</Link> },
      { key: `/registrar/handover`, icon: <SwapOutlined />, label: <Link to="/registrar/handover">交班记录</Link> },
    ],
    fieldCoach: [
      { key: `/fieldCoach`, icon: <DashboardOutlined />, label: <Link to="/fieldCoach">工作台</Link> },
      { key: `/fieldCoach/physicals`, icon: <MedicineBoxOutlined />, label: <Link to="/fieldCoach/physicals">体检核验</Link> },
      { key: `/fieldCoach/exceptions`, icon: <AlertOutlined />, label: <Link to="/fieldCoach/exceptions">异常处理</Link> },
      { key: `/fieldCoach/handover`, icon: <SwapOutlined />, label: <Link to="/fieldCoach/handover">交班记录</Link> },
    ],
    safetyOfficer: [
      { key: `/safetyOfficer`, icon: <DashboardOutlined />, label: <Link to="/safetyOfficer">工作台</Link> },
      { key: `/safetyOfficer/physicals`, icon: <FormOutlined />, label: <Link to="/safetyOfficer/physicals">体检复核</Link> },
      { key: `/safetyOfficer/exceptions`, icon: <AlertOutlined />, label: <Link to="/safetyOfficer/exceptions">异常仲裁</Link> },
      { key: `/safetyOfficer/handover`, icon: <SwapOutlined />, label: <Link to="/safetyOfficer/handover">交班管理</Link> },
    ],
  };

  const roleSwitchItems = (Object.keys(roleMap) as Role[])
    .filter((r) => r !== role)
    .map((r) => ({
      key: r,
      icon: <SwitcherOutlined />,
      label: `切换到${roleMap[r].label}`,
      onClick: () => switchRole(r),
    }));

  const userMenuItems = [
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出并返回入口', onClick: () => navigate('/') },
  ];

  const selectedKey = '/' + location.pathname.split('/').slice(0, 2).join('/');

  return (
    <Layout className="app-layout">
      <Sider
        width={220}
        style={{ background: '#001529', position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          🏍️ 驾培交班系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: 'none', paddingTop: 12 }}
          items={menuItemsByRole[role]}
        />
        <div style={{ padding: 16, marginTop: 24 }}>
          <Button
            block
            type="primary"
            ghost
            icon={<FileDoneOutlined />}
            onClick={() => setBgOpen(true)}
          >
            背景资料
          </Button>
          <div style={{ height: 8 }} />
          <Button
            block
            danger
            ghost
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            重置数据
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className={`role-badge ${role}`}>
              {roleMap[role].icon} {roleMap[role].label}入口
            </span>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              欢迎，<strong style={{ color: '#1f1f1f' }}>{currentUser}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title="未处理异常">
              <Badge count={exceptions.filter(e => !e.resolved).length} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={() => setDrawerOpen(true)}
                />
              </Badge>
            </Tooltip>

            <Dropdown
              menu={{ items: roleSwitchItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button icon={<SwitcherOutlined />}>切换角色</Button>
            </Dropdown>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', background: roleMap[role].color }} />
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: 16, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title={`异常提醒（${exceptions.filter(e => !e.resolved).length}）`}
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        {exceptions.filter(e => !e.resolved).length === 0 ? (
          <Empty description="暂无未处理异常" />
        ) : (
          <List
            dataSource={exceptions.filter(e => !e.resolved)}
            renderItem={(item) => (
              <List.Item style={{ alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <List.Item.Meta
                  avatar={<Badge status={item.level === 'error' ? 'error' : item.level === 'warning' ? 'warning' : 'processing'} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>
                        {item.studentName}
                        <Tag color={exceptionLevelMap[item.level].color} style={{ marginLeft: 8 }}>
                          {exceptionLevelMap[item.level].label}
                        </Tag>
                      </span>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#595959', marginBottom: 4 }}>{item.content}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {formatDateTime(item.createdAt)} · 处理人：{item.handler}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      <Drawer
        title="📋 背景资料（体检表、训练场排班、考试批次）"
        placement="right"
        open={bgOpen}
        onClose={() => setBgOpen(false)}
        width={520}
      >
        <div style={{ marginBottom: 24 }}>
          <h3 className="section-title"><FileDoneOutlined /> 体检表发放记录</h3>
          {bgData.physicalForms.length === 0 ? <Empty /> : (
            bgData.physicalForms.map((f) => (
              <div key={f.id} className="sidebar-bg-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>{f.studentName}</strong>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>编号：{f.formNumber}</span>
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  <span className="label">发放机构：</span>{f.issuedBy}
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  <span className="label">有效期：</span>{f.issuedDate} ~ {f.validUntil}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 className="section-title"><CalendarOutlined /> 训练场排班</h3>
          {bgData.schedules.length === 0 ? <Empty /> : (
            bgData.schedules.map((s) => (
              <div key={s.id} className="sidebar-bg-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>{s.date} {s.timeSlot}</strong>
                  <Tag color={s.registered >= s.capacity ? 'red' : 'blue'}>
                    {s.registered}/{s.capacity}
                  </Tag>
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  <span className="label">教练：</span>{s.coach} · <span className="label">场地：</span>{s.venue}
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="section-title"><FormOutlined /> 近期考试批次</h3>
          {bgData.examBatches.length === 0 ? <Empty /> : (
            bgData.examBatches.map((e) => (
              <div key={e.id} className="sidebar-bg-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>{e.date} · {subjectMap[e.subject]}</strong>
                  <Tag color={e.registered >= e.capacity ? 'red' : 'orange'}>
                    {e.registered}/{e.capacity}
                  </Tag>
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  <span className="label">考点：</span>{e.venue}
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>
    </Layout>
  );
}
