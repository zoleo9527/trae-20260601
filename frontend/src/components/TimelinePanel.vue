<template>
  <div class="timeline-panel">
    <div class="timeline-header">
      <el-icon><Clock /></el-icon>
      <span>操作追溯</span>
    </div>
    <div v-loading="loading" class="timeline-content">
      <el-empty v-if="!loading && timeline.length === 0" description="暂无操作记录" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="(item, index) in timeline"
          :key="item.id"
          :timestamp="formatTime(item.created_at)"
          placement="top"
          :type="getTimelineType(item.operation_type)"
        >
          <div class="timeline-item">
            <div class="timeline-title">
              <span class="operation-type">{{ getOperationText(item.operation_type) }}</span>
              <span class="operator" v-if="item.operator_name">
                <el-icon><User /></el-icon>
                {{ item.operator_name }}
              </span>
            </div>
            <div v-if="item.remarks" class="timeline-remarks">
              {{ item.remarks }}
            </div>
            <div v-if="item.old_value" class="timeline-detail">
              <div class="detail-row">
                <span class="label">变更前：</span>
                <span class="value old">{{ item.old_value }}</span>
              </div>
              <div v-if="item.new_value" class="detail-row">
                <span class="label">变更后：</span>
                <span class="value new">{{ item.new_value }}</span>
              </div>
            </div>
            <div v-else-if="item.new_value" class="timeline-detail">
              <span class="value">{{ item.new_value }}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Clock, User } from '@element-plus/icons-vue'
import { propertyApi, viewingApi, exceptionApi } from '@/utils/api'

const props = defineProps({
  targetType: {
    type: String,
    required: true
  },
  targetId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['loaded'])

const loading = ref(false)
const timeline = ref([])

const operationTypeMap = {
  create: '创建',
  update: '更新',
  vacancy_update: '空置处理',
  status_update: '状态变更',
  add_attachment: '添加附件',
  upload_attachment: '上传附件',
  delete_attachment: '删除附件'
}

function getOperationText(type) {
  return operationTypeMap[type] || type
}

function getTimelineType(type) {
  if (type === 'create') return 'primary'
  if (type === 'vacancy_update' || type === 'status_update') return 'warning'
  if (type.includes('attachment')) return 'info'
  return ''
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

async function loadTimeline() {
  if (!props.targetId) return
  loading.value = true
  try {
    let data
    if (props.targetType === 'property') {
      data = await propertyApi.getTimeline(props.targetId)
    } else if (props.targetType === 'viewing') {
      data = await viewingApi.getTimeline(props.targetId)
    } else if (props.targetType === 'exception') {
      data = await exceptionApi.getTimeline(props.targetId)
    }
    timeline.value = data || []
    emit('loaded', timeline.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(() => [props.targetType, props.targetId], () => {
  loadTimeline()
}, { immediate: true })

defineExpose({ loadTimeline })
</script>

<style scoped>
.timeline-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  font-weight: 600;
  font-size: 15px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.timeline-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.timeline-item {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.timeline-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.operation-type {
  font-weight: 600;
  color: #303133;
}

.operator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.timeline-remarks {
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.timeline-detail {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.detail-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #909399;
  flex-shrink: 0;
}

.value {
  color: #606266;
  word-break: break-all;
  line-height: 1.5;
}

.value.old {
  color: #f56c6c;
  text-decoration: line-through;
}

.value.new {
  color: #67c23a;
}
</style>
