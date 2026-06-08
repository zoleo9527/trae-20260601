import { Layout, Menu } from 'antd'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import DetentionList from './pages/DetentionList'
import DetentionRegister from './pages/DetentionRegister'
import DetentionDetail from './pages/DetentionDetail'

const { Header, Content } = Layout

const menuItems = [
  { key: '/', label: '扣留列表' },
  { key: '/register', label: '新建登记' },
]

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = menuItems.find((item) =>
    item.key === '/' ? location.pathname === '/' : location.pathname.startsWith(item.key),
  )?.key ?? '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ color: '#fff', fontSize: 16, whiteSpace: 'nowrap', fontWeight: 600 }}>
          民航货站 · 安检扣留与补证处理系统
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: 24, background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<DetentionList />} />
          <Route path="/register" element={<DetentionRegister />} />
          <Route path="/detail/:id" element={<DetentionDetail />} />
        </Routes>
      </Content>
    </Layout>
  )
}
