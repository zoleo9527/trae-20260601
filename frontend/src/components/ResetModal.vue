<template>
  <el-dialog title="数据重置" :visible="true" width="400px" @close="$emit('close')">
    <div class="warning-content">
      <el-alert title="警告" type="warning" description="此操作将重置所有数据，恢复到初始状态。此操作不可撤销，请谨慎操作！" />
    </div>
    
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="danger" @click="confirmReset">确认重置</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import axios from 'axios'

const emit = defineEmits(['close', 'success'])

const confirmReset = async () => {
  if (!confirm('确定要重置所有数据吗？此操作不可撤销！')) {
    return
  }
  
  try {
    await axios.post('/api/reset')
    alert('数据重置成功')
    emit('success')
    emit('close')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}
</script>

<style scoped>
.warning-content {
  margin-bottom: 20px;
}
</style>
