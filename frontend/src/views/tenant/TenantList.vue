<template>
  <div class="page-container">
    <div class="page-header">
      <h2>租户台账</h2>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px" @change="handleFilter">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="已入驻" value="settled" />
        </el-select>
        <el-button type="primary" @click="showCreateDialog = true" v-if="canCreate">
          <el-icon><Plus /></el-icon> 新增租户
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <el-table :data="tenantStore.tenants" v-loading="tenantStore.loading" stripe>
        <el-table-column prop="shop_number" label="铺位号" width="100" />
        <el-table-column prop="name" label="租户名称" min-width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="goDetail(row.id)">{{ row.name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goDetail(row.id)">详情</el-button>
            <template v-if="canReview && row.status === 'pending'">
              <el-button type="success" link size="small" @click="handleReview(row.id, 'approved')">通过</el-button>
              <el-button type="danger" link size="small" @click="openRejectDialog(row.id)">驳回</el-button>
            </template>
            <template v-if="canReview && row.status === 'approved'">
              <el-button type="success" link size="small" @click="handleSettled(row.id)">确认入驻</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="新增租户" width="500px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="租户名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="铺位号" prop="shop_number">
          <el-input v-model="createForm.shop_number" placeholder="如 1F-001" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="createForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitting">确认新增</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRejectDialog" title="驳回入驻申请" width="450px" destroy-on-close>
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectForm.remark" type="textarea" :rows="3" placeholder="请填写驳回原因，该记录将保留在历史中" />
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()

const filterStatus = ref('')
const showCreateDialog = ref(false)
const showRejectDialog = ref(false)
const submitting = ref(false)
const createFormRef = ref<FormInstance>()
const rejectTenantId = ref(0)

const createForm = reactive({
  name: '',
  shop_number: '',
  contact: '',
  phone: ''
})

const rejectForm = reactive({
  remark: ''
})

const createRules = {
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  shop_number: [{ required: true, message: '请输入铺位号', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const canCreate = computed(() => ['admin', 'operation'].includes(authStore.userRole))
const canReview = computed(() => ['admin', 'operation'].includes(authStore.userRole))

onMounted(() => {
  tenantStore.fetchTenants()
})

function handleFilter() {
  tenantStore.fetchTenants(filterStatus.value ? { status: filterStatus.value } : undefined)
}

function goDetail(id: number) {
  router.push('/tenants/' + id)
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

async function handleReview(id: number, status: string) {
  try {
    await tenantStore.reviewTenant(id, { status, remark: '审核通过' })
    ElMessage.success('审核通过')
    tenantStore.fetchTenants()
  } catch {}
}

function openRejectDialog(id: number) {
  rejectTenantId.value = id
  rejectForm.remark = ''
  showRejectDialog.value = true
}

async function submitReject() {
  if (!rejectForm.remark.trim()) {
    ElMessage.warning('请填写驳回原因，该记录将保留在历史中')
    return
  }
  submitting.value = true
  try {
    await tenantStore.reviewTenant(rejectTenantId.value, {
      status: 'rejected',
      remark: rejectForm.remark
    })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    tenantStore.fetchTenants()
  } catch {} finally {
    submitting.value = false
  }
}

async function handleSettled(id: number) {
  try {
    await tenantStore.reviewTenant(id, { status: 'settled', remark: '已完成入驻手续' })
    ElMessage.success('已确认入驻')
    tenantStore.fetchTenants()
  } catch {}
}

async function submitCreate() {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await tenantStore.createTenant({ ...createForm })
      ElMessage.success('新增成功')
      showCreateDialog.value = false
      Object.assign(createForm, { name: '', shop_number: '', contact: '', phone: '' })
      tenantStore.fetchTenants()
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
