<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span style="font-weight: 500; font-size: 16px">酒水库存</span>
          <el-button type="primary" :icon="Plus">新增酒水</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="drinkCode" label="酒水编码" width="120" />
        <el-table-column prop="drinkName" label="酒水名称" width="150" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.stock < 10 ? '#f56c6c' : '' }">{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '在售' : '停售' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { getDrinkList } from '@/api/drink'

const loading = ref(false)
const tableData = ref([])

const loadList = async () => {
  loading.value = true
  try {
    tableData.value = await getDrinkList()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>
