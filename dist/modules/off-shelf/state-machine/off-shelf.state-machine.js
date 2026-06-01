"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffShelfStateMachine = void 0;
const common_1 = require("@nestjs/common");
const base_state_machine_1 = require("../../../common/state-machine/base-state-machine");
const off_shelf_status_enum_1 = require("../enums/off-shelf-status.enum");
const off_shelf_action_enum_1 = require("../enums/off-shelf-action.enum");
const error_codes_1 = require("../../../common/error-codes");
let OffShelfStateMachine = class OffShelfStateMachine extends base_state_machine_1.BaseStateMachine {
    constructor() {
        super(...arguments);
        this.entityName = '下架单';
        this.invalidTransitionCode = error_codes_1.ErrorCode.OFF_SHELF_INVALID_TRANSITION;
        this.transitions = [
            {
                from: [off_shelf_status_enum_1.OffShelfStatus.CREATED],
                to: off_shelf_status_enum_1.OffShelfStatus.SUBMITTED,
                action: off_shelf_action_enum_1.OffShelfAction.SUBMIT,
                allowedRoles: ['STAFF'],
            },
            {
                from: [off_shelf_status_enum_1.OffShelfStatus.SUBMITTED],
                to: off_shelf_status_enum_1.OffShelfStatus.CONFIRMED,
                action: off_shelf_action_enum_1.OffShelfAction.CONFIRM,
                allowedRoles: ['PHARMACIST'],
            },
            {
                from: [off_shelf_status_enum_1.OffShelfStatus.SUBMITTED],
                to: off_shelf_status_enum_1.OffShelfStatus.REJECTED,
                action: off_shelf_action_enum_1.OffShelfAction.REJECT,
                allowedRoles: ['PHARMACIST'],
            },
            {
                from: [off_shelf_status_enum_1.OffShelfStatus.CREATED, off_shelf_status_enum_1.OffShelfStatus.SUBMITTED],
                to: off_shelf_status_enum_1.OffShelfStatus.CANCELLED,
                action: off_shelf_action_enum_1.OffShelfAction.CANCEL,
                allowedRoles: ['STAFF', 'MANAGER'],
            },
        ];
    }
};
exports.OffShelfStateMachine = OffShelfStateMachine;
exports.OffShelfStateMachine = OffShelfStateMachine = __decorate([
    (0, common_1.Injectable)()
], OffShelfStateMachine);
//# sourceMappingURL=off-shelf.state-machine.js.map