"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyTransferModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const handover_module_1 = require("../handover/handover.module");
const property_module_1 = require("../property/property.module");
const key_transfer_service_1 = require("./key-transfer.service");
const key_transfer_controller_1 = require("./key-transfer.controller");
let KeyTransferModule = class KeyTransferModule {
};
exports.KeyTransferModule = KeyTransferModule;
exports.KeyTransferModule = KeyTransferModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, handover_module_1.HandoverModule, property_module_1.PropertyModule],
        controllers: [key_transfer_controller_1.KeyTransferController],
        providers: [key_transfer_service_1.KeyTransferService],
        exports: [key_transfer_service_1.KeyTransferService],
    })
], KeyTransferModule);
//# sourceMappingURL=key-transfer.module.js.map