"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('企业内训部培训管理系统API')
        .setDescription('企业内训部培训需求与课程立项管理系统API文档')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(3000);
    console.log('Application is running on: http://localhost:3000/api');
    console.log('Swagger API Docs: http://localhost:3000/api/docs');
}
bootstrap();
//# sourceMappingURL=main.js.map