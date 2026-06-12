<template>
  <div>
    <AppHeader />
    <div class="container">
      <div class="toolbar">
        <h2 style="font-size: 1.4rem;">招商经理工作台</h2>
        <div class="actions">
          <button class="btn btn-warning" @click="handleReset">
            🔄 重置数据
          </button>
          <button class="btn btn-primary" @click="showCreate = true">
            ➕ 新建验收申请
          </button>
        </div>
      </div>
      
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-icon">📋</span>
          <div class="stat-label">我的申请</div>
          <div class="stat-value">{{ myRecords.length }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏳</span>
          <div class="stat-label">处理中</div>
          <div class="stat-value">{{ pendingCount }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ completedCount }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">❌</span>
          <div class="stat-label">已退回</div>
          <div class="stat-value">{{ rejectedCount }}</div>
        </div>
      </div>
      
      <div class="card">
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.value" 
            class="tab" 
            :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span v-if="getTabCount(tab.value) > 0" style="margin-left: 0.5rem;">
              ({{ getTabCount(tab.value) }})
            </span>
          </button>
        </div>
        
        <div v-if="store.loading" class="loading">加载中...</div>
        
        <div v-else-if="filteredRecords.length === 0" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>暂无数据</p>
        </div>
        
        <table v-else class="table">
          <thead>
            <tr>
              <th>企业名称</th>
              <th>楼层/房间</th>
              <th>面积(㎡)</th>
              <th>计划入驻日期</th>
              <th>提交时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredRecords" :key="record.id">
              <td>
                <div style="font-weight: 500;">{{ record.enterpriseName }}</div>
                <div class="text-sm text-muted">{{ record.contractNo }}</div>
              </td>
              <td>{{ record.floor }} {{ record.roomNumber }}</td>
              <td>{{ record.area }}</td>
              <td>{{ record.plannedMoveInDate }}</td>
              <td>{{ formatTime(record.submitTime) }}</td>
              <td>
                <span class="badge" :class="store.getStatusColor(record.status)">
                  {{ store.getStatusText(record.status) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="btn btn-secondary" @click="showDetail(record)">详情</button>
                  <button 
                    v-if="record.status === 'draft'" 
                    class="btn btn-primary"
                    @click="handleSubmit(record.id)"
                  >
                    提交
                  </button>
                  <button 
                    v-if="record.status === 'engineer_rejected' || record.status === 'director_rejected'" 
                    class="btn btn-warning"
                    @click="handleResubmit(record.id)"
                  >
                    重新提交
                  </button>
                </div>
                <div v-if="record.rejectReason" class="text-sm text-error" style="margin-top: 0.5rem;">
                  退回原因：{{ record.rejectReason }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建入驻验收申请</h3>
          <button class="close-btn" @click="showCreate = false">×</button>
        </div>
        
        <form @submit.prevent="handleCreate">
          <div class="form-row">
            <div class="form-group">
              <label>企业名称 *</label>
              <input v-model="form.enterpriseName" type="text" required />
            </div>
            <div class="form-group">
              <label>合同编号 *</label>
              <input v-model="form.contractNo" type="text" required />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>楼层 *</label>
              <input v-model="form.floor" type="text" placeholder="如：A栋3层" required />
            </div>
            <div class="form-group">
              <label>房间号 *</label>
              <input v-model="form.roomNumber" type="text" placeholder="如：301-305" required />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>面积(㎡) *</label>
              <input v-model.number="form.area" type="number" min="1" required />
            </div>
            <div class="form-group">
              <label>合同签订日期 *</label>
              <input v-model="form.contractDate" type="date" required />
            </div>
            <div class="form-group">
              <label>计划入驻日期 *</label>
              <input v-model="form.plannedMoveInDate" type="date" required />
            </div>
          </div>
          
          <div class="form-group">
            <label>补充备注</label>
            <textarea v-model="form.supplementRemark" rows="3" placeholder="填写需要说明的特殊情况"></textarea>
          </div>
          
          <div class="actions" style="justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" @click="showCreate = false">取消</button>
            <button type="submit" class="btn btn-primary">创建申请</button>
          </div>
        </form>
      </div>
    </div>
    
    <RecordDetail 
      :visible="showDetailModal" 
      :record="selectedRecord" 
      @close="showDetailModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import type { AcceptanceRecord, AcceptanceStatus, CreateAcceptancePayload } from '~/types'

const authStore = useAuthStore()
const store = useAcceptanceStore()

const activeTab = ref<AcceptanceStatus | 'all'>('all')
const showCreate = ref(false)
const showDetailModal = ref(false)
const selectedRecord = ref<AcceptanceRecord | null>(null)

const form = ref<CreateAcceptancePayload>({
  enterpriseName: '',
  contractNo: '',
  floor: '',
  roomNumber: '',
  area: 0,
  contractDate: '',
  plannedMoveInDate: '',
  supplementRemark: ''
})

const tabs: { value: AcceptanceStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_engineer', label: '待物业验收' },
  { value: 'engineer_rejected', label: '物业退回' },
  { value: 'pending_director', label: '待主管确认' },
  { value: 'director_rejected', label: '主管退回' },
  { value: 'completed', label: '已完成' }
]

const myRecords = computed(() => {
  if (!authStore.currentUser) return []
  return store.getMyRecords(authStore.currentUser.id)
})

const pendingCount = computed(() => 
  myRecords.value.filter(r => r.status === 'pending_engineer' || r.status === 'pending_director').length
)

const completedCount = computed(() => 
  myRecords.value.filter(r => r.status === 'completed').length
)

const rejectedCount = computed(() => 
  myRecords.value.filter(r => r.status === 'engineer_rejected' || r.status === 'director_rejected').length
)

const filteredRecords = computed(() => {
  if (activeTab.value === 'all') return myRecords.value
  return myRecords.value.filter(r => r.status === activeTab.value)
})

const getTabCount = (tab: AcceptanceStatus | 'all') => {
  if (tab === 'all') return myRecords.value.length
  return myRecords.value.filter(r => r.status === tab).length
}

const formatTime = (time: string | null) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const showDetail = (record: AcceptanceRecord) => {
  selectedRecord.value = record
  showDetailModal.value = true
}

const handleCreate = async () => {
  try {
    await store.createRecord(form.value)
    showCreate.value = false
    form.value = {
      enterpriseName: '',
      contractNo: '',
      floor: '',
      roomNumber: '',
      area: 0,
      contractDate: '',
      plannedMoveInDate: '',
      supplementRemark: ''
    }
  } catch (error) {
    alert('创建失败，请重试')
  }
}

const handleSubmit = async (id: string) => {
  if (confirm('确定要提交此申请吗？提交后将进入物业验收流程。')) {
    try {
      await store.submitRecord(id)
    } catch (error) {
      alert('提交失败，请重试')
    }
  }
}

const handleResubmit = async (id: string) => {
  if (confirm('确定要重新提交此申请吗？')) {
    try {
      await store.resubmitRecord(id)
    } catch (error) {
      alert('重新提交失败，请重试')
    }
  }
}

const handleReset = async () => {
  if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
    try {
      await store.resetData()
      alert('数据已重置')
    } catch (error) {
      alert('重置失败，请重试')
    }
  }
}

await store.fetchRecords()
</script>
