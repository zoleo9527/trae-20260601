import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useStore';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import DispatcherView from './views/DispatcherView';
import InstallerView from './views/InstallerView';
import CustomerServiceView from './views/CustomerServiceView';

const App: React.FC = () => {
  const { currentUser } = useAppStore();
  const [activeView, setActiveView] = useState('all');

  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'dispatcher':
          setActiveView('all');
          break;
        case 'installer':
          setActiveView('my_tasks');
          break;
        case 'customer_service':
          setActiveView('all');
          break;
        default:
          setActiveView('all');
      }
    }
  }, [currentUser?.role]);

  const renderView = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'dispatcher':
        return (
          <DispatcherView
            activeView={activeView}
            onViewChange={setActiveView}
          />
        );
      case 'installer':
        return (
          <InstallerView
            activeView={activeView}
            onViewChange={setActiveView}
          />
        );
      case 'customer_service':
        return (
          <CustomerServiceView
            activeView={activeView}
            onViewChange={setActiveView}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-content">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="content-area" style={{ padding: 0, display: 'flex' }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;
