import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', time: new Date().toISOString() } });
});

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`[二手车商审批系统] 后端已启动: http://localhost:${PORT}/api`);
  console.log('可用登录账号:');
  console.log('  admin     系统管理员');
  console.log('  manager1  张经理(收车经理)');
  console.log('  manager2  李经理(收车经理)');
  console.log('  appraiser1 王评估师(评估师)');
  console.log('  finance1  赵专员(金融专员)');
});
