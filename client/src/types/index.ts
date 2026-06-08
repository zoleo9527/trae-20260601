export type TourGroupStatus =
  | 'pending_dispatch'
  | 'dispatched'
  | 'checked_in'
  | 'fleet_ready'
  | 'completed'
  | 'stuck';

export type DispatchStatus = 'pending' | 'dispatched' | 'confirmed';

export type CheckInStatus = 'pending' | 'checked_in' | 'exception';

export type FleetStatus = 'pending' | 'ready' | 'delayed';

export type Role = 'dispatcher' | 'guide' | 'fleet';

export interface TourGroup {
  id: string;
  groupCode: string;
  tourName: string;
  route: string;
  tourDate: string;
  status: TourGroupStatus;
  createdAt: string;
}

export interface Dispatch {
  id: string;
  tourGroupId: string;
  guideId: string;
  dispatchedAt: string | null;
  dispatchStatus: DispatchStatus;
}

export interface CheckIn {
  id: string;
  tourGroupId: string;
  guideId: string;
  checkedInAt: string | null;
  checkInStatus: CheckInStatus;
  exception: string | null;
}

export interface FleetAssignment {
  id: string;
  tourGroupId: string;
  plateNumber: string;
  driverName: string;
  fleetStatus: FleetStatus;
  confirmedAt: string | null;
}

export interface Guide {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'on_tour' | 'off';
}

export interface FilterState {
  keyword: string;
  status: TourGroupStatus | '';
  dateRange: [string, string] | null;
  guideName: string;
}

export const STATUS_LABELS: Record<TourGroupStatus, string> = {
  pending_dispatch: '待派遣',
  dispatched: '已派遣',
  checked_in: '已签到',
  fleet_ready: '车队就位',
  completed: '正常关闭',
  stuck: '卡住/异常',
};

export const DISPATCH_STATUS_LABELS: Record<DispatchStatus, string> = {
  pending: '待派遣',
  dispatched: '已派遣',
  confirmed: '导游已确认',
};

export const CHECKIN_STATUS_LABELS: Record<CheckInStatus, string> = {
  pending: '待签到',
  checked_in: '已签到',
  exception: '异常上报',
};

export const FLEET_STATUS_LABELS: Record<FleetStatus, string> = {
  pending: '待确认',
  ready: '就位',
  delayed: '延误',
};
