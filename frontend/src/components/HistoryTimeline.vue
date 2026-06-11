<template>
  <el-timeline class="history-timeline">
    <el-timeline-item
      v-for="record in records"
      :key="record.id"
      :timestamp="formatTime(record.created_at)"
      placement="top"
      :type="getActionType(record.action)"
    >
      <el-card shadow="never" class="history-card">
        <div class="history-action">{{ record.action }}</div>
        <div class="history-operator">操作人：{{ record.operator_name }}</div>
        <div class="history-remark" v-if="record.remark">
          <el-icon><ChatLineSquare /></el-icon>
          {{ record.remark }}
        </div>
      </el-card>
    </el-timeline-item>
    <el-timeline-item v-if="records.length === 0">
      <div class="empty-history">暂无历史记录</div>
    </el-timeline-item>
  </el-timeline>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

defineProps<{
  records: any[]
}>()

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function getActionType(action: string) {
  if (action.includes('通过') || action.includes('已解决')) return 'success'
  if (action.includes('驳回') || action.includes('拒绝')) return 'danger'
  if (action.includes('补录') || action.includes('重新上传') || action.includes('要求')) return 'warning'
  if (action.includes('处理') || action.includes('开始')) return 'primary'
  return 'info'
}
</script>

<style scoped lang="scss">
.history-card {
  :deep(.el-card__body) {
    padding: 10px 14px;
  }
}

.history-action {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.history-operator {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.history-remark {
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 4px;

  .el-icon {
    margin-top: 2px;
    flex-shrink: 0;
  }
}

.empty-history {
  color: #909399;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}
</style>
