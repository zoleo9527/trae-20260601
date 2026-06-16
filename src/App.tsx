import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
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
  const { fetchUsers, fetchSoupBases, fetchSoldOuts, fetchOrders, fetchAuditLogs, fetchTodoItems } = useStore();

  useEffect(() => {
    const loadAllData = async () => {
      await fetchUsers();
      await fetchSoupBases();
      await fetchSoldOuts();
      await fetchOrders();
      await fetchAuditLogs();
      await fetchTodoItems();
    };
    loadAllData();
  }, [fetchUsers, fetchSoupBases, fetchSoldOuts, fetchOrders, fetchAuditLogs, fetchTodoItems]);

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
