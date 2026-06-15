import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { OrderManagement } from '@/components/OrderManagement';
import { OrderWorkflow } from '@/components/OrderWorkflow';
import { LocationManagement } from '@/components/LocationManagement';
import { DeliveryNotes } from '@/components/DeliveryNotes';
import { TeamManagement } from '@/components/TeamManagement';

function App() {
  const [currentMenu, setCurrentMenu] = useState('workflow');

  const renderContent = () => {
    switch (currentMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'workflow':
        return <OrderWorkflow />;
      case 'orders':
        return <OrderManagement />;
      case 'locations':
        return <LocationManagement />;
      case 'delivery':
        return <DeliveryNotes />;
      case 'team':
        return <TeamManagement />;
      default:
        return <OrderWorkflow />;
    }
  };

  return (
    <Layout currentMenu={currentMenu} onMenuChange={setCurrentMenu}>
      {renderContent()}
    </Layout>
  );
}

export default App;