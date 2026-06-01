"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessException = void 0;
const common_1 = require("@nestjs/common");
const error_codes_1 = require("../error-codes");
class BusinessException extends common_1.HttpException {
    constructor(code, message, details) {
        const msg = message || error_codes_1.ErrorMessage[code] || '未知错误';
        super(msg, common_1.HttpStatus.BAD_REQUEST);
        this.code = code;
        this.details = details;
    }
    getCode() {
        return this.code;
    }
    getDetails() {
        return this.details;
    }
}
exports.BusinessException = BusinessException;
//# sourceMappingURL=business.exception.js.map