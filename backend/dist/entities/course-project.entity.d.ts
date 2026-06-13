import { User } from './user.entity';
import { TrainingNeed } from './training-need.entity';
import { Student } from './student.entity';
export declare enum CourseProjectStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    PUBLISHED = "published",
    ENROLLING = "enrolling",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class CourseProject {
    id: string;
    trainingNeedId: string;
    trainingNeed: TrainingNeed;
    title: string;
    description: string;
    objectives: string;
    outline: string;
    instructorId: string;
    instructor: User;
    startTime: Date;
    endTime: Date;
    location: string;
    enrollmentDeadline: Date;
    maxParticipants: number;
    status: CourseProjectStatus;
    students: Student[];
    createdAt: Date;
    updatedAt: Date;
}
