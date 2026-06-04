import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Workspace from './pages/Workspace'
import WorkflowDetail from './pages/WorkflowDetail'
import ScheduleView from './pages/ScheduleView'

const { Header, Content } = Layout

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#001529', padding: '0 24px' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            眼科手术中心 - 术前检查与手术排期系统
          </div>
        </Header>
        <Content style={{ padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Workspace />} />
            <Route path="/workflow/:id" element={<WorkflowDetail />} />
            <Route path="/schedule" element={<ScheduleView />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  )
}

export default App
