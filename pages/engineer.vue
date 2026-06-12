<template>
  <div>
    <AppHeader />
    <div class="container">
      <div class="toolbar">
        <h2 style="font-size: 1.4rem;">物业工程工作台</h2>
        <div class="actions">
          <button class="btn btn-warning" @click="handleReset">
            🔄 重置数据
          </button>
        </div>
      </div>
      
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-icon">⏳</span>
          <div class="stat-label">待我验收</div>
          <div class="stat-value">{{ pendingList.length }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-label">验收通过</div>
          <div class="stat-value">{{ passedList.length }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">❌</span>
          <div class="stat-label">已退回</div>
          <div class="stat-value">{{ rejectedList.length }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📋</span>
          <div class="stat-label">全部记录</div>
          <div class="stat-value">{{ allRecords.length }}</div>
        </div>
      </div>
      
      <div class="card">
        <div class="filter-bar">
          <div class="filter-group">
            <input 
              v-model="searchKeyword" 
              type="text" 
              placeholder="🔍 搜索企业名称或合同编号..." 
              class="filter-input"
            />
          </div>
          <label class="filter-switch">
            <input type="checkbox" v-model="onlyTodo" />
            <span>仅看待办</span>
            <span v-if="pendingList.length > 0" class="todo-count">({{ pendingList.length }})</span>
          </label>
        </div>
        
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
              <th>招商经理</th>
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
              <td>{{ record.managerName }}</td>
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
                    v-if="record.status === 'pending_engineer'" 
                    class="btn btn-primary"
                    @click="showProcess(record)"
                  >
                    现场验收
                  </button>
                </div>
                <div v-if="record.rejectReason" class="text-sm text-error" style="margin-top: 0.5rem;">
                  物业退回原因：{{ record.rejectReason }}
                </div>
                <div v-if="record.directorRejectReason" class="text-sm text-error" style="margin-top: 0.5rem;">
                  主管退回原因：{{ record.directorRejectReason }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-if="showProcessModal && processingRecord" class="modal-overlay" @click.self="showProcessModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>现场验收 - {{ processingRecord.enterpriseName }}</h3>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span v-if="filteredPendingList.length > 1" class="nav-info">
              第 {{ processNavIndex + 1 }} 条 / 共 {{ filteredPendingList.length }} 条
            </span>
            <button class="close-btn" @click="showProcessModal = false">×</button>
          </div>
        </div>
        
        <div v-if="filteredPendingList.length > 1" class="modal-nav">
          <button 
            class="btn btn-secondary nav-btn" 
            :disabled="processNavIndex === 0"
            @click="navProcess(-1)"
          >
            ← 上一条
          </button>
          <button 
            class="btn btn-secondary nav-btn" 
            :disabled="processNavIndex === filteredPendingList.length - 1"
            @click="navProcess(1)"
          >
            下一条 →
          </button>
        </div>
        
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">楼层/房间</div>
            <div class="detail-value">{{ processingRecord.floor }} {{ processingRecord.roomNumber }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">面积</div>
            <div class="detail-value">{{ processingRecord.area }} ㎡</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">招商经理</div>
            <div class="detail-value">{{ processingRecord.managerName }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">计划入驻日期</div>
            <div class="detail-value">{{ processingRecord.plannedMoveInDate }}</div>
          </div>
        </div>
        
        <div v-if="processingRecord.supplementRemark" class="card" style="padding: 1rem; margin-bottom: 1rem;">
          <div class="section-title">补充备注（招商经理填写）</div>
          <p>{{ processingRecord.supplementRemark }}</p>
        </div>
        
        <div v-if="processingRecord.directorRejectReason" class="card" style="padding: 1rem; margin-bottom: 1rem; background: #fef2f2; border: 1px solid #fecaca;">
          <div class="section-title" style="color: #dc2626;">历史主管退回原因</div>
          <p style="color: #991b1b;">{{ processingRecord.directorRejectReason }}</p>
        </div>
        
        <div class="divider"></div>
        
        <form @submit.prevent="handleProcess">
          <div class="form-group">
            <label>验收结果 *</label>
            <select v-model="processForm.result" required>
              <option value="">请选择</option>
              <option value="pass">验收通过</option>
              <option value="reject">验收退回</option>
            </select>
          </div>
          
          <div v-if="processForm.result === 'reject'" class="form-group">
            <label>退回原因 *</label>
            <textarea 
              v-model="processForm.rejectReason" 
              rows="3" 
              placeholder="请详细描述需要整改的问题"
              required
            ></textarea>
            <p class="text-sm text-muted" style="margin-top: 0.5rem;">
              提示：退回原因将直接影响费用起算日期的认定，请务必填写清楚
            </p>
          </div>
          
          <div class="form-group">
            <label>验收备注</label>
            <textarea v-model="processForm.engineerRemark" rows="3" placeholder="填写现场验收情况说明"></textarea>
          </div>
          
          <div class="actions" style="justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" @click="showProcessModal = false">取消</button>
            <button 
              type="submit" 
              class="btn" 
              :class="processForm.result === 'pass' ? 'btn-success' : 'btn-danger'"
            >
              {{ processForm.result === 'pass' ? '确认通过' : '确认退回' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <RecordDetail 
      :visible="showDetailModal" 
      :record="selectedRecord"
      :currentIndex="detailNavIndex"
      :totalCount="filteredRecords.length"
      @close="showDetailModal = false"
      @prev="navDetail(-1)"
      @next="navDetail(1)"
    />
  </div>
</template>

<script setup lang="ts">
import type { AcceptanceRecord, EngineerProcessPayload } from '~/types'

const store = useAcceptanceStore()

const activeTab = ref<'all' | 'pending' | 'passed' | 'rejected'>('all')
const showDetailModal = ref(false)
const showProcessModal = ref(false)
const selectedRecord = ref<AcceptanceRecord | null>(null)
const processingRecord = ref<AcceptanceRecord | null>(null)
const searchKeyword = ref('')
const onlyTodo = ref(false)
const detailNavIndex = ref(0)
const processNavIndex = ref(0)

const processForm = ref<EngineerProcessPayload>({
  recordId: '',
  result: 'pass',
  rejectReason: '',
  engineerRemark: ''
})

const tabs: { value: 'all' | 'pending' | 'passed' | 'rejected'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待验收' },
  { value: 'passed', label: '已通过' },
  { value: 'rejected', label: '已退回' }
]

const allRecords = computed(() => 
  store.records.filter(r => r.status !== 'draft')
)

const pendingList = computed(() => store.getPendingForEngineer)

const filteredPendingList = computed(() => {
  let result = [...pendingList.value]
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    result = result.filter(r => 
      r.enterpriseName.toLowerCase().includes(keyword) || 
      r.contractNo.toLowerCase().includes(keyword)
    )
  }
  return result
})

const passedList = computed(() => 
  store.records.filter(r => 
    r.engineerResult === 'pass' && 
    r.status !== 'pending_engineer'
  )
)

const rejectedList = computed(() => 
  store.records.filter(r => r.status === 'engineer_rejected')
)

const filteredRecords = computed(() => {
  let result: AcceptanceRecord[] = []
  switch (activeTab.value) {
    case 'pending':
      result = [...pendingList.value]
      break
    case 'passed':
      result = [...passedList.value]
      break
    case 'rejected':
      result = [...rejectedList.value]
      break
    default:
      result = [...allRecords.value]
  }
  
  if (onlyTodo.value) {
    result = result.filter(r => r.status === 'pending_engineer')
  }
  
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    result = result.filter(r => 
      r.enterpriseName.toLowerCase().includes(keyword) || 
      r.contractNo.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

const getTabCount = (tab: 'all' | 'pending' | 'passed' | 'rejected') => {
  switch (tab) {
    case 'pending':
      return pendingList.value.length
    case 'passed':
      return passedList.value.length
    case 'rejected':
      return rejectedList.value.length
    default:
      return allRecords.value.length
  }
}

const formatTime = (time: string | null) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const showDetail = (record: AcceptanceRecord) => {
  const idx = filteredRecords.value.findIndex(r => r.id === record.id)
  detailNavIndex.value = idx >= 0 ? idx : 0
  selectedRecord.value = record
  showDetailModal.value = true
}

const navDetail = (direction: number) => {
  const newIndex = detailNavIndex.value + direction
  if (newIndex >= 0 && newIndex < filteredRecords.value.length) {
    detailNavIndex.value = newIndex
    selectedRecord.value = filteredRecords.value[newIndex]
  }
}

const showProcess = (record: AcceptanceRecord) => {
  const idx = filteredPendingList.value.findIndex(r => r.id === record.id)
  processNavIndex.value = idx >= 0 ? idx : 0
  processingRecord.value = record
  processForm.value = {
    recordId: record.id,
    result: 'pass',
    rejectReason: '',
    engineerRemark: ''
  }
  showProcessModal.value = true
}

const navProcess = (direction: number) => {
  const newIndex = processNavIndex.value + direction
  if (newIndex >= 0 && newIndex < filteredPendingList.value.length) {
    processNavIndex.value = newIndex
    const record = filteredPendingList.value[newIndex]
    processingRecord.value = record
    processForm.value = {
      recordId: record.id,
      result: 'pass',
      rejectReason: '',
      engineerRemark: ''
    }
  }
}

const handleProcess = async () => {
  if (!processingRecord.value) return
  
  const confirmMsg = processForm.value.result === 'pass' 
    ? '确认验收通过吗？'
    : '确认验收退回吗？退回后需要招商经理重新提交。'
  
  if (confirm(confirmMsg)) {
    try {
      await store.processEngineer({
        recordId: processForm.value.recordId,
        result: processForm.value.result,
        rejectReason: processForm.value.rejectReason,
        engineerRemark: processForm.value.engineerRemark
      })
      showProcessModal.value = false
    } catch (error: any) {
      alert(error.message || '验收处理失败，请重试')
    }
  }
}

const handleReset = async () => {
  if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
    try {
      await store.resetData()
      alert('数据已重置')
    } catch (error: any) {
      alert(error.message || '重置失败，请重试')
    }
  }
}

await store.fetchRecords()
</script>
