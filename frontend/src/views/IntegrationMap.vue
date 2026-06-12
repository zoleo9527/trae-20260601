<template>
  <div class="page-container">
    <div class="dispute-highlight">
      <div class="alert-header">
        <el-icon size="18" color="#409eff"><Connection /></el-icon>
        <strong>系统集成总览</strong>
        <span style="margin-left: 8px; font-size: 13px; color: #909399">
          当前版本：v1.0.0（演示版）· 数据存储：内存数组 · 下次启动数据将重置
        </span>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <div class="section-card">
          <div class="section-title" style="border-left-color: #409eff">
            📍 模拟数据位置
          </div>

          <div class="map-section">
            <h3 class="section-subtitle">后端种子数据</h3>
            <div class="file-item">
              <el-icon color="#e6a23c"><Document /></el-icon>
              <div class="file-info">
                <div class="file-path">
                  <code class="repo-path">backend/src/seed/run.ts</code>
                </div>
                <div class="file-desc">
                  系统启动时运行，预置 4 套房源、5 个扯皮场景、3 个角色账号
                </div>
                <div class="file-highlight">
                  <el-tag size="small" type="warning">内存存储</el-tag>
                  <span style="margin-left: 8px">所有数据存储在各 Service 的数组中，重启即清空</span>
                </div>
              </div>
            </div>

            <h3 class="section-subtitle">各模块内存数据位置</h3>
            <div class="data-locations">
              <div class="data-location-item">
                <span class="data-label">房源台账</span>
                <code class="data-path">PropertyService.properties []</code>
              </div>
              <div class="data-location-item">
                <span class="data-label">看房记录</span>
                <code class="data-path">ViewingService.viewings []</code>
              </div>
              <div class="data-location-item">
                <span class="data-label">交房验收</span>
                <code class="data-path">HandoverService.handovers []</code>
              </div>
              <div class="data-location-item">
                <span class="data-label">钥匙移交</span>
                <code class="data-path">KeyTransferService.transfers []</code>
              </div>
              <div class="data-location-item">
                <span class="data-label">押金结算</span>
                <code class="data-path">DepositService.deposits []</code>
              </div>
              <div class="data-location-item">
                <span class="data-label">审计日志</span>
                <code class="data-path">AuditService.entries []</code>
              </div>
            </div>

            <h3 class="section-subtitle">模拟用户账号</h3>
            <div class="file-item">
              <el-icon color="#e6a23c"><Document /></el-icon>
              <div class="file-info">
                <div class="file-path">
                  <code class="repo-path">backend/src/modules/auth/auth.service.ts#L12-L16</code>
                </div>
                <div class="file-desc">硬编码 3 个用户，未对接真实用户体系</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card" style="margin-top: 20px">
          <div class="section-title" style="border-left-color: #67c23a">
            🎭 角色入口
          </div>

          <div class="roles-grid">
            <div class="role-card role-consultant">
              <div class="role-header">
                <el-icon size="24"><User /></el-icon>
                <div>
                  <div class="role-name">租赁顾问</div>
                  <div class="role-account">账号: consultant1 / pass123</div>
                </div>
              </div>
              <div class="role-permissions">
                <div class="perm-title">可执行操作：</div>
                <ul class="perm-list">
                  <li>✅ 提交交房验收</li>
                  <li>✅ 发起钥匙移交</li>
                  <li>✅ 发起押金结算</li>
                  <li>✅ 录入看房反馈</li>
                  <li>❌ 确认交房验收</li>
                  <li>❌ 接收钥匙</li>
                  <li>❌ 押金确认/异议</li>
                  <li>❌ 查看审计日志</li>
                </ul>
              </div>
              <div class="role-actions">
                <el-button type="primary" size="small" @click="quickLogin('consultant1')">
                  快速登录
                </el-button>
              </div>
            </div>

            <div class="role-card role-operations">
              <div class="role-header">
                <el-icon size="24"><Management /></el-icon>
                <div>
                  <div class="role-name">运营经理</div>
                  <div class="role-account">账号: operations1 / pass123</div>
                </div>
              </div>
              <div class="role-permissions">
                <div class="perm-title">可执行操作：</div>
                <ul class="perm-list">
                  <li>✅ 确认交房验收</li>
                  <li>✅ 提出/解决验收异议</li>
                  <li>✅ 确认接收钥匙</li>
                  <li>✅ 钥匙归还登记</li>
                  <li>✅ 查看审计日志</li>
                  <li>❌ 提交交房验收</li>
                  <li>❌ 发起押金结算</li>
                  <li>❌ 押金确认/异议</li>
                </ul>
              </div>
              <div class="role-actions">
                <el-button type="success" size="small" @click="quickLogin('operations1')">
                  快速登录
                </el-button>
              </div>
            </div>

            <div class="role-card role-finance">
              <div class="role-header">
                <el-icon size="24"><Wallet /></el-icon>
                <div>
                  <div class="role-name">财务</div>
                  <div class="role-account">账号: finance1 / pass123</div>
                </div>
              </div>
              <div class="role-permissions">
                <div class="perm-title">可执行操作：</div>
                <ul class="perm-list">
                  <li>✅ 确认押金结算</li>
                  <li>✅ 提出/解决押金异议</li>
                  <li>✅ 标记押金已结算</li>
                  <li>✅ 查看审计日志</li>
                  <li>❌ 提交交房验收</li>
                  <li>❌ 确认交房验收</li>
                  <li>❌ 钥匙移交操作</li>
                  <li>❌ 录入看房反馈</li>
                </ul>
              </div>
              <div class="role-actions">
                <el-button type="warning" size="small" @click="quickLogin('finance1')">
                  快速登录
                </el-button>
              </div>
            </div>
          </div>

          <div class="section-subtitle" style="margin-top: 20px">权限校验位置</div>
          <div class="data-locations">
            <div class="data-location-item">
              <span class="data-label">后端角色 Guard</span>
              <code class="repo-path">backend/src/common/guards/roles.guard.ts</code>
            </div>
            <div class="data-location-item">
              <span class="data-label">角色装饰器</span>
              <code class="repo-path">backend/src/common/decorators/roles.decorator.ts</code>
            </div>
            <div class="data-location-item">
              <span class="data-label">前端路由鉴权</span>
              <code class="repo-path">frontend/src/router/index.js#L77-L88</code>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="12">
        <div class="section-card">
          <div class="section-title" style="border-left-color: #f56c6c">
            🚧 暂未实现的集成点
          </div>

          <div class="integration-list">
            <div class="integration-item priority-high">
              <div class="integ-header">
                <el-tag type="danger" size="small">高优先级</el-tag>
                <span class="integ-name">持久化数据库</span>
              </div>
              <div class="integ-desc">
                当前所有数据存储在内存数组中，服务重启即丢失。需要接入 TypeORM / Prisma + MySQL / PostgreSQL。
              </div>
              <div class="integ-files">
                <span class="integ-file-label">涉及文件：</span>
                <code class="integ-file">所有 *.service.ts 中的 private xxx: [] 数组</code>
              </div>
            </div>

            <div class="integration-item priority-high">
              <div class="integ-header">
                <el-tag type="danger" size="small">高优先级</el-tag>
                <span class="integ-name">真实用户体系</span>
              </div>
              <div class="integ-desc">
                当前用户硬编码在 auth.service.ts，需要对接企业微信 / LDAP / OAuth / 自建用户中心。
              </div>
              <div class="integ-files">
                <span class="integ-file-label">涉及文件：</span>
                <code class="integ-file">auth.service.ts SEED_USERS (backend/src/modules/auth/auth.service.ts#L12-L16)</code>
              </div>
            </div>

            <div class="integration-item priority-high">
              <div class="integ-header">
                <el-tag type="danger" size="small">高优先级</el-tag>
                <span class="integ-name">消息通知系统</span>
              </div>
              <div class="integ-desc">
                争议产生、状态变更、待办提醒时，没有推送通知。需要接入：站内信、邮件、企业微信/钉钉/飞书机器人、短信。
              </div>
            </div>

            <div class="integration-item priority-warning">
              <div class="integ-header">
                <el-tag type="warning" size="small">中优先级</el-tag>
                <span class="integ-name">文件/照片上传</span>
              </div>
              <div class="integ-desc">
                交房验收没有现场照片、签字单据附件；钥匙移交没有签收照片。需要对接对象存储（OSS/COS/S3）+ 文件预览。
              </div>
            </div>

            <div class="integration-item priority-warning">
              <div class="integ-header">
                <el-tag type="warning" size="small">中优先级</el-tag>
                <span class="integ-name">财务系统对接</span>
              </div>
              <div class="integ-desc">
                押金结算仅在系统内标记状态，未对接真实支付/对账系统（网银、金蝶、用友等）。
              </div>
            </div>

            <div class="integration-item priority-warning">
              <div class="integ-header">
                <el-tag type="warning" size="small">中优先级</el-tag>
                <span class="integ-name">电子签章</span>
              </div>
              <div class="integ-desc">
                交房验收单、钥匙交接单、押金结算单没有电子签名/签章，不具备法律效力。需要对接 e签宝 / 法大大 等。
              </div>
            </div>

            <div class="integration-item priority-info">
              <div class="integ-header">
                <el-tag type="info" size="small">低优先级</el-tag>
                <span class="integ-name">短信通知</span>
              </div>
              <div class="integ-desc">
                租客/客户侧的看房提醒、入住通知、押金退还通知等，没有短信触达。
              </div>
            </div>

            <div class="integration-item priority-info">
              <div class="integ-header">
                <el-tag type="info" size="small">低优先级</el-tag>
                <span class="integ-name">数据导出</span>
              </div>
              <div class="integ-desc">
                审计日志、押金结算单、交房验收单不能导出为 PDF / Excel，不便于存档和线下流转。
              </div>
            </div>

            <div class="integration-item priority-info">
              <div class="integ-header">
                <el-tag type="info" size="small">低优先级</el-tag>
                <span class="integ-name">IP 地址记录</span>
              </div>
              <div class="integ-desc">
                AuditLog 中有 ip 字段，但目前手动调用 auditService.log() 的地方都未传 ip。
              </div>
              <div class="integ-files">
                <span class="integ-file-label">涉及文件：</span>
                <code class="integ-file">audit.interceptor.ts (backend/src/common/interceptors/audit.interceptor.ts)</code>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card" style="margin-top: 20px">
          <div class="section-title" style="border-left-color: #909399">
            📋 已实现核心能力
          </div>

          <div class="implemented-list">
            <div class="implemented-item done">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <div>
                <strong>审计日志</strong>
                <p>每一步操作都写审计，含 before/after 快照，可按实体回看 —
                  <code class="repo-path">backend/src/modules/audit/audit.service.ts</code>
                </p>
              </div>
            </div>
            <div class="implemented-item done">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <div>
                <strong>钥匙移交回看</strong>
                <p>合并业务事件 + 审计日志生成完整时间线，支持按移交 ID 查询 —
                  <code class="repo-path">backend/src/modules/key-transfer/key-transfer.service.ts#L202-L296</code>
                </p>
              </div>
            </div>
            <div class="implemented-item done">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <div>
                <strong>权限校验</strong>
                <p>双 Guard 机制（JWT + 角色）+ 前端路由级拦截，每个接口都有 @Roles 装饰器 —
                  <code class="repo-path">backend/src/common/guards/roles.guard.ts</code>
                </p>
              </div>
            </div>
            <div class="implemented-item done">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <div>
                <strong>交房验收处理</strong>
                <p>完整四态流转 + 检查清单 + 争议闭环，房源状态机联动 —
                  <code class="repo-path">backend/src/modules/handover/handover.service.ts</code>
                </p>
              </div>
            </div>
            <div class="implemented-item done">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <div>
                <strong>三大扯皮点总览</strong>
                <p>Dashboard 主动暴露房源状态滞后、看房反馈缺失、押金/验收争议 —
                  <code class="repo-path">backend/src/modules/overview/overview.service.ts</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="section-card" style="margin-top: 20px">
      <div class="section-title">
        🗺️  完整流转依赖图
      </div>
      <div class="flow-diagram">
        <div class="flow-row">
          <div class="flow-node status-available">
            <div class="node-title">房源</div>
            <div class="node-sub">available</div>
          </div>
          <el-icon class="flow-arrow"><Right /></el-icon>
          <div class="flow-node status-viewing">
            <div class="node-title">带看</div>
            <div class="node-sub">viewing</div>
          </div>
          <el-icon class="flow-arrow"><Right /></el-icon>
          <div class="flow-node status-leased">
            <div class="node-title">签约</div>
            <div class="node-sub">leased</div>
          </div>
          <el-icon class="flow-arrow"><Right /></el-icon>
          <div class="flow-node status-handover">
            <div class="node-title">交房验收</div>
            <div class="node-sub">顾问提交 → 运营确认</div>
          </div>
          <el-icon class="flow-arrow"><Right /></el-icon>
          <div class="flow-node status-key">
            <div class="node-title">钥匙移交</div>
            <div class="node-sub">顾问发起 → 运营接收</div>
          </div>
          <el-icon class="flow-arrow"><Right /></el-icon>
          <div class="flow-node status-occupied">
            <div class="node-title">入驻</div>
            <div class="node-sub">occupied</div>
          </div>
        </div>
        <div class="flow-row" style="margin-top: 20px; justify-content: center">
          <div class="flow-node status-deposit" style="min-width: 300px">
            <div class="node-title">押金结算（与交房验收并行）</div>
            <div class="node-sub">顾问发起 → 财务确认/异议 → 结算</div>
          </div>
        </div>
        <div class="flow-note">
          <el-icon color="#f56c6c"><InfoFilled /></el-icon>
          每个箭头和节点都有状态机约束 + 审计留痕 + 角色权限校验，不是自由流转
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Connection, Document, User, Management, Wallet,
  Right, CircleCheck, InfoFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function quickLogin(username) {
  try {
    await authStore.login(username, 'pass123')
    ElMessage.success(`已切换为 ${authStore.userName} (${authStore.userRole === 'consultant' ? '租赁顾问' : authStore.userRole === 'operations' ? '运营经理' : '财务'})`)
    router.push('/dashboard')
  } catch (e) {
    ElMessage.error('登录失败')
  }
}
</script>

<style scoped>
.alert-header {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 20px 0 12px;
}

.map-section {
  padding: 4px 0;
}

.file-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.file-info {
  flex: 1;
}

.file-path {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.repo-path {
  color: #409eff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 3px;
}

.file-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.file-highlight {
  font-size: 12px;
  color: #909399;
}

.data-locations {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-location-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 13px;
}

.data-label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
}

.data-path {
  color: #409eff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.role-card {
  border: 2px solid #ebeef5;
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s;
}

.role-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-card.role-consultant {
  border-color: #a0cfff;
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}

.role-card.role-operations {
  border-color: #b3e19d;
  background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
}

.role-card.role-finance {
  border-color: #f5dab1;
  background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
}

.role-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ebeef5;
}

