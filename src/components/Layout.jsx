import { Layout as AntLayout, Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { FileTextOutlined, HomeOutlined } from '@ant-design/icons'

const { Header, Content, Sider } = AntLayout

function Layout({ children }) {
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <FileTextOutlined />,
      label: <Link to="/">妊检结果</Link>,
    },
    {
      key: '/farrowing-room',
      icon: <HomeOutlined />,
      label: <Link to="/farrowing-room">产房安排</Link>,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>种猪场-妊检结果与产房安排</h1>
      </Header>
      <AntLayout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout