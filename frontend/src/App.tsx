import React, { useState } from 'react';
import './index.css';
import CaseDetailPage from './pages/CaseDetailPage';
import CaseListPage from './pages/CaseListPage';
import TodoPage from './pages/TodoPage';
import { ROLE_LABELS, UserRole } from './types';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState<'todos' | 'cases' | 'detail'>('todos');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  if (!currentRole) {
    return (
      <div className="role-selector">
        <h1>MCN结案数据与费用结算系统</h1>
        <p>请选择您的角色进入系统</p>
        <div className="role-buttons">
          {(['business', 'director', 'talent_agent', 'finance'] as UserRole[]).map(role => (
            <button
              key={role}
              className="role-btn"
              onClick={() => setCurrentRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleViewCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentPage('detail');
  };

  const handleBack = () => {
    setSelectedCaseId(null);
    setCurrentPage('todos');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>MCN结案系统</h1>
          <span className="current-role">当前角色：{ROLE_LABELS[currentRole]}</span>
        </div>
        <div className="header-right">
          <nav className="nav">
            <button
              className={currentPage === 'todos' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('todos')}
            >
              我的待办
            </button>
            <button
              className={currentPage === 'cases' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('cases')}
            >
              结案记录
            </button>
          </nav>
          <button className="logout-btn" onClick={() => setCurrentRole(null)}>
            切换角色
          </button>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'todos' && (
          <TodoPage role={currentRole} onViewCase={handleViewCase} />
        )}
        {currentPage === 'cases' && (
          <CaseListPage role={currentRole} onViewCase={handleViewCase} />
        )}
        {currentPage === 'detail' && selectedCaseId && (
          <CaseDetailPage
            caseId={selectedCaseId}
            role={currentRole}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
};

export default App;
