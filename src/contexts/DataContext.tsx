import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  Vehicle,
  InspectionTask,
  InspectionReport,
  ReportDistribution,
  FollowupTask,
  FollowupResult,
  FollowupRecord,
  ReportStatus,
  FollowupStatus,
  ContactResult,
} from '../types';
import { generateId } from '../utils/helpers';
import { initialMockData } from '../services/mockData';

interface DataContextType {
  vehicles: Vehicle[];
  tasks: InspectionTask[];
  reports: InspectionReport[];
  distributions: ReportDistribution[];
  followups: FollowupTask[];
  
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Vehicle;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  getVehicle: (id: string) => Vehicle | undefined;
  
  addTask: (task: Omit<InspectionTask, 'id' | 'createdAt'>) => InspectionTask;
  updateTask: (id: string, updates: Partial<InspectionTask>) => void;
  
  submitReport: (report: Omit<InspectionReport, 'id' | 'createdAt'>) => InspectionReport;
  auditReport: (id: string, status: ReportStatus, reason?: string, auditorName?: string) => void;
  getReport: (id: string) => InspectionReport | undefined;
  
  distributeReport: (reportId: string) => ReportDistribution;
  updateDistribution: (id: string, updates: Partial<ReportDistribution>) => void;
  
  createFollowup: (distributionId: string, reportId: string, vehicleId: string, ownerName: string, ownerPhone: string) => FollowupTask;
  updateFollowup: (id: string, updates: Partial<FollowupTask>) => void;
  addFollowupRecord: (id: string, record: Omit<FollowupRecord, 'id' | 'taskId' | 'operatedAt'>) => void;
  completeFollowup: (id: string, result: FollowupResult) => void;
  
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [distributions, setDistributions] = useState<ReportDistribution[]>([]);
  const [followups, setFollowups] = useState<FollowupTask[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('vehicle-inspection-data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setVehicles(data.vehicles || []);
        setTasks(data.tasks || []);
        setReports(data.reports || []);
        setDistributions(data.distributions || []);
        setFollowups(data.followups || []);
      } catch {
        setVehicles(initialMockData.vehicles);
        setTasks(initialMockData.tasks);
        setReports(initialMockData.reports);
        setDistributions(initialMockData.distributions);
        setFollowups(initialMockData.followups);
      }
    } else {
      setVehicles(initialMockData.vehicles);
      setTasks(initialMockData.tasks);
      setReports(initialMockData.reports);
      setDistributions(initialMockData.distributions);
      setFollowups(initialMockData.followups);
    }
  }, []);

  useEffect(() => {
    if (vehicles.length > 0 || tasks.length > 0) {
      localStorage.setItem('vehicle-inspection-data', JSON.stringify({
        vehicles,
        tasks,
        reports,
        distributions,
        followups,
      }));
    }
  }, [vehicles, tasks, reports, distributions, followups]);

  const addVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle => {
    const now = new Date().toISOString();
    const vehicle: Vehicle = {
      ...vehicleData,
      id: generateId('V'),
      createdAt: now,
      updatedAt: now,
    };
    setVehicles(prev => [...prev, vehicle]);
    return vehicle;
  }, []);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => 
      v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
    ));
  }, []);

  const getVehicle = useCallback((id: string) => {
    return vehicles.find(v => v.id === id);
  }, [vehicles]);

  const addTask = useCallback((taskData: Omit<InspectionTask, 'id' | 'createdAt'>): InspectionTask => {
    const task: InspectionTask = {
      ...taskData,
      id: generateId('T'),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<InspectionTask>) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  }, []);

  const submitReport = useCallback((reportData: Omit<InspectionReport, 'id' | 'createdAt'>): InspectionReport => {
    const report: InspectionReport = {
      ...reportData,
      id: generateId('R'),
      createdAt: new Date().toISOString(),
    };
    setReports(prev => [...prev, report]);
    
    updateVehicle(reportData.vehicleId, { status: '待审核' });
    
    return report;
  }, [updateVehicle]);

  const auditReport = useCallback((id: string, status: ReportStatus, reason?: string, auditorName?: string) => {
    const report = reports.find(r => r.id === id);
    
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        const updatedReport = {
          ...r,
          status,
          auditorName,
          auditedAt: new Date().toISOString(),
          rejectReason: reason,
        };
        
        if (status === '已通过') {
          updateVehicle(r.vehicleId, { status: '待发放' });
          
          const existingDistribution = distributions.find(d => d.reportId === id);
          if (!existingDistribution) {
            const distribution: ReportDistribution = {
              id: generateId('D'),
              reportId: id,
              vehicleId: r.vehicleId,
              status: '待发放',
              createdAt: new Date().toISOString(),
            };
            setDistributions(prev => [...prev, distribution]);
          }
        } else if (status === '已驳回') {
          updateVehicle(r.vehicleId, { status: '检测中' });
          const task = tasks.find(t => t.reportId === id);
          if (task) {
            updateTask(task.id, { status: '已驳回' });
          }
        }
        
        return updatedReport;
      }
      return r;
    }));
  }, [reports, distributions, tasks, updateVehicle, updateTask]);

  const getReport = useCallback((id: string) => {
    return reports.find(r => r.id === id);
  }, [reports]);

  const distributeReport = useCallback((distributionId: string): ReportDistribution => {
    const distribution = distributions.find(d => d.id === distributionId);
    if (!distribution) throw new Error('Distribution not found');
    
    const report = reports.find(r => r.id === distribution.reportId);
    if (!report) throw new Error('Report not found');

    updateDistribution(distributionId, {
      status: '发放中',
      sentAt: new Date().toISOString(),
    });
    updateVehicle(report.vehicleId, { status: '发放中' });
    
    setTimeout(() => {
      updateDistribution(distributionId, {
        status: '已发放',
        confirmedAt: new Date().toISOString(),
      });
      updateVehicle(report.vehicleId, { status: '已发放' });
      
      const vehicle = vehicles.find(v => v.id === report.vehicleId);
      if (vehicle) {
        const followup = createFollowup(distributionId, distribution.reportId, report.vehicleId, vehicle.ownerName, vehicle.ownerPhone);
        updateDistribution(distributionId, { followupTaskId: followup.id });
      }
    }, 2000);
    
    return distribution;
  }, [distributions, reports, vehicles, updateDistribution, updateVehicle]);

  const updateDistribution = useCallback((id: string, updates: Partial<ReportDistribution>) => {
    setDistributions(prev => prev.map(d => 
      d.id === id ? { ...d, ...updates } : d
    ));
  }, []);

  const createFollowup = useCallback((
    distributionId: string,
    reportId: string,
    vehicleId: string,
    ownerName: string,
    ownerPhone: string
  ): FollowupTask => {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 48);
    
    const followup: FollowupTask = {
      id: generateId('F'),
      distributionId,
      reportId,
      vehicleId,
      ownerName,
      ownerPhone,
      status: '待回访',
      deadline: deadline.toISOString(),
      attempts: 0,
      followupRecords: [],
      createdAt: new Date().toISOString(),
    };
    setFollowups(prev => [...prev, followup]);
    
    setDistributions(prev => prev.map(d => 
      d.id === distributionId ? { ...d, followupTaskId: followup.id } : d
    ));
    
    setTimeout(() => {
      setFollowups(prev => prev.map(f => 
        f.id === followup.id ? { ...f, status: '待回访' } : f
      ));
    }, 100);
    
    return followup;
  }, []);

  const updateFollowup = useCallback((id: string, updates: Partial<FollowupTask>) => {
    setFollowups(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  }, []);

  const addFollowupRecord = useCallback((id: string, recordData: Omit<FollowupRecord, 'id' | 'taskId' | 'operatedAt'>) => {
    const record: FollowupRecord = {
      ...recordData,
      id: generateId('FR'),
      taskId: id,
      operatedAt: new Date().toISOString(),
    };
    
    setFollowups(prev => prev.map(f => {
      if (f.id === id) {
        const newAttempts = f.attempts + 1;
        let newStatus: FollowupStatus = f.status;
        
        if (recordData.contactResult === '成功') {
          newStatus = '回访中';
        } else if (recordData.contactResult === '号码错误' || newAttempts >= 3) {
          newStatus = '无法联系';
        }
        
        return {
          ...f,
          attempts: newAttempts,
          status: newStatus,
          followupRecords: [...f.followupRecords, record],
        };
      }
      return f;
    }));
  }, []);

  const completeFollowup = useCallback((id: string, result: FollowupResult) => {
    const finalRecord: FollowupRecord = {
      id: generateId('FR'),
      taskId: id,
      type: '回访',
      contactResult: '成功',
      reportReceived: result.reportReceived,
      serviceSatisfaction: result.serviceSatisfaction,
      processSatisfaction: result.processSatisfaction,
      feedback: result.feedback,
      operator: '管理员',
      operatedAt: result.completedAt,
    };
    
    setFollowups(prev => prev.map(f => {
      if (f.id === id) {
        const updatedFollowup = {
          ...f,
          status: '已完成' as FollowupStatus,
          result,
          followupRecords: [...f.followupRecords, finalRecord],
        };
        
        const vehicle = vehicles.find(v => v.id === f.vehicleId);
        if (vehicle) {
          updateVehicle(f.vehicleId, { status: '已完成' });
        }
        
        return updatedFollowup;
      }
      return f;
    }));
  }, [vehicles, updateVehicle]);

  const resetData = useCallback(() => {
    setVehicles(initialMockData.vehicles);
    setTasks(initialMockData.tasks);
    setReports(initialMockData.reports);
    setDistributions(initialMockData.distributions);
    setFollowups(initialMockData.followups);
    localStorage.removeItem('vehicle-inspection-data');
  }, []);

  return (
    <DataContext.Provider value={{
      vehicles,
      tasks,
      reports,
      distributions,
      followups,
      addVehicle,
      updateVehicle,
      getVehicle,
      addTask,
      updateTask,
      submitReport,
      auditReport,
      getReport,
      distributeReport,
      updateDistribution,
      createFollowup,
      updateFollowup,
      addFollowupRecord,
      completeFollowup,
      resetData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
