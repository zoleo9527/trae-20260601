<template>
  <div class="detail-page">
    <el-button class="back-btn" @click="$router.push('/complaints')">
      <el-icon><ArrowLeft /></el-icon> 返回投诉列表
    </el-button>

    <div v-loading="complaintStore.loading">
      <el-card shadow="never" class="info-card" v-if="complaint">
        <template #header>
          <div class="card-header">
            <span class="section-title">投诉信息</span>
            <el-tag :type="statusTagType(complaint.status)" size="large">{{ statusLabel(complaint.status) }}</el-tag>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="投诉标题">{{ complaint.title }}</el-descriptions-item>
          <el-descriptions-item label="关联租户">
            <el-button type="primary" link @click="$router.push('/tenants/' + complaint.tenant_id)">
              {{ tenantName }}
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ complaint.handler_user?.name || '未指派' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <span :class="'status-highlight status-' + complaint.status">{{ statusLabel(complaint.status) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="投诉内容" :span="2">{{ complaint.content }}</el-descriptions-item>
        </el-descriptions>

        <div class="action-bar" v-if="canHandle">
          <template v-if="complaint.status === 'pending'">
            <el-button type="primary" @click="handleAction('processing')">
              {{ !complaint.handler && isEngineering ? '接单处理' : '开始处理' }}
            </el-button>
          </template>
          <template v-if="complaint.status === 'processing'">
            <el-button type="success" @click="showResolveDialog = true">标记解决</el-button>
          </template>
        </div>
      </el-card>

      <el-card shadow="never" class="info-card">
        <template #header>
          <span class="section-title">处理历史</span>
        </template>
        <HistoryTimeline :records="historyRecords" />
      </el-card>
    </div>

    <el-dialog v-model="showResolveDialog" title="标记投诉已解决" width="450px" destroy-on-close>
      <el-form :model="resolveForm" label-width="80px">
        <el-form-item label="处理说明">
          <el-input v-model="resolveForm.remark" type="textarea" :rows="3" placeholder="请填写处理说明（将记录在操作历史中）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="success" @click="submitResolve" :loading="submitting">确认解决</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useComplaintStore } from '@/stores/complaint'
import { useTenantStore } from '@/stores/tenant'
import { ElMessage } from 'element-plus'
import HistoryTimeline from '@/components/HistoryTimeline.vue'

const route = useRoute()
const authStore = useAuthStore()
const complaintStore = useComplaintStore()
const tenantStore = useTenantStore()

const showResolveDialog = ref(false)
const submitting = ref(false)
const historyRecords = ref<any[]>([])
const resolveForm = reactive({ remark: '' })

const complaint = computed(() => complaintStore.currentComplaint)
const complaintId = computed(() => Number(route.params.id))
const canHandle = computed(() => ['admin', 'operation', 'engineering'].includes(authStore.userRole))
const isEngineering = computed(() => authStore.isEngineering)

const tenantName = computed(() => {
  if (!complaint.value) return '-'
  return tenantStore.tenants.find(t => t.id === complaint.value.tenant_id)?.name || '-'
})

onMounted(async () => {
  await Promise.all([
    complaintStore.fetchComplaint(complaintId.value),
    tenantStore.fetchTenants(),
    loadHistory()
  ])
})

async function loadHistory() {
  try {
    historyRecords.value = await complaintStore.fetchComplaintHistory(complaintId.value)
  } catch {}
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { pending: 'warning', processing: '', resolved: 'success' }
  return map[status] || 'info'
}

async function handleAction(status: string) {
  try {
    await complaintStore.handleComplaint(complaintId.value, { status, remark: '开始处理投诉' })
    ElMessage.success('已开始处理')
    await complaintStore.fetchComplaint(complaintId.value)
    await loadHistory()
  } catch {}
}

async function submitResolve() {
  if (!resolveForm.remark.trim()) {
    ElMessage.warning('请填写处理说明（将记录在操作历史中）')
    return
  }
  submitting.value = true
  try {
    await complaintStore.handleComplaint(complaintId.value, { status: 'resolved', remark: resolveForm.remark })
    ElMessage.success('已标记解决')
    showResolveDialog.value = false
    await complaintStore.fetchComplaint(complaintId.value)
    await loadHistory()
  } catch {} finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-bar {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 12px;
}

.status-highlight {
  font-weight: 600;

  &.status-pending { color: #e6a23c; }
  &.status-processing { color: #409eff; }
  &.status-resolved { color: #67c23a; }
}
</style>
