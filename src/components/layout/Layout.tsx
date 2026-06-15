import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/': '',
  '/inspections': '出场验机管理',
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [pageKey, setPageKey] = useState(location.pathname);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  const getPageTitle = () => {
    if (location.pathname === '/') return '';
    if (location.pathname.startsWith('/inspections/')) {
      const id = location.pathname.split('/')[2];
      if (location.pathname.endsWith('/sign')) return '司机签收';
      if (location.pathname.endsWith('/review')) return '签收回看';
      return '验机详情';
    }
    return pageTitles[location.pathname] || '';
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getPageTitle()} />
        <main
          key={pageKey}
          className="flex-1 p-6 overflow-auto animate-fadeIn"
          style={{ animation: 'fadeInUp 0.3s ease-out' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
