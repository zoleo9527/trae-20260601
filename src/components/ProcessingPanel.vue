<template>
  <div class="processing-panel">
    <div class="panel-header">
      <h2>兑奖登记处理</h2>
      <button class="btn btn-primary" @click="showAddModal = true">新建登记</button>
    </div>
    
    <div class="filter-bar">
      <select v-model="statusFilter">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="processing">处理中</option>
      </select>
      <select v-model="stageFilter">
        <option value="">全部环节</option>
        <option value="registration">登记</option>
        <option value="verification">审核</option>
        <option value="payment">打款</option>
        <option value="completed">完成</option>
        <option value="exception">异常</option>
      </select>
      <select v-model="handlerFilter">
        <option value="">全部责任人</option>
        <option value="店员">店员</option>
        <option value="店长">店长</option>
        <option value="片区管理员">片区管理员</option>
      </select>
      <input 
        v-model="searchKeyword" 
        type="text" 
        placeholder="搜索彩票号码或顾客姓名"
      />
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>兑奖编号</th>
            <th>彩票号码</th>
            <th>奖级</th>
            <th>金额</th>
            <th>门店</th>
            <th>顾客</th>
            <th>当前环节</th>
            <th>当前状态</th>
            <th>当前处理人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in filteredRecords" :key="record.id">
            <td>{{ record.id }}</td>
            <td>{{ record.ticketNumber }}</td>
            <td>{{ record.prizeType }}</td>
            <td>{{ formatAmount(record.prizeAmount) }}</td>
            <td>{{ record.storeName }}</td>
            <td>{{ record.customerName }}</td>
            <td>
              <span :class="['stage-badge', `stage-${record.currentStage}`]">
                {{ stageText(record.currentStage) }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', `status-${record.status}`]">
                {{ statusText(record.status) }}
              </span>
            </td>
            <td>{{ record.currentHandlerName }}（{{ record.currentHandler }}）</td>
            <td>{{ record.createdAt }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="viewRecord(record)">详情</button>
              <button 
                class="btn btn-sm btn-secondary" 
                @click="handleUpdateStatus(record)"
                :disabled="!canHandle(record)"
              >
                {{ getActionText(record) }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content">
        <h3>兑奖详情 - {{ selectedRecord?.id }}</h3>
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-row">
            <span class="detail-label">彩票号码：</span>
            <span>{{ selectedRecord?.ticketNumber }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">奖级：</span>
            <span>{{ selectedRecord?.prizeType }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">金额：</span>
            <span>{{ formatAmount(selectedRecord?.prizeAmount || 0) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">门店：</span>
            <span>{{ selectedRecord?.storeName }}（{{ selectedRecord?.storeCode }}）</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">顾客：</span>
            <span>{{ selectedRecord?.customerName }}（{{ selectedRecord?.customerId }}）</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">当前环节：</span>
            <span :class="['stage-badge', `stage-${selectedRecord?.currentStage}`]">
              {{ stageText(selectedRecord?.currentStage || '') }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">当前状态：</span>
            <span :class="['status-badge', `status-${selectedRecord?.status}`]">
              {{ statusText(selectedRecord?.status || '') }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">当前处理人：</span>
            <span>{{ selectedRecord?.currentHandlerName }}（{{ selectedRecord?.currentHandler }}）</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">备注：</span>
            <span>{{ selectedRecord?.remark || '无备注' }}</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>状态变更记录</h4>
          <div class="timeline">
            <div v-for="(change, index) in selectedRecord?.statusChanges" :key="index" class="timeline-item">
              <div class="timeline-time">{{ change.time }}</div>
              <div class="timeline-content">
                <span :class="['stage-badge', `stage-${change.stage}`]">{{ stageText(change.stage) }}</span>
                <span :class="['status-badge', `status-${change.status}`]">{{ statusText(change.status) }}</span>
              </div>
              <div class="timeline-operator">{{ change.operator }}（{{ change.operatorRole }}）</div>
              <div class="timeline-remark">{{ change.remark || '无备注' }}</div>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="showDetailModal = false">关闭</button>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>新建兑奖登记</h3>
        <form @submit.prevent="handleAdd">
          <div class="form-group">
            <label>彩票号码</label>
            <input v-model="newRecord.ticketNumber" type="text" required />
          </div>
          <div class="form-group">
            <label>奖级</label>
            <select v-model="newRecord.prizeType" required>
              <option value="">请选择奖级</option>
              <option value="一等奖">一等奖</option>
              <option value="二等奖">二等奖</option>
              <option value="三等奖">三等奖</option>
              <option value="四等奖">四等奖</option>
              <option value="五等奖">五等奖</option>
            </select>
          </div>
          <div class="form-group">
            <label>金额</label>
            <input v-model="newRecord.prizeAmount" type="number" required />
          </div>
          <div class="form-group">
            <label>门店</label>
            <select v-model="newRecord.storeCode" required>
              <option value="">请选择门店</option>
              <option value="BJ-WJ-001">朝阳区望京店</option>
              <option value="BJ-ZG-002">海淀区中关村店</option>
              <option value="BJ-XD-003">西城区西单店</option>
              <option value="BJ-WF-004">东城区王府井店</option>
            </select>
          </div>
          <div class="form-group">
            <label>顾客姓名</label>
            <input v-model="newRecord.customerName" type="text" required />
          </div>
          <div class="form-group">
            <label>身份证号</label>
            <input v-model="newRecord.customerId" type="text" required />
          </div>
          <button type="submit" class="btn btn-primary">提交</button>
          <button type="button" class="btn btn-secondary" @click="showAddModal = false">取消</button>
        </form>
      </div>
    </div>

    <div v-if="showUpdateModal" class="modal-overlay" @click.self="showUpdateModal = false">
      <div class="modal-content">
        <h3>处理兑奖 - {{ updatingRecord?.id }}</h3>
        <div class="form-group">
          <label>操作</label>
          <select v-model="updateAction.status">
            <option value="processing">开始处理/下一步</option>
            <option value="completed">完成兑奖</option>
            <option value="exception">标记异常</option>
          </select>
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="updateAction.remark"></textarea>
        </div>
        <button class="btn btn-primary" @click="handleUpdate">确认处理</button>
        <button class="btn btn-secondary" @click="showUpdateModal = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PrizeRecord, User, ProcessStage } from '~/types'
import { stageLabels } from '~/types'

const props = defineProps<{
  records: PrizeRecord[]
  user: User | null
}>()

const emit = defineEmits(['update'])

const statusFilter = ref('')
const stageFilter = ref('')
const handlerFilter = ref('')
const searchKeyword = ref('')
const showDetailModal = ref(false)
const showAddModal = ref(false)
const showUpdateModal = ref(false)
const selectedRecord = ref<PrizeRecord | null>(null)
const updatingRecord = ref<PrizeRecord | null>(null)
const updateAction = ref({
  status: 'processing' as string,
  remark: ''
})

const newRecord = ref({
  ticketNumber: '',
  prizeType: '',
  prizeAmount: '',
  storeCode: '',
  customerName: '',
  customerId: ''
})

const storeMap: Record<string, string> = {
  'BJ-WJ-001': '朝阳区望京店',
  'BJ-ZG-002': '海淀区中关村店',
  'BJ-XD-003': '西城区西单店',
  'BJ-WF-004': '东城区王府井店'
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    exception: '异常'
  }
  return map[status] || status
}

const stageText = (stage: string) => {
  return stageLabels[stage as ProcessStage] || stage
}

const formatAmount = (amount: number) => {
  return `¥${amount.toLocaleString()}`
}

const filteredRecords = computed(() => {
  return props.records.filter(r => {
    if (statusFilter.value && r.status !== statusFilter.value) return false
    if (stageFilter.value && r.currentStage !== stageFilter.value) return false
    if (handlerFilter.value && r.currentHandler !== handlerFilter.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      return r.ticketNumber.toLowerCase().includes(keyword) ||
             r.customerName.toLowerCase().includes(keyword)
    }
    return true
  })
})

const canHandle = (record: PrizeRecord) => {
  if (!props.user) return false
  const role = props.user.role
  if (role === '片区管理员') return true
  if (role === '店长' && record.currentHandler !== '片区管理员') return true
  if (role === '店员' && record.currentHandler === '店员') return true
  return false
}

const getActionText = (record: PrizeRecord) => {
  if (record.status === 'pending') return '开始处理'
  if (record.status === 'processing') return '完成/异常'
  return '查看'
}

const viewRecord = (record: PrizeRecord) => {
  const freshRecord = props.records.find(r => r.id === record.id)
  selectedRecord.value = freshRecord ? { ...freshRecord } : { ...record }
  showDetailModal.value = true
}

const handleUpdateStatus = (record: PrizeRecord) => {
  const freshRecord = props.records.find(r => r.id === record.id)
  updatingRecord.value = freshRecord ? { ...freshRecord } : { ...record }
  updateAction.value = {
    status: record.status === 'pending' ? 'processing' : 'completed',
    remark: ''
  }
  showUpdateModal.value = true
}

const handleAdd = async () => {
  const response = await fetch('/api/prize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...newRecord.value,
      storeName: storeMap[newRecord.value.storeCode],
      operator: props.user?.name
    })
  })
  const result = await response.json()
  if (result.success) {
    showAddModal.value = false
    newRecord.value = {
      ticketNumber: '',
      prizeType: '',
      prizeAmount: '',
      storeCode: '',
      customerName: '',
      customerId: ''
    }
    emit('update')
  }
}

const handleUpdate = async () => {
  if (!updatingRecord.value) return
  
  const response = await fetch('/api/prize', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: updatingRecord.value.id,
      status: updateAction.value.status,
      operator: props.user?.name || '',
      operatorRole: props.user?.role || '',
      remark: updateAction.value.remark
    })
  })
  
  const result = await response.json()
  if (result.success) {
    showUpdateModal.value = false
    if (selectedRecord.value && selectedRecord.value.id === result.data.id) {
      selectedRecord.value = { ...result.data }
    }
    if (updatingRecord.value && updatingRecord.value.id === result.data.id) {
      updatingRecord.value = { ...result.data }
    }
    emit('update')
  }
}
</script>

<style scoped>
.processing-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h2 {
  font-size: 18px;
  color: #333;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-bar select,
.filter-bar input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.detail-row {
  margin-bottom: 8px;
}

.detail-label {
  display: inline-block;
  width: 100px;
  color: #666;
}

.stage-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 4px;
}

.stage-registration {
  background-color: #e6f7ff;
  color: #1890ff;
}

.stage-verification {
  background-color: #fff7e6;
  color: #d48806;
}

.stage-payment {
  background-color: #f6ffed;
  color: #52c41a;
}

.stage-completed {
  background-color: #f0f0f0;
  color: #666;
}

.stage-exception {
  background-color: #fff2f0;
  color: #ff4d4f;
}
</style>
