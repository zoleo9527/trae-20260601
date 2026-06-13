import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
export declare class JwtAuthGuard implements CanActivate {
    private authService;
    private readonly jwtSecret;
    constructor(authService: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
