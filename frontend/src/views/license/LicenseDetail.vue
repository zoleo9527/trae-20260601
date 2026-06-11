<template>
  <div class="detail-page">
    <el-button class="back-btn" @click="$router.push('/licenses')">
      <el-icon><ArrowLeft /></el-icon> 返回证照列表
    </el-button>

    <div v-loading="licenseStore.loading">
      <el-card shadow="never" class="info-card" v-if="license">
        <template #header>
          <div class="card-header">
            <span class="section-title">证照信息</span>
            <el-tag :type="statusTagType(license.status)" size="large">{{ statusLabel(license.status) }}</el-tag>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="证照类型">{{ license.license_type }}</el-descriptions-item>
          <el-descriptions-item label="证号">{{ license.license_number }}</el-descriptions-item>
          <el-descriptions-item label="所属租户">
            <el-button type="primary" link @click="$router.push('/tenants/' + license.tenant_id)">
              {{ tenantName }}
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ license.expire_date }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatTime(license.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <span :class="'status-highlight status-' + license.status">{{ statusLabel(license.status) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="action-bar" v-if="canReview">
          <template v-if="license.status === 'pending'">
            <el-button type="success" @click="handleReview('approved')">审核通过</el-button>
            <el-button type="danger" @click="openDialog('rejected')">审核驳回</el-button>
            <el-button type="warning" @click="openDialog('need_reupload')">要求补录</el-button>
          </template>
          <template v-if="license.status === 'need_reupload'">
            <el-button type="success" @click="handleReview('approved')">审核通过（补录后）</el-button>
            <el-button type="danger" @click="openDialog('rejected')">审核驳回</el-button>
          </template>
          <template v-if="license.status === 'rejected'">
            <el-button type="primary" @click="openDialog('need_reupload')">重新要求补录</el-button>
          </template>
        </div>
      </el-card>

      <el-card shadow="never" class="info-card">
        <template #header>
          <span class="section-title">操作历史（证照回看）</span>
        </template>
        <HistoryTimeline :records="historyRecords" />
      </el-card>
    </div>

    <el-dialog v-model="showDialog" :title="dialogTitle" width="450px" destroy-on-close>
      <el-form :model="dialogForm" label-width="90px">
        <el-form-item :label="dialogForm.status === 'rejected' ? '驳回原因' : '补录说明'">
          <el-input v-model="dialogForm.remark" type="textarea" :rows="3"
            :placeholder="dialogForm.status === 'rejected' ? '请填写驳回原因（将记录在操作历史中）' : '请说明需要补录的内容（将记录在操作历史中）'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button :type="dialogForm.status === 'rejected' ? 'danger' : 'warning'" @click="submitReview" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLicenseStore } from '@/stores/license'
import { useTenantStore } from '@/stores/tenant'
import { ElMessage } from 'element-plus'
import HistoryTimeline from '@/components/HistoryTimeline.vue'
import dayjs from 'dayjs'

const route = useRoute()
const authStore = useAuthStore()
const licenseStore = useLicenseStore()
const tenantStore = useTenantStore()

const showDialog = ref(false)
const submitting = ref(false)
const historyRecords = ref<any[]>([])

const dialogForm = reactive({ status: '', remark: '' })

const license = computed(() => licenseStore.currentLicense)
const licenseId = computed(() => Number(route.params.id))

const canReview = computed(() => ['admin', 'operation'].includes(authStore.userRole))

const tenantName = computed(() => {
  if (!license.value) return '-'
  return tenantStore.tenants.find(t => t.id === license.value.tenant_id)?.name || '-'
})

const dialogTitle = computed(() => {
  return dialogForm.status === 'rejected' ? '驳回证照' : '要求补录/重新上传'
})

onMounted(async () => {
  await Promise.all([
    licenseStore.fetchLicense(licenseId.value),
    tenantStore.fetchTenants(),
    loadHistory()
  ])
})

async function loadHistory() {
  try {
    historyRecords.value = await licenseStore.fetchLicenseHistory(licenseId.value)
  } catch {}
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待审核', approved: '已通过', rejected: '已驳回', need_reupload: '需补录/重新上传'
  }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', approved: 'success', rejected: 'danger', need_reupload: 'danger'
  }
  return map[status] || 'info'
}

function openDialog(status: string) {
  dialogForm.status = status
  dialogForm.remark = ''
  showDialog.value = true
}

async function handleReview(status: string) {
  try {
    await licenseStore.reviewLicense(licenseId.value, {
      status,
      remark: status === 'approved' ? '审核通过' : ''
    })
    ElMessage.success('操作成功')
    await licenseStore.fetchLicense(licenseId.value)
    await loadHistory()
  } catch {}
}

async function submitReview() {
  if (!dialogForm.remark.trim()) {
    ElMessage.warning(dialogForm.status === 'rejected' ? '请填写驳回原因（将记录在操作历史中）' : '请说明需要补录的内容（将记录在操作历史中）')
    return
  }
  submitting.value = true
  try {
    await licenseStore.reviewLicense(licenseId.value, {
      status: dialogForm.status,
      remark: dialogForm.remark
    })
    ElMessage.success(dialogForm.status === 'rejected' ? '已驳回' : '已要求补录')
    showDialog.value = false
    await licenseStore.fetchLicense(licenseId.value)
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
  &.status-approved { color: #67c23a; }
  &.status-rejected { color: #f56c6c; }
  &.status-need_reupload { color: #f56c6c; }
}
</style>
