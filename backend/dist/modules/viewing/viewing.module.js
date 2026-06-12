"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewingModule = void 0;
const common_1 = require("@nestjs/common");
const viewing_service_1 = require("./viewing.service");
const viewing_controller_1 = require("./viewing.controller");
const audit_module_1 = require("../audit/audit.module");
let ViewingModule = class ViewingModule {
};
exports.ViewingModule = ViewingModule;
exports.ViewingModule = ViewingModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [viewing_controller_1.ViewingController],
        providers: [viewing_service_1.ViewingService],
        exports: [viewing_service_1.ViewingService],
    })
], ViewingModule);
//# sourceMappingURL=viewing.module.js.map