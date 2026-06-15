<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppointments } from '~/composables/useAppointments'

const { appointments, getAppointmentById, updateAppointment } = useAppointments()

const searchQuery = ref('')
const selectedAppointmentId = ref<string | null>(null)
const editingItemId = ref<string | null>(null)
const editingConclusion = ref('')

const filteredAppointments = computed(() => {
  if (!searchQuery.value) return appointments.value
  const query = searchQuery.value.toLowerCase()
  return appointments.value.filter(a => 
    a.orderNo.toLowerCase().includes(query) ||
    a.customer.name.toLowerCase().includes(query) ||
    a.items.some(i => i.name.toLowerCase().includes(query))
  )
})

const selectedAppointment = computed(() => {
  if (!selectedAppointmentId.value) return null
  return getAppointmentById(selectedAppointmentId.value)
})

const viewItems = (id: string) => {
  selectedAppointmentId.value = id
}

const startEdit = (itemId: string, currentConclusion: string) => {
  editingItemId.value = itemId
  editingConclusion.value = currentConclusion || ''
}

const saveConclusion = () => {
  if (selectedAppointment.value && editingItemId.value) {
    const item = selectedAppointment.value.items.find(i => i.id === editingItemId.value)
    if (item) {
      item.lastConclusion = editingConclusion.value
      updateAppointment(selectedAppointment.value.id, { items: [...selectedAppointment.value.items] })
    }
    editingItemId.value = null
    editingConclusion.value = ''
  }
}

const cancelEdit = () => {
  editingItemId.value = null
  editingConclusion.value = ''
}

const formatAddress = (addr: any) => {
  return `${addr.province}${addr.city}${addr.district}${addr.detail}`
}

const materialColors: Record<string, string> = {
  '布艺': '#ffe4e1',
  '实木': '#f5deb3',
  '电子': '#e0ffff',
  '电器': '#e6e6fa',
  '纸质': '#fffacd',
  '木质': '#deb887',
  '铁皮': '#c0c0c0',
  '玻璃': '#e0ffff',
  '金属': '#d3d3d3',
  '板式': '#fafad2',
  '植物': '#90ee90'
}

const conclusionStatus: Record<string, string> = {
  '已确认': 'badge-success',
  '已装车': 'badge-success',
  '完成': 'badge-success',
  '待确认': 'badge-warning',
  '需准备气泡膜': 'badge-warning',
  '已取消': 'badge-danger'
}
</script>

<template>
  <div class="flex gap-20">
    <div style="width: 400px;">
      <div class="card">
        <div class="form-group">
          <input 
            v-model="searchQuery" 
            placeholder="搜索订单号、客户或物品..."
          />
        </div>
        
        <div style="max-height: calc(100vh - 200px); overflow-y: auto;">
          <div 
            v-for="appointment in filteredAppointments" 
            :key="appointment.id"
            @click="viewItems(appointment.id)"
            class="todo-item"
            :class="{ active: selectedAppointmentId === appointment.id }"
            style="cursor: pointer;"
          >
            <div style="font-weight: 600; margin-bottom: 4px;">{{ appointment.orderNo }}</div>
            <div style="font-size: 12px; color: #999;">{{ appointment.customer.name }}</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">{{ appointment.date }} {{ appointment.timeSlot }}</div>
            <div style="font-size: 12px; color: #999;">{{ appointment.items.length }} 件物品</div>
          </div>
          
          <div v-if="filteredAppointments.length === 0" class="empty-state">
            <div>暂无匹配记录</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex-1">
      <div v-if="selectedAppointment" class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2>{{ selectedAppointment.orderNo }}</h2>
            <div style="color: #999; margin-top: 4px;">
              {{ selectedAppointment.customer.name }} | {{ selectedAppointment.date }} {{ selectedAppointment.timeSlot }}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #999;">出发地</div>
            <div style="font-size: 12px;">{{ formatAddress(selectedAppointment.fromAddress) }}</div>
            <div style="font-size: 12px; color: #999; margin-top: 8px;">目的地</div>
            <div style="font-size: 12px;">{{ formatAddress(selectedAppointment.toAddress) }}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3>物品清单</h3>
          <table class="table">
            <thead>
              <tr>
                <th>物品名称</th>
                <th>数量</th>
                <th>重量(kg)</th>
                <th>体积(m³)</th>
                <th>材料</th>
                <th>易碎</th>
                <th>备注</th>
                <th>上一环节结论</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedAppointment.items" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.weight }}</td>
                <td>{{ item.volume }}</td>
                <td>
                  <span 
                    class="badge" 
                    :style="{ backgroundColor: materialColors[item.material] || '#f0f0f0', color: '#333' }"
                  >
                    {{ item.material }}
                  </span>
                </td>
                <td>{{ item.fragile ? '是' : '否' }}</td>
                <td>{{ item.remark }}</td>
                <td>
                  <div v-if="editingItemId === item.id">
                    <input 
                      v-model="editingConclusion" 
                      class="form-control"
                      placeholder="输入结论..."
                    />
                  </div>
                  <span 
                    v-else-if="item.lastConclusion"
                    class="badge"
                    :class="conclusionStatus[item.lastConclusion] || 'badge-secondary'"
                  >
                    {{ item.lastConclusion }}
                  </span>
                  <span v-else style="color: #999;">无</span>
                </td>
                <td>
                  <div v-if="editingItemId === item.id">
                    <button class="btn btn-success" style="padding: 2px 8px; font-size: 12px;" @click="saveConclusion">保存</button>
                    <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 12px; margin-left: 4px;" @click="cancelEdit">取消</button>
                  </div>
                  <button 
                    v-else
                    class="btn btn-secondary" 
                    style="padding: 2px 8px; font-size: 12px;"
                    @click="startEdit(item.id, item.lastConclusion || '')"
                  >
                    编辑
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3>补充备注</h3>
          <div style="background-color: #f5f7fa; padding: 12px; border-radius: 8px; min-height: 60px;">
            {{ selectedAppointment.remarks || '无' }}
          </div>
        </div>
        
        <div v-if="selectedAppointment.exceptions.length > 0">
          <h3>异常记录</h3>
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
      </div>
      
      <div v-else class="card empty-state">
        <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
        <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">选择订单查看物品清单</div>
        <div style="color: #999;">从左侧列表选择一个预约订单</div>
      </div>
    </div>
  </div>
</template>
