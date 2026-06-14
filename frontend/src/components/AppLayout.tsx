import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Avatar, Button, Dropdown, Badge, Drawer, List, Tag, Empty, Tooltip, App, Space, Alert, Divider, Row, Col } from 'antd';
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
  FlagOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { Role, ExceptionRecord, Registration, PhysicalCheck } from 'shared';
import { useUserStore, ROLE_USERS } from '../store/user';
import { roleMap, exceptionLevelMap, formatDateTime, responsibilityMap, registrationStatusMap, physicalStatusMap } from '../utils/constants';
import { getExceptions, resetAllData, getRegistrations, getPhysicals } from '../api';
import type { TrainingSchedule, ExamBatch, PhysicalForm } from 'shared';
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
  const [regMap, setRegMap] = useState<Record<string, Registration>>({});
  const [physMap, setPhysMap] = useState<Record<string, PhysicalCheck>>({});
  const [drawerLoading, setDrawerLoading] = useState(false);
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
      const [list, regs, phys] = await Promise.all([
        getExceptions({ resolved: false }),
        getRegistrations(),
        getPhysicals(),
      ]);
      setExceptions(list);
      const rm: Record<string, Registration> = {};
      regs.forEach(r => { rm[r.id] = r; });
      setRegMap(rm);
      const pm: Record<string, PhysicalCheck> = {};
      phys.forEach(p => { pm[p.registrationId] = p; });
      setPhysMap(pm);
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

  const unresolved = useMemo(() => exceptions.filter(e => !e.resolved), [exceptions]);

  const stats = useMemo(() => {
    let withRespWarn = 0;
    let withRespMark = 0;
    let dualLink = 0;
    unresolved.forEach(e => {
      const reg = regMap[e.registrationId];
      const phys = physMap[e.registrationId];
      const hasWarn = reg?.responsibilityWarning?.triggered;
      const hasMark = phys?.responsibilityMark && phys.responsibilityMark !== 'none';
      if (hasWarn) withRespWarn++;
      if (hasMark) withRespMark++;
      if (hasWarn && hasMark) dualLink++;
    });
    return { withRespWarn, withRespMark, dualLink, total: unresolved.length };
  }, [unresolved, regMap, physMap]);

  const typeIcon: Record<string, ReactNode> = {
    registration: <FileTextOutlined style={{ color: '#1677ff' }} />,
    physical: <MedicineBoxOutlined style={{ color: '#52c41a' }} />,
    handover: <SwapOutlined style={{ color: '#faad14' }} />,
  };

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
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <BellOutlined /> 异常提醒
            <Tag color="red">{unresolved.length} 未处理</Tag>
            {stats.withRespWarn > 0 && (
              <Tag color="magenta" icon={<FlagOutlined />}>责任预警 {stats.withRespWarn}</Tag>
            )}
            {stats.withRespMark > 0 && (
              <Tag color="purple" icon={<FlagOutlined />}>责任标记 {stats.withRespMark}</Tag>
            )}
            {stats.dualLink > 0 && (
              <Tag color="warning" style={{ borderStyle: 'dashed' }}>双链路 {stats.dualLink}</Tag>
            )}
          </div>
        }
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button size="small" onClick={loadExceptions}>
              <ReloadOutlined /> 刷新
            </Button>
            <Link to={`/${role}/exceptions`}>
              <Button size="small" type="primary">
                <AlertOutlined /> 进入异常处理页
              </Button>
            </Link>
          </Space>
        }
      >
        {unresolved.length === 0 ? (
          <Empty description="暂无未处理异常 🎉" />
        ) : (
          <div>
            {stats.total > 0 && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="异常概览"
                description={
                  <Space size="small" wrap>
                    <Tag color="blue">共 {stats.total} 条</Tag>
                    <Tag color="magenta">报名侧预警 {stats.withRespWarn}</Tag>
                    <Tag color="purple">体检侧标记 {stats.withRespMark}</Tag>
                    {stats.dualLink > 0 && <Tag color="warning">双链路叠加 {stats.dualLink}</Tag>}
                  </Space>
                }
              />
            )}

            <List
              loading={drawerLoading}
              dataSource={unresolved}
              renderItem={(item) => {
                const reg = regMap[item.registrationId];
                const phys = physMap[item.registrationId];
                const rw = reg?.responsibilityWarning;
                const hasWarn = rw?.triggered;
                const hasMark = phys?.responsibilityMark && phys.responsibilityMark !== 'none';
                const isDual = hasWarn && hasMark;

                return (
                  <List.Item
                    style={{
                      alignItems: 'flex-start',
                      padding: 14,
                      marginBottom: 12,
                      borderRadius: 8,
                      background: item.level === 'error' ? '#fff2f0' : '#fff',
                      border: `1px solid ${item.level === 'error' ? '#ffccc7' : '#f0f0f0'}`,
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                        flexWrap: 'wrap',
                        gap: 6,
                      }}>
                        <Space size="small" wrap>
                          <Badge
                            status={item.level === 'error' ? 'error' : item.level === 'warning' ? 'warning' : 'processing'}
                            text={
                              <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {item.studentName}
                              </span>
                            }
                          />
                          <Tag color={exceptionLevelMap[item.level].color}>
                            {exceptionLevelMap[item.level].label}
                          </Tag>
                          {typeIcon[item.type]}
                          <Tag>{item.type === 'registration' ? '报名资料' : item.type === 'physical' ? '体检核验' : '交班争议'}</Tag>
                        </Space>
                        <Space size="small" wrap>
                          {hasWarn && (
                            <Tooltip title={`报名侧责任预警：${rw?.triggerType}，缺${rw?.missingDocs.length}项`}>
                              <Tag color="magenta" icon={<FlagOutlined />} style={{ margin: 0 }}>
                                报名预警
                              </Tag>
                            </Tooltip>
                          )}
                          {hasMark && (
                            <Tooltip title={`体检侧责任：${responsibilityMap[phys!.responsibilityMark].label}`}>
                              <Tag color={responsibilityMap[phys!.responsibilityMark].color} icon={<FlagOutlined />} style={{ margin: 0 }}>
                                {responsibilityMap[phys!.responsibilityMark].label}
                              </Tag>
                            </Tooltip>
                          )}
                          {isDual && (
                            <Tag color="warning" style={{ borderStyle: 'dashed' }}>
                              双链路
                            </Tag>
                          )}
                        </Space>
                      </div>

                      <div style={{
                        color: '#1f1f1f',
                        fontSize: 13,
                        lineHeight: 1.7,
                        marginBottom: 8,
                        padding: '8px 10px',
                        background: '#fafafa',
                        borderRadius: 6,
                        borderLeft: `3px solid ${exceptionLevelMap[item.level].color}`,
                      }}>
                        {item.content}
                      </div>

                      {(hasWarn || hasMark) && (
                        <div style={{ marginBottom: 8 }}>
                          {hasWarn && (
                            <div style={{
                              padding: '8px 10px',
                              background: '#fff0f6',
                              borderRadius: 6,
                              marginBottom: hasMark ? 6 : 0,
                              borderLeft: '3px solid #eb2f96',
                            }}>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                marginBottom: 4, flexWrap: 'wrap',
                              }}>
                                <Tag color="magenta" style={{ margin: 0 }}>报名侧 · {rw!.triggerType}</Tag>
                                <Tag color="blue" style={{ margin: 0 }}>
                                  缺 {rw!.missingDocs.length} 项
                                </Tag>
                                {rw!.syncedToException && (
                                  <Tag color="red" style={{ margin: 0 }}>已同步异常</Tag>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>
                                <UserOutlined /> {rw!.registrarName}
                                <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                                <ClockCircleOutlined /> {formatDateTime(rw!.flowTime)}
                              </div>
                              <Space size={[4, 4]} wrap>
                                {rw!.missingDocs.map((d: string) => (
                                  <Tag
                                    key={d}
                                    color="error"
                                    icon={<CloseCircleOutlined />}
                                    style={{ fontSize: 11, margin: 0 }}
                                  >
                                    {d}
                                  </Tag>
                                ))}
                              </Space>
                              {rw!.mark && (
                                <div style={{ fontSize: 12, marginTop: 6, color: '#8c8c8c' }}>
                                  建议归属：
                                  <Tag color={responsibilityMap[rw!.mark as keyof typeof responsibilityMap]?.color || 'default'} style={{ fontSize: 11, marginLeft: 4 }}>
                                    {responsibilityMap[rw!.mark as keyof typeof responsibilityMap]?.label || rw!.mark}
                                  </Tag>
                                  {rw!.description && (
                                    <span style={{ marginLeft: 8 }}>· {rw!.description.slice(0, 40)}{rw!.description.length > 40 ? '...' : ''}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {hasMark && (
                            <div style={{
                              padding: '8px 10px',
                              background: '#f9f0ff',
                              borderRadius: 6,
                              borderLeft: '3px solid #722ed1',
                            }}>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                marginBottom: 4, flexWrap: 'wrap',
                              }}>
                                <Tag color={responsibilityMap[phys!.responsibilityMark].color} style={{ margin: 0 }}>
                                  体检侧 · {responsibilityMap[phys!.responsibilityMark].label}
                                </Tag>
                                <Tag color={physicalStatusMap[phys!.status].color} style={{ margin: 0 }}>
                                  {physicalStatusMap[phys!.status].label}
                                </Tag>
                              </div>
                              {phys!.responsibilityNote && (
                                <div style={{ fontSize: 12, color: '#1f1f1f', lineHeight: 1.6 }}>
                                  <FlagOutlined style={{ color: '#722ed1', marginRight: 4 }} />
                                  {phys!.responsibilityNote}
                                </div>
                              )}
                              {phys!.reviewNote && (
                                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                                  复核：{phys!.reviewNote.slice(0, 30)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 11,
                        color: '#8c8c8c',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}>
                        <Space size="small" wrap>
                          <span><ClockCircleOutlined /> {formatDateTime(item.createdAt)}</span>
                          <span>处理人：{item.handler}</span>
                          {reg && (
                            <span>
                              <FileTextOutlined /> 报名：
                              <Tag color={registrationStatusMap[reg.status].color} style={{ fontSize: 11, margin: 0 }}>
                                {registrationStatusMap[reg.status].label}
                              </Tag>
                            </span>
                          )}
                        </Space>
                        <Link to={`/${role}/exceptions`}>
                          <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }}>
                            查看详情 →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
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
