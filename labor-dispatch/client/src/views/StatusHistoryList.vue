<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2>状态历史（完整追溯）</h2>
        </div>
      </el-header>

      <el-main>
        <div class="filter-section">
          <el-form :model="filterForm" inline>
            <el-form-item label="实体类型">
              <el-select v-model="filterForm.entityType" placeholder="请选择" clearable>
                <el-option label="用工需求" value="LaborDemand" />
                <el-option label="候选人" value="Candidate" />
                <el-option label="匹配记录" value="MatchingRecord" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作类型">
              <el-select v-model="filterForm.actionType" placeholder="请选择" clearable>
                <el-option label="创建" value="创建" />
                <el-option label="更新" value="更新" />
                <el-option label="状态更新" value="状态更新" />
                <el-option label="退回" value="退回" />
                <el-option label="补录" value="补录" />
                <el-option label="复核" value="复核" />
                <el-option label="确认" value="确认" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-section">
          <el-table :data="tableData" v-loading="loading" stripe>
            <el-table-column prop="entityType" label="实体类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ getEntityTypeName(row.entityType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="entityId" label="实体ID" width="200" show-overflow-tooltip />
            <el-table-column prop="actionType" label="操作类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getActionTypeColor(row.actionType)">
                  {{ row.actionType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态变化" width="200">
              <template #default="{ row }">
                <span v-if="row.previousStatus">{{ row.previousStatus }}</span>
                <span v-else>-</span>
                <span style="margin: 0 5px">→</span>
                <span>{{ row.newStatus }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="operator.name" label="操作人" width="100" />
            <el-table-column prop="operator.role" label="角色" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.operator?.role }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-section">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[20, 50, 100, 200]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadData"
              @current-change="loadData"
            />
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'StatusHistoryList',
  setup() {
    const loading = ref(false)

    const filterForm = reactive({
      entityType: '',
      actionType: ''
    })

    const dateRange = ref([])

    const pagination = reactive({
      page: 1,
      pageSize: 50,
      total: 0
    })

    const tableData = ref([])

    onMounted(() => {
      loadData()
    })

    const loadData = async () => {
      try {
        loading.value = true
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize
        }

        if (filterForm.entityType) {
          params.entityType = filterForm.entityType
        }
        if (filterForm.actionType) {
          params.actionType = filterForm.actionType
        }
        if (dateRange.value && dateRange.value.length === 2) {
          params.startDate = dateRange.value[0]
          params.endDate = dateRange.value[1]
        }

        const result = await api.statusHistories.list(params)
        tableData.value = result.data
        pagination.total = result.total
      } catch (error) {
        ElMessage.error('加载数据失败')
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      pagination.page = 1
      loadData()
    }

    const handleReset = () => {
      filterForm.entityType = ''
      filterForm.actionType = ''
      dateRange.value = []
      pagination.page = 1
      loadData()
    }

    const getEntityTypeName = (type) => {
      const names = {
        'LaborDemand': '用工需求',
        'Candidate': '候选人',
        'MatchingRecord': '匹配记录'
      }
      return names[type] || type
    }

    const getActionTypeColor = (actionType) => {
      const colors = {
        '创建': 'primary',
        '更新': 'info',
        '状态更新': 'warning',
        '退回': 'danger',
        '补录': 'warning',
        '复核': 'primary',
        '确认': 'success'
      }
      return colors[actionType] || 'info'
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    return {
      loading,
      filterForm,
      dateRange,
      pagination,
      tableData,
      loadData,
      handleSearch,
      handleReset,
      getEntityTypeName,
      getActionTypeColor,
      formatTime
    }
  }
}
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-content h2 {
  margin: 0;
}
</style>
