
import {
  Station,
  Device,
  Fault,
  FaultTimeline,
  WorkOrder,
  Order,
  Complaint,
  Settlement,
  SettlementAdjustment,
  Dispute,
  User,
} from '../../shared/types';

import {
  users as initialUsers,
  stations as initialStations,
  devices as initialDevices,
  faults as initialFaults,
  faultTimelines as initialFaultTimelines,
  workOrders as initialWorkOrders,
  orders as initialOrders,
  complaints as initialComplaints,
  settlements as initialSettlements,
  settlementAdjustments as initialSettlementAdjustments,
  disputes as initialDisputes,
} from './mockData.js';

export let users: User[] = [...initialUsers];
export let stations: Station[] = [...initialStations];
export let devices: Device[] = [...initialDevices];
export let faults: Fault[] = [...initialFaults];
export let faultTimelines: FaultTimeline[] = [...initialFaultTimelines];
export let workOrders: WorkOrder[] = [...initialWorkOrders];
export let orders: Order[] = [...initialOrders];
export let complaints: Complaint[] = [...initialComplaints];
export let settlements: Settlement[] = [...initialSettlements];
export let settlementAdjustments: SettlementAdjustment[] = [...initialSettlementAdjustments];
export let disputes: Dispute[] = [...initialDisputes];

export function resetData() {
  users = [...initialUsers];
  stations = [...initialStations];
  devices = [...initialDevices];
  faults = [...initialFaults];
  faultTimelines = [...initialFaultTimelines];
  workOrders = [...initialWorkOrders];
  orders = [...initialOrders];
  complaints = [...initialComplaints];
  settlements = [...initialSettlements];
  settlementAdjustments = [...initialSettlementAdjustments];
  disputes = [...initialDisputes];
}
