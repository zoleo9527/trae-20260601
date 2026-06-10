<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '../store'
import { FEED_STATUS_LABELS, ANALYSIS_STATUS_LABELS } from '../types'
import type { FarmRecord } from '../types'

const props = defineProps<{
  record: FarmRecord
}>()

const emit = defineEmits<{
  close: []
}>()

const { state, submitFeed, submitAnalysis } = useStore()

const showFeedForm = ref(false)
const showAnalysisForm = ref(false)

const feedForm = ref({
  actualAmount: props.record.feed.plannedAmount,
  keyJudgment: '',
  hasAttachment: false
})

const analysisForm = ref({
  actualConsumption: props.record.analysis?.expectedConsumption || props.record.feed.actualAmount || props.record.feed.plannedAmount,
  returnReason: '',
  supplementaryNotes: ''
})

const canFeed = computed(() => props.record.feed.status === 'pending' && state.currentRole === 'feeder')
const canAnalyze = computed(() =>
  (props.record.feed.status === 'delivered' || props.record.feed.status === 'abnormal') &&
  (!props.record.analysis || props.record.analysis.status === 'pending') &&
  state.currentRole === 'sorter'
)

const feedJudgmentVisible = computed(() =>
  props.record.feed.keyJudgment && (showAnalysisForm.value || (props.record.analysis && props.record.analysis.status !== 'pending'))
)

function onSubmitFeed() {
  submitFeed(
    props.record.feed.id,
    feedForm.value.actualAmount,
    feedForm.value.keyJudgment,
    []
  )
  showFeedForm.value = false
}

function onSubmitAnalysis() {
  submitAnalysis(
    props.record.feed.id,
    analysisForm.value.actualConsumption,
    analysisForm.value.returnReason,
    analysisForm.value.supplementaryNotes
  )
  showAnalysisForm.value = false
}

function varianceDisplay(rate: number | null) {
  if (rate === null) return { text: '-', cls: '' }
  const sign = rate > 0 ? '+' : ''
  const cls = Math.abs(rate) > 3 ? 'variance-warn' : 'variance-ok'
  return { text: `${sign}${rate}%`, cls }
}

function feedAmtDisplay() {
  const f = props.record.feed
  if (f.actualAmount === null) return `${f.plannedAmount}kg (计划)`
  const diff = f.actualAmount - f.plannedAmount
  const pct = ((diff / f.plannedAmount) * 100).toFixed(1)
  const sign = diff > 0 ? '+' : ''
  return `${f.actualAmount}kg (计划${f.plannedAmount}kg, ${sign}${pct}%)`
}
</script>

