import { BaseStateMachine, StateTransition } from '../../common/state-machine/base-state-machine';
import { ErrorCode } from '../../common/error-codes';
import { PrescriptionStatus, PrescriptionAction } from './prescription.enum';
export declare class PrescriptionStateMachine extends BaseStateMachine<PrescriptionStatus, PrescriptionAction> {
    protected entityName: string;
    protected invalidTransitionCode: ErrorCode;
    protected transitions: StateTransition<PrescriptionStatus, PrescriptionAction>[];
}
