import express from 'express';
import { sequelize } from './models/index.js';
import { initDatabase } from './config/database.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(options = {}) {
  const { autoListen = true, syncOptions = { alter: true } } = options;
  
  await initDatabase();
  
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    await sequelize.sync(syncOptions);
    console.log('数据库同步完成');
    
    if (autoListen) {
      app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
        console.log(`健康检查: http://localhost:${PORT}/api/health`);
      });
    }
    
    return { app, sequelize };
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
export default app;
