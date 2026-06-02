<template>
  <div>
    <div class="page-header">
      <span class="page-title">异常管理</span>
      <el-button type="primary" @click="showCreate = true">
        <el-icon><Plus /></el-icon> 报告异常
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-row :gutter="16">
          <el-col :span="5">
            <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100%;">
              <el-option label="全部" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已解决" value="resolved" />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select v-model="filters.type" placeholder="类型" clearable style="width: 100%;">
              <el-option label="全部" value="" />
              <el-option label="缺件" value="missing" />
              <el-option label="污染" value="contamination" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadExceptions">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <el-table :data="exceptions" border stripe style="width: 100%;">
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'missing' ? 'warning' : 'danger'" size="small">
              {{ row.type === 'missing' ? '缺件' : '污染' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="package_no" label="器械包号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/packages/${row.package_no}`)">
              {{ row.package_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="package_name" label="包名称" show-overflow-tooltip />
        <el-table-column prop="description" label="问题描述" show-overflow-tooltip />
        <el-table-column prop="missing_items" label="缺失物品" v-if="hasMissingItems" show-overflow-tooltip />
        <el-table-column prop="reporter_name" label="报告人" width="100" />
        <el-table-column prop="handler_name" label="处理人" width="100">
          <template #default="{ row }">{{ row.handler_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status]" size="small">
              {{ statusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="报告时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              v-if="row.status !== 'resolved'" 
              type="primary" 
              size="small" 
              link
              @click="showResolve(row)"
            >
              处理
            </el-button>
            <el-button v-else type="info" size="small" link @click="showDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreate" title="报告异常" width="500px">
      <el-form :model="newException" label-width="100px">
        <el-form-item label="器械包号">
          <el-input v-model="newException.package_no" placeholder="输入包号" />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-radio-group v-model="newException.type">
            <el-radio value="missing">缺件</el-radio>
            <el-radio value="contamination">污染</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="newException.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item v-if="newException.type === 'missing'" label="缺失物品">
          <el-input v-model="newException.missing_items" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="createException">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResolveDialog" title="处理异常" width="500px">
      <div v-if="currentException">
        <el-descriptions :column="1" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="包号">{{ currentException.package_no }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentException.type === 'missing' ? '缺件' : '污染' }}</el-descriptions-item>
          <el-descriptions-item label="问题描述">{{ currentException.description }}</el-descriptions-item>
        </el-descriptions>
        <el-form label-width="100px">
          <el-form-item label="处理方案">
            <el-input v-model="resolution" type="textarea" :rows="3" placeholder="请描述处理方式" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" @click="resolveException">确认解决</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { exceptionAPI } from '../api'

const exceptions = ref([])
const showCreate = ref(false)
const showResolveDialog = ref(false)
const currentException = ref(null)
const resolution = ref('')

const filters = ref({
  status: '',
  type: ''
})

const newException = ref({
  package_no: '',
  type: 'missing',
  description: '',
  missing_items: ''
})

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决'
}

const statusTagType = {
  pending: 'warning',
  processing: 'primary',
  resolved: 'success'
}

const hasMissingItems = computed(() => {
  return exceptions.value.some(e => e.missing_items)
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadExceptions = async () => {
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.type) params.type = filters.value.type
    
    const res = await exceptionAPI.getList(params)
    exceptions.value = res.data
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const resetFilters = () => {
  filters.value = { status: '', type: '' }
  loadExceptions()
}

const createException = async () => {
  if (!newException.value.package_no || !newException.value.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await exceptionAPI.create(newException.value)
    ElMessage.success('已提交')
    showCreate.value = false
    newException.value = { package_no: '', type: 'missing', description: '', missing_items: '' }
    loadExceptions()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '提交失败')
  }
}

const showResolve = (row) => {
  currentException.value = row
  resolution.value = ''
  showResolveDialog.value = true
}

const showDetail = (row) => {
  currentException.value = row
  resolution.value = row.resolution || ''
  showResolveDialog.value = true
}

const resolveException = async () => {
  if (!resolution.value) {
    ElMessage.warning('请填写处理方案')
    return
  }
  
  try {
    await exceptionAPI.resolve(currentException.value.id, resolution.value)
    ElMessage.success('已解决')
    showResolveDialog.value = false
    loadExceptions()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadExceptions()
})
</script>
