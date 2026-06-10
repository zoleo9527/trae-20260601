const app = require('./app');

const PORT = process.env.PORT || 3100;

app.listen(PORT, () => {
  console.log(`饲料厂配方审批与投料计划服务已启动: http://localhost:${PORT}`);
});
