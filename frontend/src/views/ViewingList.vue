<template>
  <div class="page-container">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="带看状态">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部"
            style="width: 140px"
            @change="loadList"
          >
            <el-option label="待带看" value="scheduled" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="客户未到" value="no_show" />
          </el-select>
        </el-form-item>
        <el-form-item label="带看日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="客户姓名/电话/备注"
            clearable
            style="width: 220px"
            @keyup.enter="loadList"
          />
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
            共 <strong>{{ total }}</strong> 条带看记录
          </span>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="openViewingDialog">
            <el-icon><Plus /></el-icon>
            新增带看
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column label="带看时间" width="180">
          <template #default="{ row }">
            <div class="viewing-time">
              <div class="date">{{ formatDate(row.viewing_date) }}</div>
              <div class="time">{{ formatTime(row.viewing_date) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户信息" width="180">
          <template #default="{ row }">
            <div class="customer-info">
              <div class="name">{{ row.customer_name }}</div>
              <div class="phone">{{ row.customer_phone || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="房源信息" min-width="220">
          <template #default="{ row }">
            <div v-if="row.property_info" class="property-info">
              <div class="property-name">
                {{ row.property_info.property_no }} - {{ row.property_info.building }}
              </div>
              <div class="property-room">
                {{ row.property_info.floor }} {{ row.property_info.room_no }}
                ({{ row.property_info.area }}㎡)
              </div>
              <div v-if="row.property_info.remarks" class="property-remarks" :title="row.property_info.remarks">
                <el-icon><InfoFilled /></el-icon>
                有房源备注
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <status-tag type="viewing" :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="意向" width="80">
          <template #default="{ row }">
            <span v-if="row.intention_level" class="intention" :class="row.intention_level">
              {{ row.intention_level === 'high' ? '高' : row.intention_level === 'medium' ? '中' : '低' }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="带看备注" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.remarks" class="remarks">{{ row.remarks }}</span>
            <span v-else class="no-remarks">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="客户反馈" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.feedback" class="feedback">{{ row.feedback }}</span>
            <span v-else class="no-remarks">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="跟进计划" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.follow_up" class="follow-up">{{ row.follow_up }}</span>
            <span v-else class="no-remarks">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="责任人" width="100">
          <template #default="{ row }">
            {{ row.handler_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="warning"
              text
              @click.stop="handleException(row)"
            >
              上报异常
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

    <viewing-dialog
      v-model="viewingDialogVisible"
      :viewing="selectedViewing"
      @success="handleViewingSuccess"
    />
    <exception-drawer
      v-model="exceptionDrawerVisible"
      :viewing-id="selectedViewing?.id"
      @success="handleExceptionSuccess"
    />

    <el-dialog
      v-model="timelineDialogVisible"
      title="带看追溯"
      width="600px"
    >
      <timeline-panel
        v-if="selectedViewing"
        :target-type="'viewing'"
        :target-id="selectedViewing.id"
        style="height: 400px; background: #f5f7fa; border-radius: 8px"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import StatusTag from '@/components/StatusTag.vue'
import ViewingDialog from '@/components/ViewingDialog.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import TimelinePanel from '@/components/TimelinePanel.vue'
import { viewingApi } from '@/utils/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const filters = reactive({
  status: '',
  keyword: '',
  date_from: '',
  date_to: ''
})

const dateRange = ref([])

const pagination = reactive({
  page: 1,
  page_size: 20
})

const viewingDialogVisible = ref(false)
const exceptionDrawerVisible = ref(false)
const timelineDialogVisible = ref(false)
const selectedViewing = ref(null)

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function formatTime(date) {
  return dayjs(date).format('HH:mm')
}

function handleDateChange(val) {
  if (val && val.length === 2) {
    filters.date_from = val[0]
    filters.date_to = val[1]
  } else {
    filters.date_from = ''
    filters.date_to = ''
  }
  loadList()
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      status: filters.status,
      keyword: filters.keyword,
      date_from: filters.date_from,
      date_to: filters.date_to,
      page: pagination.page,
      page_size: pagination.page_size
    }
    const data = await viewingApi.getList(params)
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
  filters.keyword = ''
  filters.date_from = ''
  filters.date_to = ''
  dateRange.value = []
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
  selectedViewing.value = row
  viewingDialogVisible.value = true
}

function handleEdit(row) {
  selectedViewing.value = row
  viewingDialogVisible.value = true
}

function handleException(row) {
  selectedViewing.value = row
  exceptionDrawerVisible.value = true
}

function handleTimeline(row) {
  selectedViewing.value = row
  timelineDialogVisible.value = true
}

function openViewingDialog() {
  selectedViewing.value = null
  viewingDialogVisible.value = true
}

function handleViewingSuccess() {
  loadList()
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

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.count-info {
  color: #606266;
}

.count-info strong {
  color: #409eff;
  font-size: 16px;
  margin: 0 4px;
}

.viewing-time {
  line-height: 1.5;
}

.viewing-time .date {
  font-weight: 500;
  color: #303133;
}

.viewing-time .time {
  font-size: 12px;
  color: #909399;
}

.customer-info {
  line-height: 1.5;
}

.customer-info .name {
  font-weight: 500;
  color: #303133;
}

.customer-info .phone {
  font-size: 12px;
  color: #909399;
}

.property-info {
  line-height: 1.6;
}

.property-name {
  font-weight: 500;
  color: #303133;
}

.property-room {
  font-size: 12px;
  color: #606266;
}

.property-remarks {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #e6a23c;
  margin-top: 2px;
}

.intention {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.intention.high {
  background: #fef0f0;
  color: #f56c6c;
}

.intention.medium {
  background: #fdf6ec;
  color: #e6a23c;
}

.intention.low {
  background: #f0f9eb;
  color: #67c23a;
}

.remarks,
.feedback {
  color: #606266;
}

.follow-up {
  color: #409eff;
}

.no-remarks {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
