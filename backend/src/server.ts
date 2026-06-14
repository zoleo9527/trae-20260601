import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4001;
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 二手车商系统后端已启动`);
  console.log(`   端口: ${PORT}`);
  console.log(`   API:  http://localhost:${PORT}/api/health`);
  if (fs.existsSync(frontendDist)) {
    console.log(`   前端: http://localhost:${PORT}/`);
  }
  console.log();
});
