<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Save, Package } from 'lucide-vue-next'
import { gasApi } from '@/api/gas'

const router = useRouter()

const form = ref({
  customer_id: '',
  customer_name: '',
  customer_phone: '',
  address: '',
  technician: '',
  change_date: new Date().toISOString().split('T')[0],
  old_meter_number: '',
  new_meter_number: '',
  meter_type: '',
  old_meter_reading: '',
  new_meter_reading: '',
  remark: ''
})

const hasError = computed(() => {
  return !form.value.customer_name || !form.value.address || !form.value.technician ||
         !form.value.old_meter_number || !form.value.new_meter_number || !form.value.meter_type
})

const handleSubmit = async () => {
  if (hasError.value) return
  
  try {
    await gasApi.createMeterChange(form.value)
    router.push('/gas/meter-changes')
  } catch (err) {
    console.error('创建换表记录失败:', err)
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
      <h1 class="text-xl font-semibold text-slate-900">新建换表记录</h1>
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
          <div class="flex items-center gap-2 mb-6">
            <Package class="w-5 h-5 text-purple-500" />
            <h3 class="text-lg font-semibold text-slate-900">换表信息</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h4 class="text-sm font-medium text-red-700 p-3 bg-red-50 rounded-lg">原表信息</h4>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">表号 *</label>
                <input
                  v-model="form.old_meter_number"
                  type="text"
                  placeholder="请输入原表表号"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">读数</label>
                <input
                  v-model="form.old_meter_reading"
                  type="number"
                  placeholder="请输入原表读数"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="text-sm font-medium text-green-700 p-3 bg-green-50 rounded-lg">新表信息</h4>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">表号 *</label>
                <input
                  v-model="form.new_meter_number"
                  type="text"
                  placeholder="请输入新表表号"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">读数</label>
                <input
                  v-model="form.new_meter_reading"
                  type="number"
                  placeholder="请输入新表读数"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">表型 *</label>
            <input
              v-model="form.meter_type"
              type="text"
              placeholder="请输入燃气表型号"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
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
              <label class="block text-sm font-medium text-slate-700 mb-1">维修师傅 *</label>
              <input
                v-model="form.technician"
                type="text"
                placeholder="请输入维修师傅姓名"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">换表日期</label>
              <input
                v-model="form.change_date"
                type="date"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
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
