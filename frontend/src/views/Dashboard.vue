<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const dashboard = ref(null)
const loading = ref(true)
const error = ref('')

const statusLabels = {
  pending: '待确认',
  confirmed: '已确认',
  inoculating: '接种中',
  inoculated: '已接种',
  observing: '留观中',
  completed: '已完成',
  cancelled: '已取消',
}

const obsStatusLabels = {
  waiting: '等待留观',
  observing: '留观中',
  completed: '留观完成',
  abnormal: '异常',
}

const severityColors = {
  high: '#f56c6c',
  medium: '#e6a23c',
}

onMounted(async () => {
  try {
    const res = await api.getDashboard()
    dashboard.value = res.data
  } catch (e) {
    error.value = e?.error?.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else-if="dashboard">
      <section class="alert-section" v-if="dashboard.alerts?.length">
        <h4 class="section-title alert-title">⚠ 告警通知</h4>
        <div class="alert-list">
          <div
            v-for="a in dashboard.alerts"
            :key="a.id"
            class="alert-card"
            :style="{ borderLeftColor: severityColors[a.severity] || '#e6a23c' }"
          >
            <div class="alert-head">
              <span class="alert-resident">{{ a.residentName }}</span>
              <span class="alert-vaccine">{{ a.vaccineName }}</span>
              <span class="alert-severity" :style="{ color: severityColors[a.severity] }">
                {{ a.severity === 'high' ? '严重' : '警告' }}
              </span>
            </div>
            <div class="alert-msg">{{ a.message }}</div>
          </div>
        </div>
      </section>

      <section class="stats-section">
        <h4 class="section-title">预约统计</h4>
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-value">{{ dashboard.totalAppointments }}</div>
            <div class="stat-label">总预约</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">{{ dashboard.pendingAppointments }}</div>
            <div class="stat-label">待确认</div>
          </div>
          <div class="stat-card info">
            <div class="stat-value">{{ dashboard.confirmedAppointments }}</div>
            <div class="stat-label">已确认</div>
          </div>
          <div class="stat-card primary">
            <div class="stat-value">{{ dashboard.inoculatingAppointments }}</div>
            <div class="stat-label">接种中</div>
          </div>
          <div class="stat-card info">
            <div class="stat-value">{{ dashboard.inoculatedAppointments }}</div>
            <div class="stat-label">已接种</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-value">{{ dashboard.observingAppointments }}</div>
            <div class="stat-label">留观中</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ dashboard.completedAppointments }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ dashboard.cancelledAppointments }}</div>
            <div class="stat-label">已取消</div>
          </div>
        </div>
      </section>

      <section class="stats-section">
        <h4 class="section-title">留观统计</h4>
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-value">{{ dashboard.totalObservations }}</div>
            <div class="stat-label">总留观</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">{{ dashboard.waitingObservations }}</div>
            <div class="stat-label">等待留观</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-value">{{ dashboard.observingObservations }}</div>
            <div class="stat-label">留观中</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ dashboard.completedObservations }}</div>
            <div class="stat-label">正常关闭</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ dashboard.abnormalObservations }}</div>
            <div class="stat-label">异常关闭</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ dashboard.alertObservations }}</div>
            <div class="stat-label">告警中</div>
          </div>
        </div>
      </section>

      <section class="stats-section" v-if="dashboard.totalContracts !== undefined">
        <h4 class="section-title">签约与随访</h4>
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-value">{{ dashboard.totalContracts }}</div>
            <div class="stat-label">总签约</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ dashboard.activeContracts }}</div>
            <div class="stat-label">有效签约</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ dashboard.expiredContracts }}</div>
            <div class="stat-label">已过期</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">{{ dashboard.pendingFollowups }}</div>
            <div class="stat-label">待随访</div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1100px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.error {
  color: #f56c6c;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.alert-title {
  color: #e6a23c;
}

.alert-section {
  margin-bottom: 24px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  border-left: 4px solid #e6a23c;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.alert-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.alert-resident {
  font-weight: 600;
  color: #303133;
}

.alert-vaccine {
  font-size: 13px;
  color: #909399;
}

.alert-severity {
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
}

.alert-msg {
  font-size: 13px;
  color: #606266;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-card.success .stat-value { color: #67c23a; }
.stat-card.warning .stat-value { color: #e6a23c; }
.stat-card.danger .stat-value { color: #f56c6c; }
.stat-card.info .stat-value { color: #909399; }
.stat-card.primary .stat-value { color: #409eff; }
.stat-card.orange .stat-value { color: #e6a23c; }
</style>
