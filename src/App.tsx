import { useState } from 'react'
import { Layout, Menu, Select, Typography, theme } from 'antd'
import {
  UserAddOutlined,
  FileSearchOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store/useAppStore'
import PatientRegistry from '@/pages/PatientRegistry'
import AssessmentPage from '@/pages/AssessmentPage'
import PrescriptionPage from '@/pages/PrescriptionPage'
import ReviewPage from '@/pages/ReviewPage'
import SchedulePage from '@/pages/SchedulePage'
import type { Role } from '@/types'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const ROLE_MAP: Record<Role, string> = {
  front_desk: '前台',
  therapist: '康复治疗师',
  director: '主任',
}

const MENU_ITEMS: Record<Role, Array<{ key: string; icon: React.ReactNode; label: string }>> = {
  front_desk: [
    { key: 'patients', icon: <UserAddOutlined />, label: '患者建档' },
    { key: 'schedule', icon: <CalendarOutlined />, label: '预约排课' },
  ],
  therapist: [
    { key: 'patients', icon: <TeamOutlined />, label: '患者列表' },
    { key: 'assessment', icon: <FileSearchOutlined />, label: '评估量表' },
    { key: 'prescription', icon: <MedicineBoxOutlined />, label: '康复处方' },
    { key: 'schedule', icon: <CalendarOutlined />, label: '排课表' },
  ],
  director: [
    { key: 'patients', icon: <TeamOutlined />, label: '患者总览' },
    { key: 'prescription', icon: <MedicineBoxOutlined />, label: '处方管理' },
    { key: 'review', icon: <AuditOutlined />, label: '处方复核' },
    { key: 'schedule', icon: <CalendarOutlined />, label: '排课总览' },
  ],
}

export default function App() {
  const [currentView, setCurrentView] = useState('patients')
  const { currentRole, setCurrentRole } = useAppStore()
  const { token } = theme.useToken()

  const menuItems = MENU_ITEMS[currentRole]

  const renderContent = () => {
    switch (currentView) {
      case 'patients':
        return <PatientRegistry />
      case 'assessment':
        return <AssessmentPage />
      case 'prescription':
        return <PrescriptionPage />
      case 'review':
        return <ReviewPage />
      case 'schedule':
        return <SchedulePage />
      default:
        return <PatientRegistry />
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: '#fff', borderRight: `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <Title level={4} style={{ margin: 0, color: token.colorPrimary, fontSize: 16 }}>
            🏥 康复治疗中心
          </Title>
          <div style={{ fontSize: 11, color: token.colorTextSecondary, marginTop: 4 }}>
            初评建档与康复处方
          </div>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <Select
            value={currentRole}
            onChange={(v: Role) => {
              setCurrentRole(v)
              setCurrentView('patients')
            }}
            style={{ width: '100%' }}
            options={Object.entries(ROLE_MAP).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentView]}
          items={menuItems}
          onClick={({ key }) => setCurrentView(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            {menuItems.find((m) => m.key === currentView)?.label ?? ''}
          </Title>
          <span style={{ color: token.colorTextSecondary }}>
            当前角色: {ROLE_MAP[currentRole]}
          </span>
        </Header>
        <Content style={{ margin: 24, background: '#fff', padding: 24, borderRadius: 8, minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}
