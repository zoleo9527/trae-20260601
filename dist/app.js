"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("./database/connection");
const gradeRoutes_1 = __importDefault(require("./routes/gradeRoutes"));
const packingRoutes_1 = __importDefault(require("./routes/packingRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const swagger_1 = require("./swagger/swagger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/grades', gradeRoutes_1.default);
app.use('/api/packings', packingRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
(0, swagger_1.setupSwagger)(app);
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务运行正常',
        timestamp: new Date().toISOString()
    });
});
async function startServer() {
    try {
        await (0, connection_1.initDatabase)();
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
            console.log(`API文档地址: http://localhost:${port}/api-docs`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
