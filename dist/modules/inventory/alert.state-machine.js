"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertStateMachine = void 0;
const common_1 = require("@nestjs/common");
const base_state_machine_1 = require("../../common/state-machine/base-state-machine");
const error_codes_1 = require("../../common/error-codes");
const near_expiry_alert_entity_1 = require("./entities/near-expiry-alert.entity");
let AlertStateMachine = class AlertStateMachine extends base_state_machine_1.BaseStateMachine {
    constructor() {
        super(...arguments);
        this.entityName = '近效药预警';
        this.invalidTransitionCode = error_codes_1.ErrorCode.ALERT_INVALID_TRANSITION;
        this.transitions = [
            {
                from: [near_expiry_alert_entity_1.AlertStatus.ACTIVE],
                to: near_expiry_alert_entity_1.AlertStatus.ACKNOWLEDGED,
                action: near_expiry_alert_entity_1.AlertAction.ACKNOWLEDGE,
            },
            {
                from: [near_expiry_alert_entity_1.AlertStatus.ACTIVE, near_expiry_alert_entity_1.AlertStatus.ACKNOWLEDGED],
                to: near_expiry_alert_entity_1.AlertStatus.RESOLVED,
                action: near_expiry_alert_entity_1.AlertAction.RESOLVE,
            },
        ];
    }
};
exports.AlertStateMachine = AlertStateMachine;
exports.AlertStateMachine = AlertStateMachine = __decorate([
    (0, common_1.Injectable)()
], AlertStateMachine);
//# sourceMappingURL=alert.state-machine.js.map