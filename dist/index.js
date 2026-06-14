"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("./routes/user.routes");
const application_routes_1 = require("./routes/application.routes");
const payment_routes_1 = require("./routes/payment.routes");
const certificate_routes_1 = require("./routes/certificate.routes");
const seed_1 = require("./seed");
const database_1 = require("./database");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString('zh-CN')}] ${req.method} ${req.path} - User: ${req.headers['x-user-id'] || 'anonymous'}`);
    next();
});
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        users: database_1.db.getUsers().length,
        applications: database_1.db.getApplications().length,
    });
});
app.get('/', (req, res) => {
    res.json({
        name: '公证处窗口-缴费登记与出证安排系统',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            applications: '/api/applications',
            payments: '/api/payments',
            certificates: '/api/certificates',
        },
        documentation: '请使用 x-user-id 请求头进行身份认证',
        testAccounts: {
            WINDOW_STAFF: 'WIN001 (张晓明)',
            NOTARY: 'NOT001 (王公正)',
            ARCHIVIST: 'ARC001 (刘档案)',
        },
    });
});
app.use('/api/users', user_routes_1.userRoutes);
app.use('/api/applications', application_routes_1.applicationRoutes);
app.use('/api/payments', payment_routes_1.paymentRoutes);
app.use('/api/certificates', certificate_routes_1.certificateRoutes);
app.use((err, req, res) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message,
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: '接口不存在',
        path: req.originalUrl,
        method: req.method,
    });
});
function startServer() {
    (0, seed_1.seedData)();
    console.log('\n' + '='.repeat(60));
    console.log('公证处窗口-缴费登记与出证安排系统');
    console.log('='.repeat(60));
    console.log(`\n服务器运行在: http://localhost:${PORT}`);
    console.log(`\n测试账号 (请在 Header 中设置 x-user-id):`);
    console.log('  窗口人员: WIN001 (张晓明)');
    console.log('  公证员:   NOT001 (王公正)');
    console.log('  档案员:   ARC001 (刘档案)');
    console.log('\n主要接口:');
    console.log('  GET  /health - 健康检查');
    console.log('  GET  /api/applications - 获取所有申请');
    console.log('  GET  /api/applications?stuck=true - 获取卡住的申请');
    console.log('  POST /api/payments/register - 提交缴费登记 (窗口人员)');
    console.log('  POST /api/payments/confirm - 确认缴费 (公证员)');
    console.log('  POST /api/certificates/arrange - 安排出证 (档案员)');
    console.log('  POST /api/certificates/issue - 发证 (档案员)');
    console.log('  GET  /api/certificates/:id/review - 流程回看');
    console.log('  GET  /api/applications/:id/logs - 操作日志');
    console.log('\n' + '='.repeat(60) + '\n');
    app.listen(PORT, () => {
        console.log(`服务器已启动，监听端口 ${PORT}`);
    });
}
if (require.main === module) {
    startServer();
}
//# sourceMappingURL=index.js.map