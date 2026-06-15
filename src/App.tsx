import { useState } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { MachineList } from '@/components/MachineList';
import { BurnInTestPanel } from '@/components/BurnInTestPanel';
import { ApprovalPanel } from '@/components/ApprovalPanel';
import { ExceptionPanel } from '@/components/ExceptionPanel';
import { ExportPanel } from '@/components/ExportPanel';
import { useMachineStore } from '@/store/machineStore';
import type { Machine } from '@/types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const {
    machines,
    exportTasks,
    getStats,
    startBurnInTest,
    updateTestItem,
    addException,
    resolveException,
    approveMachine,
    rejectMachine,
    returnToTesting,
    completeDelivery,
    createExportTask,
  } = useMachineStore();

  const handleSelectMachine = (machine: Machine) => {
    setSelectedMachine(machine);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedMachine(null);
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard stats={stats} onNavigate={handleTabChange} />
        )}

        {(activeTab === 'testing' || activeTab === 'approval') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <MachineList 
                machines={machines} 
                onSelect={handleSelectMachine}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedMachine ? (
                activeTab === 'testing' ? (
                  <BurnInTestPanel
                    machine={selectedMachine}
                    onStartTest={startBurnInTest}
                    onUpdateTestItem={updateTestItem}
                    onReturnToPending={returnToTesting}
                  />
                ) : (
                  <ApprovalPanel
                    machine={selectedMachine}
                    onApprove={approveMachine}
                    onReject={rejectMachine}
                    onCompleteDelivery={completeDelivery}
                  />
                )
              ) : (
                <div className="card flex items-center justify-center h-96">
                  <div className="text-center">
                    <p className="text-gray-500">请从左侧选择一个订单</p>
                    <p className="text-sm text-gray-400 mt-1">查看烤机测试或交付验收详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'exceptions' && (
          <ExceptionPanel
            machines={machines}
            onAddException={addException}
            onResolveException={resolveException}
          />
        )}

        {activeTab === 'export' && (
          <ExportPanel
            tasks={exportTasks}
            onCreateExport={createExportTask}
          />
        )}
      </main>
    </div>
  );
}

export default App;
