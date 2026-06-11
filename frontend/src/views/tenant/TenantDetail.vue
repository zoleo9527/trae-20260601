<template>
  <div class="detail-page">
    <el-button class="back-btn" @click="$router.push('/tenants')">
      <el-icon><ArrowLeft /></el-icon> 返回租户列表
    </el-button>

    <div v-loading="tenantStore.loading">
      <el-card shadow="never" class="info-card" v-if="tenant">
        <template #header>
          <div class="card-header">
            <span class="section-title">租户信息</span>
            <el-tag :type="statusTagType(tenant.status)" size="large">{{ statusLabel(tenant.status) }}</el-tag>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="租户名称">{{ tenant.name }}</el-descriptions-item>
          <el-descriptions-item label="铺位号">{{ tenant.shop_number }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ tenant.contact }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ tenant.phone }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(tenant.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ tenant.creator?.name || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="action-bar" v-if="canReview && tenant.status === 'pending'">
          <el-button type="success" @click="handleReview('approved')">审核通过</el-button>
          <el-button type="danger" @click="showRejectDialog = true">审核驳回</el-button>
        </div>
        <div class="action-bar" v-if="canReview && tenant.status === 'approved'">
          <el-button type="success" @click="handleReview('settled')">确认入驻</el-button>
        </div>
        <div class="action-bar" v-if="canReview && tenant.status === 'rejected'">
          <el-button type="primary" @click="handleReSubmit">重新提交</el-button>
        </div>
      </el-card>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" class="info-card">
            <template #header>
              <span class="section-title">相关证照</span>
            </template>
            <el-table :data="tenantLicenses" size="small" stripe v-if="tenantLicenses.length">
              <el-table-column prop="license_type" label="证照类型" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="licenseStatusType(row.status)" size="small">{{ licenseStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="expire_date" label="到期日" width="110" />
              <el-table-column label="操作" width="60">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="$router.push('/licenses/' + row.id)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty description="暂无证照" :image-size="60" v-else />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="info-card">
            <template #header>
              <span class="section-title">操作历史</span>
            </template>
            <HistoryTimeline :records="historyRecords" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card shadow="never" class="info-card">
            <template #header>
              <span class="section-title">相关活动</span>
            </template>
            <el-table :data="tenantActivities" size="small" stripe v-if="tenantActivities.length">
              <el-table-column prop="title" label="活动名称" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'" size="small">
                    {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已驳回' : '待审核' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="$router.push('/activities/' + row.id)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty description="暂无活动" :image-size="60" v-else />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="info-card">
            <template #header>
              <span class="section-title">相关投诉</span>
            </template>
            <el-table :data="tenantComplaints" size="small" stripe v-if="tenantComplaints.length">
              <el-table-column prop="title" label="投诉标题" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'resolved' ? 'success' : row.status === 'processing' ? '' : 'warning'" size="small">
                    {{ row.status === 'resolved' ? '已解决' : row.status === 'processing' ? '处理中' : '待处理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="$router.push('/complaints/' + row.id)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty description="暂无投诉" :image-size="60" v-else />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showRejectDialog" title="驳回入驻申请" width="450px" destroy-on-close>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'
import { useLicenseStore } from '@/stores/license'
import { useActivityStore } from '@/stores/activity'
import { useComplaintStore } from '@/stores/complaint'
import { ElMessage } from 'element-plus'
import HistoryTimeline from '@/components/HistoryTimeline.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const licenseStore = useLicenseStore()
const activityStore = useActivityStore()
const complaintStore = useComplaintStore()

const showRejectDialog = ref(false)
const submitting = ref(false)
const historyRecords = ref<any[]>([])

const rejectForm = reactive({ remark: '' })

const tenant = computed(() => tenantStore.currentTenant)
const tenantId = computed(() => Number(route.params.id))

const canReview = computed(() => ['admin', 'operation'].includes(authStore.userRole))

const tenantLicenses = computed(() =>
  licenseStore.licenses.filter(l => l.tenant_id === tenantId.value)
)
const tenantActivities = computed(() =>
  activityStore.activities.filter(a => a.tenant_id === tenantId.value)
)
const tenantComplaints = computed(() =>
  complaintStore.complaints.filter(c => c.tenant_id === tenantId.value)
)

onMounted(async () => {
  await Promise.all([
    tenantStore.fetchTenant(tenantId.value),
    licenseStore.fetchLicenses({ tenant_id: tenantId.value }),
    activityStore.fetchActivities({ tenant_id: tenantId.value }),
    complaintStore.fetchComplaints({ tenant_id: tenantId.value }),
    loadHistory()
  ])
})

async function loadHistory() {
  try {
    historyRecords.value = await tenantStore.fetchTenantHistory(tenantId.value)
  } catch {}
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待审核', approved: '已通过', rejected: '已驳回', settled: '已入驻'
  }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', approved: 'success', rejected: 'danger', settled: ''
  }
  return map[status] || 'info'
}

function licenseStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待审核', approved: '已通过', rejected: '已驳回', need_reupload: '需补录'
  }
  return map[status] || status
}

function licenseStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', approved: 'success', rejected: 'danger', need_reupload: 'danger'
  }
  return map[status] || 'info'
}

async function handleReview(status: string) {
  try {
    await tenantStore.reviewTenant(tenantId.value, {
      status,
      remark: status === 'approved' ? '审核通过' : '确认入驻'
    })
    ElMessage.success(status === 'approved' ? '审核通过' : '已确认入驻')
    await tenantStore.fetchTenant(tenantId.value)
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
    await tenantStore.reviewTenant(tenantId.value, {
      status: 'rejected',
      remark: rejectForm.remark
    })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    await tenantStore.fetchTenant(tenantId.value)
    await loadHistory()
  } catch {} finally {
    submitting.value = false
  }
}

async function handleReSubmit() {
  try {
    await tenantStore.reviewTenant(tenantId.value, {
      status: 'pending',
      remark: '重新提交入驻申请'
    })
    ElMessage.success('已重新提交')
    await tenantStore.fetchTenant(tenantId.value)
    await loadHistory()
  } catch {}
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
