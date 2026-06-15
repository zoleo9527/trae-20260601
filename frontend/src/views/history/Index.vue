<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElForm, ElFormItem, ElInput, ElDatePicker, ElSelect, ElOption, ElMessage, ElPagination, ElRow, ElCol, ElCollapse, ElCollapseItem, ElEmpty } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const orders = ref<any[]>([])
const installers = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const filterForm = ref({
  status: '',
  installer_id: null as number | null,
  liability_result: '',
  start_time: null as Date | null,
  end_time: null as Date | null,
  customer_name: '',
  customer_phone: ''
})

const statusMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' | 'primary' }> = {
  'PENDING': { label: '待分配', type: 'info' },
  'ASSIGNED': { label: '已分配', type: 'warning' },
  'IN_PROGRESS': { label: '安装中', type: 'primary' },
  'COMPLETED': { label: '已完成', type: 'success' },
  'REWORK_REQUESTED': { label: '待返工', type: 'danger' },
  'REWORK_IN_PROGRESS': { label: '返工中', type: 'danger' },
  'REWORK_COMPLETED': { label: '返工完成', type: 'warning' },
  'LIABILITY_PENDING': { label: '待责任判定', type: 'danger' },
  'LIABILITY_DONE': { label: '责任已判定', type: 'success' }
}

const liabilityMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  'INSTALLER': { label: '师傅责任', type: 'danger' },
  'PRODUCT': { label: '产品问题', type: 'warning' },
  'CUSTOMER': { label: '客户原因', type: 'info' },
  'OTHER': { label: '其他', type: '' }
}

const statusOptions = computed(() => {
  return Object.entries(statusMap).map(([value, { label }]) => ({ value, label }))
})

const liabilityOptions = computed(() => {
  return Object.entries(liabilityMap).map(([value, { label }]) => ({ value, label }))
})

const loadOrders = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      _page: currentPage.value,
      _limit: pageSize.value
    }
    
    if (filterForm.value.status) {
      params.status = filterForm.value.status
    }
    if (filterForm.value.installer_id) {
      params.installer_id = filterForm.value.installer_id
    }
    if (filterForm.value.liability_result) {
      params.liability_result = filterForm.value.liability_result
    }
    if (filterForm.value.customer_name) {
      params.customer_name_like = filterForm.value.customer_name
    }
    if (filterForm.value.customer_phone) {
      params.customer_phone_like = filterForm.value.customer_phone
    }
    if (filterForm.value.start_time) {
      params.scheduled_time_gte = filterForm.value.start_time.toISOString()
    }
    if (filterForm.value.end_time) {
      params.scheduled_time_lte = filterForm.value.end_time.toISOString()
    }

    const response = await api.get<any[]>('/orders', params)
    orders.value = response
    
    const allOrders = await api.get<any[]>('/orders')
    total.value = allOrders.length
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const loadInstallers = async () => {
  try {
    const response = await api.get<any[]>('/users?role=INSTALLER')
    installers.value = response
  } catch (error) {
    console.error('加载师傅列表失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadOrders()
}

const handleReset = () => {
  filterForm.value = {
    status: '',
    installer_id: null,
    liability_result: '',
    start_time: null,
    end_time: null,
    customer_name: '',
    customer_phone: ''
  }
  currentPage.value = 1
  loadOrders()
}

const handleViewDetail = (order: any) => {
  router.push(`/history/order/${order.id}`)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadOrders()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadOrders()
}

const getInstallerName = (installerId: number | null) => {
  if (!installerId) return '-'
  const installer = installers.value.find(i => i.id === installerId)
  return installer ? installer.name : '-'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadOrders()
  loadInstallers()
})
</script>

<template>
  <div class="history-page">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span>历史回看</span>
        </div>
      </template>
      
      <el-collapse>
        <el-collapse-item title="筛选条件" name="filter">
          <el-form :model="filterForm" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="订单状态">
                  <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 100%">
                    <el-option
                      v-for="option in statusOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="安装师傅">
                  <el-select v-model="filterForm.installer_id" placeholder="请选择师傅" clearable style="width: 100%">
                    <el-option
                      v-for="installer in installers"
                      :key="installer.id"
                      :label="installer.name"
                      :value="installer.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="责任判定">
                  <el-select v-model="filterForm.liability_result" placeholder="请选择责任" clearable style="width: 100%">
                    <el-option
                      v-for="option in liabilityOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="开始时间">
                  <el-date-picker
                    v-model="filterForm.start_time"
                    type="datetime"
                    placeholder="选择开始时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="结束时间">
                  <el-date-picker
                    v-model="filterForm.end_time"
                    type="datetime"
                    placeholder="选择结束时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="客户姓名">
                  <el-input v-model="filterForm.customer_name" placeholder="请输入客户姓名" clearable />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="客户电话">
                  <el-input v-model="filterForm.customer_phone" placeholder="请输入客户电话" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label-width="0">
                  <el-button type="primary" @click="handleSearch">查询</el-button>
                  <el-button @click="handleReset">重置</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card class="table-card">
      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="订单ID" width="80" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="customer_phone" label="客户电话" width="120" />
        <el-table-column prop="product_type" label="产品类型" width="100" />
        <el-table-column prop="product_model" label="产品型号" width="120" />
        <el-table-column prop="address" label="地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="installer_id" label="安装师傅" width="100">
          <template #default="{ row }">
            {{ getInstallerName(row.installer_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="liability_result" label="责任判定" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.liability_result" :type="liabilityMap[row.liability_result]?.type">
              {{ liabilityMap[row.liability_result]?.label || row.liability_result }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="scheduled_time" label="预约时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.scheduled_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleViewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.history-page {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>