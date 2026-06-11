<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { type Allocation, statusMap } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const list = ref<Allocation[]>([])
const filterStatus = ref('')
const filterModified = ref<boolean | ''>('')

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.listAllocations({
      status: filterStatus.value || undefined,
      is_modified: filterModified === '' ? undefined : filterModified.value
    })
    if (res.code === 0) list.value = res.data.items
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '加载失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (s?: string) => s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '-'
const goDetail = (id: number) => window.location.hash = `#/allocations/${id}`

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-title">📦 商品调拨单列表</div>
      <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
    </div>

    <el-card class="card-shadow" style="margin-bottom: 16px">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width: 180px" @change="loadData">
            <el-option v-for="(v, k) in statusMap" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否被修改">
          <el-select v-model="filterModified" clearable placeholder="全部" style="width: 140px" @change="loadData">
            <el-option label="是（有改动）" :value="true" />
            <el-option label="否（无改动）" :value="false" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" v-loading="loading">
      <el-table :data="list" stripe>
        <el-table-column prop="allocation_no" label="调拨单号" width="200">
          <template #default="{ row }">
            <a style="color: #4f46e5; cursor: pointer" @click="goDetail(row.id)">
              {{ row.allocation_no }}
              <el-tag v-if="row.is_modified" type="warning" size="small" style="margin-left: 6px">⚠️ 被修改</el-tag>
            </a>
          </template>
        </el-table-column>
        <el-table-column label="调柜" width="240">
          <template #default="{ row }">
            <div>{{ row.from_counter }} → {{ row.to_counter }}</div>
            <div style="font-size: 12px; color: #9ca3af">{{ row.brand }} · {{ row.floor }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="160">
          <template #default="{ row }">
            <div>{{ row.goods_name }}</div>
            <div style="font-size: 12px; color: #9ca3af">{{ row.goods_code }} / {{ row.sku }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80">
          <template #default="{ row }">{{ row.quantity }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理人" width="120">
          <template #default="{ row }">{{ row.creator_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="版本" width="70">
          <template #default="{ row }">v{{ row.version }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="goDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
