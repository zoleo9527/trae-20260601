<script setup lang="ts">
import { ref } from 'vue'
import { receptionApi } from '@/api'

const emit = defineEmits<{
  close: []
  success: []
}>()

const form = ref({
  group_name: '',
  contact_person: '',
  contact_phone: '',
  people_count: 0,
  scheduled_date: new Date().toISOString().split('T')[0],
  scheduled_time: '',
  source: '',
  remark: ''
})

const submitting = ref(false)

async function handleSubmit() {
  if (!form.value.group_name) {
    alert('请输入团体名称')
    return
  }
  if (!form.value.scheduled_date) {
    alert('请选择预约日期')
    return
  }

  submitting.value = true
  try {
    await receptionApi.create(form.value)
    emit('success')
  } catch (e: any) {
    alert('创建失败：' + (e.error || e.message))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">新建接待</span>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="form-item">
          <label class="form-label">团体名称 *</label>
          <input
            v-model="form.group_name"
            type="text"
            class="form-input"
            placeholder="请输入团体名称"
          />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-item">
            <label class="form-label">联系人</label>
            <input v-model="form.contact_person" type="text" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">联系电话</label>
            <input v-model="form.contact_phone" type="text" class="form-input" />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-item">
            <label class="form-label">人数</label>
            <input v-model.number="form.people_count" type="number" min="0" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">来源</label>
            <select v-model="form.source" class="form-select">
              <option value="">请选择</option>
              <option value="电话预约">电话预约</option>
              <option value="线上平台">线上平台</option>
              <option value="旅行社">旅行社</option>
              <option value="企业合作">企业合作</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-item">
            <label class="form-label">预约日期 *</label>
            <input v-model="form.scheduled_date" type="date" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">预约时间</label>
            <input v-model="form.scheduled_time" type="time" class="form-input" />
          </div>
        </div>
        <div class="form-item">
          <label class="form-label">备注</label>
          <textarea v-model="form.remark" class="form-textarea" placeholder="特殊要求、注意事项等"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
          {{ submitting ? '提交中...' : '创建接待单' }}
        </button>
      </div>
    </div>
  </div>
</template>
