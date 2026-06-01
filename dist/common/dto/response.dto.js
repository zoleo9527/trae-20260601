"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const error_codes_1 = require("../error-codes");
class ApiResponse {
    static success(data, requestId) {
        return {
            code: error_codes_1.ErrorCode.SUCCESS,
            message: '操作成功',
            data,
            requestId: requestId || '',
            timestamp: new Date().toISOString(),
        };
    }
    static error(code, message, requestId) {
        return {
            code,
            message,
            data: null,
            requestId: requestId || '',
            timestamp: new Date().toISOString(),
        };
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=response.dto.js.map