"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseStateMachine = void 0;
const business_exception_1 = require("../exceptions/business.exception");
class BaseStateMachine {
    canTransition(currentState, action, userRole) {
        const transition = this.transitions.find((t) => t.action === action && t.from.includes(currentState));
        if (!transition)
            return false;
        if (transition.allowedRoles && userRole && !transition.allowedRoles.includes(userRole)) {
            return false;
        }
        return true;
    }
    getNextState(currentState, action) {
        const transition = this.transitions.find((t) => t.action === action && t.from.includes(currentState));
        if (!transition) {
            throw new business_exception_1.BusinessException(this.invalidTransitionCode, `${this.entityName}无法从 ${currentState} 执行 ${action} 操作`, { currentState, action });
        }
        return transition.to;
    }
    validateTransition(currentState, action, userRole) {
        if (!this.canTransition(currentState, action, userRole)) {
            throw new business_exception_1.BusinessException(this.invalidTransitionCode, `${this.entityName}状态流转不合法: 当前状态=${currentState}, 操作=${action}, 角色=${userRole}`, { currentState, action, userRole });
        }
    }
    getAllowedActions(currentState, userRole) {
        return this.transitions
            .filter((t) => t.from.includes(currentState))
            .filter((t) => !t.allowedRoles || (userRole && t.allowedRoles.includes(userRole)))
            .map((t) => t.action);
    }
}
exports.BaseStateMachine = BaseStateMachine;
//# sourceMappingURL=base-state-machine.js.map