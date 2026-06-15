<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppointments } from '~/composables/useAppointments'
import type { Appointment } from '~/data/types'

const { 
  appointments, 
  pendingAppointments, 
  confirmedAppointments, 
  inProgressAppointments,
  completedAppointments,
  canceledAppointments,
  confirmAppointment,
  cancelAppointment,
  getAppointmentById
} = useAppointments()

const activeTab = ref('all')
const showDetail = ref(false)
const selectedAppointment = ref<Appointment | null>(null)
const showCancelModal = ref(false)
const cancelReason = ref('')

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  canceled: '已取消'
}

const statusBadgeClass: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  in_progress: 'badge-confirmed',
  completed: 'badge-completed',
  canceled: 'badge-canceled'
}

const filteredAppointments = computed(() => {
  switch (activeTab.value) {
    case 'pending': return pendingAppointments.value
    case 'confirmed': return confirmedAppointments.value
    case 'in_progress': return inProgressAppointments.value
    case 'completed': return completedAppointments.value
    case 'canceled': return canceledAppointments.value
    default: return appointments.value
  }
})

const tabs = [
  { key: 'all', label: '全部', count: appointments.value.length },
  { key: 'pending', label: '待确认', count: pendingAppointments.value.length },
  { key: 'confirmed', label: '已确认', count: confirmedAppointments.value.length },
  { key: 'in_progress', label: '进行中', count: inProgressAppointments.value.length },
  { key: 'completed', label: '已完成', count: completedAppointments.value.length },
  { key: 'canceled', label: '已取消', count: canceledAppointments.value.length }
]

const viewDetail = (appointment: Appointment) => {
  selectedAppointment.value = appointment
  showDetail.value = true
}

const handleConfirm = (id: string) => {
  confirmAppointment(id)
  if (selectedAppointment.value?.id === id) {
    selectedAppointment.value = getAppointmentById(id) || null
  }
}

const handleCancel = () => {
  if (selectedAppointment.value && cancelReason.value) {
    cancelAppointment(selectedAppointment.value.id, cancelReason.value)
    selectedAppointment.value = getAppointmentById(selectedAppointment.value.id) || null
    showCancelModal.value = false
    cancelReason.value = ''
  }
}

const formatAddress = (addr: any) => {
  return `${addr.province}${addr.city}${addr.district}${addr.detail}`
}
</script>

