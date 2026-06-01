import { Injectable } from '@nestjs/common';
import { BaseStateMachine, StateTransition } from '../../../common/state-machine/base-state-machine';
import { OffShelfStatus } from '../enums/off-shelf-status.enum';
import { OffShelfAction } from '../enums/off-shelf-action.enum';
import { ErrorCode } from '../../../common/error-codes';

@Injectable()
export class OffShelfStateMachine extends BaseStateMachine<OffShelfStatus, OffShelfAction> {
  protected entityName = '下架单';
  protected invalidTransitionCode = ErrorCode.OFF_SHELF_INVALID_TRANSITION;

  protected transitions: StateTransition<OffShelfStatus, OffShelfAction>[] = [
    {
      from: [OffShelfStatus.CREATED],
      to: OffShelfStatus.SUBMITTED,
      action: OffShelfAction.SUBMIT,
      allowedRoles: ['STAFF'],
    },
    {
      from: [OffShelfStatus.SUBMITTED],
      to: OffShelfStatus.CONFIRMED,
      action: OffShelfAction.CONFIRM,
      allowedRoles: ['PHARMACIST'],
    },
    {
      from: [OffShelfStatus.SUBMITTED],
      to: OffShelfStatus.REJECTED,
      action: OffShelfAction.REJECT,
      allowedRoles: ['PHARMACIST'],
    },
    {
      from: [OffShelfStatus.CREATED, OffShelfStatus.SUBMITTED],
      to: OffShelfStatus.CANCELLED,
      action: OffShelfAction.CANCEL,
      allowedRoles: ['STAFF', 'MANAGER'],
    },
  ];
}
