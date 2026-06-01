import { Injectable } from '@nestjs/common';
import { BaseStateMachine, StateTransition } from '../../common/state-machine/base-state-machine';
import { ErrorCode } from '../../common/error-codes';
import { AlertStatus, AlertAction } from './entities/near-expiry-alert.entity';

@Injectable()
export class AlertStateMachine extends BaseStateMachine<AlertStatus, AlertAction> {
  protected entityName: string = '近效药预警';
  protected invalidTransitionCode: ErrorCode = ErrorCode.ALERT_INVALID_TRANSITION;

  protected transitions: StateTransition<AlertStatus, AlertAction>[] = [
    {
      from: [AlertStatus.ACTIVE],
      to: AlertStatus.ACKNOWLEDGED,
      action: AlertAction.ACKNOWLEDGE,
    },
    {
      from: [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED],
      to: AlertStatus.RESOLVED,
      action: AlertAction.RESOLVE,
    },
  ];
}
