"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const context = request.context;
    return data ? context?.[data] : context;
});
exports.Context = (0, common_1.createParamDecorator)((_, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.context;
});
//# sourceMappingURL=request-context.decorator.js.map