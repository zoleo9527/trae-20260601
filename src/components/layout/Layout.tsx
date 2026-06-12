import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { mockUsers } from '../../data/mockData';
import { useProjectStore } from '../../stores/projectStore';
import { storage } from '../../utils/storage';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentUser, initializeStore, setCurrentUser } = useProjectStore();

  useEffect(() => {
    const savedUser = storage.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      storage.setCurrentUser(mockUsers[0]);
      setCurrentUser(mockUsers[0]);
    }
    setIsInitialized(true);
  }, [setCurrentUser]);

  useEffect(() => {
    if (isInitialized) {
      initializeStore();
    }
  }, [isInitialized, initializeStore]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
