"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffShelfModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const off_shelf_service_1 = require("./off-shelf.service");
const off_shelf_controller_1 = require("./off-shelf.controller");
const off_shelf_order_entity_1 = require("./entities/off-shelf-order.entity");
const off_shelf_state_machine_1 = require("./state-machine/off-shelf.state-machine");
const medicine_inventory_entity_1 = require("../inventory/entities/medicine-inventory.entity");
const near_expiry_alert_entity_1 = require("../inventory/entities/near-expiry-alert.entity");
let OffShelfModule = class OffShelfModule {
};
exports.OffShelfModule = OffShelfModule;
exports.OffShelfModule = OffShelfModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([off_shelf_order_entity_1.OffShelfOrder, medicine_inventory_entity_1.MedicineInventory, near_expiry_alert_entity_1.NearExpiryAlert])],
        controllers: [off_shelf_controller_1.OffShelfController],
        providers: [off_shelf_service_1.OffShelfService, off_shelf_state_machine_1.OffShelfStateMachine],
        exports: [off_shelf_service_1.OffShelfService, off_shelf_state_machine_1.OffShelfStateMachine],
    })
], OffShelfModule);
//# sourceMappingURL=off-shelf.module.js.map