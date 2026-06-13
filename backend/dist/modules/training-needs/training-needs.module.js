"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingNeedsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const training_needs_controller_1 = require("./training-needs.controller");
const training_needs_service_1 = require("./training-needs.service");
const training_need_entity_1 = require("../../entities/training-need.entity");
const training_need_remark_entity_1 = require("../../entities/training-need-remark.entity");
const user_entity_1 = require("../../entities/user.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const status_history_module_1 = require("../status-history/status-history.module");
let TrainingNeedsModule = class TrainingNeedsModule {
};
exports.TrainingNeedsModule = TrainingNeedsModule;
exports.TrainingNeedsModule = TrainingNeedsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([training_need_entity_1.TrainingNeed, training_need_remark_entity_1.TrainingNeedRemark, user_entity_1.User]),
            notifications_module_1.NotificationsModule,
            status_history_module_1.StatusHistoryModule,
        ],
        controllers: [training_needs_controller_1.TrainingNeedsController],
        providers: [training_needs_service_1.TrainingNeedsService],
        exports: [training_needs_service_1.TrainingNeedsService],
    })
], TrainingNeedsModule);
//# sourceMappingURL=training-needs.module.js.map