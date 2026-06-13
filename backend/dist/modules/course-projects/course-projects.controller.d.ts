import { CourseProjectsService } from './course-projects.service';
import { CreateCourseProjectDto } from './dto/create-course-project.dto';
import { UpdateCourseProjectDto } from './dto/update-course-project.dto';
import { CourseProjectQueryDto } from './dto/course-project-query.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { MarkAbsentDto } from './dto/mark-absent.dto';
import { UserRole } from '../../entities/user.entity';
export declare class CourseProjectsController {
    private courseProjectsService;
    constructor(courseProjectsService: CourseProjectsService);
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(queryDto: CourseProjectQueryDto, req: any): Promise<{
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
            status: import("../../entities/course-project.entity").CourseProjectStatus;
            students: {
                id: string;
                user: {
                    id: string;
                    name: string;
                };
                status: import("../../entities/student.entity").StudentStatus;
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateDto: UpdateCourseProjectDto, req: any): Promise<{
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    approve(id: string, req: any): Promise<{
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    reject(id: string, reason: string, req: any): Promise<{
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    publish(id: string, req: any): Promise<{
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancel(id: string, req: any): Promise<{
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
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
        status: import("../../entities/student.entity").StudentStatus;
        enrolledAt: Date;
        attendedAt: Date;
        absentReason: string;
    }[]>;
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeStudent(id: string, studentId: string, req: any): Promise<{
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
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
        status: import("../../entities/course-project.entity").CourseProjectStatus;
        students: {
            id: string;
            user: {
                id: string;
                name: string;
            };
            status: import("../../entities/student.entity").StudentStatus;
            enrolledAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
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
}
