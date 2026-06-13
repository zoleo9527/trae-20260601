import { User } from './user.entity';
import { CourseProject } from './course-project.entity';
export declare enum StudentStatus {
    ENROLLED = "enrolled",
    ATTENDED = "attended",
    ABSENT = "absent",
    COMPLETED = "completed"
}
export declare class Student {
    id: string;
    courseProjectId: string;
    courseProject: CourseProject;
    userId: string;
    user: User;
    status: StudentStatus;
    enrolledAt: Date;
    attendedAt: Date;
    absentReason: string;
    createdAt: Date;
    updatedAt: Date;
}
