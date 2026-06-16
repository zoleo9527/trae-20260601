import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Header from '@/components/layout/Header';
import OutOfStockList from '@/components/outOfStock/OutOfStockList';
import ReplenishList from '@/components/replenish/ReplenishList';
import OperationLogs from '@/components/logs/OperationLogs';
import { mockUsers } from '@/data/mockData';
import type { User } from '@/types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [activeTab, setActiveTab] = useState('outOfStock');

  return (
    <Layout>
      <Header 
        currentUser={currentUser} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <main className="max-w-7xl mx-auto">
        {activeTab === 'outOfStock' && <OutOfStockList currentUser={currentUser} />}
        {activeTab === 'replenish' && <ReplenishList currentUser={currentUser} />}
        {activeTab === 'logs' && <OperationLogs />}
      </main>

      <div className="fixed bottom-4 right-4">
        <select
          value={currentUser.id}
          onChange={(e) => {
            const user = mockUsers.find(u => u.id === e.target.value);
            if (user) setCurrentUser(user);
          }}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {mockUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role === 'manager' ? '店长' : user.role === 'supervisor' ? '区域督导' : '采购'})
            </option>
          ))}
        </select>
      </div>
    </Layout>
  );
}
