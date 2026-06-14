import { FileTextOutlined, SafetyOutlined, CreditCardOutlined, PhoneOutlined, OrderedListOutlined, BarChartOutlined } from '@ant-design/icons'
import { Menu } from 'antd'
import type { Role } from '@/types'
import { roleMap } from '@/utils/statusMap'

interface SidebarProps {
  currentUser: Role
  activeMenu: string
  onMenuChange: (key: string) => void
}

export function Sidebar({ currentUser, activeMenu, onMenuChange }: SidebarProps) {
  const managerMenu = [
    { key: 'applications', icon: <FileTextOutlined />, label: '借款申请' },
    { key: 'risk-data', icon: <SafetyOutlined />, label: '风控资料' },
    { key: 'collection', icon: <PhoneOutlined />, label: '催收记录' },
    { key: 'quota-review', icon: <CreditCardOutlined />, label: '额度建议回看' },
  ]

  const riskControlMenu = [
    { key: 'applications', icon: <FileTextOutlined />, label: '借款申请' },
    { key: 'risk-review', icon: <SafetyOutlined />, label: '风控审核' },
    { key: 'quota-suggestion', icon: <CreditCardOutlined />, label: '额度建议' },
    { key: 'workflow', icon: <OrderedListOutlined />, label: '审批流程' },
  ]

  const postLoanMenu = [
    { key: 'applications', icon: <FileTextOutlined />, label: '借款申请' },
    { key: 'collection', icon: <PhoneOutlined />, label: '催收记录' },
    { key: 'quota-review', icon: <CreditCardOutlined />, label: '额度建议回看' },
    { key: 'statistics', icon: <BarChartOutlined />, label: '统计分析' },
  ]

  const menus: Record<Role, typeof managerMenu> = {
    manager: managerMenu,
    risk_control: riskControlMenu,
    post_loan: postLoanMenu,
  }

  return (
    <Menu
      mode="inline"
      selectedKeys={[activeMenu]}
      onClick={({ key }) => onMenuChange(key)}
      style={{ marginTop: 24 }}
    >
      {menus[currentUser].map(item => (
        <Menu.Item key={item.key} icon={item.icon}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  )
}
