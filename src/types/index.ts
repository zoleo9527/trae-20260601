export type StorageStatus = 'pending' | 'stored' | 'abnormal' | 'completed';

export type TemperatureStatus = 'normal' | 'warning' | 'critical';

export interface TemperatureRecord {
  id: string;
  storageId: string;
  timestamp: string;
  temperature: number;
  status: TemperatureStatus;
  recordedBy: string;
  remark?: string;
}

export interface HistoryNote {
  id: string;
  storageId: string;
  timestamp: string;
  operator: string;
  action: string;
  content: string;
}

export interface StorageItem {
  id: string;
  batchNo: string;
  productName: string;
  productType: string;
  quantity: number;
  unit: string;
  weight: number;
  source: string;
  slaughterDate: string;
  storageRoom: string;
  shelfNo: string;
  inboundTime: string;
  expectedOutboundTime?: string;
  operator: string;
  status: StorageStatus;
  initialTemperature: number;
  targetTemperature: number;
  currentTemperature: number;
  temperatureRecords: TemperatureRecord[];
  historyNotes: HistoryNote[];
  abnormalDescription?: string;
  abnormalTime?: string;
  handler?: string;
  completeTime?: string;
}

export interface BackupRecord {
  id: string;
  name: string;
  timestamp: string;
  description: string;
  itemCount: number;
  recordCount: number;
}
