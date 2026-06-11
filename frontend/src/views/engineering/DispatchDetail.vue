<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/engineering/pending')" title="返回列表" content="派单详情" style="margin-bottom: 20px" />

    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">派单信息</span>
          <el-tag :type="getStatusTag(dispatch.status).type" size="large" :class="{ 'status-blink': dispatch.status === 'in_progress' }">
            {{ getStatusTag(dispatch.status).label }}
          </el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="派单号">{{ dispatch.dispatch_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联报修单">{{ dispatch.repair_no || dispatch.repair?.repair_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作内容" :span="2">{{ dispatch.work_content || dispatch.repair?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工种">{{ WORK_TYPE_MAP[dispatch.work_type] || dispatch.work_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预计工时">{{ dispatch.estimated_hours ? `${dispatch.estimated_hours}小时` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="施工人">{{ dispatch.engineer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="派单人">{{ dispatch.dispatcher_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyTag(dispatch.urgency || dispatch.repair?.urgency).type" size="small">
            {{ getUrgencyTag(dispatch.urgency || dispatch.repair?.urgency).label }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" style="margin-bottom: 20px" v-if="dispatch.repair">
      <template #header><span class="card-title">关联报修信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报修单号">{{ dispatch.repair.repair_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ dispatch.repair.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ dispatch.repair.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ dispatch.repair.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ SOURCE_MAP[dispatch.repair.source] || dispatch.repair.source || '-' }}</el-descriptions-item>
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

    <div class="bottom-actions" v-if="dispatch.status === 'pending'">
      <el-button type="success" size="large" @click="handleAccept" :loading="accepting">接单</el-button>
    </div>

    <el-card shadow="never" style="margin-bottom: 20px" v-if="dispatch.status === 'in_progress'">
      <template #header><span class="card-title">完工提交</span></template>
      <el-form label-width="100px" style="max-width: 560px">
        <el-form-item label="完工说明">
          <el-input v-model="completionNote" type="textarea" :rows="4" placeholder="请描述完工情况" />
        </el-form-item>
        <el-form-item label="材料使用">
          <el-input v-model="materialUsage" type="textarea" :rows="3" placeholder="请描述材料使用情况" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" @click="handleComplete" :loading="completing">提交完工</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'
import { getStatusTag, getUrgencyTag, formatDateTime, WORK_TYPE_MAP, SOURCE_MAP } from '../../utils/constants'

const route = useRoute()
const loading = ref(false)
const accepting = ref(false)
const completing = ref(false)
const dispatch = ref({})
const statusLogs = ref([])
const completionNote = ref('')
const materialUsage = ref('')

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await api.get(`/dispatches/${route.params.id}`)
    dispatch.value = res
    statusLogs.value = res.status_logs || []
  } catch {
  } finally {
    loading.value = false
  }
}

const handleAccept = async () => {
  try {
    await ElMessageBox.confirm('确认接单？接单后将进入施工状态。', '接单确认', { type: 'info' })
    accepting.value = true
    await api.post(`/dispatches/${route.params.id}/accept`, { remark: '' })
    ElMessage.success('接单成功，已进入施工状态')
    fetchDetail()
  } catch {
  } finally {
    accepting.value = false
  }
}

const handleComplete = async () => {
  if (!completionNote.value.trim()) {
    ElMessage.warning('请填写完工说明')
    return
  }
  try {
    await ElMessageBox.confirm('确认提交完工？', '完工确认', { type: 'info' })
    completing.value = true
    await api.post(`/dispatches/${route.params.id}/complete`, {
      completion_note: completionNote.value,
      material_usage: materialUsage.value,
    })
    ElMessage.success('完工提交成功')
    fetchDetail()
  } catch {
  } finally {
    completing.value = false
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
.timeline-card {
  padding: 0;
}
.timeline-card p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
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
