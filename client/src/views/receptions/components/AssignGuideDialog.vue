<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi, receptionApi } from '@/api'
import type { User } from '@/types'

const props = defineProps<{
  receptionId: number
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const guides = ref<User[]>([])
const form = ref({
  guide_id: 0,
  picking_area: '',
  remark: ''
})
const submitting = ref(false)

async function loadGuides() {
  try {
    const data = await userApi.getGuides()
    guides.value = data
    if (data.length > 0) {
      form.value.guide_id = data[0].id
    }
  } catch (e) {
    console.error('加载向导列表失败:', e)
  }
}

async function handleSubmit() {
  if (!form.value.guide_id) {
    alert('请选择向导')
    return
  }
  submitting.value = true
  try {
    await receptionApi.assignGuide(props.receptionId, form.value)
    emit('success')
  } catch (e: any) {
    alert('分配失败：' + (e.error || e.message))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadGuides()
})
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">分配向导</span>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="form-item">
          <label class="form-label">选择向导 *</label>
          <select v-model="form.guide_id" class="form-select">
            <option :value="0">请选择向导</option>
            <option v-for="g in guides" :key="g.id" :value="g.id">
              {{ g.name }} ({{ g.phone || '无电话' }})
            </option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">采摘区域</label>
          <input
            v-model="form.picking_area"
            type="text"
            class="form-input"
            placeholder="例如：A区草莓园"
          />
        </div>
        <div class="form-item">
          <label class="form-label">备注</label>
          <textarea v-model="form.remark" class="form-textarea" placeholder="特殊要求等"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
          {{ submitting ? '提交中...' : '确认分配' }}
        </button>
      </div>
    </div>
  </div>
</template>
