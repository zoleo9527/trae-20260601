"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const prescription_entity_1 = require("./prescription.entity");
const prescription_state_machine_1 = require("./prescription.state-machine");
const prescription_service_1 = require("./prescription.service");
const prescription_controller_1 = require("./prescription.controller");
let PrescriptionModule = class PrescriptionModule {
};
exports.PrescriptionModule = PrescriptionModule;
exports.PrescriptionModule = PrescriptionModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([prescription_entity_1.Prescription])],
        controllers: [prescription_controller_1.PrescriptionController],
        providers: [prescription_service_1.PrescriptionService, prescription_state_machine_1.PrescriptionStateMachine],
        exports: [prescription_service_1.PrescriptionService, prescription_state_machine_1.PrescriptionStateMachine],
    })
], PrescriptionModule);
//# sourceMappingURL=prescription.module.js.map