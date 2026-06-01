import { ErrorCode } from '../error-codes';
export interface StateTransition<S, A> {
    from: S[];
    to: S;
    action: A;
    allowedRoles?: string[];
}
export declare abstract class BaseStateMachine<S, A> {
    protected abstract transitions: StateTransition<S, A>[];
    protected abstract entityName: string;
    protected abstract invalidTransitionCode: ErrorCode;
    canTransition(currentState: S, action: A, userRole?: string): boolean;
    getNextState(currentState: S, action: A): S;
    validateTransition(currentState: S, action: A, userRole?: string): void;
    getAllowedActions(currentState: S, userRole?: string): A[];
}
