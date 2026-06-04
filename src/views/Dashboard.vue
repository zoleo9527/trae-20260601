<template>
  <div class="page-content">
    <div class="page-header">
      <h2 class="page-title">首页概览</h2>
      <el-button type="primary" :icon="Refresh" @click="loadData" :loading="loading">
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <div class="stat-icon">
            <el-icon :size="32"><List /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待办事项</div>
            <div class="stat-value">{{ stats?.todoCount || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-icon">
            <el-icon :size="32"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">风险项</div>
            <div class="stat-value">{{ stats?.riskCount || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <div class="stat-icon">
            <el-icon :size="32"><Box /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">今日术后用药</div>
            <div class="stat-value">{{ stats?.todayMedicationCount || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
          <div class="stat-icon">
            <el-icon :size="32"><Calendar /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">今日复诊</div>
            <div class="stat-value">{{ stats?.todayFollowupCount || 0 }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <div class="card-wrapper">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon color="#409EFF"><AlarmClock /></el-icon>
              待办事项
              <el-tag size="small" type="info" style="margin-left: 8px">
                按优先级排序
              </el-tag>
            </h3>
          </div>

          <el-table :data="stats?.todoItems || []" size="small" class="todo-table" @row-click="handleGotoTodo">
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.priority === 'high'" type="danger" size="small">高</el-tag>
                <el-tag v-else-if="row.priority === 'medium'" type="warning" size="small">中</el-tag>
                <el-tag v-else type="info" size="small">低</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'medication' ? 'primary' : 'success'" size="small">
                  {{ row.type === 'medication' ? '术后用药' : '复诊提醒' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="patientName" label="患者" width="100" />
            <el-table-column prop="title" label="事项" />
            <el-table-column prop="time" label="时间" width="160" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click.stop="handleGotoTodo(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="card-wrapper" style="margin-top: 20px">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon color="#e6a23c"><Clock /></el-icon>
              最近变更
            </h3>
          </div>

          <el-timeline class="timeline-wrapper">
            <el-timeline-item
              v-for="item in stats?.recentChanges || []"
              :key="item.id"
              :timestamp="item.time"
              placement="top"
            >
              <el-card shadow="never" class="timeline-card" @click="handleGotoRecent(item)">
                <div class="timeline-content">
                  <el-tag
                    :type="item.type === 'medication' ? 'primary' : 'success'"
                    size="small"
                  >
                    {{ item.type === 'medication' ? '用药' : '复诊' }}
                  </el-tag>
                  <span class="patient-name clickable">{{ item.patientName }}</span>
                  <span class="action-text clickable">{{ item.action }}</span>
                </div>
                <div class="timeline-footer">
                  <el-icon><User /></el-icon>
                  <span>{{ item.operatorName }}</span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card-wrapper">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon color="#f56c6c"><Warning /></el-icon>
              风险预警
            </h3>
          </div>

          <div v-if="!stats?.riskItems?.length" class="empty-state">
            <el-empty description="暂无风险项" :image-size="80" />
          </div>

          <div v-else class="risk-list">
            <div
              v-for="item in stats?.riskItems || []"
              :key="item.id"
              class="risk-item"
              @click="handleGotoRisk(item)"
            >
              <div class="risk-header">
                <el-tag
                  :type="item.level === 'high' ? 'danger' : item.level === 'medium' ? 'warning' : 'info'"
                  effect="dark"
                  size="small"
                >
                  {{ item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
                <el-tag
                  :type="item.type === 'medication' ? 'primary' : 'success'"
                  size="small"
                >
                  {{ item.type === 'medication' ? '用药' : '复诊' }}
                </el-tag>
              </div>
              <div class="risk-patient">{{ item.patientName }}</div>
              <div class="risk-reason">{{ item.reason }}</div>
            </div>
          </div>
        </div>

        <div class="card-wrapper" style="margin-top: 20px">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon color="#909399"><DataLine /></el-icon>
              待处理统计
            </h3>
          </div>

          <div class="mini-stats">
            <div class="mini-stat-item">
              <div class="mini-stat-value primary">{{ stats?.pendingMedicationCount || 0 }}</div>
              <div class="mini-stat-label">待处理用药</div>
            </div>
            <div class="mini-stat-item">
              <div class="mini-stat-value success">{{ stats?.pendingFollowupCount || 0 }}</div>
              <div class="mini-stat-label">待处理复诊</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, List, Warning, Box, Calendar, AlarmClock, Clock, User, DataLine } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/useAppStore'
import type { TodoItem, RiskItem, DashboardStats, RecentChange } from '@/types'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)
const stats = ref<DashboardStats | null>(null)

async function loadData() {
  loading.value = true
  try {
    await appStore.fetchDashboardStats()
    stats.value = appStore.dashboardStats
  } finally {
    loading.value = false
  }
}

function gotoTaskDetail(item: { id: string; type: 'medication' | 'followup' }) {
  if (item.type === 'medication') {
    router.push(`/medication/${item.id}`)
  } else {
    router.push(`/followup/${item.id}`)
  }
}

function handleGotoTodo(row: TodoItem) {
  gotoTaskDetail(row)
}

function handleGotoRisk(item: RiskItem) {
  gotoTaskDetail(item)
}

function handleGotoRecent(item: RecentChange) {
  gotoTaskDetail(item)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stats-row {
  margin-bottom: 10px;
}

.stat-card {
  padding: 24px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.todo-table {
  margin-top: 10px;
}

:deep(.todo-table .el-table__row) {
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.todo-table .el-table__row:hover) {
  background-color: #ecf5ff;
}

.timeline-card {
  border: 1px solid #ebeef5;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.timeline-content {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.patient-name {
  font-weight: 600;
  color: #303133;
}

.action-text {
  color: #606266;
}

.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.clickable:hover {
  color: #409EFF;
  text-decoration: underline;
}

.timeline-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.risk-list {
  max-height: 500px;
  overflow-y: auto;
}

.risk-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.risk-item:hover {
  border-color: #f56c6c;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.15);
}

.risk-header {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.risk-patient {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.risk-reason {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.mini-stats {
  display: flex;
  gap: 20px;
}

.mini-stat-item {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.mini-stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
}

.mini-stat-value.primary {
  color: #409EFF;
}

.mini-stat-value.success {
  color: #67c23a;
}

.mini-stat-label {
  font-size: 13px;
  color: #909399;
}

.empty-state {
  padding: 40px 0;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
