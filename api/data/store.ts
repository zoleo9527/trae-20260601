
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

function deepCopy<T>(data: T[]): T[] {
  return JSON.parse(JSON.stringify(data));
}

export let users: User[] = deepCopy(initialUsers);
export let stations: Station[] = deepCopy(initialStations);
export let devices: Device[] = deepCopy(initialDevices);
export let faults: Fault[] = deepCopy(initialFaults);
export let faultTimelines: FaultTimeline[] = deepCopy(initialFaultTimelines);
export let workOrders: WorkOrder[] = deepCopy(initialWorkOrders);
export let orders: Order[] = deepCopy(initialOrders);
export let complaints: Complaint[] = deepCopy(initialComplaints);
export let settlements: Settlement[] = deepCopy(initialSettlements);
export let settlementAdjustments: SettlementAdjustment[] = deepCopy(initialSettlementAdjustments);
export let disputes: Dispute[] = deepCopy(initialDisputes);

export function resetData() {
  users = deepCopy(initialUsers);
  stations = deepCopy(initialStations);
  devices = deepCopy(initialDevices);
  faults = deepCopy(initialFaults);
  faultTimelines = deepCopy(initialFaultTimelines);
  workOrders = deepCopy(initialWorkOrders);
  orders = deepCopy(initialOrders);
  complaints = deepCopy(initialComplaints);
  settlements = deepCopy(initialSettlements);
  settlementAdjustments = deepCopy(initialSettlementAdjustments);
  disputes = deepCopy(initialDisputes);
}
