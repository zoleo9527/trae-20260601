<template>
  <div class="materials-panel">
    <div class="panel-header">
      <h2>资料留存回看</h2>
    </div>
    
    <div class="filter-bar">
      <select v-model="statusFilter">
        <option value="">全部状态</option>
        <option value="uploading">上传中</option>
        <option value="pending">待审核</option>
        <option value="completed">已完成</option>
        <option value="exception">异常</option>
      </select>
      <input 
        v-model="searchKeyword" 
        type="text" 
        placeholder="搜索彩票号码或顾客姓名"
      />
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总记录</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-warning">{{ stats.uploading }}</div>
        <div class="stat-label">上传中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-info">{{ stats.pending }}</div>
        <div class="stat-label">待审核</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-success">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-danger">{{ stats.exception }}</div>
        <div class="stat-label">异常</div>
      </div>
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
            <th>资料状态</th>
            <th>资料完成度</th>
            <th>处理人</th>
            <th>更新时间</th>
            <th>摘要</th>
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
              <span :class="['status-badge', `status-${record.materialsStatus}`]">
                {{ materialsStatusText(record.materialsStatus) }}
              </span>
            </td>
            <td>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${getProgress(record)}%` }"
                  :class="getProgressClass(record)"
                ></div>
              </div>
              <span class="progress-text">{{ getProgress(record) }}%</span>
            </td>
            <td>{{ record.currentHandlerName }}（{{ record.currentHandler }}）</td>
            <td>{{ record.lastUpdatedAt }}</td>
            <td class="summary-cell">{{ record.summary || '无摘要' }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="viewMaterials(record)">查看资料</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content" style="max-width: 600px;">
        <h3>资料详情 - {{ selectedRecord?.id }}</h3>
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
            <span class="detail-label">资料状态：</span>
            <span :class="['status-badge', `status-${selectedRecord?.materialsStatus}`]">
              {{ materialsStatusText(selectedRecord?.materialsStatus || '') }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">当前处理人：</span>
            <span>{{ selectedRecord?.currentHandlerName }}（{{ selectedRecord?.currentHandler }}）</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">更新时间：</span>
            <span>{{ selectedRecord?.lastUpdatedAt }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">摘要：</span>
            <span class="summary-text">{{ selectedRecord?.summary || '无摘要' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">备注：</span>
            <span>{{ selectedRecord?.remark || '无备注' }}</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>资料清单</h4>
          <div class="materials-list">
            <div 
              v-for="(material, index) in selectedRecord?.materials" 
              :key="index" 
              class="material-item"
            >
              <div class="material-type">{{ material.type }}</div>
              <div class="material-status">
                <span :class="material.uploaded ? 'status-completed' : 'status-pending'">
                  {{ material.uploaded ? '已上传' : '未上传' }}
                </span>
              </div>
              <div v-if="material.uploaded" class="material-meta">
                {{ material.uploadedBy }} / {{ material.uploadedAt }}
              </div>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4>资料未完成原因分析</h4>
          <div v-if="getIncompleteReason(selectedRecord)" class="reason-box">
            {{ getIncompleteReason(selectedRecord) }}
          </div>
          <div v-else class="reason-box reason-complete">
            所有资料已完整上传
          </div>
        </div>
        <button class="btn btn-secondary" @click="showDetailModal = false">关闭</button>
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

const statusFilter = ref('')
const searchKeyword = ref('')
const showDetailModal = ref(false)
const selectedRecord = ref<PrizeRecord | null>(null)

const stats = computed(() => {
  const records = filteredRecords.value
  return {
    total: records.length,
    uploading: records.filter(r => r.materialsStatus === 'uploading').length,
    pending: records.filter(r => r.materialsStatus === 'pending').length,
    completed: records.filter(r => r.materialsStatus === 'completed').length,
    exception: records.filter(r => r.materialsStatus === 'exception').length
  }
})

const filteredRecords = computed(() => {
  return props.records.filter(r => {
    if (statusFilter.value && r.materialsStatus !== statusFilter.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      return r.ticketNumber.toLowerCase().includes(keyword) ||
             r.customerName.toLowerCase().includes(keyword)
    }
    return true
  })
})

const materialsStatusText = (status: string) => {
  const map: Record<string, string> = {
    uploading: '上传中',
    pending: '待审核',
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

const getProgress = (record: PrizeRecord) => {
  if (!record.materials || record.materials.length === 0) return 0
  const uploaded = record.materials.filter(m => m.uploaded).length
  return Math.round((uploaded / record.materials.length) * 100)
}

const getProgressClass = (record: PrizeRecord) => {
  const progress = getProgress(record)
  if (progress === 100) return 'progress-success'
  if (progress >= 50) return 'progress-warning'
  return 'progress-danger'
}

const viewMaterials = (record: PrizeRecord) => {
  const freshRecord = props.records.find(r => r.id === record.id)
  selectedRecord.value = freshRecord ? { ...freshRecord } : { ...record }
  showDetailModal.value = true
}

const getIncompleteReason = (record: PrizeRecord | null) => {
  if (!record) return ''
  if (record.materialsStatus === 'completed') return ''
  
  const missingMaterials = record.materials?.filter(m => !m.uploaded) || []
  if (missingMaterials.length > 0) {
    return `缺少以下资料：${missingMaterials.map(m => m.type).join('、')}`
  }
  
  if (record.materialsStatus === 'exception') {
    return record.remark || '资料存在异常，需进一步核实'
  }
  
  return '资料正在审核中'
}
</script>

<style scoped>
.materials-panel {
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

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 120px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-value.stat-warning {
  color: #d48806;
}

.stat-value.stat-info {
  color: #1890ff;
}

.stat-value.stat-success {
  color: #52c41a;
}

.stat-value.stat-danger {
  color: #ff4d4f;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.progress-bar {
  width: 100px;
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-success {
  background-color: #52c41a;
}

.progress-warning {
  background-color: #d48806;
}

.progress-danger {
  background-color: #ff4d4f;
}

.progress-text {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
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

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.material-type {
  flex: 1;
  font-size: 14px;
}

.material-status span {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.material-meta {
  font-size: 12px;
  color: #999;
}

.reason-box {
  padding: 12px;
  background-color: #fff7e6;
  border-radius: 4px;
  color: #d48806;
  font-size: 14px;
}

.reason-box.reason-complete {
  background-color: #f6ffed;
  color: #52c41a;
}

.stage-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
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
