export { differenceApi, lossApi, alertApi, dashboardApi, setCurrentApiUser } from './mockApi';
export type {
  ApiResponse,
  UpdateDifferenceStatusRequest,
  UpdateLossStatusRequest,
  UpdateAlertStatusRequest,
  IDifferenceApi,
  ILossApi,
  IAlertApi,
  IDashboardApi,
} from './types';
export {
  canTransitionDifference,
  canTransitionLoss,
  validateDifferenceLossLink,
  ALLOWED_DIFFERENCE_TRANSITIONS,
  ALLOWED_LOSS_TRANSITIONS,
  ROLE_DIFFERENCE_ACTIONS,
  ROLE_LOSS_ACTIONS,
} from './stateConstraints';
