<template>
  <div>
    <div class="page-header">
      <span class="page-title">召回管理</span>
      <el-button type="danger" @click="showCreate = true">
        <el-icon><Warning /></el-icon> 发起召回
      </el-button>
    </div>

    <el-card>
      <el-table :data="recalls" border stripe style="width: 100%;">
        <el-table-column prop="recall_no" label="召回编号" width="200">
          <template #default="{ row }">
            <el-link type="danger" @click="$router.push(`/recalls/${row.recall_no}`)">
              {{ row.recall_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="batch_no" label="关联批次" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/batches/${row.batch_no}`)">
              {{ row.batch_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="召回原因" show-overflow-tooltip />
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round(row.recovered_items / row.total_items * 100)" 
              :status="row.status === 'completed' ? 'success' : ''"
            />
            <div style="font-size: 12px; text-align: center;">
              {{ row.recovered_items }} / {{ row.total_items }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="initiator_name" label="发起人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ row.status === 'active' ? '进行中' : '已完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发起时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/recalls/${row.recall_no}`)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreate" title="发起召回" width="500px">
      <el-form :model="newRecall" label-width="100px">
        <el-form-item label="选择批次">
          <el-select v-model="newRecall.batch_no" filterable style="width: 100%;">
            <el-option 
              v-for="batch in batches" 
              :key="batch.batch_no" 
              :label="`${batch.batch_no} - ${batch.program}`"
              :value="batch.batch_no"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="召回原因">
          <el-input v-model="newRecall.reason" type="textarea" :rows="3" placeholder="请描述召回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="danger" @click="createRecall">确认发起</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { recallAPI, batchAPI } from '../api'

const recalls = ref([])
const batches = ref([])
const showCreate = ref(false)

const newRecall = ref({
  batch_no: '',
  reason: ''
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadRecalls = async () => {
  try {
    const res = await recallAPI.getList()
    recalls.value = res.data
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const loadBatches = async () => {
  try {
    const res = await batchAPI.getList({ status: 'completed' })
    batches.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const createRecall = async () => {
  if (!newRecall.value.batch_no || !newRecall.value.reason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    const res = await recallAPI.create(newRecall.value)
    ElMessage.success('召回已发起')
    showCreate.value = false
    newRecall.value = { batch_no: '', reason: '' }
    loadRecalls()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '发起失败')
  }
}

onMounted(() => {
  loadRecalls()
  loadBatches()
})
</script>
