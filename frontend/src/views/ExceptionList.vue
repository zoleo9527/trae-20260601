<template>
  <div class="page-container">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
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
      <div class="table-header">
        <div class="header-left">
          <span class="count-info">
            共 <strong>{{ total }}</strong> 条异常记录
            <el-tag v-if="pendingCount > 0" type="danger" style="margin-left: 12px">
              待处理 {{ pendingCount }}
            </el-tag>
          </span>
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
        <el-table-column label="关联信息" width="200">
          <template #default="{ row }">
            <div v-if="row.property_info" class="related-info">
              <div class="related-title">房源</div>
              <div class="related-content">
                {{ row.property_info.property_no }} - {{ row.property_info.building }}
                {{ row.property_info.floor }} {{ row.property_info.room_no }}
              </div>
            </div>
            <div v-if="row.viewing_info" class="related-info">
              <div class="related-title">带看</div>
              <div class="related-content">
                {{ row.viewing_info.customer_name }} - {{ formatDateTime(row.viewing_info.viewing_date) }}
              </div>
            </div>
            <span v-if="!row.property_info && !row.viewing_info">-</span>
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
import { Search, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import StatusTag from '@/components/StatusTag.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import TimelinePanel from '@/components/TimelinePanel.vue'
import { exceptionApi } from '@/utils/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const filters = reactive({
  status: '',
  severity: '',
  exception_type: ''
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

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
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

onMounted(() => {
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

.related-info {
  line-height: 1.5;
  margin-bottom: 4px;
}

.related-info:last-child {
  margin-bottom: 0;
}

.related-title {
  font-size: 11px;
  color: #909399;
}

.related-content {
  font-size: 12px;
  color: #606266;
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
