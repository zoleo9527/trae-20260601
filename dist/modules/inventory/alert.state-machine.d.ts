import { BaseStateMachine, StateTransition } from '../../common/state-machine/base-state-machine';
import { ErrorCode } from '../../common/error-codes';
import { AlertStatus, AlertAction } from './entities/near-expiry-alert.entity';
export declare class AlertStateMachine extends BaseStateMachine<AlertStatus, AlertAction> {
    protected entityName: string;
    protected invalidTransitionCode: ErrorCode;
    protected transitions: StateTransition<AlertStatus, AlertAction>[];
}
