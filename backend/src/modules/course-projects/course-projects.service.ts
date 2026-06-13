import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseProject, CourseProjectStatus } from '../../entities/course-project.entity';
import { TrainingNeed, TrainingNeedStatus } from '../../entities/training-need.entity';
import { TrainingNeedRemark } from '../../entities/training-need-remark.entity';
import { Student, StudentStatus } from '../../entities/student.entity';
import { User, UserRole } from '../../entities/user.entity';
import { NotificationService } from '../notifications/notifications.service';
import { StatusChangeHistoryService } from '../status-history/status-history.service';
import { EntityType } from '../../entities/status-change-history.entity';
import { NotificationType } from '../../entities/notification.entity';
import { CreateCourseProjectDto } from './dto/create-course-project.dto';
import { UpdateCourseProjectDto } from './dto/update-course-project.dto';
import { CourseProjectQueryDto } from './dto/course-project-query.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { MarkAbsentDto } from './dto/mark-absent.dto';

@Injectable()
export class CourseProjectsService {
  constructor(
    @InjectRepository(CourseProject)
    private courseProjectRepository: Repository<CourseProject>,
    @InjectRepository(TrainingNeed)
    private trainingNeedRepository: Repository<TrainingNeed>,
    @InjectRepository(TrainingNeedRemark)
    private remarkRepository: Repository<TrainingNeedRemark>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private statusHistoryService: StatusChangeHistoryService,
  ) {}

