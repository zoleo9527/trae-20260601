import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketDetail from './pages/TicketDetail'
import CreateTicket from './pages/CreateTicket'
import Header from './components/Header'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f7fa'
      }}>
        <div style={{ padding: '2rem', textAlign: 'center', fontSize: '16px', color: '#666' }}>
          加载中...
        </div>
      </div>
    )
  }

  if (!user) {
    try {
      return <Login />
    } catch (e) {
      console.error('登录页渲染错误:', e)
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f5f7fa',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ff4d4f', marginBottom: '16px' }}>页面加载出错</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 24px',
                background: '#1677ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/create" element={<CreateTicket />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
