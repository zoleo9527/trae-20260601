<template>
  <div class="page-container">
    <div class="dispute-highlight" v-if="staleProperties.length > 0">
      <div class="alert-header">
        <el-icon size="18" color="#f56c6c"><Warning /></el-icon>
        <strong>状态滞后预警</strong>
        <span style="margin-left: 8px; font-size: 13px; color: #909399">
          共 {{ staleProperties.length }} 套房源状态更新不及时
        </span>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">房源台账</div>
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 140px">
          <el-option label="可租" value="available" />
          <el-option label="带看中" value="viewing" />
          <el-option label="已签约" value="leased" />
          <el-option label="待交房" value="handover_pending" />
          <el-option label="已验收" value="handover_accepted" />
          <el-option label="已入驻" value="occupied" />
          <el-option label="退租中" value="returning" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索楼盘/楼层/房号"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
      </div>

      <el-table :data="filteredProperties" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="房源信息" width="220">
          <template #default="{ row }">
            <div class="prop-name">
              <el-icon color="#409eff"><OfficeBuilding /></el-icon>
              <strong>{{ row.building }}</strong>
            </div>
            <div class="prop-sub">{{ row.floor }}层 {{ row.unit }} · {{ row.area }}㎡</div>
          </template>
        </el-table-column>
        <el-table-column prop="rentPrice" label="月租金" width="120">
          <template #default="{ row }">¥{{ row.rentPrice.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="deposit" label="押金" width="120">
          <template #default="{ row }">¥{{ row.deposit.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="当前状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentTenant" label="当前租户" width="160">
          <template #default="{ row }">
            <span v-if="row.currentTenant">{{ row.currentTenant }}</span>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="看房统计" width="140">
          <template #default="{ row }">
            <span v-if="viewingSummary[row.id]">
              <el-tag size="small" type="info">{{ viewingSummary[row.id].totalViewings }} 次带看</el-tag>
            </span>
            <span v-else style="color: #c0c4cc">暂无带看</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewHistory(row)">
              状态历史
            </el-button>
            <el-button size="small" type="success" link @click="goViewings(row.id)">
              看房记录
            </el-button>
            <el-button size="small" type="warning" link @click="goHandover(row.id)">
              交房验收
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="historyDialogVisible" title="房源状态流转历史" width="600px">
      <div v-if="currentProperty">
        <div class="history-header">
          <el-icon size="20" color="#409eff"><OfficeBuilding /></el-icon>
          <span style="font-weight: 600; margin-left: 8px">
            {{ currentProperty.building }} {{ currentProperty.floor }}层{{ currentProperty.unit }}
          </span>
        </div>
        <el-steps :active="currentStepIndex" finish-status="success" align-center style="margin: 24px 0">
          <el-step
            v-for="(s, idx) in statusFlow"
            :key="s.key"
            :title="s.label"
            :status="getStepStatus(s.key, currentProperty.status, idx)"
          />
        </el-steps>
        <div class="section-title" style="font-size: 14px; margin-top: 16px">详细变更日志</div>
        <div class="audit-trail">
          <div v-if="!statusHistory.length" class="empty-state">暂无变更记录</div>
          <div v-for="(log, idx) in statusHistory" :key="idx" class="audit-item">
            <span class="audit-time">{{ formatTime(log.timestamp) }}</span>
            <span class="audit-user">
              <el-tag size="small" :type="roleTagType(log.userRole)">{{ roleLabel(log.userRole) }}</el-tag>
              {{ log.userName }}
            </span>
            <span class="audit-action">
              {{ log.before?.status }} → <strong>{{ log.after?.status }}</strong>
            </span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, OfficeBuilding, Warning } from '@element-plus/icons-vue'
import { propertyApi, viewingApi, overviewApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const properties = ref([])
const staleProperties = ref([])
const filterStatus = ref('')
const searchKeyword = ref('')
const viewingSummary = ref({})

const historyDialogVisible = ref(false)
const currentProperty = ref(null)
const statusHistory = ref([])

const statusFlow = [
  { key: 'available', label: '可租' },
  { key: 'viewing', label: '带看中' },
  { key: 'leased', label: '已签约' },
  { key: 'handover_pending', label: '待交房' },
  { key: 'handover_accepted', label: '已验收' },
  { key: 'occupied', label: '已入驻' },
  { key: 'returning', label: '退租中' },
]

const filteredProperties = computed(() => {
  let result = [...properties.value]
  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      p.building.toLowerCase().includes(kw) ||
      String(p.floor).includes(kw) ||
      p.unit.toLowerCase().includes(kw)
    )
  }
  return result
})

const currentStepIndex = computed(() => {
  if (!currentProperty.value) return 0
  const idx = statusFlow.findIndex(s => s.key === currentProperty.value.status)
  return idx >= 0 ? idx : 0
})

function statusLabel(s) {
  const m = {
    available: '可租', viewing: '带看中', leased: '已签约',
    handover_pending: '待交房', handover_accepted: '已验收',
    occupied: '已入驻', returning: '退租中'
  }
  return m[s] || s
}

function statusTagType(s) {
  const m = {
    available: 'success', viewing: 'warning', leased: 'primary',
    handover_pending: 'warning', handover_accepted: '',
    occupied: 'success', returning: 'info'
  }
  return m[s] || 'info'
}

function roleLabel(r) {
  const m = { consultant: '租赁顾问', operations: '运营经理', finance: '财务' }
  return m[r] || r
}

function roleTagType(r) {
  const m = { consultant: '', operations: 'success', finance: 'warning' }
  return m[r] || 'info'
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

function getStepStatus(stepKey, currentStatus, idx) {
  const currentIdx = statusFlow.findIndex(s => s.key === currentStatus)
  const stepIdx = statusFlow.findIndex(s => s.key === stepKey)
  if (stepIdx < currentIdx) return 'success'
  if (stepIdx === currentIdx) return 'process'
  return ''
}

async function loadData() {
  loading.value = true
  try {
    const data = await propertyApi.findAll()
    properties.value = data

    try {
      const overview = await overviewApi.getDisputeOverview()
      const staleIds = (overview.staleProperties || []).map(p => p.id)
      staleProperties.value = data.filter(p => staleIds.includes(p.id))
    } catch {
      staleProperties.value = []
    }

    for (const p of data) {
      try {
        const summary = await viewingApi.getPropertySummary(p.id)
        viewingSummary.value[p.id] = summary
      } catch (e) {}
    }

    if (route.query.id) {
      const target = data.find(p => p.id === route.query.id)
      if (target) setTimeout(() => viewHistory(target), 300)
    }
  } finally {
    loading.value = false
  }
}

async function viewHistory(row) {
  currentProperty.value = row
  try {
    const history = await propertyApi.getStatusHistory(row.id)
    statusHistory.value = history.filter(h => h.action === 'status_change')
  } catch (e) {
    statusHistory.value = []
  }
  historyDialogVisible.value = true
}

function goViewings(id) {
  router.push({ path: '/viewings', query: { propertyId: id } })
}

function goHandover(id) {
  router.push({ path: '/borrow', query: { propertyId: id } })
}

onMounted(loadData)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.prop-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.prop-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  padding-left: 26px;
}

.history-header {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.alert-header {
  display: flex;
  align-items: center;
  font-size: 14px;
}
</style>
