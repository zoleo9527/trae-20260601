import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { EquipmentList } from './components/EquipmentList';
import { MaintenancePlans } from './components/MaintenancePlans';
import { PartsInventory } from './components/PartsInventory';
import { OperationLogs } from './components/OperationLogs';
import { Exceptions } from './components/Exceptions';
import { User } from './types';
import { equipmentAPI, maintenanceAPI, partsAPI, logsAPI, exceptionsAPI, systemAPI } from './api';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [equipment, setEquipment] = useState<any[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<any[]>([]);
  const [partsInventory, setPartsInventory] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [eq, mp, pi, lg, ex] = await Promise.all([
        equipmentAPI.getAll(),
        maintenanceAPI.getAll(),
        partsAPI.getAll(),
        logsAPI.getAll(),
        exceptionsAPI.getAll(),
      ]);
      setEquipment(eq);
      setMaintenancePlans(mp);
      setPartsInventory(pi);
      setLogs(lg);
      setExceptions(ex);
      
      await systemAPI.checkOverdue();
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentPage('dashboard');
  };

  const handleUpdate = () => {
    loadData();
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const pendingExceptions = exceptions.filter(e => e.status === 'pending').length;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            equipment={equipment} 
            maintenancePlans={maintenancePlans}
            partsInventory={partsInventory}
            exceptions={exceptions}
            onNavigate={setCurrentPage}
          />
        );
      case 'equipment':
        return <EquipmentList equipment={equipment} currentUser={currentUser} onUpdate={handleUpdate} />;
      case 'maintenance':
        return <MaintenancePlans plans={maintenancePlans} equipment={equipment} currentUser={currentUser} onUpdate={handleUpdate} />;
      case 'parts':
        return <PartsInventory parts={partsInventory} currentUser={currentUser} onUpdate={handleUpdate} />;
      case 'logs':
        return <OperationLogs logs={logs} />;
      case 'exceptions':
        return <Exceptions exceptions={exceptions} currentUser={currentUser} onUpdate={handleUpdate} />;
      default:
        return (
          <Dashboard 
            equipment={equipment} 
            maintenancePlans={maintenancePlans}
            partsInventory={partsInventory}
            exceptions={exceptions}
            onNavigate={setCurrentPage}
          />
        );
    }
  };

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      pendingExceptions={pendingExceptions}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;