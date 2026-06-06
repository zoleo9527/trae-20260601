import { NavLink, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/students/') && location.pathname !== '/students') {
      return '学员详情';
    }
    if (location.pathname.startsWith('/transfer/')) {
      return '调班申请';
    }
    switch (location.pathname) {
      case '/students':
        return '学员档案';
      case '/approvals':
        return '调班审批';
      default:
        return '学员档案管理系统';
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">🎨 艺术培训中心</div>
        <nav className="sidebar-nav">
          <NavLink to="/students" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>👥</span>
            <span>学员档案</span>
          </NavLink>
          <NavLink to="/approvals" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>📋</span>
            <span>调班审批</span>
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray">当前用户：王主管（校区主管）</span>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
