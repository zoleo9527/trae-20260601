<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppointments } from '~/composables/useAppointments'
import { useAuth } from '~/composables/useAuth'
import type { ExceptionRecord, ExceptionType, Appointment } from '~/data/types'

const props = defineProps<{
  highlightId?: string
}>()

const { 
  appointments,
  loading,
  fetchAppointments,
  getAllExceptions,
  addException,
  startProcessingException,
  resolveException,
  getAppointmentById
} = useAppointments()

const { currentUser } = useAuth()

onMounted(() => {
  fetchAppointments()
})

watch(() => props.highlightId, (newId) => {
  if (newId) {
    const exception = allExceptions.value.find(e => e.id === newId || e.appointmentId === newId)
    if (exception) {
      selectedException.value = exception
      showResolveModal.value = true
    }
  }
})

const activeTab = ref<'all' | 'price_increase' | 'damage' | 'delay'>('all')
const showAddException = ref(false)
const showResolveModal = ref(false)
const selectedException = ref<ExceptionRecord | null>(null)
const resolution = ref('')

const newException = ref({
  appointmentId: '',
  type: 'price_increase' as ExceptionType,
  description: '',
  amount: 0
})

const allExceptions = computed(() => {
  return getAllExceptions()
})

const filteredExceptions = computed(() => {
  if (activeTab.value === 'all') return allExceptions.value
  return allExceptions.value.filter(e => e.type === activeTab.value)
})

const stats = computed(() => ({
  total: allExceptions.value.length,
  priceIncrease: allExceptions.value.filter(e => e.type === 'price_increase').length,
  damage: allExceptions.value.filter(e => e.type === 'damage').length,
  delay: allExceptions.value.filter(e => e.type === 'delay').length
}))

const tabs = computed(() => [
  { key: 'all', label: '全部', count: stats.value.total },
  { key: 'price_increase', label: '临时加价', count: stats.value.priceIncrease },
  { key: 'damage', label: '物品破损', count: stats.value.damage },
  { key: 'delay', label: '车辆迟到', count: stats.value.delay }
])

const typeLabels: Record<string, string> = {
  price_increase: '临时加价',
  damage: '物品破损',
  delay: '车辆迟到'
}

const typeIcons: Record<string, string> = {
  price_increase: '💰',
  damage: '💥',
  delay: '⏰'
}

const getAppointment = (appointmentId: string) => {
  return getAppointmentById(appointmentId)
}

const handleAddException = async () => {
  if (newException.value.appointmentId && newException.value.description) {
    await addException(
      newException.value.appointmentId,
      newException.value.type,
      newException.value.description,
      newException.value.type === 'price_increase' ? newException.value.amount : undefined
    )
    showAddException.value = false
    newException.value = {
      appointmentId: '',
      type: 'price_increase',
      description: '',
      amount: 0
    }
  }
}

const handleResolve = async () => {
  if (selectedException.value && resolution.value && currentUser.value) {
    await resolveException(
      selectedException.value.appointmentId,
      selectedException.value.id,
      resolution.value,
      currentUser.value.name
    )
    showResolveModal.value = false
    resolution.value = ''
    selectedException.value = null
  }
}

const handleStartProcessing = async (exception: ExceptionRecord) => {
  if (currentUser.value) {
    await startProcessingException(exception.appointmentId, exception.id, currentUser.value.name)
  }
}
</script>

