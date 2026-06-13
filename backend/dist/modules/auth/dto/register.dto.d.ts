import { UserRole } from '../../entities/user.entity';
export declare class RegisterDto {
    username: string;
    password: string;
    name: string;
    email: string;
    phone?: string;
    department?: string;
    role: UserRole;
}
