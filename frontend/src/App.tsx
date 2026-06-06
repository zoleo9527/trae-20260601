import React, { useState } from 'react';
import './index.css';
import TodoPage from './pages/TodoPage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import { ROLE_LABELS, UserRole } from './types';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState<'todos' | 'tickets' | 'detail'>('todos');
  const [previousPage, setPreviousPage] = useState<'todos' | 'tickets'>('todos');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const resetPageState = () => {
    setCurrentPage('todos');
    setPreviousPage('todos');
    setSelectedTicketId(null);
  };

  const handleSelectRole = (role: UserRole) => {
    resetPageState();
    setCurrentRole(role);
  };

  const handleLogout = () => {
    resetPageState();
    setCurrentRole(null);
  };

  if (!currentRole) {
    return (
      <div className="role-selector">
        <h1>影院运营-团体票预约与核销复核系统</h1>
        <p>请选择您的角色进入系统</p>
        <div className="role-buttons">
          {(['scheduling_manager', 'ticket_supervisor', 'duty_manager'] as UserRole[]).map(role => (
            <button
              key={role}
              className="role-btn"
              onClick={() => handleSelectRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleViewTicket = (ticketId: string) => {
    setPreviousPage(currentPage === 'detail' ? previousPage : currentPage as 'todos' | 'tickets');
    setSelectedTicketId(ticketId);
    setCurrentPage('detail');
  };

  const handleBack = () => {
    setSelectedTicketId(null);
    setCurrentPage(previousPage);
  };

  const handleNavClick = (page: 'todos' | 'tickets') => {
    if (currentPage !== 'detail') {
      setPreviousPage(currentPage as 'todos' | 'tickets');
    }
    setSelectedTicketId(null);
    setCurrentPage(page);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>影院团体票系统</h1>
          <span className="current-role">当前角色：{ROLE_LABELS[currentRole]}</span>
        </div>
        <div className="header-right">
          <nav className="nav">
            <button
              className={currentPage === 'todos' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handleNavClick('todos')}
            >
              我的待办
            </button>
            <button
              className={currentPage === 'tickets' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handleNavClick('tickets')}
            >
              团体票记录
            </button>
          </nav>
          <button className="logout-btn" onClick={handleLogout}>
            切换角色
          </button>
        </div>
      </header>

      <main className="app-main">
        <div style={{ display: currentPage === 'todos' ? 'block' : 'none' }}>
          <TodoPage role={currentRole} onViewTicket={handleViewTicket} />
        </div>
        <div style={{ display: currentPage === 'tickets' ? 'block' : 'none' }}>
          <TicketListPage role={currentRole} onViewTicket={handleViewTicket} />
        </div>
        {currentPage === 'detail' && selectedTicketId && (
          <TicketDetailPage
            ticketId={selectedTicketId}
            role={currentRole}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
};

export default App;
