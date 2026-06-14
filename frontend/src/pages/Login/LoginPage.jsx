import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '登录失败');
    }
    
    setLoading(false);
  };

  const demoAccounts = [
    { username: 'acceptor01', role: '受理员', password: 'demo123' },
    { username: 'appraiser01', role: '鉴定人', password: 'demo123' },
    { username: 'qc01', role: '质控审核', password: 'demo123' },
    { username: 'admin', role: '管理员', password: 'admin123' }
  ];

  const fillDemo = (account) => {
    setUsername(account.username);
    setPassword(account.password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>司法鉴定所</h1>
          <p>委托受理与材料核验系统</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>演示账号</h3>
          <div className="demo-list">
            {demoAccounts.map((account) => (
              <div key={account.username} className="demo-item">
                <div className="demo-info">
                  <span className="demo-username">{account.username}</span>
                  <span className="demo-role">{account.role}</span>
                </div>
                <button
                  type="button"
                  className="demo-button"
                  onClick={() => fillDemo(account)}
                >
                  填充
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
