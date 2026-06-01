import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../error-codes';

export interface StateTransition<S, A> {
  from: S[];
  to: S;
  action: A;
  allowedRoles?: string[];
}

export abstract class BaseStateMachine<S, A> {
  protected abstract transitions: StateTransition<S, A>[];
  protected abstract entityName: string;
  protected abstract invalidTransitionCode: ErrorCode;

  canTransition(currentState: S, action: A, userRole?: string): boolean {
    const transition = this.transitions.find(
      (t) => t.action === action && t.from.includes(currentState),
    );

    if (!transition) return false;
    if (transition.allowedRoles && userRole && !transition.allowedRoles.includes(userRole)) {
      return false;
    }

    return true;
  }

  getNextState(currentState: S, action: A): S {
    const transition = this.transitions.find(
      (t) => t.action === action && t.from.includes(currentState),
    );

    if (!transition) {
      throw new BusinessException(
        this.invalidTransitionCode,
        `${this.entityName}无法从 ${currentState} 执行 ${action} 操作`,
        { currentState, action },
      );
    }

    return transition.to;
  }

  validateTransition(currentState: S, action: A, userRole?: string): void {
    if (!this.canTransition(currentState, action, userRole)) {
      throw new BusinessException(
        this.invalidTransitionCode,
        `${this.entityName}状态流转不合法: 当前状态=${currentState}, 操作=${action}, 角色=${userRole}`,
        { currentState, action, userRole },
      );
    }
  }

  getAllowedActions(currentState: S, userRole?: string): A[] {
    return this.transitions
      .filter((t) => t.from.includes(currentState))
      .filter((t) => !t.allowedRoles || (userRole && t.allowedRoles.includes(userRole)))
      .map((t) => t.action);
  }
}
