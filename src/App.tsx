import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { seedUsers } from '@/data/seedData';
import { AuditLog } from '@/pages/AuditLog';
import { Dashboard } from '@/pages/Dashboard';
import { OrderManagement } from '@/pages/OrderManagement';
import { SoldOutManagement } from '@/pages/SoldOutManagement';
import { SoupBaseManagement } from '@/pages/SoupBaseManagement';
import { TodoManagement } from '@/pages/TodoManagement';
import { useStore } from '@/store/store';
import { useEffect, useState } from 'react';

const pages: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  soupbase: SoupBaseManagement,
  soldout: SoldOutManagement,
  orders: OrderManagement,
  todos: TodoManagement,
  audit: AuditLog,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { loadData, setCurrentUser, selectedRole } = useStore();

  useEffect(() => {
    loadData();
    const user = seedUsers.find(u => u.role === selectedRole);
    if (user) {
      setCurrentUser(user);
    }
  }, [loadData, setCurrentUser, selectedRole]);

  const PageComponent = pages[activeTab] || Dashboard;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1">
          <PageComponent />
        </main>
      </div>
    </div>
  );
}
