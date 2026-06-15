<template>
  <div class="log-list">
    <div class="header-bar">
      <h3>操作日志</h3>
    </div>
    
    <el-table :data="logs" border>
      <el-table-column prop="id" label="日志编号" width="100" />
      <el-table-column prop="operation_type" label="操作类型" width="120">
        <template #default="scope">
          <el-tag :type="getOperationType(scope.row.operation_type)">{{ scope.row.operation_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target_type" label="操作对象" width="100" />
      <el-table-column prop="target_id" label="对象编号" width="100" />
      <el-table-column prop="operator" label="操作人" width="100" />
      <el-table-column prop="content" label="操作内容" min-width="300" />
      <el-table-column prop="created_at" label="操作时间" width="180" />
    </el-table>
    
    <div v-if="logs.length === 0" class="empty-state">
      <el-empty description="暂无操作日志" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const logs = ref([])

const getOperationType = (type) => {
  const types = {
    '创建量尺': 'success',
    '修改量尺': 'primary',
    '驳回量尺': 'danger',
    '重新提交量尺': 'warning',
    '创建报价': 'success',
    '确认报价': 'success',
    '驳回报价': 'danger',
    '补充材料': 'warning',
    '完成安装': 'success'
  }
  return types[type] || 'default'
}

const loadLogs = async () => {
  try {
    const response = await axios.get('/api/logs')
    logs.value = response.data
  } catch (error) {
    console.error('加载日志失败:', error)
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.log-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-bar h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.empty-state {
  padding: 40px;
  text-align: center;
}
</style>
