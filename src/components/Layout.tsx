import { Layout as AntLayout } from 'antd'

const { Header, Sider, Content } = AntLayout

interface LayoutProps {
  header: React.ReactNode
  sider: React.ReactNode
  children: React.ReactNode
}

export function Layout({ header, sider, children }: LayoutProps) {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0 }}>{header}</Header>
      <AntLayout>
        <Sider width={256} theme="light">{sider}</Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
