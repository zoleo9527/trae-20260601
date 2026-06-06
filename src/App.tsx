import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { UserRole } from '@/types';
import { Layout } from '@/components/Layout';
import { DormManagerView } from '@/components/DormManagerView';
import { RepairWorkerView } from '@/components/RepairWorkerView';
import { LogisticsSupervisorView } from '@/components/LogisticsSupervisorView';

function App() {
  const { initialize, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const renderView = () => {
    if (!currentUser) return null;
    
    const viewProps = { activeTab, setActiveTab };
    
    switch (currentUser.role as UserRole) {
      case 'dorm_manager':
        return <DormManagerView {...viewProps} />;
      case 'repair_worker':
        return <RepairWorkerView {...viewProps} />;
      case 'logistics_supervisor':
        return <LogisticsSupervisorView {...viewProps} />;
      default:
        return <DormManagerView {...viewProps} />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

export default App;
