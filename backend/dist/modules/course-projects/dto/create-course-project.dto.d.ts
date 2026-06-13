export declare class CreateCourseProjectDto {
    trainingNeedId: string;
    title: string;
    description?: string;
    objectives?: string;
    outline?: string;
    instructorId: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    enrollmentDeadline?: Date;
    maxParticipants: number;
}
