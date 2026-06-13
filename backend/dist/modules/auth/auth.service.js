"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user_entity_1 = require("../../entities/user.entity");
let AuthService = class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.jwtSecret = process.env.JWT_SECRET || 'training-management-secret';
        this.jwtExpiresIn = '1d';
    }
    async login(loginDto) {
        const { username, password } = loginDto;
        const user = await this.userRepository.findOne({ where: { username } });
        if (!user) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };
        const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
        return {
            accessToken: token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
            },
        };
    }
    async register(registerDto) {
        const { username, password, email, ...rest } = registerDto;
        const existingUser = await this.userRepository.findOne({
            where: [{ username }, { email }],
        });
        if (existingUser) {
            throw new common_1.ConflictException('用户名或邮箱已存在');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            username,
            password: hashedPassword,
            email,
            ...rest,
        });
        await this.userRepository.save(user);
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };
        const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
        return {
            accessToken: token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
            },
        };
    }
    async validateUser(payload) {
        const user = await this.userRepository.findOne({ where: { id: payload.userId } });
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        return user;
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone,
            department: user.department,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map