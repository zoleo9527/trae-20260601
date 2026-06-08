import { useState } from 'react';
import type { User } from './types';
import { setUserId } from './api';
import RoleSelector from './components/RoleSelector';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ComplaintDetail from './pages/ComplaintDetail';

type View = 'dashboard' | 'complaint';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const handleLogin = (user: User) => {
    setUserId(user.id);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setUserId('');
    setCurrentUser(null);
    setCurrentView('dashboard');
    setSelectedComplaintId(null);
  };

  const handleSelectComplaint = (id: string) => {
    setSelectedComplaintId(id);
    setCurrentView('complaint');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedComplaintId(null);
  };

  if (!currentUser) {
    return <RoleSelector onLogin={handleLogin} />;
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {currentView === 'dashboard' && (
        <Dashboard user={currentUser} onSelectComplaint={handleSelectComplaint} />
      )}
      {currentView === 'complaint' && selectedComplaintId && (
        <ComplaintDetail
          id={selectedComplaintId}
          user={currentUser}
          onBack={handleBack}
        />
      )}
    </Layout>
  );
}
