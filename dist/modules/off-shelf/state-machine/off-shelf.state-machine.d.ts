import { BaseStateMachine, StateTransition } from '../../../common/state-machine/base-state-machine';
import { OffShelfStatus } from '../enums/off-shelf-status.enum';
import { OffShelfAction } from '../enums/off-shelf-action.enum';
import { ErrorCode } from '../../../common/error-codes';
export declare class OffShelfStateMachine extends BaseStateMachine<OffShelfStatus, OffShelfAction> {
    protected entityName: string;
    protected invalidTransitionCode: ErrorCode;
    protected transitions: StateTransition<OffShelfStatus, OffShelfAction>[];
}
