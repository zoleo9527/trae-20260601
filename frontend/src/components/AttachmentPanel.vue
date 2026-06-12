<template>
  <div class="attachment-panel">
    <div class="panel-header">
      <span>附件管理</span>
      <el-button size="small" type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        添加占位
      </el-button>
    </div>
    <div v-loading="loading" class="panel-content">
      <el-empty v-if="!loading && attachments.length === 0" description="暂无附件" />
      <div v-else class="attachment-list">
        <div
          v-for="item in attachments"
          :key="item.id"
          class="attachment-item"
        >
          <div class="item-icon">
            <el-icon :size="32" :color="getFileIconColor(item.file_name)">
              <component :is="getFileIcon(item.file_name)" />
            </el-icon>
          </div>
          <div class="item-info">
            <div class="item-name" :title="item.file_name">{{ item.file_name }}</div>
            <div class="item-meta">
              <el-tag v-if="item.storage_type === 'placeholder'" size="small" type="info">
                占位
              </el-tag>
              <span v-if="item.file_size">{{ formatFileSize(item.file_size) }}</span>
              <span v-if="item.uploaded_by">上传者：{{ item.uploaded_by }}</span>
            </div>
            <div v-if="item.remarks" class="item-remarks">{{ item.remarks }}</div>
          </div>
          <div class="item-actions">
            <el-button
              size="small"
              text
              type="danger"
              @click="handleDelete(item)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="addDialogVisible" title="添加附件占位" width="480px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="文件名">
          <el-input v-model="addForm.file_name" placeholder="请输入文件名" />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-input v-model="addForm.file_type" placeholder="如：application/pdf" />
        </el-form-item>
        <el-form-item label="文件大小">
          <el-input-number
            v-model="addForm.file_size"
            :min="0"
            placeholder="字节数"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="addForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="附件说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">
          确认添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Picture, Video, Files } from '@element-plus/icons-vue'
import { attachmentApi } from '@/utils/api'

const props = defineProps({
  propertyId: { type: Number, default: null },
  viewingId: { type: Number, default: null },
  exceptionId: { type: Number, default: null }
})

const emit = defineEmits(['changed'])

const loading = ref(false)
const adding = ref(false)
const attachments = ref([])
const addDialogVisible = ref(false)

const addForm = reactive({
  file_name: '',
  file_type: '',
  file_size: null,
  remarks: ''
})

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return Picture
  if (['mp4', 'avi', 'mov'].includes(ext)) return Video
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) return Document
  return Files
}

function getFileIconColor(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '#e6a23c'
  if (['mp4', 'avi', 'mov'].includes(ext)) return '#f56c6c'
  if (['pdf', 'doc', 'docx'].includes(ext)) return '#409eff'
  if (['xls', 'xlsx'].includes(ext)) return '#67c23a'
  return '#909399'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function loadAttachments() {
  if (!props.propertyId && !props.viewingId && !props.exceptionId) return
  loading.value = true
  try {
    const params = { page_size: 100 }
    if (props.propertyId) params.property_id = props.propertyId
    if (props.viewingId) params.viewing_id = props.viewingId
    if (props.exceptionId) params.exception_id = props.exceptionId
    const data = await attachmentApi.getList(params)
    attachments.value = data.items || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  addForm.file_name = ''
  addForm.file_type = ''
  addForm.file_size = null
  addForm.remarks = ''
  addDialogVisible.value = true
}

async function handleAdd() {
  if (!addForm.file_name) {
    ElMessage.warning('请输入文件名')
    return
  }
  adding.value = true
  try {
    const submitData = { ...addForm }
    if (props.propertyId) submitData.property_id = props.propertyId
    if (props.viewingId) submitData.viewing_id = props.viewingId
    if (props.exceptionId) submitData.exception_id = props.exceptionId
    await attachmentApi.create(submitData)
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    await loadAttachments()
    emit('changed')
  } catch (e) {
    console.error(e)
  } finally {
    adding.value = false
  }
}

async function handleDelete(item) {
  await ElMessageBox.confirm(`确定删除附件"${item.file_name}"吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
  try {
    await attachmentApi.delete(item.id)
    ElMessage.success('删除成功')
    await loadAttachments()
    emit('changed')
  } catch (e) {
    console.error(e)
  }
}

watch(() => [props.propertyId, props.viewingId, props.exceptionId], () => {
  loadAttachments()
}, { immediate: true })

defineExpose({ loadAttachments })
</script>

<style scoped>
.attachment-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.item-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.item-remarks {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.item-actions {
  flex-shrink: 0;
}
</style>
