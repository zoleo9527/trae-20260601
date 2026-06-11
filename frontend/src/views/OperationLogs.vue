<template>
  <div class="operation-logs">
    <div class="page-header">
      <h2>操作日志</h2>
      <p class="subtitle">所有操作的完整审计记录，包括状态变更、操作人、操作内容</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="模块">
          <el-select v-model="filters.module" placeholder="全部模块" clearable style="width: 140px">
            <el-option label="折扣活动" value="discount" />
            <el-option label="价格报备" value="price_report" />
            <el-option label="批量操作" value="batch" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.operation" placeholder="全部操作" clearable style="width: 140px">
            <el-option label="创建" value="create" />
            <el-option label="提交" value="submit" />
            <el-option label="审核" value="review" />
            <el-option label="通过" value="approve" />
            <el-option label="退回" value="reject" />
            <el-option label="标记异常" value="raise_exception" />
            <el-option label="解决异常" value="resolve_exception" />
            <el-option label="核实" value="verify" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人角色">
          <el-select v-model="filters.operator_role" placeholder="全部角色" clearable style="width: 140px">
            <el-option label="品牌店长" value="store_manager" />
            <el-option label="营运督导" value="operation_supervisor" />
            <el-option label="招商经理" value="investment_manager" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="operator_role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getRoleTagType(row.operator_role)">
              {{ ROLE_LABELS[row.operator_role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            {{ getModuleLabel(row.module) }}
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getOperationTagType(row.operation)">
              {{ getOperationLabel(row.operation) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态变更" width="200">
          <template #default="{ row }">
            <div v-if="row.old_status && row.new_status" class="status-transition">
              <el-tag size="small" :class="getStatusClass(row.old_status)">
                {{ getStatusLabel(row.old_status) }}
              </el-tag>
              <el-icon class="arrow"><Right /></el-icon>
              <el-tag size="small" :class="getStatusClass(row.new_status)">
                {{ getStatusLabel(row.new_status) }}
              </el-tag>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="操作详情" min-width="200">
          <template #default="{ row }">
            <span v-if="row.detail" class="detail-text">{{ row.detail }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(currentLog.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentLog.operator_name }}
          <el-tag size="small" :type="getRoleTagType(currentLog.operator_role)" style="margin-left: 8px">
            {{ ROLE_LABELS[currentLog.operator_role] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作模块">
          {{ getModuleLabel(currentLog.module) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          {{ getOperationLabel(currentLog.operation) }}
        </el-descriptions-item>
        <el-descriptions-item label="目标类型" v-if="currentLog.target_type">
          {{ currentLog.target_type === 'campaign' ? '折扣活动' : '价格报备' }}
        </el-descriptions-item>
        <el-descriptions-item label="目标ID" v-if="currentLog.target_id">
          {{ currentLog.target_id }}
        </el-descriptions-item>
        <el-descriptions-item label="状态变更" v-if="currentLog.old_status && currentLog.new_status">
          <div class="status-transition">
            <el-tag :class="getStatusClass(currentLog.old_status)">
              {{ getStatusLabel(currentLog.old_status) }}
            </el-tag>
            <el-icon class="arrow"><Right /></el-icon>
            <el-tag :class="getStatusClass(currentLog.new_status)">
              {{ getStatusLabel(currentLog.new_status) }}
            </el-tag>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="操作详情" v-if="currentLog.detail">
          {{ currentLog.detail }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentLog.ip_address || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { logApi } from '@/api'
import { ROLE_LABELS, DISCOUNT_STATUS, PRICE_REPORT_STATUS } from '@/utils/constants'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const logs = ref([])
const detailVisible = ref(false)
const currentLog = ref(null)

const filters = reactive({
  module: '',
  operation: '',
  operator_role: ''
})

const pagination = reactive({
  page: 1,
  per_page: 50,
  total: 0
})

const MODULE_LABELS = {
  discount: '折扣活动',
  price_report: '价格报备',
  batch: '批量操作',
  auth: '认证'
}

const OPERATION_LABELS = {
  create: '创建',
  update: '更新',
  submit: '提交',
  start_review: '开始审核',
  review: '审核',
  approve: '通过',
  reject: '退回',
  raise_exception: '标记异常',
  resolve_exception: '解决异常',
  verify: '核实',
  login: '登录',
  logout: '退出',
  batch_submit: '批量提交',
  batch_approve: '批量通过',
  batch_reject: '批量退回',
  batch_verify: '批量核实',
  add_record: '添加记录'
}

function getModuleLabel(module) {
  return MODULE_LABELS[module] || module
}

function getOperationLabel(operation) {
  return OPERATION_LABELS[operation] || operation
}

function getOperationTagType(operation) {
  const types = {
    approve: 'success',
    reject: 'danger',
    raise_exception: 'danger',
    resolve_exception: 'success',
    verify: 'success',
    submit: 'warning',
    review: 'primary'
  }
  return types[operation] || 'info'
}

function getRoleTagType(role) {
  const types = {
    store_manager: 'warning',
    operation_supervisor: 'primary',
    investment_manager: 'success'
  }
  return types[role] || 'info'
}

function getStatusLabel(status) {
  return DISCOUNT_STATUS[status]?.label || PRICE_REPORT_STATUS[status]?.label || status
}

function getStatusClass(status) {
  return DISCOUNT_STATUS[status]?.class || PRICE_REPORT_STATUS[status]?.class || 'status-info'
}

function formatDateTime(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN')
}

async function loadLogs() {
  loading.value = true
  try {
    const params = {
      ...filters,
      page: pagination.page,
      per_page: pagination.per_page
    }
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })
    const res = await logApi.getList(params)
    logs.value = res.items
    pagination.total = res.total
  } catch (e) {
    ElMessage.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.module = ''
  filters.operation = ''
  filters.operator_role = ''
  pagination.page = 1
  loadLogs()
}

function viewDetail(row) {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.operation-logs {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 20px;
}

.status-transition {
  display: flex;
  align-items: center;
  gap: 6px;
}

.arrow {
  color: #909399;
  font-size: 14px;
}

.detail-text {
  color: #606266;
}

.text-muted {
  color: #c0c4cc;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
