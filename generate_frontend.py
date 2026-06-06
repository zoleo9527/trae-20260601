import os

base = os.path.join(os.path.dirname(__file__), 'client/src')

os.makedirs(os.path.join(base, 'context'), exist_ok=True)
os.makedirs(os.path.join(base, 'pages'), exist_ok=True)
os.makedirs(os.path.join(base, 'components'), exist_ok=True)

files = {}

files['App.jsx'] = '''import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketDetail from './pages/TicketDetail'
import CreateTicket from './pages/CreateTicket'
import Header from './components/Header'

function App() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>
  if (!user) return <Login />
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
'''

files['index.css'] = '''* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  color: #333;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 16px;
}
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary { background: #1890ff; color: white; }
.btn-primary:hover { background: #40a9ff; }
.btn-success { background: #52c41a; color: white; }
.btn-success:hover { background: #73d13d; }
.btn-warning { background: #faad14; color: white; }
.btn-warning:hover { background: #ffc53d; }
.btn-danger { background: #ff4d4f; color: white; }
.btn-danger:hover { background: #ff7875; }
.btn-default { background: #fff; border: 1px solid #d9d9d9; color: #333; }
.btn-default:hover { border-color: #1890ff; color: #1890ff; }
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.tag-refund { background: #fff1f0; color: #ff4d4f; border: 1px solid #ffa39e; }
.tag-reissue { background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; }
.tag-pending { background: #fffbe6; color: #faad14; border: 1px solid #ffe58f; }
.tag-processing { background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; }
.tag-completed { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.tag-rejected { background: #fff1f0; color: #ff4d4f; border: 1px solid #ffa39e; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
th { background: #fafafa; font-weight: 500; }
tr:hover { background: #fafafa; }
input, select, textarea {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
}
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
.header {
  background: #001529;
  color: white;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}
.header h1 { font-size: 18px; font-weight: 500; cursor: pointer; }
.header-right { display: flex; align-items: center; gap: 16px; }
.role-selector { display: flex; gap: 8px; }
.role-btn {
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
}
.role-btn.active { background: #1890ff; }
.timeline { position: relative; padding-left: 24px; }
.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e8e8e8;
}
.timeline-item { position: relative; padding-bottom: 20px; }
.timeline-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1890ff;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #1890ff;
}
.timeline-time { font-size: 12px; color: #999; margin-bottom: 4px; }
.timeline-content { background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 14px; }
.timeline-operator { font-weight: 500; color: #1890ff; }
'''

files['pages/Login.jsx'] = '''import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { username: 'assistant', name: '李助理', role: '主播助理', desc: '负责创建工单、初步录入' },
  { username: 'controller', name: '王场控', role: '场控', desc: '负责处理退款工单、协调仓库' },
  { username: 'lead', name: '张组长', role: '售后组长', desc: '负责审核补发、最终审批' }
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(username, password)
    if (!result.success) setError(result.message)
  }

  const quickLogin = async (acc) => {
    setUsername(acc.username)
    setPassword('123456')
    const result = await login(acc.username, '123456')
    if (!result.success) setError(result.message)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="card" style={{ width: '420px', padding: '32px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '24px' }}>直播电商售后系统</h1>
        <p style={{ textAlign: 'center', color: '#999', marginBottom: '24px' }}>退款与补发审核平台</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
          </div>
          {error && <p style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '16px' }}>登录</button>
        </form>
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>演示账号（密码均为 123456）：</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.username} type="button" className="btn btn-default" onClick={() => quickLogin(acc)} style={{ textAlign: 'left', padding: '12px' }}>
                <div style={{ fontWeight: '500' }}>{acc.name} - {acc.role}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{acc.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
'''

files['components/Header.jsx'] = '''import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_OPTIONS = [
  { username: 'assistant', name: '李助理', role: 'assistant' },
  { username: 'controller', name: '王场控', role: 'controller' },
  { username: 'lead', name: '张组长', role: 'lead' }
]

const ROLE_LABELS = {
  assistant: '主播助理',
  controller: '场控',
  lead: '售后组长'
}

export default function Header() {
  const { user, logout, switchRole } = useAuth()
  const navigate = useNavigate()

  const handleSwitchRole = (opt) => {
    const idx = ROLE_OPTIONS.findIndex(r => r.role === opt.role)
    switchRole({ ...opt, id: 'u' + (idx + 1) })
  }

  return (
    <div className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 onClick={() => navigate('/')}>直播电商售后系统</h1>
        {user && <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{ROLE_LABELS[user.role]}工作台</span>}
      </div>
      <div className="header-right">
        <div className="role-selector">
          {ROLE_OPTIONS.map((opt) => (
            <button key={opt.role} className={`role-btn ${user?.role === opt.role ? 'active' : ''}`} onClick={() => handleSwitchRole(opt)}>
              {opt.name}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '14px' }}>当前: {user?.name}</span>
        <button className="btn btn-default" style={{ padding: '4px 12px', fontSize: '13px' }} onClick={logout}>退出</button>
      </div>
    </div>
  )
}
'''

for filepath, content in files.items():
    fullpath = os.path.join(base, filepath)
    os.makedirs(os.path.dirname(fullpath), exist_ok=True)
    with open(fullpath, 'w') as f:
        f.write(content)
    print(f'Created: {filepath}')

print('Done with first batch!')
