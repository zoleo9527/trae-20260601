<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">新建任务</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="type in taskTypes"
              :key="type.value"
              @click="formData.type = type.value"
              :class="[
                'px-4 py-3 border-2 rounded-lg text-center transition-all',
                formData.type === type.value
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <component :is="type.icon" class="w-6 h-6 mx-auto mb-1" />
              <div class="font-medium">{{ type.label }}</div>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">游客姓名 *</label>
            <input
              v-model="formData.touristName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="请输入游客姓名"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
            <input
              v-model="formData.touristPhone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="请输入联系电话"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">票号</label>
            <input
              v-model="formData.ticketNo"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="请输入票号"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">关联票务ID</label>
            <input
              v-model="formData.ticketId"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="关联票务ID"
            />
          </div>
        </div>

        <div v-if="formData.type === 'reschedule'">
          <label class="block text-sm font-medium text-gray-700 mb-1">新日期</label>
          <input
            v-model="formData.newDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div v-if="formData.type === 'complaint'">
          <label class="block text-sm font-medium text-gray-700 mb-1">投诉标题 *</label>
          <input
            v-model="formData.title"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="请输入投诉标题"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ formData.type === 'complaint' ? '投诉描述' : '申请原因' }} *
          </label>
          <textarea
            v-model="formData.reason"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :placeholder="formData.type === 'complaint' ? '请详细描述投诉内容' : '请输入申请原因'"
          ></textarea>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <InformationCircleIcon class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-yellow-800">
              <div class="font-medium mb-1">注意事项</div>
              <ul class="list-disc list-inside space-y-1">
                <li>提交后将自动分配给客服人员处理</li>
                <li>请确保信息填写准确,以便快速处理</li>
                <li>附件上传功能为模拟实现(标注),实际可上传相关证明材料</li>
                <li>提交后系统将自动发送短信通知(模拟实现)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
        <button @click="$emit('close')" class="btn-secondary">
          取消
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting || !isFormValid"
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? '提交中...' : '提交' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  XMarkIcon,
  InformationCircleIcon,
  ArrowUturnLeftIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  close: []
  created: []
}>()

const formData = ref({
  type: 'refund' as 'refund' | 'reschedule' | 'complaint',
  touristName: '',
  touristPhone: '',
  ticketNo: '',
  ticketId: '',
  reason: '',
  title: '',
  newDate: ''
})

const submitting = ref(false)

const taskTypes = [
  { label: '退票申请', value: 'refund', icon: ArrowUturnLeftIcon },
  { label: '改期申请', value: 'reschedule', icon: CalendarIcon },
  { label: '投诉处理', value: 'complaint', icon: ExclamationCircleIcon }
]

const isFormValid = computed(() => {
  if (!formData.value.touristName || !formData.value.touristPhone || !formData.value.reason) {
    return false
  }
  if (formData.value.type === 'complaint' && !formData.value.title) {
    return false
  }
  return true
})

async function handleSubmit() {
  if (!isFormValid.value) return

  submitting.value = true
  try {
    const response = await $fetch('/api/tasks/create', {
      method: 'POST',
      body: formData.value
    })

    if (response.code === 200) {
      alert('任务创建成功')
      emit('created')
    }
  } catch (error) {
    console.error('创建任务失败:', error)
    alert('创建任务失败,请重试')
  } finally {
    submitting.value = false
  }
}
</script>
