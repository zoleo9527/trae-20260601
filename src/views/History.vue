<template>
  <div class="history-page">
    <div class="page-header">
      <div>
      <h1 class="page-title">历史记录</h1>
      <p class="page-subtitle">全链路追溯所有订单的验机与复核记录</p>
    </div>
      <div class="header-actions">
        <el-button @click="exportData" :disabled="!canExport">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option
              v-for="(value, key) in STATUS_LABELS"
              :key="key"
              :label="value.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="器材类型">
          <el-select v-model="filters.category" placeholder="全部类型" clearable>
            <el-option label="机身" value="机身" />
            <el-option label="镜头" value="镜头" />
            <el-option label="配件" value="配件" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-input v-model="filters.customer" placeholder="客户姓名" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table
      :data="filteredList"
      v-loading="loading"
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="orderNo" label="订单号" width="160" fixed="left">
        <template #default="{ row }">
          <span class="monospace link" @click="viewDetail(row.id)">{{ row.orderNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="器材信息" min-width="220">
        <template #default="{ row }">
          <div class="equipment-cell">
            <div class="equipment-name">{{ row.equipment.name }}</div>
            <div class="equipment-meta">
              <el-tag size="mini" type="info">{{ row.equipment.category }}</el-tag>
              <span class="serial">{{ row.equipment.serialNo }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="customer.name" label="客户" width="100" />
      <el-table-column label="租期" width="100">
        <template #default="{ row }">
          {{ row.rentalPeriod.days }}天
        </template>
      </el-table-column>
      <el-table-column label="出库验机" width="180">
        <template #default="{ row }">
          <div v-if="row.outboundInspection">
            <div class="inspector">{{ row.outboundInspection.inspector }}</div>
            <div class="time">{{ formatTime(row.outboundInspection.inspectedAt) }}</div>
          </div>
          <span v-else style="color: #9ca3af;">-</span>
        </template>
      </el-table-column>
      <el-table-column label="归还复核" width="180">
        <template #default="{ row }">
          <div v-if="row.returnInspection">
            <div class="inspector">{{ row.returnInspection.inspector }}</div>
            <div class="time">{{ formatTime(row.returnInspection.inspectedAt) }}</div>
          </div>
          <span v-else style="color: #9ca3af;">-</span>
        </template>
      </el-table-column>
      <el-table-column label="复核结果" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.returnInspection" :type="row.returnInspection.overallResult === 'abnormal' ? 'danger' : 'success'">
            {{ row.returnInspection.overallResult === 'abnormal' ? '异常' : '正常' }}
          </el-tag>
          <span v-else style="color: #9ca3af;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="当前状态" width="130">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="viewDetail(row.id)">
            追溯详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="integration-point">
      <el-icon><InfoFilled /></el-icon>
      <strong>设计说明：</strong>
      所有状态变更均记录操作人、时间和备注，确保一线处理和管理回看基于同一份数据。
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { STATUS_LABELS } from '@/data/mockData'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const loading = ref(false)
const filters = reactive({
  status: '',
  category: '',
  customer: '',
  dateRange: []
})

const allList = computed(() => equipmentStore.allRentals)
const canExport = computed(() => authStore.hasPermission('history:export'))

const filteredList = computed(() => {
  let list = [...allList.value]

  if (filters.status) {
    list = list.filter(r => r.status === filters.status)
  }

  if (filters.category) {
    list = list.filter(r => r.equipment.category === filters.category)
  }

  if (filters.customer) {
    list = list.filter(r =>
      r.customer.name.includes(filters.customer)
    )
  }

  if (filters.dateRange && filters.dateRange.length === 2) {
    const [start, end] = filters.dateRange
    list = list.filter(r => {
      const createDate = new Date(r.createdAt).toISOString().split('T')[0]
      return createDate >= start && createDate <= end
    })
  }

  return list
})

const getStatusLabel = (status) => STATUS_LABELS[status]?.label || status
const getStatusType = (status) => STATUS_LABELS[status]?.type || 'info'

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const viewDetail = (id) => {
  router.push(`/history/detail/${id}`)
}

const applyFilters = () => {
  ElMessage.success(`查询到 ${filteredList.value.length} 条记录`)
}

const resetFilters = () => {
  filters.status = ''
  filters.category = ''
  filters.customer = ''
  filters.dateRange = []
}

const exportData = () => {
  if (!canExport.value) {
    ElMessage.warning('您没有导出权限')
    return
  }
  ElMessage.info('导出功能待实现')
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 20px;
}

.monospace {
  font-family: monospace;
  font-size: 12px;
}

.monospace.link {
  color: #3b82f6;
  cursor: pointer;
}

.monospace.link:hover {
  text-decoration: underline;
}

.equipment-cell {
  line-height: 1.4;
}

.equipment-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.equipment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.serial {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

.inspector {
  font-weight: 500;
  color: #374151;
}

.time {
  font-size: 11px;
  color: #9ca3af;
}
</style>
