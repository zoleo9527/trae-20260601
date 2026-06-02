<template>
  <div>
    <div class="page-header">
      <span class="page-title">灭菌批次管理</span>
      <el-button type="primary" @click="showCreate = true">
        <el-icon><Plus /></el-icon> 新建批次
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-input v-model="filters.batchNo" placeholder="搜索批次号" prefix-icon="Search" clearable />
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100%;">
              <el-option label="全部" value="" />
              <el-option label="处理中" value="processing" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadBatches">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <el-table :data="batches" border stripe style="width: 100%;">
        <el-table-column prop="batch_no" label="批次号" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/batches/${row.batch_no}`)">
              {{ row.batch_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="sterilizer_id" label="灭菌器" width="120" />
        <el-table-column prop="program" label="灭菌程序" width="140" />
        <el-table-column label="参数" width="140">
          <template #default="{ row }">
            {{ row.temperature }}℃ / {{ row.duration }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="package_count" label="器械包数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'primary'" size="small">
              {{ row.status === 'completed' ? '已完成' : '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bio_indicator_result" label="生物指示" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.bio_indicator_result" :type="row.bio_indicator_result === 'pass' ? 'success' : 'danger'" size="small">
              {{ row.bio_indicator_result === 'pass' ? '合格' : '不合格' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作员" width="100" />
        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/batches/${row.batch_no}`)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreate" title="新建灭菌批次" width="500px">
      <el-form :model="newBatch" label-width="100px">
        <el-form-item label="批次号">
          <el-input v-model="newBatch.batch_no" :placeholder="'BATCH' + Date.now()" />
        </el-form-item>
        <el-form-item label="灭菌器">
          <el-select v-model="newBatch.sterilizer_id" style="width: 100%;">
            <el-option label="STE-001" value="STE-001" />
            <el-option label="STE-002" value="STE-002" />
            <el-option label="EO-001" value="EO-001" />
          </el-select>
        </el-form-item>
        <el-form-item label="灭菌程序">
          <el-select v-model="newBatch.program" style="width: 100%;">
            <el-option label="高温高压灭菌" value="高温高压灭菌" />
            <el-option label="环氧乙烷灭菌" value="环氧乙烷灭菌" />
            <el-option label="低温等离子灭菌" value="低温等离子灭菌" />
          </el-select>
        </el-form-item>
        <el-form-item label="温度(℃)">
          <el-input-number v-model="newBatch.temperature" :min="50" :max="150" />
        </el-form-item>
        <el-form-item label="时长(分钟)">
          <el-input-number v-model="newBatch.duration" :min="5" :max="600" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="createBatch">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { batchAPI } from '../api'

const batches = ref([])
const showCreate = ref(false)

const filters = ref({
  batchNo: '',
  status: ''
})

const newBatch = ref({
  batch_no: '',
  sterilizer_id: 'STE-001',
  program: '高温高压灭菌',
  temperature: 134,
  duration: 18
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadBatches = async () => {
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    
    const res = await batchAPI.getList(params)
    
    if (filters.value.batchNo) {
      batches.value = res.data.filter(b => 
        b.batch_no.toLowerCase().includes(filters.value.batchNo.toLowerCase())
      )
    } else {
      batches.value = res.data
    }
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const resetFilters = () => {
  filters.value = { batchNo: '', status: '' }
  loadBatches()
}

const createBatch = async () => {
  if (!newBatch.value.batch_no) {
    newBatch.value.batch_no = 'BATCH' + Date.now()
  }
  
  try {
    await batchAPI.create(newBatch.value)
    ElMessage.success('创建成功')
    showCreate.value = false
    loadBatches()
    newBatch.value = { batch_no: '', sterilizer_id: 'STE-001', program: '高温高压灭菌', temperature: 134, duration: 18 }
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '创建失败')
  }
}

onMounted(() => {
  loadBatches()
})
</script>
