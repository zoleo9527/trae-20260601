import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Layout.css';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    const labels = {
      'acceptor': '受理员',
      'appraiser': '鉴定人',
      'qc_reviewer': '质控审核',
      'admin': '管理员'
    };
    return labels[role] || role;
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>司法鉴定所</h2>
          <p>委托受理系统</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <span className="nav-icon">📊</span>
            <span>仪表盘</span>
          </Link>
          <Link to="/delegations" className="nav-item">
            <span className="nav-icon">📋</span>
            <span>委托单管理</span>
          </Link>
          <Link to="/audit-logs" className="nav-item">
            <span className="nav-icon">📝</span>
            <span>审计日志</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{getRoleLabel(user?.role)}</div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            退出登录
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>司法鉴定所管理系统</h1>
          </div>
          <div className="header-right">
            <span className="user-welcome">欢迎，{user?.name}</span>
          </div>
        </header>

        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
