<template>
  <div class="status-timeline-wrapper">
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in sortedHistory"
        :key="index"
        :timestamp="formatTime(item.timestamp)"
        :type="getTimelineType(item.status)"
        :icon="getTimelineIcon(item.status)"
      >
        <div class="timeline-content">
          <div class="timeline-header">
            <el-tag :type="getStatusType(item.status)" size="small">
              {{ getStatusLabel(item.status) }}
            </el-tag>
            <span class="operator">
              <el-icon><User /></el-icon>
              {{ item.operator }}
              <span class="role-badge">({{ getRoleLabel(item.operatorRole) }})</span>
            </span>
          </div>
          <p class="timeline-remark">{{ item.remark }}</p>
          <div v-if="item.attachments && item.attachments.length > 0" class="timeline-attachments">
            <div
              v-for="(att, attIndex) in item.attachments"
              :key="attIndex"
              class="attachment-item"
              @click="handleAttachmentClick(att)"
              :class="{ clickable: att.url }"
            >
              <el-icon v-if="att.type === 'image'"><Picture /></el-icon>
              <el-icon v-else-if="att.type === 'signature'"><Edit /></el-icon>
              <el-icon v-else-if="att.type === 'receipt'"><Money /></el-icon>
              <el-icon v-else-if="att.type === 'repair'"><Tools /></el-icon>
              <el-icon v-else><Paperclip /></el-icon>
              <span>{{ att.name }}</span>
              <el-icon v-if="att.url" class="preview-icon"><View /></el-icon>
            </div>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>

    <el-dialog
      v-model="attachmentDialogVisible"
      :title="currentAttachment?.name || '附件预览'"
      width="560px"
    >
      <div class="attachment-preview-container">
        <img
          v-if="isImageType(currentAttachment)"
          :src="getAttachmentUrl(currentAttachment)"
          :alt="currentAttachment?.name"
          class="attachment-preview-img"
        />
        <div v-else class="attachment-placeholder">
          <el-icon :size="80"><Document /></el-icon>
          <p>该附件类型暂不支持预览</p>
          <el-button type="primary" size="small" @click="downloadAttachment">
            下载附件
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="attachmentDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { STATUS_LABELS, STATUS_FLOW } from '@/data/mockData'

const props = defineProps({
  history: {
    type: Array,
    required: true
  }
})

const sortedHistory = computed(() => {
  return [...props.history].sort((a, b) => a.timestamp - b.timestamp)
})

const attachmentDialogVisible = ref(false)
const currentAttachment = ref(null)

const handleAttachmentClick = (att) => {
  if (att.url) {
    currentAttachment.value = att
    attachmentDialogVisible.value = true
  }
}

const isImageType = (att) => {
  if (!att) return false
  return ['image', 'signature', 'receipt', 'repair'].includes(att.type)
}

const getAttachmentUrl = (att) => {
  if (!att?.url) return ''
  if (att.url.startsWith('#') || att.url.startsWith('mock-')) {
    return `https://picsum.photos/400/300?random=${att.url}`
  }
  return att.url
}

const downloadAttachment = () => {
  // 模拟下载
  console.log('Download:', currentAttachment.value)
}

const getStatusLabel = (status) => {
  return STATUS_LABELS[status]?.label || status
}

const getStatusType = (status) => {
  return STATUS_LABELS[status]?.type || 'info'
}

const getTimelineType = (status) => {
  const typeMap = {
    [STATUS_FLOW.PENDING_OUTBOUND]: 'info',
    [STATUS_FLOW.OUTBOUND_INSPECTING]: 'warning',
    [STATUS_FLOW.OUTBOUND_COMPLETED]: 'success',
    [STATUS_FLOW.RENTING]: 'primary',
    [STATUS_FLOW.PENDING_RETURN]: 'info',
    [STATUS_FLOW.RETURN_INSPECTING]: 'warning',
    [STATUS_FLOW.RETURN_COMPLETED]: 'success',
    [STATUS_FLOW.ABNORMAL]: 'danger',
    [STATUS_FLOW.IN_REPAIR]: 'warning',
    [STATUS_FLOW.CLOSED]: 'success'
  }
  return typeMap[status] || 'info'
}

const getTimelineIcon = (status) => {
  if (status === STATUS_FLOW.ABNORMAL) return 'Warning'
  if (status === STATUS_FLOW.CLOSED) return 'Check'
  if (status === STATUS_FLOW.IN_REPAIR) return 'Tools'
  return null
}

const getRoleLabel = (role) => {
  const roleMap = {
    system: '系统',
    frontline: '一线',
    manager: '经理',
    customer: '客户',
    admin: '管理员'
  }
  return roleMap[role] || role
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.status-timeline-wrapper {
  padding: 10px 0;
}

.timeline-content {
  padding-bottom: 10px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.operator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 13px;
}

.operator .el-icon {
  font-size: 14px;
}

.role-badge {
  color: #9ca3af;
  font-size: 12px;
}

.timeline-remark {
  color: #374151;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.timeline-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  transition: all 0.2s;
}

.attachment-item.clickable {
  cursor: pointer;
}

.attachment-item.clickable:hover {
  background: #e0e7ff;
  color: #4f46e5;
}

.attachment-item .el-icon {
  font-size: 12px;
  color: #60a5fa;
}

.preview-icon {
  margin-left: 4px;
  font-size: 11px !important;
  opacity: 0.7;
}

.attachment-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background: #f9fafb;
  border-radius: 8px;
}

.attachment-preview-img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.attachment-placeholder {
  text-align: center;
  color: #9ca3af;
}

.attachment-placeholder .el-icon {
  margin-bottom: 12px;
  color: #d1d5db;
}

.attachment-placeholder p {
  margin: 0 0 16px 0;
}
</style>
