<template>
  <div>
    <AppHeader />
    <div class="container">
      <div class="toolbar">
        <h2 style="font-size: 1.4rem;">招商主管工作台</h2>
        <div class="actions">
          <button class="btn btn-warning" @click="handleReset">
            🔄 重置数据
          </button>
        </div>
      </div>
      
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-icon">⏳</span>
          <div class="stat-label">待我确认</div>
          <div class="stat-value">{{ pendingList.length }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-label">已确认</div>
          <div class="stat-value">{{ confirmedList.length }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💰</span>
          <div class="stat-label">费用已起算</div>
          <div class="stat-value">{{ feeStartedList.length }}</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">❌</span>
          <div class="stat-label">已退回</div>
          <div class="stat-value">{{ rejectedList.length }}</div>
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
              <th>物业验收结果</th>
              <th>计划入驻日期</th>
              <th>费用起算日期</th>
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
              <td>
                <span v-if="record.engineerResult === 'pass'" class="badge bg-green-100 text-green-700">
                  验收通过
                </span>
                <span v-else-if="record.engineerResult === 'reject'" class="badge bg-red-100 text-red-700">
                  验收退回
                </span>
                <span v-else class="badge bg-gray-100 text-gray-600">-</span>
              </td>
              <td>{{ record.plannedMoveInDate }}</td>
              <td>
                <span v-if="record.feeStartDate" style="color: #10b981; font-weight: 500;">
                  {{ record.feeStartDate }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="badge" :class="store.getStatusColor(record.status)">
                  {{ store.getStatusText(record.status) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="btn btn-secondary" @click="showDetail(record)">详情</button>
                  <button 
                    v-if="record.status === 'pending_director'" 
                    class="btn btn-success"
                    @click="showProcess(record)"
                  >
                    审核
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
      
      <div class="card" v-if="filteredFeeStartedList.length > 0">
        <div class="card-title">💰 费用起算回看</div>
        <p class="text-sm text-muted" style="margin-bottom: 1rem;">
          以下企业已完成入驻验收流程，费用已正式起算
          <span v-if="searchKeyword.trim()" class="text-sm" style="margin-left: 0.5rem;">
            当前筛选后共 {{ filteredFeeStartedList.length }} 条
          </span>
        </p>
        <table class="table">
          <thead>
            <tr>
              <th>企业名称</th>
              <th>楼层/房间</th>
              <th>面积(㎡)</th>
              <th>物业验收人</th>
              <th>计划入驻日期</th>
              <th>费用起算日期</th>
              <th>延期天数</th>
              <th>退回记录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredFeeStartedList" :key="record.id">
              <td>
                <div style="font-weight: 500;">{{ record.enterpriseName }}</div>
                <div class="text-sm text-muted">{{ record.contractNo }}</div>
              </td>
              <td>{{ record.floor }} {{ record.roomNumber }}</td>
              <td>{{ record.area }}</td>
              <td>{{ record.engineerName }}</td>
              <td>{{ record.plannedMoveInDate }}</td>
              <td style="color: #10b981; font-weight: 600;">{{ record.feeStartDate }}</td>
              <td>
                <span class="fee-start-highlight" :class="getDayDiffClass(record)">
                  {{ calculateDayDiff(record) }}天
                </span>
              </td>
              <td>
                <span 
                  v-if="record.rejectReason || record.directorRejectReason" 
                  class="reject-badge"
                  @click="showRejectReasons(record)"
                >
                  {{ (record.rejectReason ? 1 : 0) + (record.directorRejectReason ? 1 : 0) }} 条退回
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" @click="showDetail(record)">
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="showRejectModal && rejectModalRecord" class="modal-overlay" @click.self="showRejectModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>退回记录 - {{ rejectModalRecord.enterpriseName }}</h3>
            <button class="close-btn" @click="showRejectModal = false">×</button>
          </div>
          
          <div v-if="rejectModalRecord.rejectReason" class="reject-box">
            <div class="reject-label">物业退回原因</div>
            <div class="reject-content">{{ rejectModalRecord.rejectReason }}</div>
          </div>
          
          <div v-if="rejectModalRecord.directorRejectReason" class="reject-box">
            <div class="reject-label">主管退回原因</div>
            <div class="reject-content">{{ rejectModalRecord.directorRejectReason }}</div>
          </div>
          
          <div v-if="!rejectModalRecord.rejectReason && !rejectModalRecord.directorRejectReason" class="empty-state">
            <p>暂无退回记录</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showProcessModal && processingRecord" class="modal-overlay" @click.self="showProcessModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>审核入驻验收 - {{ processingRecord.enterpriseName }}</h3>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span v-if="pendingList.length > 1" class="nav-info">
              第 {{ processNavIndex + 1 }} 条 / 共 {{ pendingList.length }} 条
            </span>
            <button class="close-btn" @click="showProcessModal = false">×</button>
          </div>
        </div>
        
        <div v-if="pendingList.length > 1" class="modal-nav">
          <button 
            class="btn btn-secondary nav-btn" 
            :disabled="processNavIndex === 0"
            @click="navProcess(-1)"
          >
            ← 上一条
          </button>
          <button 
            class="btn btn-secondary nav-btn" 
            :disabled="processNavIndex === pendingList.length - 1"
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
            <div class="detail-label">物业验收人</div>
            <div class="detail-value">{{ processingRecord.engineerName }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">计划入驻日期</div>
            <div class="detail-value">{{ processingRecord.plannedMoveInDate }}</div>
          </div>
        </div>
        
        <div v-if="processingRecord.rejectReason" class="card" style="padding: 1rem; margin-bottom: 1rem; background: #fef2f2; border: 1px solid #fecaca;">
          <div class="section-title" style="color: #dc2626;">物业退回原因</div>
          <p style="color: #991b1b;">{{ processingRecord.rejectReason }}</p>
        </div>
        
        <div v-if="processingRecord.directorRejectReason" class="card" style="padding: 1rem; margin-bottom: 1rem; background: #fef2f2; border: 1px solid #fecaca;">
          <div class="section-title" style="color: #dc2626;">历史主管退回原因</div>
          <p style="color: #991b1b;">{{ processingRecord.directorRejectReason }}</p>
        </div>
        
        <div v-if="processingRecord.engineerRemark" class="card" style="padding: 1rem; margin-bottom: 1rem;">
          <div class="section-title">物业验收备注</div>
          <p>{{ processingRecord.engineerRemark }}</p>
        </div>
        
        <div v-if="processingRecord.supplementRemark" class="card" style="padding: 1rem; margin-bottom: 1rem;">
          <div class="section-title">补充备注</div>
          <p>{{ processingRecord.supplementRemark }}</p>
        </div>
        
        <div class="divider"></div>
        
        <form @submit.prevent="handleProcess">
          <div class="form-group">
            <label>审核结果 *</label>
            <select v-model="processForm.result" required>
              <option value="">请选择</option>
              <option value="pass">通过，确认费用起算</option>
              <option value="reject">退回</option>
            </select>
          </div>
          
          <div v-if="processForm.result === 'pass'" class="form-group">
            <label>费用起算日期 *</label>
            <input 
              v-model="processForm.feeStartDate" 
              type="date" 
              :min="processingRecord.plannedMoveInDate"
              required 
            />
            <p class="text-sm text-muted" style="margin-top: 0.5rem;">
              提示：费用起算日期应不早于计划入驻日期
            </p>
          </div>
          
          <div v-if="processForm.result === 'reject'" class="form-group">
            <label>退回原因 *</label>
            <textarea 
              v-model="processForm.directorRejectReason" 
              rows="3" 
              placeholder="请详细描述退回原因"
              required
            ></textarea>
            <p class="text-sm text-muted" style="margin-top: 0.5rem;">
              提示：退回原因将反馈给招商经理，直接影响责任认定，请务必填写清楚
            </p>
          </div>
          
          <div class="form-group">
            <label>审核备注</label>
            <textarea v-model="processForm.directorRemark" rows="3" placeholder="填写审核意见"></textarea>
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
import type { AcceptanceRecord, DirectorProcessPayload } from '~/types'

const store = useAcceptanceStore()

const activeTab = ref<'all' | 'pending' | 'completed' | 'rejected'>('all')
const showDetailModal = ref(false)
const showProcessModal = ref(false)
const showRejectModal = ref(false)
const selectedRecord = ref<AcceptanceRecord | null>(null)
const processingRecord = ref<AcceptanceRecord | null>(null)
const rejectModalRecord = ref<AcceptanceRecord | null>(null)
const searchKeyword = ref('')
const onlyTodo = ref(false)
const detailNavIndex = ref(0)
const processNavIndex = ref(0)

const processForm = ref<DirectorProcessPayload & { recordId: string }>({
  recordId: '',
  result: 'pass',
  feeStartDate: '',
  directorRemark: '',
  directorRejectReason: ''
})

const tabs: { value: 'all' | 'pending' | 'completed' | 'rejected'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已退回' }
]

const pendingList = computed(() => store.getPendingForDirector)
const confirmedList = computed(() => 
  store.records.filter(r => r.directorResult === 'pass')
)
const feeStartedList = computed(() => store.getCompletedRecords)
const rejectedList = computed(() => 
  store.records.filter(r => r.status === 'director_rejected')
)

const directorVisibleRecords = computed(() =>
  store.records.filter(r => 
    r.status !== 'draft' && 
    r.status !== 'pending_engineer' && 
    r.status !== 'engineer_rejected'
  )
)

const filteredRecords = computed(() => {
  let result: AcceptanceRecord[] = []
  switch (activeTab.value) {
    case 'pending':
      result = [...pendingList.value]
      break
    case 'completed':
      result = [...feeStartedList.value]
      break
    case 'rejected':
      result = [...rejectedList.value]
      break
    default:
      result = [...directorVisibleRecords.value]
  }
  
  if (onlyTodo.value) {
    result = result.filter(r => r.status === 'pending_director')
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

const filteredFeeStartedList = computed(() => {
  let result = [...feeStartedList.value]
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    result = result.filter(r => 
      r.enterpriseName.toLowerCase().includes(keyword) || 
      r.contractNo.toLowerCase().includes(keyword)
    )
  }
  return result
})

const getTabCount = (tab: 'all' | 'pending' | 'completed' | 'rejected') => {
  switch (tab) {
    case 'pending':
      return pendingList.value.length
    case 'completed':
      return feeStartedList.value.length
    case 'rejected':
      return rejectedList.value.length
    default:
      return directorVisibleRecords.value.length
  }
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
  const idx = pendingList.value.findIndex(r => r.id === record.id)
  processNavIndex.value = idx >= 0 ? idx : 0
  processingRecord.value = record
  processForm.value = {
    recordId: record.id,
    result: 'pass',
    feeStartDate: record.plannedMoveInDate,
    directorRemark: '',
    directorRejectReason: ''
  }
  showProcessModal.value = true
}

const navProcess = (direction: number) => {
  const newIndex = processNavIndex.value + direction
  if (newIndex >= 0 && newIndex < pendingList.value.length) {
    processNavIndex.value = newIndex
    const record = pendingList.value[newIndex]
    processingRecord.value = record
    processForm.value = {
      recordId: record.id,
      result: 'pass',
      feeStartDate: record.plannedMoveInDate,
      directorRemark: '',
      directorRejectReason: ''
    }
  }
}

const showRejectReasons = (record: AcceptanceRecord) => {
  rejectModalRecord.value = record
  showRejectModal.value = true
}

const handleProcess = async () => {
  if (!processingRecord.value) return
  
  const confirmMsg = processForm.value.result === 'pass' 
    ? `确认费用起算日期为 ${processForm.value.feeStartDate} 吗？`
    : '确定要退回此申请吗？'
  
  if (confirm(confirmMsg)) {
    try {
      await store.processDirector({
        recordId: processForm.value.recordId,
        result: processForm.value.result,
        feeStartDate: processForm.value.feeStartDate,
        directorRemark: processForm.value.directorRemark,
        directorRejectReason: processForm.value.directorRejectReason
      })
      showProcessModal.value = false
    } catch (error: any) {
      alert(error.message || '审核失败，请重试')
    }
  }
}

const calculateDayDiff = (record: AcceptanceRecord) => {
  if (!record.feeStartDate || !record.plannedMoveInDate) return 0
  const feeDate = new Date(record.feeStartDate)
  const planDate = new Date(record.plannedMoveInDate)
  const diff = Math.floor((feeDate.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

const getDayDiffClass = (record: AcceptanceRecord) => {
  const diff = calculateDayDiff(record)
  if (diff === 0) return 'delay-zero'
  if (diff <= 7) return 'delay-small'
  return 'delay-large'
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
