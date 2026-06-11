<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/service/pending')" title="返回列表" content="报修详情" style="margin-bottom: 20px" />

    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">基本信息</span>
          <div class="header-tags">
            <el-tag :type="getStatusTag(repair.status).type" size="large" :class="{ 'status-blink': repair.status === 'in_progress' }">
              {{ getStatusTag(repair.status).label }}
            </el-tag>
            <el-tag :type="getUrgencyTag(repair.urgency).type" size="large">{{ getUrgencyTag(repair.urgency).label }}</el-tag>
          </div>
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
      <template #header>
        <div class="card-header-row">
          <span class="card-title">派单信息</span>
          <el-tag :type="getStatusTag(repair.dispatch.status).type" size="large" :class="{ 'status-blink': repair.dispatch.status === 'in_progress' }">
            {{ getStatusTag(repair.dispatch.status).label }}
          </el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="派单号">{{ repair.dispatch.dispatch_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工种">{{ WORK_TYPE_MAP[repair.dispatch.work_type] || repair.dispatch.work_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="派单人">{{ repair.dispatch.dispatcher_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="施工人">{{ repair.dispatch.engineer_name || (repair.dispatch.engineer_id ? `ID:${repair.dispatch.engineer_id}` : '-') }}</el-descriptions-item>
        <el-descriptions-item label="派单时间">{{ formatDateTime(repair.dispatch.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="预计工时">{{ repair.dispatch.estimated_hours ? `${repair.dispatch.estimated_hours}小时` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="接单时间">{{ formatDateTime(repair.dispatch.accepted_at) }}</el-descriptions-item>
        <el-descriptions-item label="开工时间">{{ formatDateTime(repair.dispatch.started_at) }}</el-descriptions-item>
        <el-descriptions-item label="完工时间">{{ formatDateTime(repair.dispatch.completed_at) }}</el-descriptions-item>
        <el-descriptions-item label="验证时间">{{ formatDateTime(repair.dispatch.verified_at) }}</el-descriptions-item>
        <el-descriptions-item label="工作内容" :span="2">{{ repair.dispatch.work_content || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完工说明" :span="2">{{ repair.dispatch.completion_note || '-' }}</el-descriptions-item>
        <el-descriptions-item label="材料使用" :span="2">{{ repair.dispatch.material_usage || '-' }}</el-descriptions-item>
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
          :type="idx === statusLogs.length - 1 ? 'primary' : getLogType(log)"
        >
          <el-card shadow="never" class="timeline-card">
            <p><strong>{{ getStatusTag(log.to_status).label }}</strong>
              <span v-if="log.from_status" style="color:#909399;font-size:12px;margin-left:6px">
                由 {{ getStatusTag(log.from_status).label }} 变更
              </span>
            </p>
            <p v-if="log.operator_name">
              操作人：{{ log.operator_name }}
              <span style="color:#909399;margin-left:6px">({{ ROLE_MAP[log.operator_role] || log.operator_role }})</span>
            </p>
            <p v-if="log.remark">备注：{{ log.remark }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!statusLogs.length" description="暂无状态记录" />
    </el-card>

    <div class="bottom-actions">
      <el-button v-if="repair.status === 'pending'" type="success" size="large" @click="showAcceptDialog">受理报修</el-button>
      <el-button v-if="repair.dispatch && ['completed', 'verified'].includes(repair.dispatch.status)" type="primary" size="large" @click="handleClose">关闭报修单</el-button>
    </div>

    <el-dialog v-model="acceptDialogVisible" title="确认受理并派单" width="560px">
      <p style="margin-bottom: 8px; color: #909399">受理后系统将自动创建工程派单，无需另外通知工程部</p>
      <el-form ref="acceptFormRef" :model="acceptForm" :rules="acceptRules" label-width="100px" style="margin-top: 16px">
        <el-form-item label="派单内容" prop="work_content">
          <el-input v-model="acceptForm.work_content" type="textarea" :rows="3" placeholder="请填写派单工作内容" />
        </el-form-item>
        <el-form-item label="工种" prop="work_type">
          <el-select v-model="acceptForm.work_type" placeholder="请选择工种" style="width: 100%">
            <el-option label="电气" value="电气" />
            <el-option label="水管" value="水管" />
            <el-option label="空调" value="空调" />
            <el-option label="装修" value="装修" />
            <el-option label="综合" value="综合" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派工程师" prop="engineer_id">
          <el-select v-model="acceptForm.engineer_id" placeholder="请选择工程师" style="width: 100%">
            <el-option v-for="e in engineers" :key="e.id" :label="`${e.display_name}（${e.department}）`" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计工时">
          <el-input-number v-model="acceptForm.estimated_hours" :min="0.5" :max="72" :step="0.5" />
          <span style="margin-left: 8px; color: #909399">小时</span>
        </el-form-item>
        <el-form-item label="受理备注">
          <el-input v-model="acceptForm.remark" type="textarea" :rows="2" placeholder="可选填写受理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAccept" :loading="accepting">确认受理并派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'
import { getStatusTag, getUrgencyTag, computeSlaRemaining, formatDateTime, SOURCE_MAP, WORK_TYPE_MAP } from '../../utils/constants'

const ROLE_MAP = {
  operation: '营运专员',
  service_desk: '客服台',
  engineering: '工程部',
  admin: '管理员',
}

const getLogType = (log) => {
  const terminal = ['completed', 'closed', 'verified']
  if (terminal.includes(log.to_status)) return 'success'
  if (log.to_status === 'pending') return 'info'
  if (['accepted', 'dispatched', 'in_progress'].includes(log.to_status)) return 'warning'
  return 'info'
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const accepting = ref(false)
const repair = ref({})
const statusLogs = ref([])
const acceptDialogVisible = ref(false)
const engineers = ref([])
const acceptFormRef = ref(null)
const acceptForm = ref({
  work_content: '',
  work_type: '',
  engineer_id: null,
  estimated_hours: 4.0,
  remark: '',
})
const acceptRules = {
  work_content: [{ required: true, message: '请填写派单内容', trigger: 'blur' }],
  engineer_id: [{ required: true, message: '请选择工程师', trigger: 'change' }],
}

const fetchEngineers = async () => {
  try {
    const res = await api.get('/dispatches/engineers')
    engineers.value = Array.isArray(res) ? res : []
  } catch {
    engineers.value = []
  }
}

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

const showAcceptDialog = () => {
  acceptForm.value = {
    work_content: '',
    work_type: '',
    engineer_id: null,
    estimated_hours: 4.0,
    remark: '',
  }
  acceptDialogVisible.value = true
  fetchEngineers()
}

const handleAccept = async () => {
  const valid = await acceptFormRef.value.validate().catch(() => false)
  if (!valid) return
  accepting.value = true
  try {
    await api.post(`/repairs/${route.params.id}/accept`, acceptForm.value)
    ElMessage.success('受理成功，工程派单已自动创建')
    acceptDialogVisible.value = false
    fetchDetail()
  } catch {
  } finally {
    accepting.value = false
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
.header-tags {
  display: flex;
  gap: 8px;
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
