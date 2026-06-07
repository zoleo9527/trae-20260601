import { MilkChangeStatus, MilkChangeType, ReturnReason } from '../common/enums';

export class CreateMilkChangeDto {
  customerId: string;
  changeType: MilkChangeType;
  changeDetail?: string;
  oldProduct?: string;
  oldQuantity?: number;
  newProduct?: string;
  newQuantity?: number;
  oldAddress?: string;
  newAddress?: string;
  oldDeliveryTime?: string;
  newDeliveryTime?: string;
  oldRouteId?: string;
  oldRouteName?: string;
  newRouteId?: string;
  newRouteName?: string;
  routeAdjustReason?: string;
  assignedToId?: string;
  remark?: string;
  effectiveDate?: string;
  supplementRemark?: string;
}

export class ProcessMilkChangeDto {
  handlerId: string;
  targetStatus: MilkChangeStatus;
  remark?: string;
  returnReason?: ReturnReason;
  returnDetail?: string;
  assignedToId?: string;
  supplementRemark?: string;
  newRouteId?: string;
  newRouteName?: string;
  routeAdjustReason?: string;
  newProduct?: string;
  newQuantity?: number;
  newAddress?: string;
  newDeliveryTime?: string;
  changeDetail?: string;
  effectiveDate?: string;
  expectedCompleteAt?: string;
}

export class ListMilkChangeDto {
  status?: MilkChangeStatus;
  customerId?: string;
  handlerRole?: string;
  handlerId?: string;
  page?: number;
  pageSize?: number;
}

export class AssignRouteDto {
  handlerId: string;
  newRouteId: string;
  newRouteName: string;
  routeAdjustReason?: string;
  remark?: string;
}
