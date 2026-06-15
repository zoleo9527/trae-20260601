<template>
  <div class="shift-report">
    <div class="toolbar">
      <el-select v-model="selectedShift" placeholder="选择班次">
        <el-option label="早班 (8:00-12:00)" value="morning" />
        <el-option label="中班 (12:00-18:00)" value="afternoon" />
        <el-option label="晚班 (18:00-22:00)" value="evening" />
      </el-select>
      <el-button @click="generateReport" type="primary">生成报表</el-button>
      <el-button @click="exportReport" type="success" :disabled="!reportData">导出报表</el-button>
    </div>

    <div v-if="reportData" class="report-content">
      <el-card title="班次信息" class="info-card">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="班次">{{ getShiftName(reportData.shift) }}</el-descriptions-item>
          <el-descriptions-item label="时间段">{{ reportData.start_time }} - {{ reportData.end_time }}</el-descriptions-item>
          <el-descriptions-item label="总工单数">{{ reportData.total_orders }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ reportData.completed }}</el-descriptions-item>
          <el-descriptions-item label="进行中">{{ reportData.in_progress }}</el-descriptions-item>
          <el-descriptions-item label="领用备件数">{{ reportData.parts_issued }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <div class="stats-row">
        <el-card class="stat-card">
          <div class="stat-header">工单完成率</div>
          <div class="stat-circle">
            <div class="circle-inner">
              <span class="circle-value">{{ completionRate }}%</span>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-header">待交接工单</div>
          <div class="pending-count">{{ reportData.in_progress }}</div>
          <div class="stat-desc">需要下一班处理</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-header">备件使用</div>
          <div class="pending-count">{{ reportData.parts_issued }}</div>
          <div class="stat-desc">件备件被领用</div>
        </el-card>
      </div>

      <el-card title="班次工单列表">
        <el-table :data="reportData.orders" border>
          <el-table-column prop="order_no" label="工单号" />
          <el-table-column prop="customer_name" label="客户" />
          <el-table-column prop="device_model" label="机型" />
          <el-table-column prop="problem_description" label="问题描述" :show-overflow-tooltip="true" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" />
        </el-table>
      </el-card>

      <div class="sign-off">
        <el-card title="交班签字">
          <div class="sign-row">
            <div class="sign-item">
              <span class="sign-label">交班人:</span>
              <el-input v-model="signForm.off_signature" placeholder="请输入姓名" />
            </div>
            <div class="sign-item">
              <span class="sign-label">接班人:</span>
              <el-input v-model="signForm.on_signature" placeholder="请输入姓名" />
            </div>
            <div class="sign-item">
              <span class="sign-label">交接时间:</span>
              <span class="sign-value">{{ new Date().toLocaleString('zh-CN') }}</span>
            </div>
          </div>
          <el-button @click="signOff" type="primary" style="margin-top: 20px">确认交接</el-button>
        </el-card>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-icon class="empty-icon"><component :is="icons.FileText" /></el-icon>
      <div class="empty-text">请选择班次并生成报表</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { FileText } from '@element-plus/icons-vue'
import { records } from '../api'

const icons = { FileText }

const selectedShift = ref('morning')
const reportData = ref(null)

const signForm = reactive({
  off_signature: '',
  on_signature: ''
})

const getShiftName = (shift) => {
  const names = {
    morning: '早班',
    afternoon: '中班',
    evening: '晚班'
  }
  return names[shift] || shift
}

const getStatusTagType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '维修中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const completionRate = computed(() => {
  if (!reportData.value || reportData.value.total_orders === 0) return 0
  return Math.round((reportData.value.completed / reportData.value.total_orders) * 100)
})

const generateReport = async () => {
  const res = await records.getShiftReport(selectedShift.value)
  reportData.value = res.data
}

const exportReport = async () => {
  if (!reportData.value) return
  
  const data = {
    ...reportData.value,
    sign_form: signForm,
    export_time: new Date().toLocaleString('zh-CN')
  }
  
  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shift_report_${selectedShift.value}_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const signOff = () => {
  if (!signForm.off_signature || !signForm.on_signature) {
    alert('请填写交班人和接班人姓名')
    return
  }
  alert(`交接完成！\n交班人: ${signForm.off_signature}\n接班人: ${signForm.on_signature}\n时间: ${new Date().toLocaleString('zh-CN')}`)
}
</script>

<style scoped>
.shift-report {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  max-width: 600px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  text-align: center;
}

.stat-header {
  font-weight: bold;
  margin-bottom: 15px;
}

.stat-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(#409eff 0deg, #409eff var(--progress, 0deg), #eee var(--progress, 0deg));
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  position: relative;
}

.stat-circle::before {
  content: '';
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: white;
}

.circle-inner {
  position: relative;
  z-index: 1;
}

.circle-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.pending-count {
  font-size: 36px;
  font-weight: bold;
  color: #e6a23c;
}

.stat-desc {
  color: #999;
  font-size: 14px;
  margin-top: 5px;
}

.sign-off {
  max-width: 800px;
}

.sign-row {
  display: flex;
  gap: 40px;
}

.sign-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sign-label {
  font-weight: bold;
}

.sign-value {
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 100px 0;
}

.empty-icon {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 20px;
}

.empty-text {
  color: #999;
  font-size: 16px;
}
</style>
