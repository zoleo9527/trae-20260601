import { Repository } from 'typeorm';
import { CourseProject, CourseProjectStatus } from '../../entities/course-project.entity';
import { TrainingNeed } from '../../entities/training-need.entity';
import { TrainingNeedRemark } from '../../entities/training-need-remark.entity';
import { Student, StudentStatus } from '../../entities/student.entity';
import { User, UserRole } from '../../entities/user.entity';
import { NotificationService } from '../notifications/notifications.service';
import { StatusChangeHistoryService } from '../status-history/status-history.service';
import { CreateCourseProjectDto } from './dto/create-course-project.dto';
import { UpdateCourseProjectDto } from './dto/update-course-project.dto';
import { CourseProjectQueryDto } from './dto/course-project-query.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { MarkAbsentDto } from './dto/mark-absent.dto';
export declare class CourseProjectsService {
    private courseProjectRepository;
    private trainingNeedRepository;
    private remarkRepository;
    private studentRepository;
    private userRepository;
    private notificationService;
    private statusHistoryService;
    constructor(courseProjectRepository: Repository<CourseProject>, trainingNeedRepository: Repository<TrainingNeed>, remarkRepository: Repository<TrainingNeedRemark>, studentRepository: Repository<Student>, userRepository: Repository<User>, notificationService: NotificationService, statusHistoryService: StatusChangeHistoryService);
    create(createDto: CreateCourseProjectDto): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(queryDto: CourseProjectQueryDto, user: User): Promise<{
        items: {
            id: string;
            trainingNeed: {
                id: string;
                title: string;
                department: string;
                remarks: {
                    id: string;
                    handler: {
                        id: string;
                        name: string;
                    };
                    content: string;
                    action: import("../../entities/training-need-remark.entity").RemarkAction;
                    createdAt: Date;
                }[];
            };
            title: string;
            description: string;
            objectives: string;
            outline: string;
            instructor: {
                id: string;
                name: string;
            };
            startTime: Date;
            endTime: Date;
            location: string;
            enrollmentDeadline: Date;
            maxParticipants: number;
            currentParticipants: number;
            status: CourseProjectStatus;
            students: {
                id: string;
                user: {
                    id: string;
                    name: string;
                };
                status: StudentStatus;
                enrolledAt: Date;
            }[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateDto: UpdateCourseProjectDto, user: User): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, user: User): Promise<{
        message: string;
    }>;
    approve(id: string, userId: string): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    reject(id: string, reason: string, userId: string): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    publish(id: string, userId: string): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancel(id: string, userId: string): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    addStudent(id: string, addStudentDto: AddStudentDto): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeStudent(id: string, studentId: string, user: User): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    markStudentAbsent(id: string, studentId: string, markAbsentDto: MarkAbsentDto): Promise<{
        id: string;
        trainingNeed: {
            id: string;
            title: string;
            department: string;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
                createdAt: Date;
            }[];
        };
        title: string;
        description: string;
        objectives: string;
        outline: string;
        instructor: {
            id: string;
            name: string;
        };
        startTime: Date;
        endTime: Date;
        location: string;
        enrollmentDeadline: Date;
        maxParticipants: number;
        currentParticipants: number;
        status: CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStudents(id: string): Promise<{
        id: string;
        user: {
            id: string;
            name: string;
            department: string;
        };
        status: StudentStatus;
        enrolledAt: Date;
        attendedAt: Date;
        absentReason: string;
    }[]>;
    getRemarks(id: string): Promise<{
        id: string;
        handler: {
            id: string;
            name: string;
            role: UserRole;
        };
        content: string;
        action: import("../../entities/training-need-remark.entity").RemarkAction;
        createdAt: Date;
        source: string;
    }[]>;
    private updateStatusIfNeeded;
    private transformProject;
    private getStatusLabel;
}
