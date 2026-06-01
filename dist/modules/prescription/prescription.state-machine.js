"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionStateMachine = void 0;
const common_1 = require("@nestjs/common");
const base_state_machine_1 = require("../../common/state-machine/base-state-machine");
const error_codes_1 = require("../../common/error-codes");
const prescription_enum_1 = require("./prescription.enum");
let PrescriptionStateMachine = class PrescriptionStateMachine extends base_state_machine_1.BaseStateMachine {
    constructor() {
        super(...arguments);
        this.entityName = '处方';
        this.invalidTransitionCode = error_codes_1.ErrorCode.PRESCRIPTION_INVALID_TRANSITION;
        this.transitions = [
            {
                from: [prescription_enum_1.PrescriptionStatus.DRAFT],
                to: prescription_enum_1.PrescriptionStatus.SUBMITTED,
                action: prescription_enum_1.PrescriptionAction.SUBMIT,
                allowedRoles: [prescription_enum_1.UserRole.STAFF],
            },
            {
                from: [prescription_enum_1.PrescriptionStatus.SUBMITTED],
                to: prescription_enum_1.PrescriptionStatus.REVIEWING,
                action: prescription_enum_1.PrescriptionAction.REVIEW,
                allowedRoles: [prescription_enum_1.UserRole.PHARMACIST],
            },
            {
                from: [prescription_enum_1.PrescriptionStatus.REVIEWING],
                to: prescription_enum_1.PrescriptionStatus.APPROVED,
                action: prescription_enum_1.PrescriptionAction.APPROVE,
                allowedRoles: [prescription_enum_1.UserRole.PHARMACIST],
            },
            {
                from: [prescription_enum_1.PrescriptionStatus.REVIEWING],
                to: prescription_enum_1.PrescriptionStatus.REJECTED,
                action: prescription_enum_1.PrescriptionAction.REJECT,
                allowedRoles: [prescription_enum_1.UserRole.PHARMACIST],
            },
            {
                from: [prescription_enum_1.PrescriptionStatus.REJECTED],
                to: prescription_enum_1.PrescriptionStatus.SUPPLEMENTED,
                action: prescription_enum_1.PrescriptionAction.SUPPLEMENT,
                allowedRoles: [prescription_enum_1.UserRole.STAFF],
            },
            {
                from: [prescription_enum_1.PrescriptionStatus.SUPPLEMENTED],
                to: prescription_enum_1.PrescriptionStatus.REVIEWING,
                action: prescription_enum_1.PrescriptionAction.REVIEW,
                allowedRoles: [prescription_enum_1.UserRole.PHARMACIST],
            },
            {
                from: [
                    prescription_enum_1.PrescriptionStatus.DRAFT,
                    prescription_enum_1.PrescriptionStatus.SUBMITTED,
                    prescription_enum_1.PrescriptionStatus.REVIEWING,
                    prescription_enum_1.PrescriptionStatus.APPROVED,
                    prescription_enum_1.PrescriptionStatus.REJECTED,
                    prescription_enum_1.PrescriptionStatus.SUPPLEMENTED,
                ],
                to: prescription_enum_1.PrescriptionStatus.VOIDED,
                action: prescription_enum_1.PrescriptionAction.VOID,
                allowedRoles: [prescription_enum_1.UserRole.MANAGER],
            },
        ];
    }
};
exports.PrescriptionStateMachine = PrescriptionStateMachine;
exports.PrescriptionStateMachine = PrescriptionStateMachine = __decorate([
    (0, common_1.Injectable)()
], PrescriptionStateMachine);
//# sourceMappingURL=prescription.state-machine.js.map