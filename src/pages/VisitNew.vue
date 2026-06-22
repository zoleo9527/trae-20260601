<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  MessageSquare
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'

const router = useRouter()

const form = ref({
  customer_name: '',
  customer_phone: '',
  address: '',
  customer_id: '',
  visit_type: 'pre_visit' as 'pre_visit' | 'post_visit' | 'follow_up',
  purpose: '',
  visitor: '',
  visitor_role: 'customer_service' as 'safety_inspector' | 'customer_service' | 'repair_technician',
  scheduled_date: '',
  application_id: ''
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const typeOptions = [
  { value: 'pre_visit', label: '事前回访' },
  { value: 'post_visit', label: '事后回访' },
  { value: 'follow_up', label: '跟踪回访' }
]

const roleOptions = [
  { value: 'customer_service', label: '客服' },
  { value: 'safety_inspector', label: '安检员' },
  { value: 'repair_technician', label: '维修师傅' }
]

const validate = () => {
  errors.value = {}
  
  if (!form.value.customer_name.trim()) {
    errors.value.customer_name = '请输入客户名称'
  }
  
  if (!form.value.customer_phone.trim()) {
    errors.value.customer_phone = '请输入联系电话'
  } else if (!/^1[3-9]\d{9}$/.test(form.value.customer_phone)) {
    errors.value.customer_phone = '请输入正确的手机号码'
  }
  
  if (!form.value.address.trim()) {
    errors.value.address = '请输入地址'
  }
  
  if (!form.value.purpose.trim()) {
    errors.value.purpose = '请输入回访目的'
  }
  
  if (!form.value.scheduled_date) {
    errors.value.scheduled_date = '请选择回访日期'
  }
  
  if (!form.value.visitor.trim()) {
    errors.value.visitor = '请输入回访人'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return
  
  submitting.value = true
  
  try {
    const payload = {
      ...form.value,
      customer_id: `c${Date.now()}`,
      visitor_role: form.value.visitor_role as any
    }
    
    const res = await gasApi.createVisit(payload)
    
    if (res.success) {
      router.push('/gas/visits')
    } else {
      alert(res.error || '创建失败')
    }
  } catch (err) {
    console.error('创建回访失败:', err)
    alert('创建失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <button
        @click="router.back()"
        class="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ArrowLeft class="w-5 h-5" />
        返回
      </button>
      <div class="h-6 w-px bg-slate-300"></div>
      <h1 class="text-xl font-semibold text-slate-900">新建客户回访</h1>
    </div>

    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              <span class="flex items-center gap-1">
                <User class="w-4 h-4" />
                客户信息
              </span>
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  v-model="form.customer_name"
                  type="text"
                  placeholder="客户名称"
                  :class="[
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2',
                    errors.customer_name ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'
                  ]"
                />
                <p v-if="errors.customer_name" class="mt-1 text-sm text-red-600">{{ errors.customer_name }}</p>
              </div>
              <div>
                <input
                  v-model="form.customer_phone"
                  type="tel"
                  placeholder="联系电话"
                  :class="[
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2',
                    errors.customer_phone ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'
                  ]"
                />
                <p v-if="errors.customer_phone" class="mt-1 text-sm text-red-600">{{ errors.customer_phone }}</p>
              </div>
            </div>
            <div class="mt-4">
              <input
                v-model="form.address"
                type="text"
                placeholder="详细地址"
                :class="[
                  'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2',
                  errors.address ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'
                ]"
              />
              <p v-if="errors.address" class="mt-1 text-sm text-red-600">{{ errors.address }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              <span class="flex items-center gap-1">
                <MessageSquare class="w-4 h-4" />
                回访类型
              </span>
            </label>
            <div class="grid grid-cols-3 gap-3">
              <label
                v-for="option in typeOptions"
                :key="option.value"
                :class="[
                  'flex items-center justify-center py-3 rounded-lg border cursor-pointer transition-colors',
                  form.visit_type === option.value
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 hover:border-slate-300'
                ]"
              >
                <input
                  v-model="form.visit_type"
                  :value="option.value"
                  type="radio"
                  class="sr-only"
                />
                <span class="text-sm font-medium">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              <span class="flex items-center gap-1">
                <Calendar class="w-4 h-4" />
                回访日期
              </span>
            </label>
            <input
              v-model="form.scheduled_date"
              type="date"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2',
                errors.scheduled_date ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'
              ]"
            />
            <p v-if="errors.scheduled_date" class="mt-1 text-sm text-red-600">{{ errors.scheduled_date }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              <span class="flex items-center gap-1">
                <FileText class="w-4 h-4" />
                回访目的
              </span>
            </label>
            <textarea
              v-model="form.purpose"
              rows="3"
              placeholder="请描述回访目的..."
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none',
                errors.purpose ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'
              ]"
            ></textarea>
            <p v-if="errors.purpose" class="mt-1 text-sm text-red-600">{{ errors.purpose }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">回访人信息</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  v-model="form.visitor"
                  type="text"
                  placeholder="回访人姓名"
                  :class="[
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2',
                    errors.visitor ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'
                  ]"
                />
                <p v-if="errors.visitor" class="mt-1 text-sm text-red-600">{{ errors.visitor }}</p>
              </div>
              <div>
                <select
                  v-model="form.visitor_role"
                  :class="[
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2',
                    'border-slate-300 focus:ring-green-500'
                  ]"
                >
                  <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">关联申请（可选）</label>
            <input
              v-model="form.application_id"
              type="text"
              placeholder="输入申请编号（如 ga001）"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="router.back()"
              class="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? '提交中...' : '创建回访' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
