export type DispatchStatus = 'pending' | 'dispatched' | 'accepted' | 'rejected' | 'reassigned';

export interface DispatchRecord {
  id: string;
  repairOrderId: string;
  repairOrderNo: string;
  repairTitle: string;
  dispatcherId: string;
  dispatcherName: string;
  workerId: string;
  workerName: string;
  status: DispatchStatus;
  dispatchNote?: string;
  workerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}
