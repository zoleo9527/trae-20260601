<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isEngineering ? '我的工单' : '投诉记录' }}</h2>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px" @change="handleFilter">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已解决" value="resolved" />
        </el-select>
        <el-button type="primary" @click="showCreateDialog = true" v-if="canCreate">
          <el-icon><Plus /></el-icon> 登记投诉
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <el-table :data="complaintStore.complaints" v-loading="complaintStore.loading" stripe>
        <el-table-column prop="title" label="投诉标题" min-width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push('/complaints/' + row.id)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="关联租户" width="120">
          <template #default="{ row }">
            {{ getTenantName(row.tenant_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理人" width="100">
          <template #default="{ row }">
            {{ row.handler_user?.name || '未指派' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push('/complaints/' + row.id)">详情</el-button>
            <template v-if="canHandle && row.status === 'pending'">
              <el-button type="primary" link size="small" @click="handleAction(row.id, 'processing')">
                {{ !row.handler && isEngineering ? '接单处理' : '开始处理' }}
              </el-button>
            </template>
            <template v-if="canHandle && row.status === 'processing'">
              <el-button type="success" link size="small" @click="openResolveDialog(row.id)">标记解决</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="登记投诉" width="500px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="关联租户" prop="tenant_id">
          <el-select v-model="createForm.tenant_id" placeholder="请选择租户" style="width: 100%">
            <el-option v-for="t in tenantStore.tenants" :key="t.id" :label="`${t.name} (${t.shop_number})`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="投诉标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入投诉标题" />
        </el-form-item>
        <el-form-item label="投诉内容" prop="content">
          <el-input v-model="createForm.content" type="textarea" :rows="3" placeholder="请输入投诉内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitting">确认登记</el-button>
      </template>
    </el-dialog>

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
import { useAuthStore } from '@/stores/auth'
import { useComplaintStore } from '@/stores/complaint'
import { useTenantStore } from '@/stores/tenant'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import type { FormInstance } from 'element-plus'

const authStore = useAuthStore()
const complaintStore = useComplaintStore()
const tenantStore = useTenantStore()

const filterStatus = ref('')
const showCreateDialog = ref(false)
const showResolveDialog = ref(false)
const submitting = ref(false)
const createFormRef = ref<FormInstance>()
const resolveComplaintId = ref(0)

const createForm = reactive({
  tenant_id: null as number | null,
  title: '',
  content: ''
})

const createRules = {
  tenant_id: [{ required: true, message: '请选择租户', trigger: 'change' }],
  title: [{ required: true, message: '请输入投诉标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入投诉内容', trigger: 'blur' }]
}

const resolveForm = reactive({ remark: '' })

const isEngineering = computed(() => authStore.isEngineering)
const canCreate = computed(() => ['admin', 'operation', 'customer_service'].includes(authStore.userRole))
const canHandle = computed(() => ['admin', 'operation', 'engineering'].includes(authStore.userRole))

onMounted(() => {
  complaintStore.fetchComplaints()
  tenantStore.fetchTenants()
})

function handleFilter() {
  complaintStore.fetchComplaints(filterStatus.value ? { status: filterStatus.value } : undefined)
}

function getTenantName(tenantId: number) {
  return tenantStore.tenants.find(t => t.id === tenantId)?.name || '-'
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { pending: 'warning', processing: '', resolved: 'success' }
  return map[status] || 'info'
}

async function handleAction(id: number, status: string) {
  try {
    await complaintStore.handleComplaint(id, { status, remark: '开始处理' })
    ElMessage.success('已开始处理')
    complaintStore.fetchComplaints()
  } catch {}
}

function openResolveDialog(id: number) {
  resolveComplaintId.value = id
  resolveForm.remark = ''
  showResolveDialog.value = true
}

async function submitResolve() {
  if (!resolveForm.remark.trim()) {
    ElMessage.warning('请填写处理说明（将记录在操作历史中）')
    return
  }
  submitting.value = true
  try {
    await complaintStore.handleComplaint(resolveComplaintId.value, { status: 'resolved', remark: resolveForm.remark })
    ElMessage.success('已标记解决')
    showResolveDialog.value = false
    complaintStore.fetchComplaints()
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
      await complaintStore.createComplaint({ ...createForm })
      ElMessage.success('登记成功')
      showCreateDialog.value = false
      Object.assign(createForm, { tenant_id: null, title: '', content: '' })
      complaintStore.fetchComplaints()
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
