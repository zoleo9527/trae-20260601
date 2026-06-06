import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 校园维修系统服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});
