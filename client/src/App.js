import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import Risks from './pages/Risks';
import Maintenance from './pages/Maintenance';
import Reservations from './pages/Reservations';
import { userAPI } from './api';

const roleLabels = {
  frontdesk: '前台',
  belayer: '保护员',
  routesetter: '线路管理员',
  manager: '经理'
};

function App() {
  const [users, setUsers] = useState([]);
  const [currentRole, setCurrentRole] = useState(localStorage.getItem('currentRole') || 'manager');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data);
      const user = data.find(u => u.role === currentRole) || data[0];
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUserId', user.id);
      }
    } catch (e) {
      console.error('加载用户失败', e);
    }
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    localStorage.setItem('currentRole', role);
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', user.id);
    }
    window.dispatchEvent(new Event('roleChange'));
  };

  const navItems = [
    { path: '/', label: '今日待办', icon: '📋' },
    { path: '/schedules', label: '保护员排班', icon: '📅' },
    { path: '/risks', label: '风险提示', icon: '⚠️' },
    { path: '/maintenance', label: '线路维护', icon: '🔧' },
    { path: '/reservations', label: '会员预约', icon: '📝' }
  ];

  return (
    <Router>
      <div className="app">
        <div className="sidebar">
          <div className="logo">🧗 攀岩馆运营</div>
          <ul className="nav-menu">
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink to={item.path} className={({isActive}) => isActive ? 'active' : ''}>
                  {item.icon} {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="main-content">
          <div className="header">
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </h2>
            </div>
            <div className="header-right">
              <select 
                className="role-selector" 
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>切换为: {label}</option>
                ))}
              </select>
              {currentUser && (
                <div className="user-info">
                  <div className="avatar">{currentUser.name[0]}</div>
                  <span style={{ fontSize: '14px' }}>{currentUser.name}</span>
                  <span className="badge badge-blue">{roleLabels[currentUser.role]}</span>
                </div>
              )}
            </div>
          </div>

          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard currentRole={currentRole} currentUser={currentUser} />} />
              <Route path="/schedules" element={<Schedules currentRole={currentRole} currentUser={currentUser} />} />
              <Route path="/risks" element={<Risks currentRole={currentRole} currentUser={currentUser} />} />
              <Route path="/maintenance" element={<Maintenance currentRole={currentRole} currentUser={currentUser} />} />
              <Route path="/reservations" element={<Reservations currentRole={currentRole} currentUser={currentUser} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
