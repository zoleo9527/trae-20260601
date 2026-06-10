export const UserRole = {
  INSPECTOR: "INSPECTOR",
  DISPATCHER: "DISPATCHER",
  AREA_MANAGER: "AREA_MANAGER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const HotspotStatus = {
  PENDING: "PENDING",
  DISPATCHED: "DISPATCHED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type HotspotStatus = (typeof HotspotStatus)[keyof typeof HotspotStatus];

export const ActionType = {
  SUBMIT: "SUBMIT",
  DISPATCH: "DISPATCH",
  ACCEPT: "ACCEPT",
  UPDATE: "UPDATE",
  COMPLETE: "COMPLETE",
  CANCEL: "CANCEL",
  COMMENT: "COMMENT",
  ATTACH: "ATTACH",
} as const;
export type ActionType = (typeof ActionType)[keyof typeof ActionType];
