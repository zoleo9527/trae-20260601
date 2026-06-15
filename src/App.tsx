import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Scheduling from './components/Scheduling';
import Checkin from './components/Checkin';
import Logs from './components/Logs';
import Staff from './components/Staff';
import Reviews from './components/Reviews';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <Orders />;
      case 'scheduling':
        return <Scheduling />;
      case 'checkin':
        return <Checkin />;
      case 'logs':
        return <Logs />;
      case 'staff':
        return <Staff />;
      case 'reviews':
        return <Reviews />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="家政服务管理系统" />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 min-h-screen overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
