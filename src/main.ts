import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import * as os from 'os';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.setGlobalPrefix('api');

  const exportDir = path.join(os.tmpdir(), 'music-leave-makeup-exports');
  const fs = require('fs');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  app.use('/api/exports', express.static(exportDir));

  const config = new DocumentBuilder()
    .setTitle('音乐培训机构-老师请假与补课协调系统')
    .setDescription(`
## 背景
真实场景里，旧台账、现场记录和沟通截图通常只记录结果，不记录"为什么变成这样"，导致老师请假和补课协调之间的责任说不清。

## 系统核心回答三件事
1. **谁在处理？** — 每条请假/补课记录的当前处理人角色+ID+姓名
2. **请假卡在哪里？** — GET /api/leaves/:id/blocking：当前状态、阻塞原因、补材料清单、催促次数、建议动作
3. **补课协调为什么还没完成？** — GET /api/makeups/:id/review：完整时间线 + 当前责任人 + 未完成原因说明

## 三个关键状态（题目要求）
- **有人催** (URGENCY)：家长顾问/教务对 PENDING_AFFAIRS 状态的请假发起"催促"，会记录催促次数和原因
- **有人退回** (RETURNED)：教务审批退回，处理人交还给任课老师，需重新补充
- **有人补材料** (PENDING_MATERIAL)：教务要求补具体材料，处理人交还给任课老师

## 幂等性

所有写接口 DTO 均强制 \`idempotencyKey: string\`，DTO 层通过 \`@IsString() + @IsNotEmpty()\` 校验。

服务端采用**两级幂等索引**：

- **创建级幂等**：POST 创建实体时，通过实体字段 \`*.idempotencyKey\` + Map 索引去重
  - \`leaveIdemKeys\`：请假申请
  - \`makeupIdemKeys\`：补课协调
  - \`exportTaskIdemKeys\`：导出任务

- **操作级幂等**：PATCH 修改实体时，通过 \`operationIdemKeys\` 统一索引，记录 \`{ entityType, entityId, action, actorId, timestamp }\`，避免重复审批/重复催办/重复状态流转

**执行顺序（关键）**：\`参数校验 → 业务合法性校验（终态/权限/状态）→ 幂等登记（原子 check+set）→ 执行业务逻辑\`，避免失败请求占用幂等键导致重试被误判。

**已覆盖的 10 个写接口**：请假创建/审批/催办/补材料；补课创建/提议/家长确认/排课/完成；导出任务创建。

**幂等命中行为**：服务端返回当前实体的最新状态，不改状态、不计数、不写日志、不生成新任务。

## 角色与鉴权
通过 HTTP Header \`x-user-id\` 传递用户ID：
- 任课老师：T001 张老师 / T002 李老师 / T003 王老师
- 教务老师：A001 陈教务 / A002 刘教务
- 家长顾问：AD001 赵顾问 / AD002 孙顾问

公开查询入口：GET /api/roles-catalog
`)
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`\n✅ 服务启动成功`);
  console.log(`   HTTP API  : http://localhost:${port}/api`);
  console.log(`   Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`   角色目录  : http://localhost:${port}/api/roles-catalog`);
  console.log(`\n🔑 测试用 x-user-id：`);
  console.log(`   任课老师: T001(张老师) T002(李老师) T003(王老师)`);
  console.log(`   教务老师: A001(陈教务) A002(刘教务)`);
  console.log(`   家长顾问: AD001(赵顾问) AD002(孙顾问)`);
}
bootstrap();