.role-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.role-account {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.perm-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.perm-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.perm-list li {
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.role-actions {
  margin-top: 16px;
  text-align: right;
}

.integration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.integration-item {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.integration-item.priority-high {
  background: linear-gradient(90deg, #fef0f0 0%, #fff 100%);
  border-left: 4px solid #f56c6c;
}

.integration-item.priority-warning {
  background: linear-gradient(90deg, #fdf6ec 0%, #fff 100%);
  border-left: 4px solid #e6a23c;
}

.integration-item.priority-info {
  background: linear-gradient(90deg, #f4f4f5 0%, #fff 100%);
  border-left: 4px solid #909399;
}

.integ-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.integ-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.integ-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
}

.integ-files {
  font-size: 12px;
  color: #909399;
}

.integ-file-label {
  margin-right: 8px;
}

.integ-file {
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.implemented-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.implemented-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #f0f9eb;
  border-radius: 8px;
}

.implemented-item p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
}

.implemented-item strong {
  font-size: 14px;
  color: #303133;
}

.flow-diagram {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.flow-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.flow-node {
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
  min-width: 100px;
}

.flow-node.status-available {
  background: #f0f9eb;
  border: 2px solid #67c23a;
}

.flow-node.status-viewing {
  background: #fdf6ec;
  border: 2px solid #e6a23c;
}

.flow-node.status-leased {
  background: #ecf5ff;
  border: 2px solid #409eff;
}

.flow-node.status-handover {
  background: #fef0f0;
  border: 2px solid #f56c6c;
}

.flow-node.status-key {
  background: #e1f3d8;
  border: 2px solid #67c23a;
}

.flow-node.status-occupied {
  background: #d9ecff;
  border: 2px solid #409eff;
}

.flow-node.status-deposit {
  background: #faecd8;
  border: 2px solid #e6a23c;
}

.node-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.node-sub {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.flow-arrow {
  color: #c0c4cc;
  font-size: 20px;
}

.flow-note {
  margin-top: 20px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 6px;
  font-size: 13px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
