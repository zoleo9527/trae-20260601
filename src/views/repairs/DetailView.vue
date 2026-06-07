<template>
  <div v-if="repair" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button @click="router.push('/repairs')" class="text-gray-500 hover:text-gray-700">
          ← 返回列表
        </button>
        <h1 class="text-2xl font-bold text-gray-900">报修详情</h1>
        <StatusBadge type="repair" :status="repair.status" />
        <PriorityBadge :priority="repair.priority" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">报修单号</p>
              <p class="font-medium text-orange-600">{{ repair.repairNo }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">设备编号</p>
              <p class="font-medium">{{ repair.deviceCode }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">设备名称</p>
              <p class="font-medium">{{ repair.deviceName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">位置</p>
              <p class="font-medium">{{ repair.location }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">上报人</p>
              <p class="font-medium">{{ repair.reporterName }} ({{ store.roleLabel(repair.reporterRole) }})</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">上报时间</p>
              <p class="font-medium">{{ formatDateTime(repair.reportedAt) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">处理人</p>
              <p class="font-medium">{{ repair.assigneeName || '未指派' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">关联巡检</p>
              <p v-if="repair.relatedInspectionId" class="font-medium">
                <router-link :to="`/inspections/${repair.relatedInspectionId}`" class="text-blue-600 hover:underline">
                  🔗 查看巡检单
                </router-link>
              </p>
              <p v-else class="text-gray-400">-</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">异常描述</h2>
          <p class="text-gray-700 bg-gray-50 p-4 rounded-lg">{{ repair.abnormalDescription }}</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">维修进度</h2>
            <button 
              v-if="canEditProgress" 
              @click="showEditProgress = !showEditProgress"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              {{ showEditProgress ? '取消' : '编辑' }}
            </button>
          </div>
          <template v-if="showEditProgress">
            <textarea 
              v-model="progressText"
              rows="3"
              placeholder="更新维修进度..."
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            ></textarea>
            <div v-if="repair.status === 'completed' || repair.status === 'verified' || repair.status === 'closed'" class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-1">解决方案</label>
              <textarea 
                v-model="solutionText"
                rows="2"
                placeholder="记录最终解决方案..."
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3">
              <button 
                @click="showEditProgress = false"
                class="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                取消
              </button>
              <button 
                @click="saveProgress"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </template>
          <template v-else>
            <p class="text-gray-700">{{ repair.repairProgress || '暂无进度记录' }}</p>
            <div v-if="repair.solution" class="mt-4 pt-4 border-t">
              <p class="text-sm font-medium text-gray-500 mb-1">解决方案</p>
              <p class="text-gray-700 bg-green-50 p-3 rounded">{{ repair.solution }}</p>
            </div>
          </template>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">📊 完整处理轨迹</h2>
            <span class="text-xs text-gray-500">
              共 {{ unifiedTimeline.length }} 条记录
            </span>
          </div>
          <p class="text-sm text-gray-500 mb-4">
            包含报修处理流程和关联巡检的所有状态变动，责任清晰可追溯。
          </p>
          <div class="relative">
            <div 
              v-for="(item, idx) in unifiedTimeline" 
              :key="item.id" 
              class="flex items-start space-x-4 pb-6 last:pb-0"
            >
              <div class="relative flex flex-col items-center">
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  :class="getTimelineItemClass(item.type).bg"
                >
                  {{ idx + 1 }}
                </div>
                <div 
                  v-if="idx < unifiedTimeline.length - 1" 
                  class="w-0.5 h-full absolute top-8"
                  :class="getTimelineItemClass(item.type).line"
                ></div>
              </div>
              <div class="flex-1 pb-2">
                <div class="flex items-center flex-wrap gap-2">
                  <span class="font-medium text-gray-900">{{ item.userName }}</span>
                  <span class="text-xs text-gray-400">({{ store.roleLabel(item.userRole) }})</span>
                  <span 
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="getTimelineItemClass(item.type).badge"
                  >
                    {{ getTimelineItemLabel(item.type) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  <template v-if="item.type === 'repair'">
                    {{ item.fromStatus ? store.repairStatusLabel(item.fromStatus as any) + ' → ' : '' }}
                    <span class="font-medium">{{ store.repairStatusLabel(item.toStatus as any) }}</span>
                  </template>
                  <template v-else-if="item.type === 'inspection'">
                    <template v-if="item.fromStatus && item.fromStatus !== item.inspectionStatus">
                      {{ store.inspectionStatusLabel(item.fromStatus as any) }} →
                    </template>
                    <StatusBadge type="inspection" :status="item.inspectionStatus!" />
                  </template>
                  <template v-else-if="item.type === 'progress'">
                    <span class="text-gray-500">更新进度:</span>
                    <span class="font-medium text-gray-800 ml-1">{{ item.newValue || '(空)' }}</span>
                  </template>
                  <template v-else-if="item.type === 'solution'">
                    <span class="text-gray-500">记录方案:</span>
                    <span class="font-medium text-green-700 ml-1">{{ item.newValue || '(空)' }}</span>
                  </template>
                </p>
                <template v-if="item.type === 'progress' || item.type === 'solution'">
                  <p v-if="item.oldValue" class="text-xs text-gray-400 mt-1">
                    变更前: {{ item.oldValue || '(空)' }}
                  </p>
                </template>
                <p v-if="item.remark" class="text-sm text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                  {{ item.remark }}
                </p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDateTime(item.timestamp) }}</p>
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
              v-if="canAcceptRepair"
              @click="updateStatus('assigned', '已受理，安排处理')"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              受理报修
            </button>
            
            <button 
              v-if="canStartProcess"
              @click="updateStatus('in_progress', '开始处理')"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始处理
            </button>
            
            <button 
              v-if="canMarkWaitingParts"
              @click="showWaitingPartsModal = true"
              class="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              等待备件
            </button>
            
            <button 
              v-if="canCompleteRepair"
              @click="showCompleteModal = true"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              完成维修
            </button>

            <button 
              v-if="canVerifyRepair"
              @click="showVerifyModal = true"
              class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              验证修复
            </button>

            <button 
              v-if="canCloseRepair"
              @click="updateStatus('closed', '归档关闭')"
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              关闭工单
            </button>

            <button 
              v-if="canResumeFromWaitingParts"
              @click="updateStatus('in_progress', '备件已到，继续处理')"
              class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              备件已到，继续
            </button>

            <div v-if="!canAcceptRepair && !canStartProcess && !canMarkWaitingParts && !canCompleteRepair && !canVerifyRepair && !canCloseRepair && !canResumeFromWaitingParts" class="text-center py-4">
              <p class="text-sm text-gray-500">当前角色无可用操作</p>
              <p class="text-xs text-gray-400 mt-1">您当前是 {{ store.roleLabel(store.currentUser.role) }}</p>
            </div>
          </div>
        </div>

        <div v-if="repair.relatedInspectionId && relatedInspection" class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-900 mb-3">🔗 关联巡检</h3>
          <div class="space-y-2">
            <p class="text-sm"><span class="text-gray-500">单号:</span> {{ relatedInspection.inspectionNo }}</p>
            <p class="text-sm"><span class="text-gray-500">状态:</span> 
              <StatusBadge type="inspection" :status="relatedInspection.status" />
            </p>
            <p class="text-sm"><span class="text-gray-500">巡检人:</span> {{ relatedInspection.inspectorName }}</p>
            <p v-if="relatedInspection.overallRemark" class="text-sm"><span class="text-gray-500">备注:</span> {{ relatedInspection.overallRemark }}</p>
            <router-link 
              :to="`/inspections/${relatedInspection.id}`"
              class="inline-block text-sm text-blue-600 hover:underline mt-2"
            >
              查看巡检详情 →
            </router-link>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-900 mb-3">⏱️ 时间节点</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">创建时间</span>
              <span>{{ formatDateTime(repair.createdAt) }}</span>
            </div>
            <div v-if="repair.completedAt" class="flex justify-between">
              <span class="text-gray-500">完成时间</span>
              <span>{{ formatDateTime(repair.completedAt) }}</span>
            </div>
            <div v-if="repair.verifiedAt" class="flex justify-between">
              <span class="text-gray-500">验证时间</span>
              <span>{{ formatDateTime(repair.verifiedAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">更新时间</span>
              <span>{{ formatDateTime(repair.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showWaitingPartsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">等待备件</h3>
        <textarea 
          v-model="waitingPartsRemark"
          rows="3"
          placeholder="说明需要的备件和预计到货时间..."
          class="w-full px-3 py-2 border rounded-lg mb-4"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button @click="showWaitingPartsModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-900">取消</button>
          <button 
            @click="confirmWaitingParts"
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            确认
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCompleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">完成维修</h3>
        <textarea 
          v-model="completeRemark"
          rows="3"
          placeholder="输入维修完成说明和解决方案..."
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

    <div v-if="showVerifyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">验证修复</h3>
        <textarea 
          v-model="verifyRemark"
          rows="3"
          placeholder="输入验证结果和意见..."
          class="w-full px-3 py-2 border rounded-lg mb-4"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button @click="showVerifyModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-900">取消</button>
          <button 
            @click="confirmVerify"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            确认验证
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12 text-gray-500">
    报修记录不存在
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGasStationStore } from '@/stores/gasStation'
import type { RepairStatus, InspectionStatus, UserRole } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import PriorityBadge from '@/components/PriorityBadge.vue'

const route = useRoute()
const router = useRouter()
const store = useGasStationStore()

const repairId = computed(() => route.params.id as string)
const repair = computed(() => store.getRepairById(repairId.value))
const relatedInspection = computed(() => {
  if (!repair.value?.relatedInspectionId) return null
  return store.getInspectionById(repair.value.relatedInspectionId)
})

const progressText = ref('')
const solutionText = ref('')
const showEditProgress = ref(false)
const completeRemark = ref('')
const verifyRemark = ref('')
const waitingPartsRemark = ref('')
const showCompleteModal = ref(false)
const showVerifyModal = ref(false)
const showWaitingPartsModal = ref(false)

const canEditProgress = computed(() => {
  if (!repair.value) return false
  return store.canEditRepair(repairId.value) && ['assigned', 'in_progress', 'waiting_parts', 'completed'].includes(repair.value.status)
})

const canAcceptRepair = computed(() => {
  if (!repair.value) return false
  return store.canAssignRepair && repair.value.status === 'submitted'
})

const canStartProcess = computed(() => {
  if (!repair.value) return false
  return store.canProcessRepair && repair.value.status === 'assigned'
})

const canMarkWaitingParts = computed(() => {
  if (!repair.value) return false
  return store.canProcessRepair && repair.value.status === 'in_progress'
})

const canCompleteRepair = computed(() => {
  if (!repair.value) return false
  return store.canProcessRepair && ['in_progress', 'waiting_parts'].includes(repair.value.status)
})

const canVerifyRepair = computed(() => {
  if (!repair.value) return false
  return store.canVerifyRepair && repair.value.status === 'completed'
})

const canCloseRepair = computed(() => {
  if (!repair.value) return false
  return store.canCloseRepair && repair.value.status === 'verified'
})

const canResumeFromWaitingParts = computed(() => {
  if (!repair.value) return false
  return store.canProcessRepair && repair.value.status === 'waiting_parts'
})

interface TimelineItem {
  id: string
  type: 'repair' | 'inspection' | 'progress' | 'solution'
  timestamp: string
  userName: string
  userRole: UserRole
  fromStatus?: string
  toStatus?: string
  inspectionStatus?: InspectionStatus
  oldValue?: string
  newValue?: string
  remark: string
}

const unifiedTimeline = computed<TimelineItem[]>(() => {
  if (!repair.value) return []
  
  const repairLogs: TimelineItem[] = repair.value.statusLogs.map(log => ({
    id: log.id,
    type: 'repair' as const,
    timestamp: log.timestamp,
    userName: log.userName,
    userRole: log.userRole,
    fromStatus: log.fromStatus,
    toStatus: log.toStatus,
    remark: log.remark
  }))
  
  const inspectionLogs: TimelineItem[] = repair.value.inspectionUpdates.map((update, idx) => ({
    id: `inspect-${idx}-${update.timestamp}`,
    type: 'inspection' as const,
    timestamp: update.timestamp,
    userName: update.operatorName,
    userRole: update.operatorRole,
    fromStatus: update.fromStatus,
    inspectionStatus: update.inspectionStatus,
    remark: update.inspectionRemark
  }))

  const progressLogs: TimelineItem[] = repair.value.progressLogs.map(log => ({
    id: log.id,
    type: log.type,
    timestamp: log.timestamp,
    userName: log.userName,
    userRole: log.userRole,
    oldValue: log.oldValue,
    newValue: log.newValue,
    remark: log.remark
  }))
  
  return [...repairLogs, ...inspectionLogs, ...progressLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
})

watch(repair, (val) => {
  if (val) {
    progressText.value = val.repairProgress
    solutionText.value = val.solution || ''
  }
}, { immediate: true })

const updateStatus = (status: RepairStatus, remark: string) => {
  store.updateRepairStatus(repairId.value, status, remark)
}

const confirmWaitingParts = () => {
  store.updateRepairStatus(repairId.value, 'waiting_parts', waitingPartsRemark.value || '等待备件到货')
  showWaitingPartsModal.value = false
  waitingPartsRemark.value = ''
}

const confirmComplete = () => {
  store.updateRepairStatus(repairId.value, 'completed', completeRemark.value || '维修完成')
  if (completeRemark.value) {
    store.updateRepairProgress(repairId.value, repair.value?.repairProgress || '', completeRemark.value)
  }
  showCompleteModal.value = false
  completeRemark.value = ''
}

const confirmVerify = () => {
  store.updateRepairStatus(repairId.value, 'verified', verifyRemark.value || '验证通过，修复有效')
  showVerifyModal.value = false
  verifyRemark.value = ''
}

const saveProgress = () => {
  store.updateRepairProgress(repairId.value, progressText.value, solutionText.value || undefined)
  showEditProgress.value = false
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDateTime = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getTimelineItemClass = (type: string) => {
  const map: Record<string, { bg: string; line: string; badge: string }> = {
    repair: { bg: 'bg-orange-100 text-orange-700', line: 'bg-gray-200', badge: 'bg-orange-100 text-orange-700' },
    inspection: { bg: 'bg-blue-100 text-blue-700', line: 'bg-blue-200', badge: 'bg-blue-100 text-blue-700' },
    progress: { bg: 'bg-purple-100 text-purple-700', line: 'bg-purple-200', badge: 'bg-purple-100 text-purple-700' },
    solution: { bg: 'bg-green-100 text-green-700', line: 'bg-green-200', badge: 'bg-green-100 text-green-700' }
  }
  return map[type] || map.repair
}

const getTimelineItemLabel = (type: string) => {
  const map: Record<string, string> = {
    repair: '状态变更',
    inspection: '巡检联动',
    progress: '进度更新',
    solution: '解决方案'
  }
  return map[type] || '操作记录'
}
</script>