  async create(createDto: CreateCourseProjectDto) {
    const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id: createDto.trainingNeedId } });
    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    if (trainingNeed.status !== TrainingNeedStatus.APPROVED) {
      throw new ForbiddenException('只能为已审批通过的培训需求创建立项');
    }

    const instructor = await this.userRepository.findOne({ where: { id: createDto.instructorId, role: UserRole.INSTRUCTOR } });
    if (!instructor) {
      throw new NotFoundException('讲师不存在');
    }

    const courseProject = this.courseProjectRepository.create(createDto);
    await this.courseProjectRepository.save(courseProject);

    return this.findOne(courseProject.id);
  }

  async findAll(queryDto: CourseProjectQueryDto, user: User) {
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

    if (user.role === UserRole.INSTRUCTOR) {
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

  async findOne(id: string) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id },
      relations: ['trainingNeed', 'trainingNeed.submitter', 'instructor', 'students', 'students.user'],
    });

    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    return this.transformProject(courseProject);
  }

  async update(id: string, updateDto: UpdateCourseProjectDto, user: User) {
    const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (user.role !== UserRole.TRAINING_MANAGER) {
      throw new ForbiddenException('无权修改课程立项');
    }

    if (courseProject.status === CourseProjectStatus.COMPLETED || courseProject.status === CourseProjectStatus.CANCELLED) {
      throw new ForbiddenException('已完成或已取消的课程不能修改');
    }

    await this.courseProjectRepository.update(id, updateDto);

    return this.findOne(id);
  }

  async remove(id: string, user: User) {
    const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (user.role !== UserRole.TRAINING_MANAGER) {
      throw new ForbiddenException('无权删除课程立项');
    }

    if (courseProject.status !== CourseProjectStatus.PENDING) {
      throw new ForbiddenException('只能删除待审批状态的课程立项');
    }

    await this.courseProjectRepository.delete(id);

    return { message: '删除成功' };
  }

  async approve(id: string, userId: string) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id },
      relations: ['instructor'],
    });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (courseProject.status !== CourseProjectStatus.PENDING) {
      throw new ForbiddenException('只能审批待审批状态的立项');
    }

    const fromStatus = courseProject.status;
    await this.courseProjectRepository.update(id, { status: CourseProjectStatus.APPROVED });

    await this.statusHistoryService.recordStatusChange(
      EntityType.COURSE_PROJECT,
      id,
      fromStatus,
      CourseProjectStatus.APPROVED,
      userId,
      '审批通过',
    );

    await this.notificationService.sendNotification(
      NotificationType.COURSE_PROJECT_APPROVED,
      courseProject.instructorId,
      '课程立项已审批通过',
      `您负责的课程「${courseProject.title}」已审批通过，等待发布。`,
      'course_project',
      id,
    );

    return this.findOne(id);
  }

  async reject(id: string, reason: string, userId: string) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id },
      relations: ['trainingNeed', 'trainingNeed.submitter'],
    });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (courseProject.status !== CourseProjectStatus.PENDING) {
      throw new ForbiddenException('只能驳回待审批状态的立项');
    }

    const fromStatus = courseProject.status;
    await this.courseProjectRepository.update(id, { status: CourseProjectStatus.REJECTED });

    await this.statusHistoryService.recordStatusChange(
      EntityType.COURSE_PROJECT,
      id,
      fromStatus,
      CourseProjectStatus.REJECTED,
      userId,
      reason,
    );

    await this.notificationService.sendNotification(
      NotificationType.COURSE_PROJECT_REJECTED,
      courseProject.trainingNeed.submitterId,
      '课程立项已被驳回',
      `课程「${courseProject.title}」已被驳回，原因：${reason}`,
      'course_project',
      id,
    );

    return this.findOne(id);
  }

  async publish(id: string, userId: string) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id },
      relations: ['instructor'],
    });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (courseProject.status !== CourseProjectStatus.APPROVED) {
      throw new ForbiddenException('只能发布已审批通过的课程');
    }

    await this.courseProjectRepository.update(id, { status: CourseProjectStatus.PUBLISHED });

    await this.notificationService.sendNotification(
      NotificationType.COURSE_REMINDER,
      courseProject.instructorId,
      '课程已发布',
      `您负责的课程「${courseProject.title}」已发布，学员可以开始报名。`,
      'course_project',
      id,
    );

    return this.findOne(id);
  }

  async cancel(id: string, userId: string) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id },
      relations: ['students'],
    });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (courseProject.status === CourseProjectStatus.COMPLETED) {
      throw new ForbiddenException('已完成的课程不能取消');
    }

    await this.courseProjectRepository.update(id, { status: CourseProjectStatus.CANCELLED });

    for (const student of courseProject.students) {
      await this.notificationService.sendNotification(
        NotificationType.COURSE_REMINDER,
        student.userId,
        '课程已取消',
        `您报名的课程「${courseProject.title}」已被取消。`,
        'course_project',
        id,
      );
    }

    return this.findOne(id);
  }

  async addStudent(id: string, addStudentDto: AddStudentDto) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id },
      relations: ['students'],
    });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (courseProject.status !== CourseProjectStatus.PUBLISHED && courseProject.status !== CourseProjectStatus.ENROLLING) {
      throw new ForbiddenException('只能在报名阶段添加学员');
    }

    if (courseProject.students.length >= courseProject.maxParticipants) {
      throw new ForbiddenException('课程人数已满');
    }

    const existingStudent = await this.studentRepository.findOne({
      where: { courseProjectId: id, userId: addStudentDto.userId },
    });
    if (existingStudent) {
      throw new ForbiddenException('该学员已报名');
    }

    const student = this.studentRepository.create({
      courseProjectId: id,
      userId: addStudentDto.userId,
      status: StudentStatus.ENROLLED,
    });
    await this.studentRepository.save(student);

    await this.updateStatusIfNeeded(courseProject.id);

    return this.findOne(id);
  }

  async removeStudent(id: string, studentId: string, user: User) {
    const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    if (user.role !== UserRole.TRAINING_MANAGER) {
      throw new ForbiddenException('无权移除学员');
    }

    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('学员不存在');
    }

    await this.studentRepository.delete(studentId);

    return this.findOne(id);
  }

  async markStudentAbsent(id: string, studentId: string, markAbsentDto: MarkAbsentDto) {
    const courseProject = await this.courseProjectRepository.findOne({ where: { id } });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
    }

    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('学员不存在');
    }

    await this.studentRepository.update(studentId, {
      status: StudentStatus.ABSENT,
      absentReason: markAbsentDto.reason,
    });

    return this.findOne(id);
  }

  async getStudents(id: string) {
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

  async getRemarks(id: string) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id },
      relations: ['trainingNeed'],
    });
    if (!courseProject) {
      throw new NotFoundException('课程立项不存在');
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

  private async updateStatusIfNeeded(projectId: string) {
    const courseProject = await this.courseProjectRepository.findOne({
      where: { id: projectId },
      relations: ['students'],
    });

    if (!courseProject) return;

    const now = new Date();

    if (courseProject.status === CourseProjectStatus.PUBLISHED && courseProject.enrollmentDeadline && now > courseProject.enrollmentDeadline) {
      await this.courseProjectRepository.update(projectId, { status: CourseProjectStatus.ENROLLING });
    }

    if ((courseProject.status === CourseProjectStatus.PUBLISHED || courseProject.status === CourseProjectStatus.ENROLLING) && now >= courseProject.startTime) {
      await this.courseProjectRepository.update(projectId, { status: CourseProjectStatus.IN_PROGRESS });
    }

    if (courseProject.status === CourseProjectStatus.IN_PROGRESS && now >= courseProject.endTime) {
      await this.courseProjectRepository.update(projectId, { status: CourseProjectStatus.COMPLETED });
    }
  }

  private async transformProject(courseProject: CourseProject) {
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
}