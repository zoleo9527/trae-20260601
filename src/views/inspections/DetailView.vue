<template>
  <div v-if="inspection" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button @click="router.push('/inspections')" class="text-gray-500 hover:text-gray-700">
          ← 返回列表
        </button>
        <h1 class="text-2xl font-bold text-gray-900">巡检详情</h1>
        <StatusBadge type="inspection" :status="inspection.status" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">巡检单号</p>
              <p class="font-medium text-blue-600">{{ inspection.inspectionNo }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">设备编号</p>
              <p class="font-medium">{{ inspection.deviceCode }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">设备名称</p>
              <p class="font-medium">{{ inspection.deviceName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">位置</p>
              <p class="font-medium">{{ inspection.location }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">巡检人</p>
              <p class="font-medium">{{ inspection.inspectorName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">计划日期</p>
              <p class="font-medium">{{ formatDate(inspection.scheduledDate) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">实际日期</p>
              <p class="font-medium">{{ inspection.actualDate ? formatDate(inspection.actualDate) : '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">关联报修</p>
              <p v-if="inspection.relatedRepairId" class="font-medium">
                <router-link :to="`/repairs/${inspection.relatedRepairId}`" class="text-orange-600 hover:underline">
                  🔗 查看报修单
                </router-link>
              </p>
              <p v-else class="text-gray-400">-</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">巡检项目</h2>
            <span v-if="inspection.status === 'completed' || inspection.status === 'abnormal'" 
                  class="text-sm text-gray-500">
              (只读)
            </span>
          </div>
          <div class="space-y-4">
            <div 
              v-for="item in inspection.items" 
              :key="item.id"
              class="border rounded-lg p-4"
              :class="{ 'bg-gray-50': inspection.status === 'completed' || inspection.status === 'abnormal' }"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <p class="font-medium text-gray-900">{{ item.name }}</p>
                    <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{{ item.category }}</span>
                  </div>
                  <p v-if="item.remark" class="text-sm text-gray-500 mt-1">备注: {{ item.remark }}</p>
                </div>
                <div class="ml-4">
                  <template v-if="canEdit">
                    <select 
                      :value="item.result"
                      @change="updateItemResult(item.id, ($event.target as HTMLSelectElement).value as any, item.remark)"
                      class="text-sm border rounded px-2 py-1"
                    >
                      <option value="normal">正常</option>
                      <option value="abnormal">异常</option>
                      <option value="na">不适用</option>
                    </select>
                  </template>
                  <template v-else>
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="itemResultClass(item.result)"
                    >
                      {{ itemResultLabel(item.result) }}
                    </span>
                  </template>
                </div>
              </div>
              <div v-if="canEdit" class="mt-3">
                <input 
                  type="text"
                  :value="item.remark"
                  @change="updateItemResult(item.id, item.result, ($event.target as HTMLInputElement).value)"
                  placeholder="添加备注..."
                  class="w-full text-sm border rounded px-3 py-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">总体备注</h2>
          <template v-if="canEdit">
            <textarea 
              v-model="overallRemark"
              rows="3"
              placeholder="输入总体备注..."
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @blur="saveOverallRemark"
            ></textarea>
          </template>
          <template v-else>
            <p class="text-gray-700">{{ inspection.overallRemark || '无' }}</p>
          </template>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">📊 状态流转轨迹</h2>
          <div class="relative">
            <div v-for="(log, idx) in inspection.statusLogs" :key="log.id" class="flex items-start space-x-4 pb-6 last:pb-0">
              <div class="relative flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                  {{ idx + 1 }}
                </div>
                <div v-if="idx < inspection.statusLogs.length - 1" class="w-0.5 h-full bg-gray-200 absolute top-8"></div>
              </div>
              <div class="flex-1 pb-2">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{{ log.userName }}</span>
                  <span class="text-xs text-gray-400">({{ store.roleLabel(log.userRole) }})</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {{ log.fromStatus ? store.inspectionStatusLabel(log.fromStatus as any) + ' → ' : '' }}
                  <span class="font-medium">{{ store.inspectionStatusLabel(log.toStatus as any) }}</span>
                </p>
                <p v-if="log.remark" class="text-sm text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                  {{ log.remark }}
                </p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDateTime(log.timestamp) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">操作</h2>
          <div class="space-y-3">
            <button 
              v-if="canStartInspection"
              @click="updateStatus('in_progress', '开始巡检')"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始巡检
            </button>
            
            <button 
              v-if="canCompleteInspection"
              @click="showCompleteModal = true"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              完成巡检
            </button>
            
            <button 
              v-if="canCreateRepair"
              @click="showCreateRepairModal = true"
              class="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              创建报修单
            </button>

            <button 
              v-if="canStartRecheck"
              @click="updateStatus('in_progress', '开始复检')"
              class="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              开始复检
            </button>

            <button 
              v-if="canArrangeRecheck"
              @click="showRecheckModal = true"
              class="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              安排复检
            </button>

            <div v-if="!canStartInspection && !canCompleteInspection && !canCreateRepair && !canStartRecheck && !canArrangeRecheck" class="text-center py-4">
              <p class="text-sm text-gray-500">当前角色无可用操作</p>
              <p class="text-xs text-gray-400 mt-1">您当前是 {{ store.roleLabel(store.currentUser.role) }}</p>
            </div>
          </div>
        </div>

        <div v-if="inspection.relatedRepairId && relatedRepair" class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-900 mb-3">🔗 关联报修</h3>
          <div class="space-y-2">
            <p class="text-sm"><span class="text-gray-500">单号:</span> {{ relatedRepair.repairNo }}</p>
            <p class="text-sm"><span class="text-gray-500">状态:</span> 
              <StatusBadge type="repair" :status="relatedRepair.status" />
            </p>
            <p class="text-sm"><span class="text-gray-500">优先级:</span> 
              <PriorityBadge :priority="relatedRepair.priority" />
            </p>
            <router-link 
              :to="`/repairs/${relatedRepair.id}`"
              class="inline-block text-sm text-blue-600 hover:underline mt-2"
            >
              查看详情 →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCompleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">完成巡检</h3>
        <textarea 
          v-model="completeRemark"
          rows="3"
          placeholder="输入完成备注..."
          class="w-full px-3 py-2 border rounded-lg mb-4"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button @click="showCompleteModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-900">取消</button>
          <button 
            @click="confirmComplete"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            确认完成
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRecheckModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">安排复检</h3>
        <textarea 
          v-model="recheckRemark"
          rows="3"
          placeholder="输入复检安排说明..."
          class="w-full px-3 py-2 border rounded-lg mb-4"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button @click="showRecheckModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-900">取消</button>
          <button 
            @click="confirmRecheck"
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            确认安排
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCreateRepairModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">创建报修单</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select v-model="newRepair.priority" class="w-full px-3 py-2 border rounded-lg">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
            <textarea 
              v-model="newRepair.description"
              rows="3"
              placeholder="详细描述异常情况..."
              class="w-full px-3 py-2 border rounded-lg"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showCreateRepairModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-900">取消</button>
          <button 
            @click="confirmCreateRepair"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            创建报修
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12 text-gray-500">
    巡检记录不存在
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGasStationStore } from '@/stores/gasStation'
import type { InspectionStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import PriorityBadge from '@/components/PriorityBadge.vue'

const route = useRoute()
const router = useRouter()
const store = useGasStationStore()

const inspectionId = computed(() => route.params.id as string)
const inspection = computed(() => store.getInspectionById(inspectionId.value))
const relatedRepair = computed(() => {
  if (!inspection.value?.relatedRepairId) return null
  return store.getRepairById(inspection.value.relatedRepairId)
})

const overallRemark = ref('')
const completeRemark = ref('')
const recheckRemark = ref('')
const showCompleteModal = ref(false)
const showRecheckModal = ref(false)
const showCreateRepairModal = ref(false)

const newRepair = ref({
  priority: 'high' as 'low' | 'medium' | 'high' | 'urgent',
  description: ''
})

const canEdit = computed(() => {
  if (!inspection.value) return false
  return store.canEditInspection(inspectionId.value) && ['in_progress', 'recheck'].includes(inspection.value.status)
})

const canStartInspection = computed(() => {
  if (!inspection.value) return false
  return store.canExecuteInspection && inspection.value.status === 'pending'
})

const canCompleteInspection = computed(() => {
  if (!inspection.value) return false
  return store.canExecuteInspection && inspection.value.status === 'in_progress'
})

const canCreateRepair = computed(() => {
  if (!inspection.value) return false
  return store.canSubmitRepair && (inspection.value.status === 'in_progress' || inspection.value.status === 'abnormal') && !inspection.value.relatedRepairId
})

const canStartRecheck = computed(() => {
  if (!inspection.value) return false
  return store.canExecuteInspection && inspection.value.status === 'recheck'
})

const canArrangeRecheck = computed(() => {
  if (!inspection.value) return false
  return store.canReviewInspection && inspection.value.status === 'abnormal'
})

watch(inspection, (val) => {
  if (val) overallRemark.value = val.overallRemark
}, { immediate: true })

const updateStatus = (status: InspectionStatus, remark: string) => {
  store.updateInspectionStatus(inspectionId.value, status, remark)
}

const confirmComplete = () => {
  const hasAbnormal = inspection.value?.items.some(i => i.result === 'abnormal')
  if (hasAbnormal) {
    store.updateInspectionStatus(inspectionId.value, 'abnormal', completeRemark.value || '巡检完成，发现异常')
  } else {
    store.updateInspectionStatus(inspectionId.value, 'completed', completeRemark.value || '巡检完成，一切正常')
  }
  showCompleteModal.value = false
  completeRemark.value = ''
}

const confirmRecheck = () => {
  store.updateInspectionStatus(inspectionId.value, 'recheck', recheckRemark.value || '安排复检')
  showRecheckModal.value = false
  recheckRemark.value = ''
}

const confirmCreateRepair = () => {
  if (newRepair.value.description) {
    const repair = store.createRepairFromInspection(
      inspectionId.value, 
      newRepair.value.priority, 
      newRepair.value.description
    )
    if (repair) {
      store.updateInspectionStatus(inspectionId.value, 'abnormal', `创建报修单 ${repair.repairNo}`)
      router.push(`/repairs/${repair.id}`)
    }
  }
  showCreateRepairModal.value = false
  newRepair.value = { priority: 'high', description: '' }
}

const updateItemResult = (itemId: string, result: 'normal' | 'abnormal' | 'na', remark: string) => {
  store.updateInspectionItem(inspectionId.value, itemId, result, remark)
}

const saveOverallRemark = () => {
  store.updateInspectionRemark(inspectionId.value, overallRemark.value)
}

const itemResultLabel = (result: string) => {
  const map: Record<string, string> = { normal: '正常', abnormal: '异常', na: '不适用' }
  return map[result] || result
}

const itemResultClass = (result: string) => {
  const map: Record<string, string> = {
    normal: 'bg-green-100 text-green-800',
    abnormal: 'bg-red-100 text-red-800',
    na: 'bg-gray-100 text-gray-600'
  }
  return map[result] || ''
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
