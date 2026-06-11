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
            <el-button type="primary" @click="openResubmitDialog">
              <el-icon><Upload /></el-icon> 补录提交
            </el-button>
            <el-button type="success" @click="handleReview('approved')">审核通过（补录后）</el-button>
            <el-button type="danger" @click="openDialog('rejected')">审核驳回</el-button>
          </template>
          <template v-if="license.status === 'rejected'">
            <el-button type="primary" @click="openResubmitDialog">
              <el-icon><Upload /></el-icon> 重新提交证照
            </el-button>
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

    <el-dialog v-model="showResubmitDialog" title="补录提交 — 修改证照信息后重新提交审核" width="520px" destroy-on-close>
      <el-alert
        :title="resubmitAlertTitle"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <el-form ref="resubmitFormRef" :model="resubmitForm" :rules="resubmitRules" label-width="90px">
        <el-form-item label="证照类型">
          <span class="form-text">{{ license?.license_type }}</span>
        </el-form-item>
        <el-form-item label="所属租户">
          <span class="form-text">{{ tenantName }}</span>
        </el-form-item>
        <el-form-item label="证号" prop="license_number">
          <el-input v-model="resubmitForm.license_number" placeholder="请输入更正后的证号" />
        </el-form-item>
        <el-form-item label="到期日期" prop="expire_date">
          <el-date-picker v-model="resubmitForm.expire_date" type="date" value-format="YYYY-MM-DD" placeholder="选择到期日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="补录说明" prop="remark">
          <el-input v-model="resubmitForm.remark" type="textarea" :rows="3" placeholder="请说明本次补录修改的内容（将记录在操作历史中）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResubmitDialog = false">取消</el-button>
        <el-button type="primary" @click="submitResubmit" :loading="submitting">确认补录提交</el-button>
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
import type { FormInstance } from 'element-plus'

const route = useRoute()
const authStore = useAuthStore()
const licenseStore = useLicenseStore()
const tenantStore = useTenantStore()

const showDialog = ref(false)
const showResubmitDialog = ref(false)
const submitting = ref(false)
const historyRecords = ref<any[]>([])
const resubmitFormRef = ref<FormInstance>()

const dialogForm = reactive({ status: '', remark: '' })

const resubmitForm = reactive({
  license_number: '',
  expire_date: '',
  remark: ''
})

const resubmitRules = {
  license_number: [{ required: true, message: '请输入证号', trigger: 'blur' }],
  expire_date: [{ required: true, message: '请选择到期日期', trigger: 'change' }]
}

const license = computed(() => licenseStore.currentLicense)
const licenseId = computed(() => Number(route.params.id))

const canReview = computed(() => ['admin', 'operation'].includes(authStore.userRole))

const tenantName = computed(() => {
  if (!license.value) return '-'
  return tenantStore.tenants.find(t => t.id === license.value.tenant_id)?.name || '-'
})

const resubmitAlertTitle = computed(() => {
  if (!license.value) return ''
  if (license.value.status === 'need_reupload') return '该证照已被要求补录，请修改信息后重新提交审核'
  if (license.value.status === 'rejected') return '该证照已被驳回，请修改信息后重新提交审核'
  return ''
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

function openResubmitDialog() {
  if (!license.value) return
  resubmitForm.license_number = license.value.license_number
  resubmitForm.expire_date = license.value.expire_date
  resubmitForm.remark = ''
  showResubmitDialog.value = true
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

async function submitResubmit() {
  if (!resubmitFormRef.value) return
  await resubmitFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await licenseStore.resubmitLicense(licenseId.value, {
        license_number: resubmitForm.license_number,
        expire_date: resubmitForm.expire_date,
        remark: resubmitForm.remark || undefined
      })
      ElMessage.success('补录提交成功，证照已回到待审核状态')
      showResubmitDialog.value = false
      await licenseStore.fetchLicense(licenseId.value)
      await loadHistory()
    } catch {} finally {
      submitting.value = false
    }
  })
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

.form-text {
  font-size: 14px;
  color: #606266;
}
</style>
