import { Injectable } from '@nestjs/common';
import { BaseStateMachine, StateTransition } from '../../../common/state-machine/base-state-machine';
import { ErrorCode } from '../../../common/error-codes';
import { TransferStatus, TransferAction } from '../enums';

@Injectable()
export class TransferStateMachine extends BaseStateMachine<TransferStatus, TransferAction> {
  protected entityName = '调拨单';
  protected invalidTransitionCode = ErrorCode.TRANSFER_INVALID_TRANSITION;

  protected transitions: StateTransition<TransferStatus, TransferAction>[] = [
    {
      from: [TransferStatus.DRAFT],
      to: TransferStatus.SUBMITTED,
      action: TransferAction.SUBMIT,
      allowedRoles: ['STAFF'],
    },
    {
      from: [TransferStatus.SUBMITTED],
      to: TransferStatus.APPROVED,
      action: TransferAction.APPROVE,
      allowedRoles: ['MANAGER'],
    },
    {
      from: [TransferStatus.SUBMITTED],
      to: TransferStatus.REJECTED,
      action: TransferAction.REJECT,
      allowedRoles: ['MANAGER'],
    },
    {
      from: [TransferStatus.APPROVED],
      to: TransferStatus.COMPLETED,
      action: TransferAction.COMPLETE,
      allowedRoles: ['STAFF'],
    },
    {
      from: [TransferStatus.DRAFT, TransferStatus.SUBMITTED],
      to: TransferStatus.CANCELLED,
      action: TransferAction.CANCEL,
      allowedRoles: ['STAFF'],
    },
  ];
}
