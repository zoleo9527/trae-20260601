import { useState, useCallback } from 'react';
import { Equipment, MaintenancePlan, PartsInventory, OperationLog, Exception, User } from '../types';

interface AppState {
  currentUser: User | null;
  equipment: Equipment[];
  maintenancePlans: MaintenancePlan[];
  partsInventory: PartsInventory[];
  logs: OperationLog[];
  exceptions: Exception[];
}

export function useAppStore() {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    equipment: [],
    maintenancePlans: [],
    partsInventory: [],
    logs: [],
    exceptions: [],
  });

  const setCurrentUser = useCallback((user: User | null) => {
    setState(prev => ({ ...prev, currentUser: user }));
  }, []);

  const setEquipment = useCallback((equipment: Equipment[]) => {
    setState(prev => ({ ...prev, equipment }));
  }, []);

  const setMaintenancePlans = useCallback((plans: MaintenancePlan[]) => {
    setState(prev => ({ ...prev, maintenancePlans: plans }));
  }, []);

  const setPartsInventory = useCallback((parts: PartsInventory[]) => {
    setState(prev => ({ ...prev, partsInventory: parts }));
  }, []);

  const setLogs = useCallback((logs: OperationLog[]) => {
    setState(prev => ({ ...prev, logs }));
  }, []);

  const setExceptions = useCallback((exceptions: Exception[]) => {
    setState(prev => ({ ...prev, exceptions }));
  }, []);

  const updateEquipment = useCallback((id: string, updates: Partial<Equipment>) => {
    setState(prev => ({
      ...prev,
      equipment: prev.equipment.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const updateMaintenancePlan = useCallback((id: string, updates: Partial<MaintenancePlan>) => {
    setState(prev => ({
      ...prev,
      maintenancePlans: prev.maintenancePlans.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const updatePart = useCallback((id: string, updates: Partial<PartsInventory>) => {
    setState(prev => ({
      ...prev,
      partsInventory: prev.partsInventory.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const addLog = useCallback((log: OperationLog) => {
    setState(prev => ({
      ...prev,
      logs: [log, ...prev.logs],
    }));
  }, []);

  const addException = useCallback((exception: Exception) => {
    setState(prev => ({
      ...prev,
      exceptions: [exception, ...prev.exceptions],
    }));
  }, []);

  const updateException = useCallback((id: string, updates: Partial<Exception>) => {
    setState(prev => ({
      ...prev,
      exceptions: prev.exceptions.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  return {
    state,
    setCurrentUser,
    setEquipment,
    setMaintenancePlans,
    setPartsInventory,
    setLogs,
    setExceptions,
    updateEquipment,
    updateMaintenancePlan,
    updatePart,
    addLog,
    addException,
    updateException,
  };
}
