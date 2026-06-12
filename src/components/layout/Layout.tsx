import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { mockUsers } from '../../data/mockData';
import { useProjectStore } from '../../stores/projectStore';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, initializeStore, setCurrentUser } = useProjectStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  useEffect(() => {
    if (!currentUser) {
      const savedUser = mockUsers[0];
      setCurrentUser(savedUser);
    }
  }, [currentUser, setCurrentUser]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentPath={location.pathname} 
        onQuickAction={handleTabChange}
        currentTab={searchParams.get('tab') || 'all'}
      />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
