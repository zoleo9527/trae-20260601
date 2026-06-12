"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const property_module_1 = require("./modules/property/property.module");
const viewing_module_1 = require("./modules/viewing/viewing.module");
const handover_module_1 = require("./modules/handover/handover.module");
const key_transfer_module_1 = require("./modules/key-transfer/key-transfer.module");
const deposit_module_1 = require("./modules/deposit/deposit.module");
const audit_module_1 = require("./modules/audit/audit.module");
const overview_module_1 = require("./modules/overview/overview.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            property_module_1.PropertyModule,
            viewing_module_1.ViewingModule,
            handover_module_1.HandoverModule,
            key_transfer_module_1.KeyTransferModule,
            deposit_module_1.DepositModule,
            audit_module_1.AuditModule,
            overview_module_1.OverviewModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map