<template>
  <div class="page-container">
    <div class="page-header">
      <h2>证照台账</h2>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px" @change="handleFilter">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="需补录" value="need_reupload" />
        </el-select>
        <el-select v-model="filterTenant" placeholder="租户筛选" clearable style="width: 160px" @change="handleFilter">
          <el-option v-for="t in tenantStore.tenants" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-button type="primary" @click="showCreateDialog = true" v-if="canCreate">
          <el-icon><Plus /></el-icon> 录入证照
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <el-table :data="licenseStore.licenses" v-loading="licenseStore.loading" stripe>
        <el-table-column prop="license_type" label="证照类型" width="130" />
        <el-table-column prop="license_number" label="证号" min-width="160" />
        <el-table-column label="所属租户" width="120">
          <template #default="{ row }">
            {{ getTenantName(row.tenant_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="expire_date" label="到期日" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push('/licenses/' + row.id)">详情/历史</el-button>
            <template v-if="canReview && row.status === 'pending'">
              <el-button type="success" link size="small" @click="handleReview(row.id, 'approved')">通过</el-button>
              <el-button type="danger" link size="small" @click="openReviewDialog(row.id, 'rejected')">驳回</el-button>
            </template>
            <template v-if="canReview && (row.status === 'pending' || row.status === 'approved')">
              <el-button type="warning" link size="small" @click="openReviewDialog(row.id, 'need_reupload')">要求补录</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="录入证照" width="500px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="所属租户" prop="tenant_id">
          <el-select v-model="createForm.tenant_id" placeholder="请选择租户" style="width: 100%">
            <el-option v-for="t in tenantStore.tenants" :key="t.id" :label="`${t.name} (${t.shop_number})`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="证照类型" prop="license_type">
          <el-select v-model="createForm.license_type" placeholder="请选择" style="width: 100%">
            <el-option label="营业执照" value="营业执照" />
            <el-option label="食品经营许可证" value="食品经营许可证" />
            <el-option label="餐饮服务许可证" value="餐饮服务许可证" />
            <el-option label="消防安全检查合格证" value="消防安全检查合格证" />
            <el-option label="卫生许可证" value="卫生许可证" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="证号" prop="license_number">
          <el-input v-model="createForm.license_number" placeholder="请输入证号" />
        </el-form-item>
        <el-form-item label="到期日期" prop="expire_date">
          <el-date-picker v-model="createForm.expire_date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitting">确认录入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReviewDialog" :title="reviewDialogTitle" width="450px" destroy-on-close>
      <el-form :model="reviewForm" label-width="90px">
        <el-form-item :label="reviewForm.status === 'rejected' ? '驳回原因' : '补录说明'">
          <el-input v-model="reviewForm.remark" type="textarea" :rows="3"
            :placeholder="reviewForm.status === 'rejected' ? '请填写驳回原因（将记录在历史中）' : '请说明需要补录的内容（将记录在历史中）'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button :type="reviewForm.status === 'rejected' ? 'danger' : 'warning'" @click="submitReview" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLicenseStore } from '@/stores/license'
import { useTenantStore } from '@/stores/tenant'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const authStore = useAuthStore()
const licenseStore = useLicenseStore()
const tenantStore = useTenantStore()

const filterStatus = ref('')
const filterTenant = ref<number | string>('')
const showCreateDialog = ref(false)
const showReviewDialog = ref(false)
const submitting = ref(false)
const createFormRef = ref<FormInstance>()

const createForm = reactive({
  tenant_id: null as number | null,
  license_type: '',
  license_number: '',
  expire_date: ''
})

const createRules = {
  tenant_id: [{ required: true, message: '请选择租户', trigger: 'change' }],
  license_type: [{ required: true, message: '请选择证照类型', trigger: 'change' }],
  license_number: [{ required: true, message: '请输入证号', trigger: 'blur' }],
  expire_date: [{ required: true, message: '请选择到期日期', trigger: 'change' }]
}

const reviewForm = reactive({
  licenseId: 0,
  status: '',
  remark: ''
})

const reviewDialogTitle = computed(() => {
  return reviewForm.status === 'rejected' ? '驳回证照' : '要求补录/重新上传'
})

const canCreate = computed(() => ['admin', 'operation'].includes(authStore.userRole))
const canReview = computed(() => ['admin', 'operation'].includes(authStore.userRole))

onMounted(() => {
  licenseStore.fetchLicenses()
  tenantStore.fetchTenants()
})

function handleFilter() {
  const params: Record<string, any> = {}
  if (filterStatus.value) params.status = filterStatus.value
  if (filterTenant.value) params.tenant_id = filterTenant.value
  licenseStore.fetchLicenses(params)
}

function getTenantName(tenantId: number) {
  return tenantStore.tenants.find(t => t.id === tenantId)?.name || '-'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待审核', approved: '已通过', rejected: '已驳回', need_reupload: '需补录'
  }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning', approved: 'success', rejected: 'danger', need_reupload: 'danger'
  }
  return map[status] || 'info'
}

async function handleReview(id: number, status: string) {
  try {
    await licenseStore.reviewLicense(id, { status, remark: '审核通过' })
    ElMessage.success('审核通过')
    licenseStore.fetchLicenses()
  } catch {}
}

function openReviewDialog(id: number, status: string) {
  reviewForm.licenseId = id
  reviewForm.status = status
  reviewForm.remark = ''
  showReviewDialog.value = true
}

async function submitReview() {
  if (!reviewForm.remark.trim()) {
    ElMessage.warning(reviewForm.status === 'rejected' ? '请填写驳回原因（将记录在历史中）' : '请说明需要补录的内容（将记录在历史中）')
    return
  }
  submitting.value = true
  try {
    await licenseStore.reviewLicense(reviewForm.licenseId, {
      status: reviewForm.status,
      remark: reviewForm.remark
    })
    ElMessage.success(reviewForm.status === 'rejected' ? '已驳回' : '已要求补录')
    showReviewDialog.value = false
    licenseStore.fetchLicenses()
  } catch {} finally {
    submitting.value = false
  }
}

async function submitCreate() {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await licenseStore.createLicense({ ...createForm })
      ElMessage.success('录入成功')
      showCreateDialog.value = false
      Object.assign(createForm, { tenant_id: null, license_type: '', license_number: '', expire_date: '' })
      licenseStore.fetchLicenses()
    } catch {} finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.page-header .header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
