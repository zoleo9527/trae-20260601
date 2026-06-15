<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAppointments } from '~/composables/useAppointments'
import { useAuth } from '~/composables/useAuth'
import { getRoleName } from '~/data/mockData'
import type { ExceptionRecord, ExceptionType, Role } from '~/data/types'

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
  updateException,
  getAppointmentById
} = useAppointments()

const { currentUser } = useAuth()

const activeTab = ref<'all' | 'price_increase' | 'damage' | 'delay'>('all')
const showAddException = ref(false)
const showResolveModal = ref(false)
const showEditModal = ref(false)
const selectedException = ref<ExceptionRecord | null>(null)
const resolution = ref('')

const editForm = ref({
  responsibleRole: '' as Role | '',
  dueTime: '',
  isOverdue: false,
  timeNote: ''
})

const newException = ref({
  appointmentId: '',
  type: 'price_increase' as ExceptionType,
  description: '',
  amount: 0,
  responsibleRole: '' as Role | '',
  dueTime: '',
  timeNote: ''
})

const allExceptions = computed(() => {
  return getAllExceptions()
})

const filteredExceptions = computed(() => {
  if (activeTab.value === 'all') return allExceptions.value
  return allExceptions.value.filter(e => e.type === activeTab.value)
})

onMounted(async () => {
  await fetchAppointments()
  await nextTick()
  if (props.highlightId) {
    openExceptionDetail(props.highlightId)
  }
})

watch(() => props.highlightId, async (newId) => {
  if (newId && !loading.value) {
    await nextTick()
    openExceptionDetail(newId)
  }
})

const openExceptionDetail = (id: string) => {
  const exception = allExceptions.value.find(e => e.id === id || e.appointmentId === id)
  if (exception) {
    selectedException.value = exception
    resolution.value = exception.resolution || ''
    showResolveModal.value = true
  }
}

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

const roleOptions = [
  { value: 'dispatcher', label: '调度员' },
  { value: 'team_leader', label: '搬运组长' },
  { value: 'customer_service', label: '客服' }
]

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
      amount: 0,
      responsibleRole: '',
      dueTime: '',
      timeNote: ''
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

const openEditModal = (exception: ExceptionRecord) => {
  selectedException.value = exception
  editForm.value = {
    responsibleRole: exception.responsibleRole || '',
    dueTime: exception.dueTime || '',
    isOverdue: exception.isOverdue || false,
    timeNote: exception.timeNote || ''
  }
  showEditModal.value = true
}

