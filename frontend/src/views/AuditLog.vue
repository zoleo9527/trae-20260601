<template>
  <div class="page-container">
    <div class="section-card">
      <div class="section-title">审计日志</div>

      <div class="filter-bar">
        <el-select v-model="filterEntity" placeholder="筛选模块" clearable style="width: 160px">
          <el-option label="房源" value="property" />
          <el-option label="看房记录" value="viewing" />
          <el-option label="交房验收" value="handover" />
          <el-option label="钥匙移交" value="key_transfer" />
          <el-option label="押金结算" value="deposit" />
          <el-option label="审计" value="audit" />
        </el-select>
        <el-select v-model="filterAction" placeholder="筛选操作" clearable style="width: 140px">
          <el-option label="创建" value="create" />
          <el-option label="状态变更" value="status_change" />
          <el-option label="提交" value="submit" />
          <el-option label="确认" value="confirm" />
          <el-option label="提出异议" value="dispute" />
          <el-option label="解决争议" value="resolve" />
          <el-option label="发起移交" value="initiate_transfer" />
          <el-option label="确认接收" value="confirm_reception" />
          <el-option label="归还钥匙" value="return_keys" />
          <el-option label="添加反馈" value="add_feedback" />
          <el-option label="标记结算" value="markSettled" />
        </el-select>
        <el-select v-model="filterRole" placeholder="筛选角色" clearable style="width: 140px">
          <el-option label="租赁顾问" value="consultant" />
          <el-option label="运营经理" value="operations" />
          <el-option label="财务" value="finance" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 280px"
        />
        <el-button type="primary" @click="loadData" :icon="Refresh">查询</el-button>
      </div>

      <el-table :data="auditLogs" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="时间" width="180" fixed="left">
          <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
        </el-table-column>
        <el-table-column label="操作人" width="140">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.userRole)" size="small">{{ roleLabel(row.userRole) }}</el-tag>
            <span style="margin-left: 8px">{{ row.userName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="模块" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ entityLabel(row.entity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-tag :type="actionTagType(row.action)" size="small">{{ actionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实体ID" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.entityId?.slice(0, 12) }}...</template>
        </el-table-column>
        <el-table-column label="变更详情" min-width="300">
          <template #default="{ row }">
            <div class="change-detail">
              <div v-if="row.before && row.after" class="change-before-after">
                <div class="change-section">
                  <div class="change-label">变更前</div>
                  <pre class="change-json">{{ formatJson(row.before) }}</pre>
                </div>
                <div class="change-arrow">
                  <el-icon color="#409eff"><Right /></el-icon>
                </div>
                <div class="change-section">
                  <div class="change-label">变更后</div>
                  <pre class="change-json">{{ formatJson(row.after) }}</pre>
                </div>
              </div>
              <div v-else-if="row.after" class="change-create">
                <el-tag type="success" size="small">新建</el-tag>
                <pre class="change-json">{{ formatJson(row.after) }}</pre>
              </div>
              <div v-else-if="row.before" class="change-delete">
                <el-tag type="danger" size="small">删除</el-tag>
                <pre class="change-json">{{ formatJson(row.before) }}</pre>
              </div>
              <span v-else style="color: #c0c4cc">无详情</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="IP" width="140" fixed="right">
          <template #default="{ row }">
            <span v-if="row.ip">{{ row.ip }}</span>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="stats-bar" style="margin-top: 16px">
        <el-tag size="large">共 {{ auditLogs.length }} 条审计记录</el-tag>
        <el-tag type="success" size="large" style="margin-left: 8px">
          顾问操作: {{ countByRole('consultant') }} 条
        </el-tag>
        <el-tag type="" size="large" style="margin-left: 8px">
          运营操作: {{ countByRole('operations') }} 条
        </el-tag>
        <el-tag type="warning" size="large" style="margin-left: 8px">
          财务操作: {{ countByRole('finance') }} 条
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Right } from '@element-plus/icons-vue'
import { auditApi } from '@/api'

const loading = ref(false)
const auditLogs = ref([])
const filterEntity = ref('')
const filterAction = ref('')
const filterRole = ref('')
const dateRange = ref([])

function roleLabel(r) {
  const m = { consultant: '租赁顾问', operations: '运营经理', finance: '财务' }
  return m[r] || r
}

function roleTagType(r) {
  const m = { consultant: '', operations: 'success', finance: 'warning' }
  return m[r] || 'info'
}

function entityLabel(e) {
  const m = {
    property: '房源', viewing: '看房记录',
    handover: '交房验收', key_transfer: '钥匙移交',
    deposit: '押金结算', audit: '审计'
  }
  return m[e] || e
}

function actionLabel(a) {
  const m = {
    create: '创建', status_change: '状态变更',
    submit: '提交', confirm: '确认',
    dispute: '提出异议', resolve: '解决争议',
    initiate_transfer: '发起移交', confirm_reception: '确认接收',
    return_keys: '归还钥匙', add_feedback: '添加反馈',
    markSettled: '标记结算', initiate: '发起'
  }
  return m[a] || a
}

function actionTagType(a) {
  if (['dispute', 'return_keys'].includes(a)) return 'danger'
  if (['confirm', 'confirm_reception', 'markSettled'].includes(a)) return 'success'
  if (['submit', 'initiate', 'initiate_transfer'].includes(a)) return 'warning'
  if (['resolve'].includes(a)) return ''
  return 'info'
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

function formatJson(obj) {
  if (!obj) return ''
  try {
    if (typeof obj === 'string') return obj
    const filtered = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'id' || k === 'entityId' || k === 'password') continue
      if (v === null || v === undefined || v === '') continue
      if (typeof v === 'string' && v.length > 50) {
        filtered[k] = v.slice(0, 50) + '...'
      } else if (v instanceof Date) {
        filtered[k] = v.toLocaleString('zh-CN')
      } else {
        filtered[k] = v
      }
    }
    const str = JSON.stringify(filtered, null, 2)
    if (str.length > 300) return str.slice(0, 300) + '\n...'
    return str
  } catch (e) {
    return String(obj)
  }
}

function countByRole(role) {
  return auditLogs.value.filter(l => l.userRole === role).length
}

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterEntity.value) params.entity = filterEntity.value
    if (filterAction.value) params.action = filterAction.value
    if (filterRole.value) params.userId = filterRole.value
    if (dateRange.value && dateRange.value.length === 2) {
      params.from = dateRange.value[0]
      params.to = dateRange.value[1]
    }
    auditLogs.value = await auditApi.query(params)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.change-detail {
  font-size: 12px;
}

.change-before-after {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.change-section {
  flex: 1;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 8px;
}

.change-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.change-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
}

.change-json {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #606266;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
}

.change-create,
.change-delete {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 8px;
}

.stats-bar {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}
</style>
