"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const idempotency_middleware_1 = require("./common/middleware/idempotency.middleware");
const audit_log_interceptor_1 = require("./common/interceptors/audit-log.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new audit_log_interceptor_1.AuditLogInterceptor());
    const idempotencyMiddleware = new idempotency_middleware_1.IdempotencyMiddleware();
    app.use((req, res, next) => idempotencyMiddleware.use(req, res, next));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('药房运营协同服务 API')
        .setDescription('处方复核、近效药预警、下架确认、调拨审批统一协同平台')
        .setVersion('1.0.0')
        .addApiKey({ type: 'apiKey', name: 'X-Request-Id', in: 'header' }, 'X-Request-Id')
        .addApiKey({ type: 'apiKey', name: 'X-User-Id', in: 'header' }, 'X-User-Id')
        .addApiKey({ type: 'apiKey', name: 'X-User-Role', in: 'header' }, 'X-User-Role')
        .addApiKey({ type: 'apiKey', name: 'X-Store-Id', in: 'header' }, 'X-Store-Id')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 药房运营协同服务已启动: http://localhost:${port}`);
    console.log(`📖 API 文档: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map