"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const seedData_1 = require("./data/seedData");
const auth_1 = __importDefault(require("./routes/auth"));
const projects_1 = __importDefault(require("./routes/projects"));
const arrangements_1 = __importDefault(require("./routes/arrangements"));
const signin_1 = __importDefault(require("./routes/signin"));
const exceptions_1 = __importDefault(require("./routes/exceptions"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', auth_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/arrangements', arrangements_1.default);
app.use('/api/signin', signin_1.default);
app.use('/api/exceptions', exceptions_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '招标代理公司-开评标安排与专家签到系统运行正常' });
});
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: err.message || '服务器内部错误' });
});
const startServer = async () => {
    try {
        await (0, database_1.initDatabase)();
        console.log('数据库初始化完成');
        await (0, seedData_1.seedDatabase)();
        console.log('种子数据插入完成');
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log('API文档:');
            console.log('  GET  /api/health - 健康检查');
            console.log('  POST /api/auth/login - 登录');
            console.log('  GET  /api/projects - 项目列表');
            console.log('  GET  /api/projects/:id/analysis - 项目分析（核心接口）');
            console.log('  GET  /api/projects/:id/timeline - 项目时间线');
            console.log('  POST /api/exceptions/trigger-sample - 触发异常样例');
        });
    }
    catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map