<template>
  <div class="detail-panel">
    <div class="detail-header">
      <div class="header-info">
        <span class="house-badge">{{ record.feed.houseName }}</span>
        <span class="record-id">{{ record.feed.id }}</span>
        <span :class="['status-badge', `feed-${record.feed.status}`]">
          {{ FEED_STATUS_LABELS[record.feed.status] }}
        </span>
        <span v-if="record.feed.riskFlag" class="risk-badge">⚠ 风险</span>
      </div>
      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

    <div v-if="record.feed.riskFlag && record.feed.riskReason" class="risk-alert">
      <div class="alert-icon">⚠</div>
      <div class="alert-content">
        <div class="alert-title">风险提示</div>
        <div class="alert-text">{{ record.feed.riskReason }}</div>
      </div>
    </div>

    <div class="detail-body">
      <section class="section">
        <h3 class="section-title">
          <span class="section-icon">🚜</span>
          饲料投喂
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">日期</span>
            <span class="info-value">{{ record.feed.date }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">饲料类型</span>
            <span class="info-value">{{ record.feed.feedType }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">计划/实际</span>
            <span class="info-value">{{ feedAmtDisplay() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">投喂时间</span>
            <span class="info-value">{{ record.feed.feedTime || '未投喂' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">饲养员</span>
            <span class="info-value">{{ record.feed.feeder }}</span>
          </div>
        </div>

        <div v-if="record.feed.keyJudgment" class="judgment-box">
          <div class="judgment-label">🔑 投喂关键判断</div>
          <div class="judgment-content">{{ record.feed.keyJudgment }}</div>
        </div>

        <div v-if="record.feed.attachments.length" class="attachment-box">
          <div class="attach-label">📎 附件</div>
          <div class="attach-list">
            <div v-for="att in record.feed.attachments" :key="att.id" class="attach-item">
              <span class="attach-name">{{ att.name }}</span>
              <span class="attach-size">{{ att.size }}</span>
              <span class="attach-placeholder">[占位]</span>
            </div>
          </div>
        </div>

        <div v-if="canFeed && !showFeedForm" class="action-bar">
          <button class="action-btn feed-action" @click="showFeedForm = true">执行投喂</button>
        </div>

        <div v-if="showFeedForm" class="form-box">
          <div class="form-row">
            <label>实际投喂量 (kg)</label>
            <input v-model.number="feedForm.actualAmount" type="number" class="form-input" />
          </div>
          <div class="form-row">
            <label>关键判断</label>
            <textarea v-model="feedForm.keyJudgment" class="form-textarea" rows="2" placeholder="记录投喂时的重要观察，如鸡群状态、料槽情况等"></textarea>
          </div>
          <div class="form-row">
            <label>附件</label>
            <div class="attach-placeholder-input">
              <span class="placeholder-text">[附件上传占位 - 现场照片/视频]</span>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="showFeedForm = false">取消</button>
            <button class="btn-primary" @click="onSubmitFeed">确认投喂</button>
          </div>
        </div>
      </section>

      <div class="section-divider"></div>

      <section class="section">
        <h3 class="section-title">
          <span class="section-icon">📊</span>
          耗用分析
          <span v-if="record.analysis" :class="['analysis-badge', `analysis-${record.analysis.status}`]">
            {{ ANALYSIS_STATUS_LABELS[record.analysis.status] }}
          </span>
          <span v-else class="analysis-badge analysis-none">未关联</span>
        </h3>

        <div v-if="feedJudgmentVisible" class="judgment-highlight">
          <div class="highlight-label">📋 投喂时留下的关键判断（请结合此信息进行分析）</div>
          <div class="highlight-content">{{ record.feed.keyJudgment }}</div>
        </div>

        <div v-if="record.analysis" class="info-grid">
          <div class="info-item">
            <span class="info-label">预期耗用</span>
            <span class="info-value">{{ record.analysis.expectedConsumption }}kg</span>
          </div>
          <div class="info-item">
            <span class="info-label">实际耗用</span>
            <span class="info-value">{{ record.analysis.actualConsumption !== null ? record.analysis.actualConsumption + 'kg' : '未录入' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">偏差</span>
            <span :class="['info-value', varianceDisplay(record.analysis.varianceRate).cls]">
              {{ varianceDisplay(record.analysis.varianceRate).text }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">分析人</span>
            <span class="info-value">{{ record.analysis.analyzer || '-' }}</span>
          </div>
        </div>

        <div v-if="record.analysis?.returnReason" class="return-box">
          <div class="return-label">🔄 退回原因</div>
          <div class="return-content">{{ record.analysis.returnReason }}</div>
        </div>

        <div v-if="record.analysis?.supplementaryNotes" class="notes-box">
          <div class="notes-label">📝 补充备注</div>
          <div class="notes-content">{{ record.analysis.supplementaryNotes }}</div>
        </div>

        <div v-if="!record.analysis" class="no-analysis">
          <p>暂无耗用分析记录。投喂完成后，分拣员可进行耗用分析。</p>
        </div>

        <div v-if="canAnalyze && !showAnalysisForm" class="action-bar">
          <button class="action-btn analysis-action" @click="showAnalysisForm = true">进行耗用分析</button>
        </div>

        <div v-if="showAnalysisForm" class="form-box">
          <div v-if="record.feed.keyJudgment" class="form-context">
            <div class="context-label">📋 投喂关键判断回顾</div>
            <div class="context-text">{{ record.feed.keyJudgment }}</div>
          </div>
          <div class="form-row">
            <label>实际耗用量 (kg)</label>
            <input v-model.number="analysisForm.actualConsumption" type="number" class="form-input" />
          </div>
          <div class="form-row">
            <label>退回原因（如有）</label>
            <textarea v-model="analysisForm.returnReason" class="form-textarea" rows="2" placeholder="饲料结块、受潮退回等原因"></textarea>
          </div>
          <div class="form-row">
            <label>补充备注</label>
            <textarea v-model="analysisForm.supplementaryNotes" class="form-textarea" rows="3" placeholder="补充说明、后续跟进事项等"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="showAnalysisForm = false">取消</button>
            <button class="btn-primary" @click="onSubmitAnalysis">提交分析</button>
          </div>
        </div>
      </section>

      <div class="detail-meta">
        <span>创建：{{ record.feed.createdAt }}</span>
        <span>更新：{{ record.feed.updatedAt }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-panel {
  background: #fff;
  border-radius: 12px;
  width: 720px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #eee;
  background: #fafbfc;
  border-radius: 12px 12px 0 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.house-badge {
  background: #1a1a2e;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
}

.record-id {
  font-size: 12px;
  color: #999;
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.feed-pending {
  background: #fef3e2;
  color: #e67e22;
}

.feed-delivered {
  background: #e8f8f0;
  color: #27ae60;
}

.feed-abnormal {
  background: #fde8e8;
  color: #e74c3c;
}

.risk-badge {
  font-size: 12px;
  color: #e74c3c;
  font-weight: 700;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.risk-alert {
  display: flex;
  gap: 12px;
  padding: 14px 24px;
  background: #fef9f9;
  border-bottom: 1px solid #fde8e8;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 13px;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 2px;
}

.alert-text {
  font-size: 13px;
  color: #c0392b;
  line-height: 1.5;
}

.detail-body {
  padding: 20px 24px;
}

.section {
  margin-bottom: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 16px;
}

.analysis-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.analysis-done {
  background: #e8f8f0;
  color: #27ae60;
}

.analysis-pending {
  background: #fef3e2;
  color: #e67e22;
}

.analysis-issue {
  background: #fde8e8;
  color: #e74c3c;
}

.analysis-none {
  background: #f0f0f0;
  color: #999;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: #999;
}

.info-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.variance-ok {
  color: #27ae60;
  font-weight: 700;
}

.variance-warn {
  color: #e74c3c;
  font-weight: 700;
}

.judgment-box {
  background: #f0f7ff;
  border: 1px solid #d0e4f7;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.judgment-label {
  font-size: 12px;
  font-weight: 700;
  color: #2980b9;
  margin-bottom: 4px;
}

.judgment-content {
  font-size: 13px;
  color: #2c3e50;
  line-height: 1.6;
}

.judgment-highlight {
  background: #fff8e1;
  border: 2px solid #f39c12;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 14px;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: #f39c12; }
  50% { border-color: #f1c40f; }
}

.highlight-label {
  font-size: 12px;
  font-weight: 700;
  color: #e67e22;
  margin-bottom: 4px;
}

.highlight-content {
  font-size: 13px;
  color: #2c3e50;
  line-height: 1.6;
}

.attachment-box {
  margin-bottom: 12px;
}

.attach-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.attach-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attach-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8f9fb;
  border-radius: 4px;
  border: 1px dashed #ddd;
}

.attach-name {
  font-size: 12px;
  color: #333;
}

.attach-size {
  font-size: 11px;
  color: #999;
}

.attach-placeholder {
  font-size: 10px;
  color: #e67e22;
  background: #fef3e2;
  padding: 1px 6px;
  border-radius: 3px;
}

.return-box {
  background: #fef9f9;
  border: 1px solid #fde8e8;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.return-label {
  font-size: 12px;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 4px;
}

.return-content {
  font-size: 13px;
  color: #c0392b;
  line-height: 1.6;
}

.notes-box {
  background: #f8f9fb;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.notes-label {
  font-size: 12px;
  font-weight: 700;
  color: #555;
  margin-bottom: 4px;
}

.notes-content {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
}

.no-analysis {
  padding: 16px;
  background: #fafbfc;
  border-radius: 6px;
  text-align: center;
}

.no-analysis p {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.action-bar {
  margin-top: 12px;
}

.action-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.feed-action {
  background: #27ae60;
  color: #fff;
}

.feed-action:hover {
  background: #219a52;
}

.analysis-action {
  background: #2980b9;
  color: #fff;
}

.analysis-action:hover {
  background: #2471a3;
}

.form-box {
  background: #f8f9fb;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.form-row {
  margin-bottom: 12px;
}

.form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #2980b9;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #2980b9;
}

.attach-placeholder-input {
  padding: 12px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  text-align: center;
  background: #fff;
}

.placeholder-text {
  font-size: 12px;
  color: #bbb;
}

.form-context {
  background: #fff8e1;
  border: 1px solid #f5deb3;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.context-label {
  font-size: 11px;
  font-weight: 700;
  color: #e67e22;
  margin-bottom: 4px;
}

.context-text {
  font-size: 12px;
  color: #555;
  line-height: 1.5;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.btn-secondary {
  padding: 8px 20px;
  border: 1px solid #ddd;
  background: #fff;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-primary {
  padding: 8px 20px;
  border: none;
  background: #1a1a2e;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.btn-primary:hover {
  background: #2d2d5e;
}

.section-divider {
  height: 1px;
  background: #eee;
  margin: 20px 0;
}

.detail-meta {
  display: flex;
  gap: 24px;
  font-size: 11px;
  color: #bbb;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