<template>
  <div>
    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; gap: 24px;">
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f5f7fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 600; color: #f5222d;">{{ stats.total }}</div>
          <div style="font-size: 14px; color: #999; margin-top: 4px;">待处理异常</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f5f7fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 600; color: #722ed1;">{{ stats.priceIncrease }}</div>
          <div style="font-size: 14px; color: #999; margin-top: 4px;">临时加价</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f5f7fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 600; color: #f5222d;">{{ stats.damage }}</div>
          <div style="font-size: 14px; color: #999; margin-top: 4px;">物品破损</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f5f7fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 600; color: #faad14;">{{ stats.delay }}</div>
          <div style="font-size: 14px; color: #999; margin-top: 4px;">车辆迟到</div>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="card" style="text-align: center; padding: 40px;">
      <div style="color: #999;">正在加载异常数据...</div>
    </div>
    
    <div v-else class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div class="nav-tabs" style="margin-bottom: 0;">
          <div 
            v-for="tab in tabs" 
            :key="tab.key"
            @click="activeTab = tab.key as any"
            class="nav-tab"
            :class="{ active: activeTab === tab.key }"
          >
            {{ tab.label }} ({{ tab.count }})
          </div>
        </div>
        <button class="btn btn-primary" @click="showAddException = true">
          + 新增异常
        </button>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px;">
        <div 
          v-for="exception in filteredExceptions" 
          :key="exception.id"
          class="card"
          :style="{ 
            borderLeft: exception.status === 'processing' ? '4px solid #faad14' : '4px solid #f5222d',
            marginBottom: 0,
            backgroundColor: exception.id === highlightId || exception.appointmentId === highlightId ? '#e6f7ff' : ''
          }"
        >
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">{{ typeIcons[exception.type] }}</span>
              <span class="badge badge-price-change">{{ typeLabels[exception.type] }}</span>
            </div>
            <span :class="['badge', exception.status === 'processing' ? 'badge-warning' : exception.status === 'resolved' ? 'badge-completed' : 'badge-pending']">
              {{ exception.status === 'resolved' ? '已解决' : exception.status === 'processing' ? '处理中' : '待处理' }}
            </span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-weight: 500; margin-bottom: 4px;">
              {{ getAppointment(exception.appointmentId)?.orderNo || '未知订单' }}
            </div>
            <div style="color: #666;">{{ exception.description }}</div>
          </div>
          
          <div v-if="exception.amount" style="color: #f5222d; font-weight: 500; margin-bottom: 8px;">
            加价金额: ¥{{ exception.amount.toLocaleString() }}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; color: #999; font-size: 12px;">
            <span>创建时间: {{ exception.createdAt }}</span>
            <span v-if="exception.handledBy">处理人: {{ exception.handledBy }}</span>
          </div>
          
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button 
              v-if="exception.status === 'pending'"
              class="btn btn-warning"
              style="flex: 1;"
              @click="handleStartProcessing(exception)"
            >
              开始处理
            </button>
            <button 
              class="btn btn-success"
              style="flex: 1;"
              @click="selectedException = exception; showResolveModal = true"
            >
              {{ exception.status === 'resolved' ? '查看处理结果' : '完成处理' }}
            </button>
          </div>
          
          <div v-if="exception.resolution" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e8e8e8;">
            <div style="font-size: 12px; color: #999; margin-bottom: 4px;">处理结果</div>
            <div style="color: #52c41a;">{{ exception.resolution }}</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
              处理人: {{ exception.handledBy }} | {{ exception.handledAt }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="filteredExceptions.length === 0" class="empty-state">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">暂无异常记录</div>
        <div style="color: #999;">当前没有需要处理的异常</div>
      </div>
    </div>
    
    <div v-if="showAddException" class="drawer-mask" @click.self="showAddException = false">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-title">新增异常记录</div>
          <div class="drawer-close" @click="showAddException = false">✕</div>
        </div>
        <div class="drawer-body">
          <div class="form-group">
            <label>关联订单</label>
            <select v-model="newException.appointmentId">
              <option value="">请选择订单</option>
              <option v-for="appointment in appointments" :key="appointment.id" :value="appointment.id">
                {{ appointment.orderNo }} - {{ appointment.customer.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>异常类型</label>
            <select v-model="newException.type">
              <option value="price_increase">临时加价</option>
              <option value="damage">物品破损</option>
              <option value="delay">车辆迟到</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>异常描述</label>
            <textarea v-model="newException.description" placeholder="请详细描述异常情况"></textarea>
          </div>
          
          <div v-if="newException.type === 'price_increase'" class="form-group">
            <label>加价金额</label>
            <input type="number" v-model.number="newException.amount" placeholder="输入加价金额" />
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="showAddException = false">取消</button>
          <button class="btn btn-primary" @click="handleAddException">确认添加</button>
        </div>
      </div>
    </div>
    
    <div v-if="showResolveModal && selectedException" class="drawer-mask" @click.self="showResolveModal = false">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-title">完成异常处理</div>
          <div class="drawer-close" @click="showResolveModal = false">✕</div>
        </div>
        <div class="drawer-body">
          <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-weight: 500; margin-bottom: 8px;">{{ typeIcons[selectedException.type] }} {{ typeLabels[selectedException.type] }}</div>
            <div>{{ selectedException.description }}</div>
            <div v-if="selectedException.amount" style="color: #f5222d; margin-top: 4px;">金额: ¥{{ selectedException.amount }}</div>
          </div>
          
          <div class="form-group">
            <label>处理结果</label>
            <textarea v-model="resolution" placeholder="请输入处理结果..."></textarea>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="showResolveModal = false">取消</button>
          <button class="btn btn-success" @click="handleResolve">确认处理</button>
        </div>
      </div>
    </div>
  </div>
</template>