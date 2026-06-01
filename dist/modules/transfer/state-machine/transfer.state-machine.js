"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferStateMachine = void 0;
const common_1 = require("@nestjs/common");
const base_state_machine_1 = require("../../../common/state-machine/base-state-machine");
const error_codes_1 = require("../../../common/error-codes");
const enums_1 = require("../enums");
let TransferStateMachine = class TransferStateMachine extends base_state_machine_1.BaseStateMachine {
    constructor() {
        super(...arguments);
        this.entityName = '调拨单';
        this.invalidTransitionCode = error_codes_1.ErrorCode.TRANSFER_INVALID_TRANSITION;
        this.transitions = [
            {
                from: [enums_1.TransferStatus.DRAFT],
                to: enums_1.TransferStatus.SUBMITTED,
                action: enums_1.TransferAction.SUBMIT,
                allowedRoles: ['STAFF'],
            },
            {
                from: [enums_1.TransferStatus.SUBMITTED],
                to: enums_1.TransferStatus.APPROVED,
                action: enums_1.TransferAction.APPROVE,
                allowedRoles: ['MANAGER'],
            },
            {
                from: [enums_1.TransferStatus.SUBMITTED],
                to: enums_1.TransferStatus.REJECTED,
                action: enums_1.TransferAction.REJECT,
                allowedRoles: ['MANAGER'],
            },
            {
                from: [enums_1.TransferStatus.APPROVED],
                to: enums_1.TransferStatus.COMPLETED,
                action: enums_1.TransferAction.COMPLETE,
                allowedRoles: ['STAFF'],
            },
            {
                from: [enums_1.TransferStatus.DRAFT, enums_1.TransferStatus.SUBMITTED],
                to: enums_1.TransferStatus.CANCELLED,
                action: enums_1.TransferAction.CANCEL,
                allowedRoles: ['STAFF'],
            },
        ];
    }
};
exports.TransferStateMachine = TransferStateMachine;
exports.TransferStateMachine = TransferStateMachine = __decorate([
    (0, common_1.Injectable)()
], TransferStateMachine);
//# sourceMappingURL=transfer.state-machine.js.map