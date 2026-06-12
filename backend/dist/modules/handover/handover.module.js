"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoverModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const property_module_1 = require("../property/property.module");
const handover_service_1 = require("./handover.service");
const handover_controller_1 = require("./handover.controller");
let HandoverModule = class HandoverModule {
};
exports.HandoverModule = HandoverModule;
exports.HandoverModule = HandoverModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, property_module_1.PropertyModule],
        controllers: [handover_controller_1.HandoverController],
        providers: [handover_service_1.HandoverService],
        exports: [handover_service_1.HandoverService],
    })
], HandoverModule);
//# sourceMappingURL=handover.module.js.map