const handleUpdateException = async () => {
  if (selectedException.value) {
    await updateException(
      selectedException.value.appointmentId,
      selectedException.value.id,
      {
        responsibleRole: editForm.value.responsibleRole as Role || undefined,
        dueTime: editForm.value.dueTime || undefined,
        isOverdue: editForm.value.isOverdue,
        timeNote: editForm.value.timeNote || undefined
      }
    )
    showEditModal.value = false
    selectedException.value = null
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
            borderLeft: exception.status === 'processing' ? '4px solid #faad14' : exception.status === 'resolved' ? '4px solid #52c41a' : exception.isOverdue ? '4px solid #f5222d' : '4px solid #faad14',
            marginBottom: 0,
            backgroundColor: exception.id === highlightId || exception.appointmentId === highlightId ? '#e6f7ff' : ''
          }"
        >
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">{{ typeIcons[exception.type] }}</span>
              <span class="badge badge-price-change">{{ typeLabels[exception.type] }}</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span v-if="exception.isOverdue" class="badge" style="background-color: #fff2f0; color: #f5222d;">⚠️ 逾期</span>
              <span :class="['badge', exception.status === 'resolved' ? 'badge-completed' : exception.status === 'processing' ? 'badge-warning' : 'badge-pending']">
                {{ exception.status === 'resolved' ? '已解决' : exception.status === 'processing' ? '处理中' : '待处理' }}
              </span>
            </div>
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
          
          <div style="display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 8px;">
            <span v-if="exception.responsibleRole">责任: {{ getRoleName(exception.responsibleRole) }}</span>
            <span v-if="exception.dueTime">截止: {{ exception.dueTime }}</span>
          </div>
          
          <div v-if="exception.timeNote" style="font-size: 12px; color: #4080ff; margin-bottom: 8px;">
            时效备注: {{ exception.timeNote }}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; color: #999; font-size: 12px;">
            <span>创建: {{ exception.createdAt }}</span>
            <span v-if="exception.handledBy">处理人: {{ exception.handledBy }}</span>
          </div>
          
          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button 
              v-if="exception.status === 'pending'"
              class="btn btn-warning"
              style="flex: 1;"
              @click="handleStartProcessing(exception)"
            >
              开始处理
            </button>
            <button 
              v-if="exception.status !== 'resolved'"
              class="btn btn-secondary"
              style="flex: 1;"
              @click="openEditModal(exception)"
            >
              编辑
            </button>
            <button 
              class="btn btn-success"
              style="flex: 1;"
              @click="selectedException = exception; resolution = exception.resolution || ''; showResolveModal = true"
            >
              {{ exception.status === 'resolved' ? '查看结果' : '完成处理' }}
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
          
          <div class="form-group">
            <label>责任角色</label>
            <select v-model="newException.responsibleRole">
              <option value="">请选择责任角色</option>
              <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>截止时间</label>
            <input type="datetime-local" v-model="newException.dueTime" />
          </div>
          
          <div class="form-group">
            <label>时效备注</label>
            <textarea v-model="newException.timeNote" placeholder="请输入时效备注"></textarea>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="showAddException = false">取消</button>
          <button class="btn btn-primary" @click="handleAddException">确认添加</button>
        </div>
      </div>
    </div>
    
    <div v-if="showEditModal && selectedException" class="drawer-mask" @click.self="showEditModal = false">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-title">编辑异常 - {{ typeLabels[selectedException.type] }}</div>
          <div class="drawer-close" @click="showEditModal = false">✕</div>
        </div>
        <div class="drawer-body">
          <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <div>{{ selectedException.description }}</div>
          </div>
          
          <div class="form-group">
            <label>责任角色</label>
            <select v-model="editForm.responsibleRole">
              <option value="">请选择责任角色</option>
              <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>截止时间</label>
            <input type="datetime-local" v-model="editForm.dueTime" />
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="editForm.isOverdue" style="margin-right: 8px;" />
              标记为逾期
            </label>
          </div>
          
          <div class="form-group">
            <label>时效备注</label>
            <textarea v-model="editForm.timeNote" placeholder="请输入时效备注，如：已通知客户、需协调等"></textarea>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" @click="handleUpdateException">保存修改</button>
        </div>
      </div>
    </div>
    
    <div v-if="showResolveModal && selectedException" class="drawer-mask" @click.self="showResolveModal = false">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-title">{{ selectedException.status === 'resolved' ? '查看处理结果' : '完成异常处理' }}</div>
          <div class="drawer-close" @click="showResolveModal = false">✕</div>
        </div>
        <div class="drawer-body">
          <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-weight: 500; margin-bottom: 8px;">{{ typeIcons[selectedException.type] }} {{ typeLabels[selectedException.type] }}</div>
            <div>{{ selectedException.description }}</div>
            <div v-if="selectedException.amount" style="color: #f5222d; margin-top: 4px;">金额: ¥{{ selectedException.amount }}</div>
          </div>
          
          <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #999; margin-bottom: 8px;">责任与时效</div>
            <div style="display: flex; gap: 16px; font-size: 14px;">
              <span v-if="selectedException.responsibleRole">责任: {{ getRoleName(selectedException.responsibleRole) }}</span>
              <span v-if="selectedException.dueTime">截止: {{ selectedException.dueTime }}</span>
            </div>
            <div v-if="selectedException.timeNote" style="margin-top: 8px; color: #4080ff;">备注: {{ selectedException.timeNote }}</div>
          </div>
          
          <div class="form-group">
            <label>处理结果</label>
            <textarea 
              v-model="resolution" 
              placeholder="请输入处理结果..."
              :disabled="selectedException.status === 'resolved'"
            ></textarea>
          </div>
          
          <div v-if="selectedException.handledBy" style="background-color: #f6ffed; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #999; margin-bottom: 4px;">已处理信息</div>
            <div style="color: #52c41a;">处理人: {{ selectedException.handledBy }}</div>
            <div style="color: #52c41a;">处理时间: {{ selectedException.handledAt }}</div>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="showResolveModal = false">关闭</button>
          <button 
            v-if="selectedException.status !== 'resolved'"
            class="btn btn-success" 
            @click="handleResolve"
          >
            确认处理
          </button>
        </div>
      </div>
    </div>
  </div>
</template>