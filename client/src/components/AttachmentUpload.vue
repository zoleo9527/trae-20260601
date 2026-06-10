<script setup lang="ts">
import { ref } from 'vue'
import { attachmentApi } from '@/api'
import { formatFileSize } from '@/utils/constants'

const props = defineProps<{
  bizType: string
  bizId: number
}>()

const emit = defineEmits<{
  uploaded: []
  deleted: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const showPlaceholderModal = ref(false)
const placeholderForm = ref({
  file_name: '',
  file_type: '',
  file_size: 0
})

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('biz_type', props.bizType)
    formData.append('biz_id', String(props.bizId))

    await attachmentApi.upload(formData)
    emit('uploaded')
  } catch (e: any) {
    alert('上传失败：' + (e.error || e.message))
  } finally {
    uploading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function openPlaceholderModal() {
  placeholderForm.value = {
    file_name: '',
    file_type: '',
    file_size: 0
  }
  showPlaceholderModal.value = true
}

async function addPlaceholder() {
  if (!placeholderForm.value.file_name) {
    alert('请输入文件名')
    return
  }
  try {
    await attachmentApi.placeholder({
      biz_type: props.bizType,
      biz_id: props.bizId,
      ...placeholderForm.value
    })
    showPlaceholderModal.value = false
    emit('uploaded')
  } catch (e: any) {
    alert('添加失败：' + (e.error || e.message))
  }
}

function triggerUpload() {
  fileInput.value?.click()
}
</script>

<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <button class="btn btn-primary btn-sm" @click="triggerUpload" :disabled="uploading">
      {{ uploading ? '上传中...' : '📎 上传附件' }}
    </button>
    <button class="btn btn-sm" @click="openPlaceholderModal">
      📄 添加附件占位
    </button>
    <input
      ref="fileInput"
      type="file"
      style="display: none;"
      @change="handleFileChange"
    />
  </div>

  <div v-if="showPlaceholderModal" class="modal-mask" @click.self="showPlaceholderModal = false">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">添加附件占位</span>
        <button class="modal-close" @click="showPlaceholderModal = false">×</button>
      </div>
      <div class="modal-body">
        <div class="form-item">
          <label class="form-label">文件名 *</label>
          <input
            v-model="placeholderForm.file_name"
            type="text"
            class="form-input"
            placeholder="例如：现场记录照片.jpg"
          />
        </div>
        <div class="form-item">
          <label class="form-label">文件类型</label>
          <select v-model="placeholderForm.file_type" class="form-select">
            <option value="">请选择</option>
            <option value="image">图片</option>
            <option value="pdf">PDF文档</option>
            <option value="excel">Excel表格</option>
            <option value="word">Word文档</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">文件大小（KB）</label>
          <input
            v-model.number="placeholderForm.file_size"
            type="number"
            class="form-input"
            placeholder="预估文件大小"
          />
        </div>
        <div style="font-size: 12px; color: #999; margin-top: -8px;">
          附件占位用于标记"应有但暂未上传"的文件，方便后续补传留痕
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="showPlaceholderModal = false">取消</button>
        <button class="btn btn-primary" @click="addPlaceholder">确认添加</button>
      </div>
    </div>
  </div>
</template>
