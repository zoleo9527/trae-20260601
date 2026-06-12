<template>
  <div class="page-container">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="房源状态">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部"
            style="width: 140px"
            @change="loadList"
          >
            <el-option label="空置中" value="vacant" />
            <el-option label="已出租" value="occupied" />
            <el-option label="已预定" value="reserved" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼宇">
          <el-select
            v-model="filters.building"
            clearable
            placeholder="全部"
            style="width: 180px"
            @change="loadList"
          >
            <el-option
              v-for="b in buildings"
              :key="b"
              :value="b"
              :label="b"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="房源编号/房间号/备注"
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
      <div v-if="jumpContext" class="jump-context-bar">
        <el-icon><Right /></el-icon>
        <span>从异常「{{ jumpContext.exceptionTitle }}」跳转，正在定位房源...</span>
      </div>
      <div class="table-header">
        <div class="header-left">
          <span class="count-info">
            共 <strong>{{ total }}</strong> 条房源
          </span>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        style="width: 100%"
        :row-class-name="propertyRowClassName"
        @row-click="handleRowClick"
      >
        <el-table-column prop="property_no" label="房源编号" width="120">
          <template #default="{ row }">
            <span class="property-no">{{ row.property_no }}</span>
          </template>
        </el-table-column>
        <el-table-column label="位置信息" min-width="200">
          <template #default="{ row }">
            <div class="location">
              <div class="building">{{ row.building }}</div>
              <div class="room">{{ row.floor }} {{ row.room_no }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="area" label="面积" width="100">
          <template #default="{ row }">
            {{ row.area }} ㎡
          </template>
        </el-table-column>
        <el-table-column prop="layout" label="户型" width="120" />
        <el-table-column label="租金" width="140">
          <template #default="{ row }">
            <div>
              <div>￥{{ row.monthly_rent?.toLocaleString() || '-' }}/月</div>
              <div class="sub-rent">￥{{ row.daily_rent || '-' }}/㎡/天</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <status-tag type="property" :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="空置信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.status === 'vacant'" class="vacancy-info">
              <div class="vacancy-reason" :title="row.vacancy_reason">
                {{ row.vacancy_reason || '-' }}
              </div>
              <div class="vacancy-date">
                空置：{{ row.vacancy_date ? formatDate(row.vacancy_date) : '-' }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="处理备注" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.remarks" class="remarks-text">
              {{ row.remarks }}
            </span>
            <span v-else class="no-remarks">暂无备注</span>
          </template>
        </el-table-column>
        <el-table-column label="责任人" width="100">
          <template #default="{ row }">
            {{ row.handler_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="handleVacancy(row)"
            >
              空置处理
            </el-button>
            <el-button
              size="small"
              type="success"
              text
              @click.stop="handleViewing(row)"
            >
              安排带看
            </el-button>
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="handleDetail(row)"
            >
              查看详情
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

    <vacancy-dialog
      v-model="vacancyDialogVisible"
      :property="selectedProperty"
      @success="handleVacancySuccess"
    />
    <viewing-dialog
      v-model="viewingDialogVisible"
      :default-property-id="selectedProperty?.id"
      @success="handleViewingSuccess"
    />
    <property-detail-drawer
      v-model="detailDrawerVisible"
      :property-id="selectedPropertyId"
      @updated="loadList"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { Search, Refresh, Download, Right } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import StatusTag from '@/components/StatusTag.vue'
import VacancyDialog from '@/components/VacancyDialog.vue'
import ViewingDialog from '@/components/ViewingDialog.vue'
import PropertyDetailDrawer from '@/components/PropertyDetailDrawer.vue'
import { propertyApi } from '@/utils/api'

const route = useRoute()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const buildings = ref([])

const filters = reactive({
  status: '',
  building: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20
})

const vacancyDialogVisible = ref(false)
const viewingDialogVisible = ref(false)
const detailDrawerVisible = ref(false)
const selectedProperty = ref(null)
const selectedPropertyId = ref(null)
const highlightId = ref(null)
const jumpContext = ref(null)

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function propertyRowClassName({ row }) {
  if (row.id === highlightId.value) {
    return 'highlight-row'
  }
  return ''
}

async function loadBuildings() {
  try {
    buildings.value = await propertyApi.getBuildings()
  } catch (e) {
    console.error(e)
  }
}

async function loadList() {
  loading.value = true
  try {
    const data = await propertyApi.getList({
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
  filters.building = ''
  filters.keyword = ''
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
  selectedProperty.value = row
  selectedPropertyId.value = row.id
  detailDrawerVisible.value = true
}

function handleVacancy(row) {
  selectedProperty.value = row
  vacancyDialogVisible.value = true
}

function handleViewing(row) {
  selectedProperty.value = row
  viewingDialogVisible.value = true
}

function handleDetail(row) {
  selectedProperty.value = row
  selectedPropertyId.value = row.id
  detailDrawerVisible.value = true
}

function handleVacancySuccess() {
  loadList()
}

function handleViewingSuccess() {
  loadList()
}

function handleExport() {
  if (list.value.length === 0) {
    ElMessage.warning('当前无数据可导出')
    return
  }
  const headers = ['房源编号', '楼宇', '楼层', '房间号', '面积(㎡)', '户型', '装修', '日租金(元/㎡/天)', '月租金(元)', '状态', '空置原因', '空置日期', '预计可租日期', '处理备注', '责任人']
  const statusMap = { vacant: '空置中', occupied: '已出租', reserved: '已预定', maintenance: '维护中' }
  const rows = list.value.map(row => [
    row.property_no,
    row.building,
    row.floor,
    row.room_no,
    row.area,
    row.layout || '',
    row.decoration || '',
    row.daily_rent || '',
    row.monthly_rent || '',
    statusMap[row.status] || row.status,
    row.vacancy_reason || '',
    row.vacancy_date ? formatDate(row.vacancy_date) : '',
    row.expected_available_date ? formatDate(row.expected_available_date) : '',
    row.remarks || '',
    row.handler_name || ''
  ])
  const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `房源台账_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}

onMounted(async () => {
  await loadBuildings()
  await loadList()
  handleRouteQuery()
})

onBeforeRouteUpdate((to) => {
  if (to.query.highlight_id) {
    nextTick(() => handleRouteQuery(to.query))
  }
})

async function handleRouteQuery(query) {
  const q = query || route.query
  const targetId = Number(q.highlight_id)
  if (!targetId) return

  jumpContext.value = q.from_exception ? {
    exceptionTitle: q.from_exception || ''
  } : null

  const found = list.value.find(p => p.id === targetId)
  if (found) {
    highlightId.value = targetId
    selectedProperty.value = found
    selectedPropertyId.value = targetId
    detailDrawerVisible.value = true
    ElMessage.success(`已定位到房源：${found.property_no}`)
  } else {
    try {
      const detail = await propertyApi.getDetail(targetId)
      highlightId.value = targetId
      selectedProperty.value = detail
      selectedPropertyId.value = targetId
      detailDrawerVisible.value = true
      ElMessage.success(`已定位到房源：${detail.property_no}`)
    } catch (e) {
      ElMessage.error('未找到对应的房源记录，可能已被删除')
    }
  }

  setTimeout(() => {
    jumpContext.value = null
  }, 3000)
}
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

.filter-form {
  margin: 0;
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

.property-no {
  font-weight: 600;
  color: #409eff;
}

.location {
  line-height: 1.5;
}

.location .building {
  font-weight: 500;
  color: #303133;
}

.location .room {
  font-size: 12px;
  color: #909399;
}

.sub-rent {
  font-size: 12px;
  color: #909399;
}

.vacancy-info {
  line-height: 1.5;
}

.vacancy-reason {
  color: #606266;
  margin-bottom: 4px;
}

.vacancy-date {
  font-size: 12px;
  color: #909399;
}

.remarks-text {
  color: #e6a23c;
}

.no-remarks {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.highlight-row) {
  background: #ecf5ff !important;
}

:deep(.highlight-row:hover > td) {
  background: #d9ecff !important;
}

.jump-context-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #e6a23c;
}
</style>
