<template>
  <div class="detail-page">
    <el-button class="back-btn" @click="$router.push('/activities')">
      <el-icon><ArrowLeft /></el-icon> 返回活动列表
    </el-button>

    <div v-loading="activityStore.loading">
      <el-card shadow="never" class="info-card" v-if="activity">
        <template #header>
          <div class="card-header">
            <span class="section-title">活动信息</span>
            <el-tag :type="statusTagType(activity.status)" size="large">{{ statusLabel(activity.status) }}</el-tag>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="活动名称">{{ activity.title }}</el-descriptions-item>
          <el-descriptions-item label="所属租户">
            <el-button type="primary" link @click="$router.push('/tenants/' + activity.tenant_id)">
              {{ tenantName }}
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ activity.start_date }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ activity.end_date }}</el-descriptions-item>
          <el-descriptions-item label="活动内容" :span="2">{{ activity.content }}</el-descriptions-item>
        </el-descriptions>

        <div class="action-bar" v-if="canReview && activity.status === 'pending'">
          <el-button type="success" @click="handleReview('approved')">审核通过</el-button>
          <el-button type="danger" @click="showRejectDialog = true">审核驳回</el-button>
        </div>
      </el-card>

      <el-card shadow="never" class="info-card">
        <template #header>
          <span class="section-title">操作历史</span>
        </template>
        <HistoryTimeline :records="historyRecords" />
      </el-card>
    </div>

    <el-dialog v-model="showRejectDialog" title="驳回活动申请" width="450px" destroy-on-close>
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectForm.remark" type="textarea" :rows="3" placeholder="请填写驳回原因（将记录在操作历史中）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="submitReject" :loading="submitting">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useActivityStore } from '@/stores/activity'
import { useTenantStore } from '@/stores/tenant'
import { ElMessage } from 'element-plus'
import HistoryTimeline from '@/components/HistoryTimeline.vue'

const route = useRoute()
const authStore = useAuthStore()
const activityStore = useActivityStore()
const tenantStore = useTenantStore()

const showRejectDialog = ref(false)
const submitting = ref(false)
const historyRecords = ref<any[]>([])
const rejectForm = reactive({ remark: '' })

const activity = computed(() => activityStore.currentActivity)
const activityId = computed(() => Number(route.params.id))
const canReview = computed(() => ['admin', 'operation', 'engineering'].includes(authStore.userRole))

const tenantName = computed(() => {
  if (!activity.value) return '-'
  return tenantStore.tenants.find(t => t.id === activity.value.tenant_id)?.name || '-'
})

onMounted(async () => {
  await Promise.all([
    activityStore.fetchActivity(activityId.value),
    tenantStore.fetchTenants(),
    loadHistory()
  ])
})

async function loadHistory() {
  try {
    historyRecords.value = await activityStore.fetchActivityHistory(activityId.value)
  } catch {}
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

async function handleReview(status: string) {
  try {
    await activityStore.reviewActivity(activityId.value, { status, remark: '审核通过' })
    ElMessage.success('审核通过')
    await activityStore.fetchActivity(activityId.value)
    await loadHistory()
  } catch {}
}

async function submitReject() {
  if (!rejectForm.remark.trim()) {
    ElMessage.warning('请填写驳回原因（将记录在操作历史中）')
    return
  }
  submitting.value = true
  try {
    await activityStore.reviewActivity(activityId.value, { status: 'rejected', remark: rejectForm.remark })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    await activityStore.fetchActivity(activityId.value)
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
</style>
