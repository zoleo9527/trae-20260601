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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const SEED_USERS = [
    { id: '1', username: 'consultant1', password: 'pass123', role: 'consultant', name: '张磊' },
    { id: '2', username: 'operations1', password: 'pass123', role: 'operations', name: '李敏' },
    { id: '3', username: 'finance1', password: 'pass123', role: 'finance', name: '王芳' },
];
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.users = [...SEED_USERS];
    }
    async login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        if (!user) {
            return null;
        }
        const payload = { sub: user.id, username: user.username, role: user.role, name: user.name };
        const access_token = this.jwtService.sign(payload);
        const { password: _, ...result } = user;
        return { access_token, user: result };
    }
    async validateUser(payload) {
        const user = this.users.find(u => u.id === payload.sub);
        if (!user) {
            return null;
        }
        const { password: _, ...result } = user;
        return result;
    }
    async getMockUsers() {
        return this.users.map(({ password: _, ...result }) => result);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map