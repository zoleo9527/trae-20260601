import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            name: string;
            email: string;
            role: import("../../entities/user.entity").UserRole;
            department: string;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            name: string;
            email: string;
            role: import("../../entities/user.entity").UserRole;
            department: string;
        };
    }>;
    getProfile(req: any): Promise<{
        id: string;
        username: string;
        name: string;
        email: string;
        phone: string;
        department: string;
        role: import("../../entities/user.entity").UserRole;
        createdAt: Date;
    }>;
}
