<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/operation/repairs')" title="返回列表" content="报修详情" style="margin-bottom: 20px" />

    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">基本信息</span>
          <el-tag :type="getStatusTag(repair.status).type" size="large" :class="{ 'status-blink': repair.status === 'in_progress' }">
            {{ getStatusTag(repair.status).label }}
          </el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单号">{{ repair.repair_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ repair.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ repair.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ repair.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ SOURCE_MAP[repair.source] || repair.source || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyTag(repair.urgency).type" size="small">{{ getUrgencyTag(repair.urgency).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="SLA截止">
          <template v-if="repair.sla_deadline">
            <span :class="{ 'sla-overdue': computeSlaRemaining(repair.sla_deadline)?.overdue, 'sla-warning': computeSlaRemaining(repair.sla_deadline)?.warning }">
              {{ formatDateTime(repair.sla_deadline) }}
              <template v-if="computeSlaRemaining(repair.sla_deadline)">
                （{{ computeSlaRemaining(repair.sla_deadline).text }}）
              </template>
            </span>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" style="margin-bottom: 20px" v-if="repair.activity_occupation || repair.tenant_timeout || repair.complaint_ambiguous">
      <template #header><span class="card-title">场景标签</span></template>
      <div class="scene-tags-row">
        <el-tag v-if="repair.activity_occupation" type="warning" size="large">活动占道{{ repair.activity_name ? `：${repair.activity_name}` : '' }}</el-tag>
        <el-tag v-if="repair.tenant_timeout" type="danger" size="large">租户超时</el-tag>
        <el-tag v-if="repair.complaint_ambiguous" size="large" color="#9B59B6" style="color:#fff;border:none">投诉归属不清{{ repair.complaint_ref ? `：${repair.complaint_ref}` : '' }}</el-tag>
      </div>
    </el-card>

    <el-card shadow="never" style="margin-bottom: 20px" v-if="repair.dispatch">
      <template #header><span class="card-title">派单信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="派单号">{{ repair.dispatch.dispatch_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工种">{{ WORK_TYPE_MAP[repair.dispatch.work_type] || repair.dispatch.work_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="施工人ID">{{ repair.dispatch.engineer_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(repair.dispatch.status).type" size="small">{{ getStatusTag(repair.dispatch.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="完工说明" :span="2">{{ repair.dispatch.completion_note || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header><span class="card-title">状态流转</span></template>
      <el-timeline>
        <el-timeline-item
          v-for="(log, idx) in statusLogs"
          :key="idx"
          :timestamp="formatDateTime(log.created_at)"
          placement="top"
          :type="idx === statusLogs.length - 1 ? 'primary' : 'info'"
        >
          <el-card shadow="never" class="timeline-card">
            <p><strong>{{ getStatusTag(log.to_status).label }}</strong></p>
            <p v-if="log.operator_name">操作人：{{ log.operator_name }}</p>
            <p v-if="log.remark">备注：{{ log.remark }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!statusLogs.length" description="暂无状态记录" />
    </el-card>

    <div class="bottom-actions" v-if="repair.status === 'completed'">
      <el-button type="primary" size="large" @click="handleClose">关闭报修单</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'
import { getStatusTag, getUrgencyTag, computeSlaRemaining, formatDateTime, SOURCE_MAP, WORK_TYPE_MAP } from '../../utils/constants'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const repair = ref({})
const statusLogs = ref([])

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await api.get(`/repairs/${route.params.id}`)
    repair.value = res
    statusLogs.value = res.status_logs || []
  } catch {
  } finally {
    loading.value = false
  }
}

const handleClose = async () => {
  try {
    await ElMessageBox.confirm('确认关闭此报修单？', '提示', { type: 'warning' })
    await api.post(`/repairs/${route.params.id}/close`)
    ElMessage.success('已关闭')
    fetchDetail()
  } catch {
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.card-title {
  font-size: 16px;
  font-weight: 600;
}
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.scene-tags-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.timeline-card {
  padding: 0;
}
.timeline-card p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}
.sla-overdue {
  color: #f56c6c;
  font-weight: 700;
}
.sla-warning {
  color: #e6a23c;
  font-weight: 600;
}
.bottom-actions {
  text-align: center;
  margin-top: 20px;
}
.status-blink {
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
