import { BaseStateMachine, StateTransition } from '../../../common/state-machine/base-state-machine';
import { ErrorCode } from '../../../common/error-codes';
import { TransferStatus, TransferAction } from '../enums';
export declare class TransferStateMachine extends BaseStateMachine<TransferStatus, TransferAction> {
    protected entityName: string;
    protected invalidTransitionCode: ErrorCode;
    protected transitions: StateTransition<TransferStatus, TransferAction>[];
}
