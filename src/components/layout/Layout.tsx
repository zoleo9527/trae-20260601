import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useProjectStore } from '../../stores/projectStore';
import { mockUsers } from '../../data/mockData';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  const location = useLocation();
  const { currentUser, setCurrentUser } = useProjectStore();

  useEffect(() => {
    if (!currentUser) {
      setCurrentUser(mockUsers[0]);
    }
  }, [currentUser, setCurrentUser]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPath={location.pathname} />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
