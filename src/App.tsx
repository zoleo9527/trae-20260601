import { useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import ConfirmationPage from '@/pages/Confirmation';
import CollectionPage from '@/pages/Collection';
import HistoryPage from '@/pages/History';
import { mockUsers } from '@/data/mockData';
import { useStore } from '@/store/useStore';
import type { User, UserRole } from '@/types';

export default function App() {
  const [currentPath, setCurrentPath] = useState('/confirmation');
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const { state, actions } = useStore();

  const handleMenuClick = (key: string) => {
    setCurrentPath(key);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/confirmation':
        return (
          <ConfirmationPage 
            currentUserRole={currentUser.role} 
            confirmations={state.confirmations}
            actions={actions}
          />
        );
      case '/collection':
        return (
          <CollectionPage 
            currentUserRole={currentUser.role} 
            collections={state.collections}
            actions={actions}
          />
        );
      case '/history':
        return <HistoryPage logs={state.logs} />;
      default:
        return (
          <ConfirmationPage 
            currentUserRole={currentUser.role} 
            confirmations={state.confirmations}
            actions={actions}
          />
        );
    }
  };

  return (
    <AppLayout 
      currentUser={currentUser} 
      currentPath={currentPath}
      onMenuClick={handleMenuClick}
      onRoleChange={handleRoleChange}
    >
      {renderPage()}
    </AppLayout>
  );
}