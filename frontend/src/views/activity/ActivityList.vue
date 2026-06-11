<template>
  <div class="page-container">
    <div class="page-header">
      <h2>活动申请</h2>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px" @change="handleFilter">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-button type="primary" @click="showCreateDialog = true" v-if="canCreate">
          <el-icon><Plus /></el-icon> 提交活动
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <el-table :data="activityStore.activities" v-loading="activityStore.loading" stripe>
        <el-table-column prop="title" label="活动名称" min-width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push('/activities/' + row.id)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="所属租户" width="120">
          <template #default="{ row }">
            {{ getTenantName(row.tenant_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="110" />
        <el-table-column prop="end_date" label="结束日期" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push('/activities/' + row.id)">详情</el-button>
            <template v-if="canReview && row.status === 'pending'">
              <el-button type="success" link size="small" @click="handleReview(row.id, 'approved')">通过</el-button>
              <el-button type="danger" link size="small" @click="openRejectDialog(row.id)">驳回</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="提交活动申请" width="550px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="所属租户" prop="tenant_id">
          <el-select v-model="createForm.tenant_id" placeholder="请选择租户" style="width: 100%">
            <el-option v-for="t in tenantStore.tenants" :key="t.id" :label="`${t.name} (${t.shop_number})`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动内容" prop="content">
          <el-input v-model="createForm.content" type="textarea" :rows="3" placeholder="请输入活动内容" />
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker v-model="createForm.start_date" type="date" value-format="YYYY-MM-DD" placeholder="选择开始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker v-model="createForm.end_date" type="date" value-format="YYYY-MM-DD" placeholder="选择结束日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitting">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRejectDialog" title="驳回活动申请" width="450px" destroy-on-close>
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectForm.remark" type="textarea" :rows="3" placeholder="请填写驳回原因（将记录在历史中）" />
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
import { useAuthStore } from '@/stores/auth'
import { useActivityStore } from '@/stores/activity'
import { useTenantStore } from '@/stores/tenant'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const authStore = useAuthStore()
const activityStore = useActivityStore()
const tenantStore = useTenantStore()

const filterStatus = ref('')
const showCreateDialog = ref(false)
const showRejectDialog = ref(false)
const submitting = ref(false)
const createFormRef = ref<FormInstance>()
const rejectActivityId = ref(0)

const createForm = reactive({
  tenant_id: null as number | null,
  title: '',
  content: '',
  start_date: '',
  end_date: ''
})

const createRules = {
  tenant_id: [{ required: true, message: '请选择租户', trigger: 'change' }],
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  content: [{ required: true, message: '请输入活动内容', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

const rejectForm = reactive({ remark: '' })

const canCreate = computed(() => ['admin', 'operation', 'customer_service'].includes(authStore.userRole))
const canReview = computed(() => ['admin', 'operation', 'engineering'].includes(authStore.userRole))

onMounted(() => {
  activityStore.fetchActivities()
  tenantStore.fetchTenants()
})

function handleFilter() {
  activityStore.fetchActivities(filterStatus.value ? { status: filterStatus.value } : undefined)
}

function getTenantName(tenantId: number) {
  return tenantStore.tenants.find(t => t.id === tenantId)?.name || '-'
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

async function handleReview(id: number, status: string) {
  try {
    await activityStore.reviewActivity(id, { status, remark: '审核通过' })
    ElMessage.success('审核通过')
    activityStore.fetchActivities()
  } catch {}
}

function openRejectDialog(id: number) {
  rejectActivityId.value = id
  rejectForm.remark = ''
  showRejectDialog.value = true
}

async function submitReject() {
  if (!rejectForm.remark.trim()) {
    ElMessage.warning('请填写驳回原因（将记录在历史中）')
    return
  }
  submitting.value = true
  try {
    await activityStore.reviewActivity(rejectActivityId.value, { status: 'rejected', remark: rejectForm.remark })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    activityStore.fetchActivities()
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
      await activityStore.createActivity({ ...createForm })
      ElMessage.success('提交成功')
      showCreateDialog.value = false
      Object.assign(createForm, { tenant_id: null, title: '', content: '', start_date: '', end_date: '' })
      activityStore.fetchActivities()
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
