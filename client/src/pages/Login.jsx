import { useState } from 'react'
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
