<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, X, Save } from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { SafetyCheckItem } from '@/types/gas'

const router = useRouter()

const form = ref({
  customer_id: '',
  customer_name: '',
  customer_phone: '',
  address: '',
  inspector: '',
  check_date: new Date().toISOString().split('T')[0],
  remark: ''
})

const items = ref<SafetyCheckItem[]>([
  { id: '1', item_name: '燃气表外观检查', standard: '完好无损', actual: '', passed: true, remark: '' },
  { id: '2', item_name: '燃气表读数核对', standard: '准确无误', actual: '', passed: true, remark: '' },
  { id: '3', item_name: '管道泄漏检测', standard: '无泄漏', actual: '', passed: true, remark: '' },
  { id: '4', item_name: '阀门开关检查', standard: '灵活正常', actual: '', passed: true, remark: '' },
  { id: '5', item_name: '软管老化检查', standard: '无老化裂纹', actual: '', passed: true, remark: '' },
  { id: '6', item_name: '报警器功能测试', standard: '正常报警', actual: '', passed: true, remark: '' }
])

const hasError = computed(() => {
  return !form.value.customer_name || !form.value.address || !form.value.inspector
})

const overallResult = computed(() => {
  return items.value.every(item => item.passed) ? 'passed' : 'failed'
})

const addItem = () => {
  const newId = String(parseInt(items.value[items.value.length - 1]?.id || '0') + 1)
  items.value.push({
    id: newId,
    item_name: '',
    standard: '',
    actual: '',
    passed: true,
    remark: ''
  })
}

const removeItem = (id: string) => {
  items.value = items.value.filter(item => item.id !== id)
}

const togglePassed = (id: string) => {
  const item = items.value.find(i => i.id === id)
  if (item) {
    item.passed = !item.passed
  }
}

const handleSubmit = async () => {
  if (hasError.value) return
  
  try {
    await gasApi.createSafetyCheck({
      ...form.value,
      items: items.value,
      overall_result: overallResult.value
    })
    router.push('/gas/safety-checks')
  } catch (err) {
    console.error('创建安检记录失败:', err)
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
      <h1 class="text-xl font-semibold text-slate-900">新建安检记录</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">客户信息</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">客户名称 *</label>
              <input
                v-model="form.customer_name"
                type="text"
                placeholder="请输入客户名称"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
              <input
                v-model="form.customer_phone"
                type="tel"
                placeholder="请输入联系电话"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">地址 *</label>
              <input
                v-model="form.address"
                type="text"
                placeholder="请输入详细地址"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900">检查项目</h3>
            <button
              @click="addItem"
              class="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Plus class="w-4 h-4" />
              添加项目
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="item in items"
              :key="item.id"
              class="p-4 border border-slate-200 rounded-lg"
            >
              <div class="flex items-center justify-between mb-3">
                <input
                  v-model="item.item_name"
                  type="text"
                  placeholder="检查项目名称"
                  class="flex-1 px-3 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div class="flex items-center gap-2">
                  <button
                    @click="togglePassed(item.id)"
                    :class="[
                      'px-3 py-1 text-sm rounded-full transition-colors',
                      item.passed 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    ]"
                  >
                    {{ item.passed ? '合格' : '不合格' }}
                  </button>
                  <button
                    @click="removeItem(item.id)"
                    class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-slate-500 mb-1">标准值</label>
                  <input
                    v-model="item.standard"
                    type="text"
                    placeholder="标准值"
                    class="w-full px-3 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1">实测值</label>
                  <input
                    v-model="item.actual"
                    type="text"
                    placeholder="实测值"
                    class="w-full px-3 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div v-if="!item.passed" class="mt-2">
                <label class="block text-xs text-slate-500 mb-1">不合格原因</label>
                <input
                  v-model="item.remark"
                  type="text"
                  placeholder="请说明不合格原因"
                  class="w-full px-3 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">备注</h3>
          <textarea
            v-model="form.remark"
            rows="3"
            placeholder="请输入备注信息"
            class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">基本信息</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">安检员 *</label>
              <input
                v-model="form.inspector"
                type="text"
                placeholder="请输入安检员姓名"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">检查日期</label>
              <input
                v-model="form.check_date"
                type="date"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">检查结果</h3>
          <div :class="[
            'px-4 py-3 rounded-lg text-center',
            overallResult === 'passed' ? 'bg-green-50' : 'bg-red-50'
          ]">
            <span :class="[
              'text-lg font-semibold',
              overallResult === 'passed' ? 'text-green-700' : 'text-red-700'
            ]">
              {{ overallResult === 'passed' ? '通过' : '未通过' }}
            </span>
            <p class="text-sm text-slate-500 mt-1">
              {{ items.filter(i => i.passed).length }}/{{ items.length }} 项目合格
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="router.back()"
            class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSubmit"
            :disabled="hasError"
            :class="[
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
              hasError 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-purple-500 text-white hover:bg-purple-600'
            ]"
          >
            <Save class="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
