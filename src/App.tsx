import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { UserRole } from './types';
import Dashboard from './pages/Dashboard';
import RectificationList from './pages/RectificationList';
import NewRectification from './pages/NewRectification';
import RectificationDetail from './pages/RectificationDetail';
import ReviewList from './pages/ReviewList';
import ReviewDetail from './pages/ReviewDetail';

const App: React.FC = () => {
  const { role, userName, setRole, setUserName, roleLabel } = useAuth();
  const navigate = useNavigate();

  const roles: { key: UserRole; label: string; defaultUser: string }[] = [
    { key: 'leasing_manager', label: '招商经理', defaultUser: '赵明' },
    { key: 'ops_supervisor', label: '营运督导', defaultUser: '钱红' },
    { key: 'store_manager', label: '品牌店长', defaultUser: '张伟' },
  ];

  const handleRoleChange = (newRole: UserRole) => {
    const roleConfig = roles.find(r => r.key === newRole);
    if (roleConfig) {
      setRole(newRole);
      setUserName(roleConfig.defaultUser);
    }
    navigate('/');
  };

  const navItems = [
    { path: '/', label: '工作台', icon: '🏠', roles: ['leasing_manager', 'ops_supervisor', 'store_manager'] },
    { path: '/rectifications', label: '巡店整改', icon: '📋', roles: ['leasing_manager', 'ops_supervisor', 'store_manager'] },
    { path: '/reviews', label: '闭店复查', icon: '✅', roles: ['ops_supervisor', 'store_manager', 'leasing_manager'] },
  ];

  const visibleNav = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          🏬 奥特莱斯运营
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: 'normal' }}>
            巡店整改与闭店复查
          </div>
        </div>
        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="role-switcher">当前身份：{roleLabel} · {userName}</div>
          <div className="role-buttons">
            {roles.map(r => (
              <button
                key={r.key}
                className={`role-btn ${role === r.key ? 'active' : ''}`}
                onClick={() => handleRoleChange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rectifications" element={<RectificationList />} />
          <Route path="/rectifications/new" element={<NewRectification />} />
          <Route path="/rectifications/:id" element={<RectificationDetail />} />
          <Route path="/reviews" element={<ReviewList />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
