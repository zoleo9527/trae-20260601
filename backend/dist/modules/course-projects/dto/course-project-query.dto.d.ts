import { CourseProjectStatus } from '../../entities/course-project.entity';
export declare class CourseProjectQueryDto {
    page?: number;
    pageSize?: number;
    status?: CourseProjectStatus;
    instructorId?: string;
    startDate?: Date;
    endDate?: Date;
    keyword?: string;
}
