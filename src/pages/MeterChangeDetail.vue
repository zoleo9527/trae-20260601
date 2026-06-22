<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Wrench,
  CheckCircle,
  FileText,
  Loader,
  Package
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { MeterChange } from '@/types/gas'

const router = useRouter()
const route = useRoute()

const change = ref<MeterChange | null>(null)
const loading = ref(true)

const id = computed(() => route.params.id as string)

async function fetchChange() {
  loading.value = true
  try {
    const res = await gasApi.getMeterChange(id.value)
    if (res.success) {
      change.value = res.data
    }
  } catch (err) {
    console.error('获取换表详情失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchChange()
})
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
      <h1 class="text-xl font-semibold text-slate-900">换表详情</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader class="w-8 h-8 text-purple-500 animate-spin" />
    </div>

    <template v-else-if="change">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-sm font-medium text-slate-500">#{{ change.id }}</span>
                  <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle class="w-3 h-3" />
                    已完成
                  </span>
                </div>
                <h2 class="text-xl font-semibold text-slate-900">{{ change.customer_name }}</h2>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <MapPin class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">{{ change.address }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Calendar class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">换表日期：{{ change.change_date }}</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Wrench class="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span class="text-sm text-slate-700">维修师傅：{{ change.technician }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-6">
              <Package class="w-5 h-5 text-purple-500" />
              <h3 class="text-lg font-semibold text-slate-900">换表信息</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-4 bg-red-50 rounded-xl">
                <h4 class="text-sm font-medium text-red-700 mb-3">原表信息</h4>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">型号</span>
                    <span class="text-slate-700">{{ change.old_meter_model }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">编号</span>
                    <span class="text-slate-700">{{ change.old_meter_serial }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">读数</span>
                    <span class="text-slate-700">{{ change.old_meter_reading }}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-green-50 rounded-xl">
                <h4 class="text-sm font-medium text-green-700 mb-3">新表信息</h4>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">型号</span>
                    <span class="text-slate-700">{{ change.new_meter_model }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">编号</span>
                    <span class="text-slate-700">{{ change.new_meter_serial }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">读数</span>
                    <span class="text-slate-700">{{ change.new_meter_reading }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="change.remark" class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-2 mb-4">
              <FileText class="w-5 h-5 text-slate-500" />
              <h3 class="text-lg font-semibold text-slate-900">备注</h3>
            </div>
            <p class="text-sm text-slate-600">{{ change.remark }}</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">统计信息</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">表号变更</span>
                <span class="text-slate-700">{{ change.old_meter_serial }} → {{ change.new_meter_serial }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">型号变更</span>
                <span class="text-slate-700">{{ change.old_meter_model }} → {{ change.new_meter_model }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">关联信息</h3>
            <div class="space-y-3">
              <div v-if="change.application_id" class="p-3 bg-slate-50 rounded-lg">
                <span class="text-xs text-slate-500">关联停复气申请</span>
                <p class="text-sm text-slate-700">#{{ change.application_id }}</p>
              </div>
              <div v-if="change.safety_check_id" class="p-3 bg-slate-50 rounded-lg">
                <span class="text-xs text-slate-500">关联安检记录</span>
                <p class="text-sm text-slate-700">#{{ change.safety_check_id }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
