const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 球馆运营系统已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 看板概览:   http://localhost:${PORT}/api/dashboard/overview`);
  console.log(`📋 看板视图:   http://localhost:${PORT}/api/dashboard/kanban`);
  console.log(`📝 包场申请:   http://localhost:${PORT}/api/bookings`);
  console.log(`💰 费用审核:   http://localhost:${PORT}/api/fee-reviews/pending`);
  console.log(`📜 审计日志:   http://localhost:${PORT}/api/audit-logs`);
  console.log(`\n💡 使用说明:`);
  console.log(`   - 在请求头中添加 x-user-id 指定当前用户 (1=前台, 2=教练, 3=店长)`);
  console.log(`   - 运行 npm run setup 一键初始化依赖和数据`);
  console.log(`   - 运行 npm run dev 启动开发服务器\n`);
});
