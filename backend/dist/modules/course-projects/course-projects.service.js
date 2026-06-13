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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const course_project_entity_1 = require("../../entities/course-project.entity");
const training_need_entity_1 = require("../../entities/training-need.entity");
const training_need_remark_entity_1 = require("../../entities/training-need-remark.entity");
const student_entity_1 = require("../../entities/student.entity");
const user_entity_1 = require("../../entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const status_history_service_1 = require("../status-history/status-history.service");
const status_change_history_entity_1 = require("../../entities/status-change-history.entity");
const notification_entity_1 = require("../../entities/notification.entity");
let CourseProjectsService = class CourseProjectsService {
    constructor(courseProjectRepository, trainingNeedRepository, remarkRepository, studentRepository, userRepository, notificationService, statusHistoryService) {
        this.courseProjectRepository = courseProjectRepository;
        this.trainingNeedRepository = trainingNeedRepository;
        this.remarkRepository = remarkRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.statusHistoryService = statusHistoryService;
    }
    async create(createDto) {
        const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id: createDto.trainingNeedId } });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        if (trainingNeed.status !== training_need_entity_1.TrainingNeedStatus.APPROVED) {
            throw new common_1.ForbiddenException('只能为已审批通过的培训需求创建立项');
        }
        const instructor = await this.userRepository.findOne({ where: { id: createDto.instructorId, role: user_entity_1.UserRole.INSTRUCTOR } });
        if (!instructor) {
            throw new common_1.NotFoundException('讲师不存在');
        }
        const courseProject = this.courseProjectRepository.create(createDto);
        await this.courseProjectRepository.save(courseProject);
        return this.findOne(courseProject.id);
    }
    async findAll(queryDto, user) {
        const { page = 1, pageSize = 10, status, instructorId, startDate, endDate, keyword } = queryDto;
        const query = this.courseProjectRepository
            .createQueryBuilder('cp')
            .leftJoinAndSelect('cp.trainingNeed', 'trainingNeed')
            .leftJoinAndSelect('cp.instructor', 'instructor')
            .leftJoinAndSelect('trainingNeed.submitter', 'submitter');
        if (status) {
            query.andWhere('cp.status = :status', { status });
        }
        if (instructorId) {
            query.andWhere('cp.instructorId = :instructorId', { instructorId });
        }
        if (startDate) {
            query.andWhere('cp.startTime >= :startDate', { startDate });
        }
        if (endDate) {
            query.andWhere('cp.endTime <= :endDate', { endDate });
        }
        if (keyword) {
            query.andWhere('(cp.title LIKE :keyword OR cp.description LIKE :keyword)', {
                keyword: `%${keyword}%`,
            });
        }
        if (user.role === user_entity_1.UserRole.INSTRUCTOR) {
            query.andWhere('cp.instructorId = :instructorId', { instructorId: user.id });
        }
        query.orderBy('cp.createdAt', 'DESC');
        const [items, total] = await query
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return {
            items: await Promise.all(items.map((item) => this.transformProject(item))),
            total,
            page,
            pageSize,
        };
    }
    async findOne(id) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id },
            relations: ['trainingNeed', 'trainingNeed.submitter', 'instructor', 'students', 'students.user'],
        });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        const latestChange = await this.statusHistoryService.getLatestStatusChange(status_change_history_entity_1.EntityType.COURSE_PROJECT, id);
        const result = this.transformProject(courseProject);
        result.latestStatusChange = latestChange ? {
            fromStatus: latestChange.fromStatus,
            toStatus: latestChange.toStatus,
            handler: latestChange.changedBy ? {
                id: latestChange.changedBy.id,
                name: latestChange.changedBy.name,
                role: latestChange.changedBy.role,
            } : null,
            reason: latestChange.reason,
            remarks: latestChange.remarks,
            timestamp: latestChange.createdAt,
            statusLabel: this.getStatusLabel(latestChange.toStatus),
        } : null;
        return result;
    }
    async update(id, updateDto, user) {
        const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (user.role !== user_entity_1.UserRole.TRAINING_MANAGER) {
            throw new common_1.ForbiddenException('无权修改课程立项');
        }
        if (courseProject.status === course_project_entity_1.CourseProjectStatus.COMPLETED || courseProject.status === course_project_entity_1.CourseProjectStatus.CANCELLED) {
            throw new common_1.ForbiddenException('已完成或已取消的课程不能修改');
        }
        await this.courseProjectRepository.update(id, updateDto);
        return this.findOne(id);
    }
    async remove(id, user) {
        const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (user.role !== user_entity_1.UserRole.TRAINING_MANAGER) {
            throw new common_1.ForbiddenException('无权删除课程立项');
        }
        if (courseProject.status !== course_project_entity_1.CourseProjectStatus.PENDING) {
            throw new common_1.ForbiddenException('只能删除待审批状态的课程立项');
        }
        await this.courseProjectRepository.delete(id);
        return { message: '删除成功' };
    }
    async approve(id, userId) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id },
            relations: ['instructor'],
        });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (courseProject.status !== course_project_entity_1.CourseProjectStatus.PENDING) {
            throw new common_1.ForbiddenException('只能审批待审批状态的立项');
        }
        const fromStatus = courseProject.status;
        await this.courseProjectRepository.update(id, { status: course_project_entity_1.CourseProjectStatus.APPROVED });
        await this.statusHistoryService.recordStatusChange(status_change_history_entity_1.EntityType.COURSE_PROJECT, id, fromStatus, course_project_entity_1.CourseProjectStatus.APPROVED, userId, '审批通过');
        await this.notificationService.sendNotification(notification_entity_1.NotificationType.COURSE_PROJECT_APPROVED, courseProject.instructorId, '课程立项已审批通过', `您负责的课程「${courseProject.title}」已审批通过，等待发布。`, 'course_project', id);
        return this.findOne(id);
    }
    async reject(id, reason, userId) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id },
            relations: ['trainingNeed', 'trainingNeed.submitter'],
        });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (courseProject.status !== course_project_entity_1.CourseProjectStatus.PENDING) {
            throw new common_1.ForbiddenException('只能驳回待审批状态的立项');
        }
        const fromStatus = courseProject.status;
        await this.courseProjectRepository.update(id, { status: course_project_entity_1.CourseProjectStatus.REJECTED });
        await this.statusHistoryService.recordStatusChange(status_change_history_entity_1.EntityType.COURSE_PROJECT, id, fromStatus, course_project_entity_1.CourseProjectStatus.REJECTED, userId, reason);
        await this.notificationService.sendNotification(notification_entity_1.NotificationType.COURSE_PROJECT_REJECTED, courseProject.trainingNeed.submitterId, '课程立项已被驳回', `课程「${courseProject.title}」已被驳回，原因：${reason}`, 'course_project', id);
        return this.findOne(id);
    }
    async publish(id, userId) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id },
            relations: ['instructor'],
        });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (courseProject.status !== course_project_entity_1.CourseProjectStatus.APPROVED) {
            throw new common_1.ForbiddenException('只能发布已审批通过的课程');
        }
        await this.courseProjectRepository.update(id, { status: course_project_entity_1.CourseProjectStatus.PUBLISHED });
        await this.notificationService.sendNotification(notification_entity_1.NotificationType.COURSE_REMINDER, courseProject.instructorId, '课程已发布', `您负责的课程「${courseProject.title}」已发布，学员可以开始报名。`, 'course_project', id);
        return this.findOne(id);
    }
    async cancel(id, userId) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id },
            relations: ['students'],
        });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (courseProject.status === course_project_entity_1.CourseProjectStatus.COMPLETED) {
            throw new common_1.ForbiddenException('已完成的课程不能取消');
        }
        await this.courseProjectRepository.update(id, { status: course_project_entity_1.CourseProjectStatus.CANCELLED });
        for (const student of courseProject.students) {
            await this.notificationService.sendNotification(notification_entity_1.NotificationType.COURSE_REMINDER, student.userId, '课程已取消', `您报名的课程「${courseProject.title}」已被取消。`, 'course_project', id);
        }
        return this.findOne(id);
    }
    async addStudent(id, addStudentDto) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id },
            relations: ['students'],
        });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (courseProject.status !== course_project_entity_1.CourseProjectStatus.PUBLISHED && courseProject.status !== course_project_entity_1.CourseProjectStatus.ENROLLING) {
            throw new common_1.ForbiddenException('只能在报名阶段添加学员');
        }
        if (courseProject.students.length >= courseProject.maxParticipants) {
            throw new common_1.ForbiddenException('课程人数已满');
        }
        const existingStudent = await this.studentRepository.findOne({
            where: { courseProjectId: id, userId: addStudentDto.userId },
        });
        if (existingStudent) {
            throw new common_1.ForbiddenException('该学员已报名');
        }
        const student = this.studentRepository.create({
            courseProjectId: id,
            userId: addStudentDto.userId,
            status: student_entity_1.StudentStatus.ENROLLED,
        });
        await this.studentRepository.save(student);
        await this.updateStatusIfNeeded(courseProject.id);
        return this.findOne(id);
    }
    async removeStudent(id, studentId, user) {
        const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        if (user.role !== user_entity_1.UserRole.TRAINING_MANAGER) {
            throw new common_1.ForbiddenException('无权移除学员');
        }
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student) {
            throw new common_1.NotFoundException('学员不存在');
        }
        await this.studentRepository.delete(studentId);
        return this.findOne(id);
    }
    async markStudentAbsent(id, studentId, markAbsentDto) {
        const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student) {
            throw new common_1.NotFoundException('学员不存在');
        }
        await this.studentRepository.update(studentId, {
            status: student_entity_1.StudentStatus.ABSENT,
            absentReason: markAbsentDto.reason,
        });
        return this.findOne(id);
    }
    async getStudents(id) {
        const students = await this.studentRepository.find({
            where: { courseProjectId: id },
            relations: ['user'],
        });
        return students.map((student) => ({
            id: student.id,
            user: {
                id: student.user.id,
                name: student.user.name,
                department: student.user.department,
            },
            status: student.status,
            enrolledAt: student.enrolledAt,
            attendedAt: student.attendedAt,
            absentReason: student.absentReason,
        }));
    }
    async getRemarks(id) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id },
            relations: ['trainingNeed'],
        });
        if (!courseProject) {
            throw new common_1.NotFoundException('课程立项不存在');
        }
        const remarks = await this.remarkRepository.find({
            where: { trainingNeedId: courseProject.trainingNeedId },
            relations: ['handler'],
            order: { createdAt: 'ASC' },
        });
        return remarks.map((remark) => ({
            id: remark.id,
            handler: {
                id: remark.handler.id,
                name: remark.handler.name,
                role: remark.handler.role,
            },
            content: remark.content,
            action: remark.action,
            createdAt: remark.createdAt,
            source: '来自培训需求处理',
        }));
    }
    async updateStatusIfNeeded(projectId) {
        const courseProject = await this.courseProjectRepository.findOne({
            where: { id: projectId },
            relations: ['students'],
        });
        if (!courseProject)
            return;
        const now = new Date();
        if (courseProject.status === course_project_entity_1.CourseProjectStatus.PUBLISHED && courseProject.enrollmentDeadline && now > courseProject.enrollmentDeadline) {
            await this.courseProjectRepository.update(projectId, { status: course_project_entity_1.CourseProjectStatus.ENROLLING });
        }
        if ((courseProject.status === course_project_entity_1.CourseProjectStatus.PUBLISHED || courseProject.status === course_project_entity_1.CourseProjectStatus.ENROLLING) && now >= courseProject.startTime) {
            await this.courseProjectRepository.update(projectId, { status: course_project_entity_1.CourseProjectStatus.IN_PROGRESS });
        }
        if (courseProject.status === course_project_entity_1.CourseProjectStatus.IN_PROGRESS && now >= courseProject.endTime) {
            await this.courseProjectRepository.update(projectId, { status: course_project_entity_1.CourseProjectStatus.COMPLETED });
        }
    }
    async transformProject(courseProject) {
        const remarks = await this.remarkRepository.find({
            where: { trainingNeedId: courseProject.trainingNeedId },
            relations: ['handler'],
        });
        return {
            id: courseProject.id,
            trainingNeed: {
                id: courseProject.trainingNeed?.id,
                title: courseProject.trainingNeed?.title,
                department: courseProject.trainingNeed?.department,
                remarks: remarks.map((remark) => ({
                    id: remark.id,
                    handler: {
                        id: remark.handler.id,
                        name: remark.handler.name,
                    },
                    content: remark.content,
                    action: remark.action,
                    createdAt: remark.createdAt,
                })),
            },
            title: courseProject.title,
            description: courseProject.description,
            objectives: courseProject.objectives,
            outline: courseProject.outline,
            instructor: courseProject.instructor ? {
                id: courseProject.instructor.id,
                name: courseProject.instructor.name,
            } : null,
            startTime: courseProject.startTime,
            endTime: courseProject.endTime,
            location: courseProject.location,
            enrollmentDeadline: courseProject.enrollmentDeadline,
            maxParticipants: courseProject.maxParticipants,
            currentParticipants: courseProject.students?.length || 0,
            status: courseProject.status,
            students: courseProject.students?.map((student) => ({
                id: student.id,
                user: {
                    id: student.user.id,
                    name: student.user.name,
                },
                status: student.status,
                enrolledAt: student.enrolledAt,
            })) || [],
            createdAt: courseProject.createdAt,
            updatedAt: courseProject.updatedAt,
        };
    }
    getStatusLabel(status) {
        const statusMap = {
            'pending': '待审批',
            'approved': '已通过',
            'rejected': '已驳回',
            'published': '已发布',
            'in_progress': '进行中',
            'completed': '已完成',
            'cancelled': '已取消',
        };
        return statusMap[status] || status;
    }
};
exports.CourseProjectsService = CourseProjectsService;
exports.CourseProjectsService = CourseProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(course_project_entity_1.CourseProject)),
    __param(1, (0, typeorm_1.InjectRepository)(training_need_entity_1.TrainingNeed)),
    __param(2, (0, typeorm_1.InjectRepository)(training_need_remark_entity_1.TrainingNeedRemark)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationService,
        status_history_service_1.StatusChangeHistoryService])
], CourseProjectsService);
//# sourceMappingURL=course-projects.service.js.map