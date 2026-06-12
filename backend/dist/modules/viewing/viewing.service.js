"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewingService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const audit_service_1 = require("../audit/audit.service");
let ViewingService = class ViewingService {
    constructor(auditService) {
        this.auditService = auditService;
        this.viewings = [];
    }
    create(data, userId, userName, userRole) {
        const viewing = {
            id: (0, uuid_1.v4)(),
            ...data,
            createdAt: new Date(),
        };
        this.viewings.push(viewing);
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'create',
            entity: 'viewing',
            entityId: viewing.id,
            after: viewing,
        });
        return viewing;
    }
    findAll(filters) {
        let result = [...this.viewings];
        if (filters?.propertyId) {
            result = result.filter((v) => v.propertyId === filters.propertyId);
        }
        if (filters?.consultantId) {
            result = result.filter((v) => v.consultantId === filters.consultantId);
        }
        if (filters?.feedback !== undefined) {
            const hasFeedback = filters.feedback === 'true' || filters.feedback === true;
            result = result.filter((v) => hasFeedback ? v.feedback !== undefined : v.feedback === undefined);
        }
        if (filters?.from) {
            const fromDate = new Date(filters.from);
            result = result.filter((v) => v.viewDate >= fromDate);
        }
        if (filters?.to) {
            const toDate = new Date(filters.to);
            result = result.filter((v) => v.viewDate <= toDate);
        }
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return result;
    }
    findOne(id) {
        const viewing = this.viewings.find((v) => v.id === id);
        if (!viewing) {
            throw new common_1.NotFoundException(`Viewing with id "${id}" not found`);
        }
        return viewing;
    }
    addFeedback(id, feedback, userId, userName, userRole) {
        const viewing = this.findOne(id);
        const before = { ...viewing };
        viewing.feedback = {
            ...feedback,
            submittedAt: new Date(),
        };
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'add_feedback',
            entity: 'viewing',
            entityId: viewing.id,
            before,
            after: viewing,
        });
        return viewing;
    }
    getPropertyViewingSummary(propertyId) {
        const propertyViewings = this.viewings.filter((v) => v.propertyId === propertyId);
        const withFeedback = propertyViewings.filter((v) => v.feedback);
        const satisfiedCount = withFeedback.filter((v) => v.feedback.satisfaction === 'satisfied').length;
        const unsatisfiedCount = withFeedback.filter((v) => v.feedback.satisfaction === 'unsatisfied').length;
        const neutralCount = withFeedback.filter((v) => v.feedback.satisfaction === 'neutral').length;
        const sortedByFeedbackDate = [...withFeedback].sort((a, b) => b.feedback.submittedAt.getTime() - a.feedback.submittedAt.getTime());
        return {
            totalViewings: propertyViewings.length,
            satisfiedCount,
            unsatisfiedCount,
            neutralCount,
            latestFeedback: sortedByFeedbackDate[0]?.feedback ?? null,
        };
    }
};
exports.ViewingService = ViewingService;
exports.ViewingService = ViewingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], ViewingService);
//# sourceMappingURL=viewing.service.js.map