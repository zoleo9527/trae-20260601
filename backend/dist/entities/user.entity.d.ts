export declare enum UserRole {
    TRAINING_MANAGER = "training_manager",
    DEPARTMENT_HEAD = "department_head",
    INSTRUCTOR = "instructor",
    STUDENT = "student"
}
export declare class User {
    id: string;
    username: string;
    password: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