<template>
  <div>
    <div class="nav-tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.key"
        @click="activeTab = tab.key"
        class="nav-tab"
        :class="{ active: activeTab === tab.key }"
      >
        {{ tab.label }} ({{ tab.count }})
      </div>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>地址</th>
            <th>时间</th>
            <th>车辆</th>
            <th>预估费用</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="appointment in filteredAppointments" :key="appointment.id">
            <td><a href="#" @click.prevent="viewDetail(appointment)" style="color: #4080ff;">{{ appointment.orderNo }}</a></td>
            <td>
              <div>{{ appointment.customer.name }}</div>
              <div style="font-size: 12px; color: #999;">{{ appointment.customer.phone }}</div>
            </td>
            <td style="max-width: 300px;">
              <div style="font-size: 12px;">📦 {{ formatAddress(appointment.fromAddress) }}</div>
              <div style="font-size: 12px; color: #999;">📍 {{ formatAddress(appointment.toAddress) }}</div>
            </td>
            <td>
              <div>{{ appointment.date }}</div>
              <div style="font-size: 12px; color: #999;">{{ appointment.timeSlot }}</div>
            </td>
            <td>{{ appointment.vehicleType }}</td>
            <td>¥{{ appointment.estimatedPrice.toLocaleString() }}</td>
            <td><span :class="['badge', statusBadgeClass[appointment.status]]">{{ statusLabels[appointment.status] }}</span></td>
            <td>
              <div style="display: flex; gap: 8px;">
                <button 
                  v-if="appointment.status === 'pending'"
                  class="btn btn-primary"
                  style="padding: 4px 8px; font-size: 12px;"
                  @click="handleConfirm(appointment.id)"
                >
                  确认
                </button>
                <button 
                  v-if="appointment.status === 'pending' || appointment.status === 'confirmed'"
                  class="btn btn-danger"
                  style="padding: 4px 8px; font-size: 12px;"
                  @click="selectedAppointment = appointment; showCancelModal = true"
                >
                  取消
                </button>
                <button 
                  v-if="appointment.status !== 'completed' && appointment.status !== 'canceled'"
                  class="btn btn-secondary"
                  style="padding: 4px 8px; font-size: 12px;"
                  @click="viewDetail(appointment)"
                >
                  详情
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredAppointments.length === 0" class="empty-state">
        <div>暂无预约记录</div>
      </div>
    </div>
    
    <div v-if="showDetail && selectedAppointment" class="drawer-mask" @click.self="showDetail = false">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-title">预约详情 - {{ selectedAppointment.orderNo }}</div>
          <div class="drawer-close" @click="showDetail = false">✕</div>
        </div>
        <div class="drawer-body">
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px;">客户信息</h3>
            <div style="display: flex; gap: 24px;">
              <div>
                <div style="font-size: 12px; color: #999;">姓名</div>
                <div>{{ selectedAppointment.customer.name }}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #999;">电话</div>
                <div>{{ selectedAppointment.customer.phone }}</div>
              </div>
              <div v-if="selectedAppointment.customer.wechat">
                <div style="font-size: 12px; color: #999;">微信</div>
                <div>{{ selectedAppointment.customer.wechat }}</div>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px;">地址信息</h3>
            <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
              <div style="font-size: 12px; color: #999; margin-bottom: 4px;">📦 出发地</div>
              <div>{{ formatAddress(selectedAppointment.fromAddress) }}</div>
            </div>
            <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px;">
              <div style="font-size: 12px; color: #999; margin-bottom: 4px;">📍 目的地</div>
              <div>{{ formatAddress(selectedAppointment.toAddress) }}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px;">预约信息</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
              <div>
                <div style="font-size: 12px; color: #999;">日期</div>
                <div>{{ selectedAppointment.date }}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #999;">时段</div>
                <div>{{ selectedAppointment.timeSlot }}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #999;">车辆类型</div>
                <div>{{ selectedAppointment.vehicleType }}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #999;">预估费用</div>
                <div>¥{{ selectedAppointment.estimatedPrice.toLocaleString() }}</div>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px;">物品清单</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>数量</th>
                  <th>材料</th>
                  <th>易碎</th>
                  <th>备注</th>
                  <th>结论</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedAppointment.items" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.material }}</td>
                  <td>{{ item.fragile ? '是' : '否' }}</td>
                  <td>{{ item.remark }}</td>
                  <td>
                    <span 
                      v-if="item.lastConclusion"
                      class="badge"
                      :class="{ 
                        'badge-success': item.lastConclusion === '已确认' || item.lastConclusion === '完成',
                        'badge-warning': item.lastConclusion === '待确认' || item.lastConclusion === '需准备气泡膜',
                        'badge-danger': item.lastConclusion === '已取消'
                      }"
                    >
                      {{ item.lastConclusion }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="selectedAppointment.exceptions.length > 0" style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px;">异常记录</h3>
            <div v-for="exception in selectedAppointment.exceptions" :key="exception.id" style="background-color: #fff7e6; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span class="badge badge-price-change">{{ exception.type === 'price_increase' ? '临时加价' : exception.type === 'damage' ? '物品破损' : '车辆迟到' }}</span>
                <span :class="['badge', exception.status === 'resolved' ? 'badge-completed' : exception.status === 'processing' ? 'badge-warning' : 'badge-pending']">
                  {{ exception.status === 'resolved' ? '已解决' : exception.status === 'processing' ? '处理中' : '待处理' }}
                </span>
              </div>
              <div>{{ exception.description }}</div>
              <div v-if="exception.amount" style="font-size: 12px; color: #f5222d; margin-top: 4px;">金额: ¥{{ exception.amount }}</div>
              <div v-if="exception.resolution" style="font-size: 12px; color: #52c41a; margin-top: 4px;">处理结果: {{ exception.resolution }}</div>
            </div>
          </div>
          
          <div>
            <h3 style="margin-bottom: 12px;">补充备注</h3>
            <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px; min-height: 60px;">
              {{ selectedAppointment.remarks || '无' }}
            </div>
          </div>
          
          <div v-if="selectedAppointment.rejectReason">
            <h3 style="margin-bottom: 12px;">取消原因</h3>
            <div style="background-color: #fff2f0; padding: 12px; border-radius: 8px; color: #f5222d;">
              {{ selectedAppointment.rejectReason }}
            </div>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="showDetail = false">关闭</button>
          <button 
            v-if="selectedAppointment.status === 'pending'"
            class="btn btn-primary"
            @click="handleConfirm(selectedAppointment.id)"
          >
            确认预约
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showCancelModal" class="drawer-mask" @click.self="showCancelModal = false">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-title">取消预约</div>
          <div class="drawer-close" @click="showCancelModal = false">✕</div>
        </div>
        <div class="drawer-body">
          <div class="form-group">
            <label>取消原因</label>
            <textarea v-model="cancelReason" placeholder="请输入取消原因"></textarea>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="showCancelModal = false">取消</button>
          <button class="btn btn-danger" @click="handleCancel">确认取消</button>
        </div>
      </div>
    </div>
  </div>
</template>
