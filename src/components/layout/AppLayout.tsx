import { useUserStore } from '@/store/useUserStore';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, setCurrentUser } = useUserStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Header currentUser={currentUser} onUserChange={setCurrentUser} />
        <main className="pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
