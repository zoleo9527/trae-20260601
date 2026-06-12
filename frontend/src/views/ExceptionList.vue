<template>
  <div class="page-container">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关联房源">
          <el-select
            v-model="filters.property_id"
            filterable
            clearable
            placeholder="全部房源"
            style="width: 220px"
            @change="loadList"
          >
            <el-option
              v-for="p in propertyOptions"
              :key="p.id"
              :value="p.id"
              :label="`${p.property_no} - ${p.building} ${p.floor} ${p.room_no}`"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联带看">
          <el-select
            v-model="filters.viewing_id"
            filterable
            clearable
            placeholder="全部带看"
            style="width: 220px"
            @change="loadList"
          >
            <el-option
              v-for="v in viewingOptions"
              :key="v.id"
              :value="v.id"
              :label="`${v.customer_name} - ${formatDate(v.viewing_date)}`"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="异常状态">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部"
            style="width: 140px"
            @change="loadList"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select
            v-model="filters.severity"
            clearable
            placeholder="全部"
            style="width: 140px"
            @change="loadList"
          >
            <el-option label="低" value="low" />
            <el-option label="中" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select
            v-model="filters.exception_type"
            clearable
            placeholder="全部"
            style="width: 140px"
            @change="loadList"
          >
            <el-option label="房源问题" value="房源问题" />
            <el-option label="客户问题" value="客户问题" />
            <el-option label="带看问题" value="带看问题" />
            <el-option label="物业问题" value="物业问题" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div v-if="activeFilters.length > 0" class="filter-tags-bar">
        <span class="filter-tags-label">当前筛选：</span>
        <el-tag
          v-for="f in activeFilters"
          :key="f.key"
          :type="f.type"
          closable
          size="small"
          class="filter-tag"
          @close="clearFilter(f.key)"
        >
          <el-icon class="filter-tag-icon"><Filter /></el-icon>
          {{ f.label }}: {{ f.value }}
        </el-tag>
        <el-button size="small" text type="primary" @click="resetFilters">
          清除全部
        </el-button>
      </div>

      <div class="table-header">
        <div class="header-left">
          <span class="count-info">
            共 <strong>{{ total }}</strong> 条异常记录
          </span>
          <div class="stats-chips">
            <el-tag v-if="pendingCount > 0" type="danger" effect="dark" class="stat-chip">
              <el-icon><Clock /></el-icon>
              待处理 {{ pendingCount }}
            </el-tag>
            <el-tag v-if="highPriorityCount > 0" type="warning" effect="dark" class="stat-chip">
              <el-icon><Warning /></el-icon>
              高优先级 {{ highPriorityCount }}
            </el-tag>
            <el-tag v-if="processingCount > 0" type="primary" effect="plain" class="stat-chip">
              处理中 {{ processingCount }}
            </el-tag>
            <el-tag v-if="resolvedTodayCount > 0" type="success" effect="plain" class="stat-chip">
              今日已解决 {{ resolvedTodayCount }}
            </el-tag>
          </div>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        style="width: 100%"
        :row-class-name="tableRowClassName"
        @row-click="handleRowClick"
      >
        <el-table-column label="异常信息" min-width="280">
          <template #default="{ row }">
            <div class="exception-info">
              <div class="exception-header">
                <el-tag
                  size="small"
                  :type="row.severity === 'high' || row.severity === 'critical' ? 'danger' : row.severity === 'normal' ? 'warning' : 'info'"
                >
                  {{ row.severity === 'critical' ? '紧急' : row.severity === 'high' ? '高' : row.severity === 'normal' ? '中' : '低' }}
                </el-tag>
                <span class="exception-type">{{ row.exception_type }}</span>
                <span class="exception-title">{{ row.title }}</span>
              </div>
              <div class="exception-desc">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务链路" width="280">
          <template #default="{ row }">
            <div class="chain-tags">
              <el-tag
                v-if="row.property_info"
                size="small"
                type="info"
                effect="light"
                class="chain-tag"
                @click.stop="filterByProperty(row.property_info.id)"
              >
                <el-icon style="vertical-align: -2px; margin-right: 2px"><OfficeBuilding /></el-icon>
                {{ row.property_info.property_no }}
              </el-tag>
              <el-icon v-if="row.property_info && row.viewing_info" class="chain-arrow"><ArrowRight /></el-icon>
              <el-tag
                v-if="row.viewing_info"
                size="small"
                type="warning"
                effect="light"
                class="chain-tag"
                @click.stop="filterByViewing(row.viewing_info.id)"
              >
                <el-icon style="vertical-align: -2px; margin-right: 2px"><User /></el-icon>
                {{ row.viewing_info.customer_name }}
              </el-tag>
              <el-icon v-if="row.viewing_info" class="chain-arrow"><ArrowRight /></el-icon>
              <el-icon v-else-if="row.property_info" class="chain-arrow"><ArrowRight /></el-icon>
              <el-tag
                size="small"
                :type="row.severity === 'critical' || row.severity === 'high' ? 'danger' : 'warning'"
                effect="dark"
                class="chain-tag"
              >
                <el-icon style="vertical-align: -2px; margin-right: 2px"><Warning /></el-icon>
                {{ row.title.length > 10 ? row.title.slice(0, 10) + '...' : row.title }}
              </el-tag>
            </div>
            <div class="chain-detail">
              <span v-if="row.property_info" class="chain-detail-item">
                {{ row.property_info.building }} {{ row.property_info.floor }}{{ row.property_info.room_no }}
              </span>
              <span v-if="row.viewing_info" class="chain-detail-item">
                {{ formatDateTime(row.viewing_info.viewing_date) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <status-tag type="exception" :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="解决方案" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.solution" class="solution">{{ row.solution }}</span>
            <span v-else class="no-content">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="处理备注" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.remarks" class="remarks">{{ row.remarks }}</span>
            <span v-else class="no-content">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="解决时间" width="160">
          <template #default="{ row }">
            <div v-if="row.resolved_at">
              {{ formatDateTime(row.resolved_at) }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="责任人" width="100">
          <template #default="{ row }">
            {{ row.handler_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="上报时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="handleProcess(row)"
            >
              {{ row.status === 'resolved' || row.status === 'closed' ? '查看' : '处理' }}
            </el-button>
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="handleTimeline(row)"
            >
              追溯
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <exception-drawer
      v-model="exceptionDrawerVisible"
      :exception="selectedException"
      @success="handleExceptionSuccess"
      @jump-to-property="handleJumpToProperty"
      @jump-to-viewing="handleJumpToViewing"
    />

    <el-dialog
      v-model="timelineDialogVisible"
      title="异常追溯"
      width="600px"
    >
      <timeline-panel
        v-if="selectedException"
        :target-type="'exception'"
        :target-id="selectedException.id"
        style="height: 400px; background: #f5f7fa; border-radius: 8px"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, OfficeBuilding, User, Warning, ArrowRight, Filter, Clock } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import StatusTag from '@/components/StatusTag.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import TimelinePanel from '@/components/TimelinePanel.vue'
import { exceptionApi, propertyApi, viewingApi } from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const propertyOptions = ref([])
const viewingOptions = ref([])

const filters = reactive({
  status: '',
  severity: '',
  exception_type: '',
  property_id: null,
  viewing_id: null
})

const pagination = reactive({
  page: 1,
  page_size: 20
})

const exceptionDrawerVisible = ref(false)
const timelineDialogVisible = ref(false)
const selectedException = ref(null)

const pendingCount = computed(() => {
  return list.value.filter(item => item.status === 'pending').length
})

const highPriorityCount = computed(() => {
  return list.value.filter(item =>
    (item.severity === 'high' || item.severity === 'critical') &&
    (item.status === 'pending' || item.status === 'processing')
  ).length
})

const processingCount = computed(() => {
  return list.value.filter(item => item.status === 'processing').length
})

const resolvedTodayCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return list.value.filter(item =>
    item.status === 'resolved' &&
    item.resolved_at &&
    dayjs(item.resolved_at).format('YYYY-MM-DD') === today
  ).length
})

const activeFilters = computed(() => {
  const result = []
  if (filters.property_id) {
    const p = propertyOptions.value.find(x => x.id === filters.property_id)
    if (p) {
      result.push({
        key: 'property_id',
        label: '房源',
        value: `${p.property_no} - ${p.building} ${p.floor}${p.room_no}`,
        type: 'info'
      })
    }
  }
  if (filters.viewing_id) {
    const v = viewingOptions.value.find(x => x.id === filters.viewing_id)
    if (v) {
      result.push({
        key: 'viewing_id',
        label: '带看',
        value: `${v.customer_name} - ${formatDate(v.viewing_date)}`,
        type: 'warning'
      })
    }
  }
  if (filters.status) {
    const statusMap = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
    result.push({ key: 'status', label: '状态', value: statusMap[filters.status] || filters.status, type: '' })
  }
  if (filters.severity) {
    const sevMap = { low: '低', normal: '中', high: '高', critical: '紧急' }
    const sevTypeMap = { low: 'info', normal: '', high: 'warning', critical: 'danger' }
    result.push({ key: 'severity', label: '严重程度', value: sevMap[filters.severity] || filters.severity, type: sevTypeMap[filters.severity] || '' })
  }
  if (filters.exception_type) {
    result.push({ key: 'exception_type', label: '异常类型', value: filters.exception_type, type: '' })
  }
  return result
})

function clearFilter(key) {
  if (key === 'property_id') filters.property_id = null
  else if (key === 'viewing_id') filters.viewing_id = null
  else if (key === 'status') filters.status = ''
  else if (key === 'severity') filters.severity = ''
  else if (key === 'exception_type') filters.exception_type = ''
  pagination.page = 1
  loadList()
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function formatDate(date) {
  return dayjs(date).format('MM-DD HH:mm')
}

async function loadPropertyOptions() {
  try {
    const data = await propertyApi.getList({ page_size: 100 })
    propertyOptions.value = data.items || []
  } catch (e) {
    console.error(e)
  }
}

async function loadViewingOptions() {
  try {
    const data = await viewingApi.getList({ page_size: 100 })
    viewingOptions.value = data.items || []
  } catch (e) {
    console.error(e)
  }
}

function tableRowClassName({ row }) {
  if (row.status === 'pending' && (row.severity === 'high' || row.severity === 'critical')) {
    return 'exception-row-high'
  }
  if (row.status === 'pending') {
    return 'exception-row-pending'
  }
  return ''
}

async function loadList() {
  loading.value = true
  try {
    const data = await exceptionApi.getList({
      ...filters,
      page: pagination.page,
      page_size: pagination.page_size
    })
    list.value = data.items || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = ''
  filters.severity = ''
  filters.exception_type = ''
  filters.property_id = null
  filters.viewing_id = null
  pagination.page = 1
  loadList()
}

function handleSizeChange(val) {
  pagination.page_size = val
  pagination.page = 1
  loadList()
}

function handlePageChange(val) {
  pagination.page = val
  loadList()
}

function handleRowClick(row) {
  selectedException.value = row
  exceptionDrawerVisible.value = true
}

function handleProcess(row) {
  selectedException.value = row
  exceptionDrawerVisible.value = true
}

function handleTimeline(row) {
  selectedException.value = row
  timelineDialogVisible.value = true
}

function handleExceptionSuccess() {
  loadList()
}

function handleJumpToProperty(propertyId) {
  const excTitle = selectedException.value?.title || ''
  exceptionDrawerVisible.value = false
  router.push({
    path: '/properties',
    query: { highlight_id: propertyId, from_exception: excTitle }
  })
}

function handleJumpToViewing(viewingId) {
  const excTitle = selectedException.value?.title || ''
  exceptionDrawerVisible.value = false
  router.push({
    path: '/viewings',
    query: { highlight_id: viewingId, from_exception: excTitle }
  })
}

function filterByProperty(propertyId) {
  filters.property_id = propertyId
  pagination.page = 1
  loadList()
}

function filterByViewing(viewingId) {
  filters.viewing_id = viewingId
  pagination.page = 1
  loadList()
}

onMounted(() => {
  loadPropertyOptions()
  loadViewingOptions()
  loadList()
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}

:deep(.exception-row-pending) {
  background: #fdf6ec !important;
}

:deep(.exception-row-high) {
  background: #fef0f0 !important;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-tags-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.filter-tags-label {
  font-size: 12px;
  color: #909399;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
}

.filter-tag-icon {
  margin-right: 2px;
  font-size: 12px;
}

.count-info {
  color: #606266;
  display: flex;
  align-items: center;
}

.count-info strong {
  color: #409eff;
  font-size: 16px;
  margin: 0 4px;
}

.stats-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.exception-info {
  line-height: 1.6;
}

.exception-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.exception-type {
  font-size: 12px;
  color: #909399;
}

.exception-title {
  font-weight: 500;
  color: #303133;
}

.exception-desc {
  font-size: 12px;
  color: #606266;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chain-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.chain-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.chain-tag:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.chain-arrow {
  font-size: 12px;
  color: #c0c4cc;
}

.chain-detail {
  font-size: 11px;
  color: #909399;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chain-detail-item {
  line-height: 1.4;
}

.solution {
  color: #67c23a;
}

.remarks {
  color: #606266;
}

.no-content {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
