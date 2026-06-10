"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const repository_1 = require("../database/repository");
class UserService {
    async getUserById(id) {
        return await (0, repository_1.getUserById)(id);
    }
    async getUsersByRole(role) {
        return await (0, repository_1.getUsersByRole)(role);
    }
    async getAllUsers() {
        return await (0, repository_1.getUsersByRole)();
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
