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
exports.CourseProject = exports.CourseProjectStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const training_need_entity_1 = require("./training-need.entity");
const student_entity_1 = require("./student.entity");
var CourseProjectStatus;
(function (CourseProjectStatus) {
    CourseProjectStatus["PENDING"] = "pending";
    CourseProjectStatus["APPROVED"] = "approved";
    CourseProjectStatus["REJECTED"] = "rejected";
    CourseProjectStatus["PUBLISHED"] = "published";
    CourseProjectStatus["ENROLLING"] = "enrolling";
    CourseProjectStatus["IN_PROGRESS"] = "in_progress";
    CourseProjectStatus["COMPLETED"] = "completed";
    CourseProjectStatus["CANCELLED"] = "cancelled";
})(CourseProjectStatus || (exports.CourseProjectStatus = CourseProjectStatus = {}));
let CourseProject = class CourseProject {
};
exports.CourseProject = CourseProject;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CourseProject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'training_need_id' }),
    __metadata("design:type", String)
], CourseProject.prototype, "trainingNeedId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => training_need_entity_1.TrainingNeed),
    (0, typeorm_1.JoinColumn)({ name: 'training_need_id' }),
    __metadata("design:type", training_need_entity_1.TrainingNeed)
], CourseProject.prototype, "trainingNeed", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CourseProject.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CourseProject.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CourseProject.prototype, "objectives", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CourseProject.prototype, "outline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'instructor_id' }),
    __metadata("design:type", String)
], CourseProject.prototype, "instructorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'instructor_id' }),
    __metadata("design:type", user_entity_1.User)
], CourseProject.prototype, "instructor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', name: 'start_time' }),
    __metadata("design:type", Date)
], CourseProject.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', name: 'end_time' }),
    __metadata("design:type", Date)
], CourseProject.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CourseProject.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', name: 'enrollment_deadline', nullable: true }),
    __metadata("design:type", Date)
], CourseProject.prototype, "enrollmentDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_participants', default: 0 }),
    __metadata("design:type", Number)
], CourseProject.prototype, "maxParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CourseProjectStatus,
        default: CourseProjectStatus.PENDING,
    }),
    __metadata("design:type", String)
], CourseProject.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_entity_1.Student, (student) => student.courseProject),
    __metadata("design:type", Array)
], CourseProject.prototype, "students", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CourseProject.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CourseProject.prototype, "updatedAt", void 0);
exports.CourseProject = CourseProject = __decorate([
    (0, typeorm_1.Entity)('course_project')
], CourseProject);
//# sourceMappingURL=course-project.entity.js.map