"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const business_exception_1 = require("../exceptions/business.exception");
const error_codes_1 = require("../error-codes");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let code = error_codes_1.ErrorCode.INTERNAL_ERROR;
        let message = '系统内部错误';
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let details = null;
        let requestId = request.headers['x-request-id'];
        if (exception instanceof business_exception_1.BusinessException) {
            code = exception.getCode();
            message = exception.message;
            status = common_1.HttpStatus.BAD_REQUEST;
            details = exception.getDetails();
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            message = exception.message;
            const responseData = exception.getResponse();
            if (typeof responseData === 'object' && responseData['message']) {
                message = Array.isArray(responseData['message'])
                    ? responseData['message'].join(', ')
                    : responseData['message'];
            }
            code = status === common_1.HttpStatus.UNAUTHORIZED ? error_codes_1.ErrorCode.UNAUTHORIZED : error_codes_1.ErrorCode.INVALID_PARAMETER;
        }
        else if (exception instanceof Error) {
            message = exception.message;
            console.error('未捕获的异常:', exception.stack);
        }
        response.status(status).json({
            code,
            message,
            data: null,
            details,
            requestId,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map