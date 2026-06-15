import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { MachineList } from '@/components/MachineList';
import { BurnInTestPanel } from '@/components/BurnInTestPanel';
import { ApprovalPanel } from '@/components/ApprovalPanel';
import { ExceptionPanel } from '@/components/ExceptionPanel';
import { ExportPanel } from '@/components/ExportPanel';
import type { Machine, ExportTask, DashboardStats, TestItem } from '@/types';
import {
  getMachines,
  getStats,
  startBurnInTest,
  updateTestItem,
  addException,
  resolveException,
  approveMachine,
  rejectMachine,
  returnToTesting,
  completeDelivery,
  getExportTasks,
  createExportTask,
  completeExportTask,
  generateReportData,
  saveReportAsFile,
} from '@/api/machineApi';
import { setStoredData, STORAGE_KEYS } from '@/utils/storage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMachines: 0,
    pendingTest: 0,
    testing: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    exceptions: 0,
    todayTests: 0,
    todayDeliveries: 0,
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setMachines(getMachines());
    setExportTasks(getExportTasks());
    setStats(getStats());
  };

  const saveAndRefresh = (newMachines: Machine[]) => {
    setStoredData(STORAGE_KEYS.MACHINES, newMachines);
    refreshData();
    if (selectedMachine) {
      const updated = newMachines.find(m => m.id === selectedMachine.id);
      if (updated) {
        setSelectedMachine(updated);
      } else {
        setSelectedMachine(null);
      }
    }
  };

  const saveTasksAndRefresh = (newTasks: ExportTask[]) => {
    setStoredData(STORAGE_KEYS.EXPORT_TASKS, newTasks);
    setExportTasks(newTasks);
  };

  const handleSelectMachine = (machine: Machine) => {
    setSelectedMachine(machine);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedMachine(null);
  };

  const handleStartTest = (machineId: string, operator: string) => {
    const newMachines = startBurnInTest(machineId, operator);
    saveAndRefresh(newMachines);
  };

  const handleUpdateTestItem = (machineId: string, itemId: string, update: Partial<TestItem>) => {
    const newMachines = updateTestItem(machineId, itemId, update);
    saveAndRefresh(newMachines);
  };

  const handleAddException = (machineId: string, exception: Parameters<typeof addException>[1]) => {
    const newMachines = addException(machineId, exception);
    saveAndRefresh(newMachines);
  };

  const handleResolveException = (machineId: string, exceptionId: string, resolution: string, resolvedBy: string) => {
    const newMachines = resolveException(machineId, exceptionId, resolution, resolvedBy);
    saveAndRefresh(newMachines);
  };

  const handleApprove = (machineId: string, approver: string, comments: string) => {
    const newMachines = approveMachine(machineId, approver, comments);
    saveAndRefresh(newMachines);
  };

  const handleReject = (machineId: string, approver: string, comments: string) => {
    const newMachines = rejectMachine(machineId, approver, comments);
    saveAndRefresh(newMachines);
  };

  const handleReturnToTesting = (machineId: string, operator: string, reason: string) => {
    const newMachines = returnToTesting(machineId, operator, reason);
    saveAndRefresh(newMachines);
  };

  const handleCompleteDelivery = (machineId: string, delivery: Parameters<typeof completeDelivery>[1]) => {
    const newMachines = completeDelivery(machineId, delivery);
    saveAndRefresh(newMachines);
  };

  const handleCreateExport = (type: ExportTask['type']) => {
    const result = createExportTask(type);
    saveTasksAndRefresh(result.tasks);
    
    setTimeout(() => {
      const completedTasks = completeExportTask(result.tasks[result.tasks.length - 1].id, result.machines);
      saveTasksAndRefresh(completedTasks);
      
      const reportContent = generateReportData(type, result.machines);
      const task = completedTasks.find(t => t.id === result.tasks[result.tasks.length - 1].id);
      if (task) {
        saveReportAsFile(reportContent, task.filename);
      }
    }, 1000);
  };

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
                    onStartTest={handleStartTest}
                    onUpdateTestItem={handleUpdateTestItem}
                    onReturnToPending={handleReturnToTesting}
                  />
                ) : (
                  <ApprovalPanel
                    machine={selectedMachine}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCompleteDelivery={handleCompleteDelivery}
                    onReturnToTesting={handleReturnToTesting}
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
            onAddException={handleAddException}
            onResolveException={handleResolveException}
          />
        )}

        {activeTab === 'export' && (
          <ExportPanel
            tasks={exportTasks}
            onCreateExport={handleCreateExport}
          />
        )}
      </main>
    </div>
  );
}

export default App;
