export type DiscrepancyType = 'cash' | 'oil' | 'member' | 'invoice' | 'nozzle';

export type DiscrepancyStatus = 'pending' | 'reviewed' | 'confirmed' | 'resolved';

export type ShiftStatus = 'pending' | 'reviewing' | 'confirmed';

export interface Discrepancy {
  id: string;
  type: DiscrepancyType;
  typeName: string;
  title: string;
  description: string;
  systemValue: number | string;
  actualValue: number | string;
  difference: number | string;
  unit: string;
  status: DiscrepancyStatus;
  reviewOpinion?: string;
  reviewer?: string;
  reviewTime?: string;
}

export interface NozzleData {
  nozzleNo: string;
  oilType: string;
  tankNo: string;
  startReading: number;
  endReading: number;
  systemSales: number;
  actualSales: number;
  difference: number;
  unitPrice: number;
  amount: number;
}

export interface OilData {
  tankNo: string;
  oilType: string;
  startStock: number;
  endStock: number;
  salesVolume: number;
  actualLoss: number;
  standardLoss: number;
  difference: number;
  isRecorded?: boolean;
}

export interface OilLossRecordForm {
  tankNo: string;
  oilType: string;
  endStock: number;
  actualLoss: number;
  remark?: string;
}

export interface ShiftRecord {
  id: string;
  shiftNo: string;
  cashier: string;
  startTime: string;
  endTime: string;
  submitTime: string;
  status: ShiftStatus;
  discrepancies: Discrepancy[];
  oilData?: OilData[];
  nozzleData?: NozzleData[];
  oilLossRecorded?: boolean;
  stationMasterOpinion?: string;
  stationMaster?: string;
  stationMasterTime?: string;
  meterOpinion?: string;
  meter?: string;
  meterTime?: string;
}

export interface DiscrepancySummary {
  type: DiscrepancyType;
  typeName: string;
  count: number;
  amount: number;
  unit: string;
}
