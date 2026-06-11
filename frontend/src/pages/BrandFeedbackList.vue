<template>
  <div class="brand-feedback-page">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">品牌反馈回看</h2>
        <p class="page-desc">查看所有品牌方已给出反馈的客诉处理记录，方便追溯责任界定和处理方案</p>
      </div>
      <div class="header-right">
        <div class="role-switcher">
          <span class="switcher-label">切换角色：</span>
          <button
            v-for="role in ROLES"
            :key="role.key"
            class="role-btn"
            :class="{ active: roleStore.currentRole.key === role.key }"
            @click="roleStore.setRole(role.key)"
          >
            {{ role.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card brand">
        <div class="stat-icon">🏷️</div>
        <div>
          <div class="stat-label">已反馈品牌数</div>
          <div class="stat-value">{{ brandCount }}</div>
        </div>
      </div>
      <div class="stat-card resp">
        <div class="stat-icon">⚖️</div>
        <div>
          <div class="stat-label">品牌责任占比</div>
          <div class="stat-value">{{ brandRespRate }}%</div>
        </div>
      </div>
      <div class="stat-card total">
        <div class="stat-icon">📑</div>
        <div>
          <div class="stat-label">有反馈记录</div>
          <div class="stat-value">{{ feedbackList.length }}</div>
        </div>
      </div>
      <div class="stat-card done">
        <div class="stat-icon">✅</div>
        <div>
          <div class="stat-label">已闭环处理</div>
          <div class="stat-value">{{ closedCount }}</div>
        </div>
      </div>
    </div>

    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">责任界定</label>
          <select v-model="filters.responsibility" class="filter-select">
            <option value="">全部责任</option>
            <option v-for="(label, key) in RESPONSIBILITY_CONFIG" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">处理状态</label>
          <select v-model="filters.status" class="filter-select">
            <option value="">全部状态</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">品牌</label>
          <select v-model="filters.brand" class="filter-select">
            <option value="">全部品牌</option>
            <option v-for="b in uniqueBrands" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="filter-item flex-2">
          <label class="filter-label">搜索</label>
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="filters.keyword"
              type="text"
              class="search-input"
              placeholder="搜索反馈内容、处理建议、单号..."
            />
            <button v-if="filters.keyword" class="search-clear" @click="filters.keyword = ''">×</button>
          </div>
        </div>
      </div>
    </div>

    <div class="feedback-container" v-if="filteredList.length > 0">
      <div
        v-for="item in filteredList"
        :key="item.id"
        class="feedback-card"
      >
        <div class="fb-card-head">
          <div class="fb-head-left">
            <span class="fb-brand-tag">{{ item.brand }}</span>
            <span class="fb-no">{{ item.complaintNo }}</span>
            <span
              class="fb-status-tag"
              :style="{
                color: STATUS_CONFIG[item.status].color,
                background: STATUS_CONFIG[item.status].bgColor
              }"
            >
              {{ STATUS_CONFIG[item.status].label }}
            </span>
          </div>
          <div class="fb-head-right">
            <button class="link-btn" @click="goDetail(item.id)">查看详情 →</button>
          </div>
        </div>

        <div class="fb-card-body">
          <div class="handover-summary">
            <div class="hs-item hs-submit">
              <span class="hs-icon">📤</span>
              <div class="hs-content">
                <div class="hs-label">提交人</div>
                <div class="hs-value">
                  <span class="hs-name">{{ item.submitter }}</span>
                  <span class="hs-role" :class="item.submitterRole">{{ complaintStore.roleLabel(item.submitterRole) }}</span>
                </div>
                <div class="hs-time">{{ formatDateTime(item.submitTime) }}</div>
              </div>
            </div>
            <div class="hs-arrow">→</div>
            <div class="hs-item hs-brand">
              <span class="hs-icon">🏷️</span>
              <div class="hs-content">
                <div class="hs-label">品牌反馈</div>
                <div class="hs-value" v-if="item.brandFeedbackList.length > 0">
                  <span class="hs-name">{{ item.brandFeedbackList[item.brandFeedbackList.length - 1].operator.split('-')[1] || item.brandFeedbackList[item.brandFeedbackList.length - 1].operator }}</span>
                  <span class="hs-resp" :class="item.brandFeedbackList[item.brandFeedbackList.length - 1].responsibility">
                    {{ RESPONSIBILITY_CONFIG[item.brandFeedbackList[item.brandFeedbackList.length - 1].responsibility] }}
                  </span>
                </div>
                <div class="hs-time" v-if="item.brandFeedbackList.length > 0">
                  {{ formatDateTime(item.brandFeedbackList[item.brandFeedbackList.length - 1].timestamp) }}
                </div>
              </div>
            </div>
            <div class="hs-arrow" v-if="complaintStore.getLatestRecheck(item)">→</div>
            <div class="hs-item hs-recheck" v-if="complaintStore.getLatestRecheck(item)">
              <span class="hs-icon">✅</span>
              <div class="hs-content">
                <div class="hs-label">最近复核</div>
                <div class="hs-value">
                  <span class="hs-name">{{ complaintStore.getLatestRecheck(item)!.operator }}</span>
                  <span class="hs-role" :class="complaintStore.getLatestRecheck(item)!.role">
                    {{ complaintStore.roleLabel(complaintStore.getLatestRecheck(item)!.role) }}
                  </span>
                </div>
                <div class="hs-time">{{ formatDateTime(complaintStore.getLatestRecheck(item)!.timestamp) }}</div>
                <div class="hs-conclusion">{{ complaintStore.getLatestRecheck(item)!.remark.length > 30 ? complaintStore.getLatestRecheck(item)!.remark.slice(0, 30) + '...' : complaintStore.getLatestRecheck(item)!.remark }}</div>
              </div>
            </div>
            <div class="hs-item hs-current">
              <span class="hs-icon">⏳</span>
              <div class="hs-content">
                <div class="hs-label">当前处理人</div>
                <div class="hs-value">
                  <span class="hs-name">{{ item.currentHandler }}</span>
                  <span class="hs-role" :class="item.currentHandlerRole">{{ complaintStore.roleLabel(item.currentHandlerRole) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="fb-info-row">
            <div class="fb-info-item">
              <span class="fb-info-label">商品：</span>
              <span class="fb-info-value">{{ item.productName }}</span>
            </div>
            <div class="fb-info-item">
              <span class="fb-info-label">专柜：</span>
              <span class="fb-info-value">{{ item.counter }}</span>
            </div>
            <div class="fb-info-item">
              <span class="fb-info-label">顾客：</span>
              <span class="fb-info-value">{{ item.customerName }}</span>
            </div>
            <div class="fb-info-item">
              <span class="fb-info-label">类型：</span>
              <span class="type-tag-sm">{{ COMPLAINT_TYPE_CONFIG[item.type] }}</span>
            </div>
          </div>

          <div class="fb-complaint-summary">
            <span class="fb-info-label">客诉摘要：</span>
            <span class="fb-summary-text">{{ item.complaintContent.length > 80 ? item.complaintContent.slice(0, 80) + '...' : item.complaintContent }}</span>
          </div>

          <div class="fb-timeline-section" v-if="item.brandFeedbackList.length > 0">
            <div
              v-for="(fb, idx) in item.brandFeedbackList"
              :key="fb.id"
              class="fb-feedback-block"
            >
              <div class="fb-feedback-head">
                <div class="fb-feedback-meta">
                  <span class="fb-feedback-index">品牌反馈 #{{ idx + 1 }}</span>
                  <span class="fb-feedback-op">{{ fb.operator }}</span>
                  <span class="fb-feedback-time">{{ formatDateTime(fb.timestamp) }}</span>
                </div>
                <span class="resp-tag-large" :class="fb.responsibility">
                  {{ RESPONSIBILITY_CONFIG[fb.responsibility] }}
                </span>
              </div>
              <div class="fb-feedback-content">
                <div class="fb-field">
                  <span class="fb-field-label">反馈内容</span>
                  <div class="fb-field-text">{{ fb.feedbackContent }}</div>
                </div>
                <div class="fb-field">
                  <span class="fb-field-label">处理建议</span>
                  <div class="fb-field-text suggestion">{{ fb.handlingSuggestion }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="fb-ops-summary">
            <div class="ops-meta-item">
              <span class="ops-meta-icon">📝</span>
              <span>操作记录 {{ item.operations.length }} 条</span>
            </div>
            <div class="ops-meta-item">
              <span class="ops-meta-icon">🔄</span>
              <span>退回 {{ item.returnCount }} 次</span>
            </div>
            <div class="ops-meta-item">
              <span class="ops-meta-icon">✅</span>
              <span>复核 {{ item.recheckCount }} 次</span>
            </div>
            <button
              v-if="hasKeyRemarks(item)"
              class="toggle-remarks-btn"
              @click.stop="toggleRemarks(item.id)"
            >
              {{ expandedId === item.id ? '收起备注 ▲' : '展开关键备注 ▼' }}
            </button>
          </div>

          <div v-if="expandedId === item.id && hasKeyRemarks(item)" class="key-remarks-section">
            <div v-if="complaintStore.getReturnList(item).length > 0" class="remark-block remark-return">
              <div class="remark-head">
                <span class="remark-icon">🔴</span>
                <span class="remark-title">退回补录记录（{{ complaintStore.getReturnList(item).length }} 次）</span>
              </div>
              <div class="remark-items">
                <div
                  v-for="(r, idx) in complaintStore.getReturnList(item)"
                  :key="r.id"
                  class="remark-item"
                >
                  <div class="remark-meta">
                    <span class="remark-op">{{ r.operator }}</span>
                    <span class="remark-role" :class="r.role">{{ complaintStore.roleLabel(r.role) }}</span>
                    <span class="remark-time">{{ formatDateTime(r.timestamp) }}</span>
                  </div>
                  <div class="remark-text">#{{ idx + 1 }} {{ r.action }}：{{ r.remark }}</div>
                </div>
              </div>
            </div>

            <div v-if="item.brandFeedbackList.length > 0" class="remark-block remark-feedback">
              <div class="remark-head">
                <span class="remark-icon">🟢</span>
                <span class="remark-title">品牌反馈意见（{{ item.brandFeedbackList.length }} 份）</span>
              </div>
              <div class="remark-items">
                <div
                  v-for="(fb, idx) in item.brandFeedbackList"
                  :key="fb.id"
                  class="remark-item"
                >
                  <div class="remark-meta">
                    <span class="remark-op">{{ fb.operator }}</span>
                    <span class="remark-resp" :class="fb.responsibility">{{ RESPONSIBILITY_CONFIG[fb.responsibility] }}</span>
                    <span class="remark-time">{{ formatDateTime(fb.timestamp) }}</span>
                  </div>
                  <div class="remark-text">
                    <div><strong>反馈内容：</strong>{{ fb.feedbackContent }}</div>
                    <div style="margin-top: 4px;"><strong>处理建议：</strong>{{ fb.handlingSuggestion }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="complaintStore.getRecheckList(item).length > 0" class="remark-block remark-recheck">
              <div class="remark-head">
                <span class="remark-icon">🟡</span>
                <span class="remark-title">复核通过结论（{{ complaintStore.getRecheckList(item).length }} 次）</span>
              </div>
              <div class="remark-items">
                <div
                  v-for="(r, idx) in complaintStore.getRecheckList(item)"
                  :key="r.id"
                  class="remark-item"
                >
                  <div class="remark-meta">
                    <span class="remark-op">{{ r.operator }}</span>
                    <span class="remark-role" :class="r.role">{{ complaintStore.roleLabel(r.role) }}</span>
                    <span class="remark-time">{{ formatDateTime(r.timestamp) }}</span>
                  </div>
                  <div class="remark-text">#{{ idx + 1 }} 复核结论：{{ r.remark }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="list-footer">
        <span class="total-text">共 {{ filteredList.length }} 条品牌反馈记录</span>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">暂无品牌反馈记录</div>
      <div class="empty-desc">
        {{ hasAnyFilter ? '当前筛选条件下没有匹配的记录，请调整筛选条件' : '还没有客诉单收到品牌反馈，品牌督导会在处理后提交反馈' }}
      </div>
      <div v-if="hasAnyFilter" class="empty-actions">
        <button class="btn btn-outline" @click="resetFilters">重置筛选</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useComplaintStore } from '@/stores/complaint'
import { useRoleStore } from '@/stores/role'
import {
  STATUS_CONFIG,
  COMPLAINT_TYPE_CONFIG,
  RESPONSIBILITY_CONFIG,
  ROLES,
  type ResponsibilityParty,
  type ComplaintStatus,
  type Complaint
} from '@/types'

const router = useRouter()
const complaintStore = useComplaintStore()
const roleStore = useRoleStore()

const expandedId = ref<string | null>(null)

function toggleRemarks(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function hasKeyRemarks(c: Complaint): boolean {
  return (
    complaintStore.getReturnList(c).length > 0 ||
    c.brandFeedbackList.length > 0 ||
    complaintStore.getRecheckList(c).length > 0
  )
}

const filters = reactive({
  responsibility: '' as ResponsibilityParty | '',
  status: '' as 'processing' | 'completed' | '',
  brand: '',
  keyword: ''
})

const allComplaints = computed(() => complaintStore.getList())

const feedbackList = computed(() =>
  allComplaints.value.filter(c => c.brandFeedbackList.length > 0)
)

const uniqueBrands = computed(() => {
  const set = new Set(feedbackList.value.map(c => c.brand))
  return Array.from(set)
})

const brandCount = computed(() => uniqueBrands.value.length)

const brandRespRate = computed(() => {
  const list = feedbackList.value
  if (list.length === 0) return 0
  const brandResp = list.filter(c =>
    c.brandFeedbackList.some(fb => fb.responsibility === 'brand')
  ).length
  return Math.round((brandResp / list.length) * 100)
})

const closedCount = computed(() =>
  feedbackList.value.filter(c => c.status === 'completed').length
)

const hasAnyFilter = computed(() => {
  return filters.responsibility || filters.status || filters.brand || filters.keyword
})

const filteredList = computed(() => {
  let list = [...feedbackList.value]

  if (filters.responsibility) {
    list = list.filter(c =>
      c.brandFeedbackList.some(fb => fb.responsibility === filters.responsibility)
    )
  }
  if (filters.status) {
    if (filters.status === 'completed') {
      list = list.filter(c => c.status === 'completed')
    } else {
      list = list.filter(c => c.status !== 'completed')
    }
  }
  if (filters.brand) {
    list = list.filter(c => c.brand === filters.brand)
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(c => {
      const inFeedback = c.brandFeedbackList.some(fb =>
        fb.feedbackContent.toLowerCase().includes(kw) ||
        fb.handlingSuggestion.toLowerCase().includes(kw)
      )
      return inFeedback ||
        c.complaintNo.toLowerCase().includes(kw) ||
        c.brand.toLowerCase().includes(kw) ||
        c.complaintContent.toLowerCase().includes(kw)
    })
  }

  return list.sort((a, b) => {
    const aTime = a.brandFeedbackList.length > 0
      ? new Date(a.brandFeedbackList[a.brandFeedbackList.length - 1].timestamp).getTime()
      : 0
    const bTime = b.brandFeedbackList.length > 0
      ? new Date(b.brandFeedbackList[b.brandFeedbackList.length - 1].timestamp).getTime()
      : 0
    return bTime - aTime
  })
})

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function resetFilters() {
  filters.responsibility = ''
  filters.status = ''
  filters.brand = ''
  filters.keyword = ''
}

function goDetail(id: string) {
  router.push(`/complaint/${id}`)
}
</script>

<style scoped>
.brand-feedback-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 6px 0;
}

.page-desc {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.role-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.switcher-label {
  font-size: 13px;
  color: #718096;
}

.role-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  background: #edf2f7;
  color: #4a5568;
  transition: all 0.2s;
}

.role-btn:hover {
  background: #e2e8f0;
}

.role-btn.active {
  background: #2c5282;
  color: white;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 18px 20px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-card.brand .stat-icon {
  background: linear-gradient(135deg, #ebf8ff, #bee3f8);
}

.stat-card.resp .stat-icon {
  background: linear-gradient(135deg, #fef5e7, #feebc8);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #f7fafc, #e2e8f0);
}

.stat-card.done .stat-icon {
  background: linear-gradient(135deg, #f0fff4, #c6f6d5);
}

.stat-label {
  font-size: 13px;
  color: #718096;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1a202c;
}

.filter-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 180px;
}

.flex-2 {
  flex: 2;
  min-width: 300px;
}

.filter-label {
  display: block;
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 6px;
  font-weight: 500;
}

.filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  background: white;
}

.filter-select:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #718096;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feedback-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.fb-card-head {
  padding: 16px 24px;
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fb-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.fb-brand-tag {
  background: #2c5282;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.fb-no {
  font-family: 'SF Mono', Consolas, monospace;
  color: #718096;
  font-size: 13px;
}

.fb-status-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.link-btn {
  color: #2c5282;
  background: none;
  padding: 4px 0;
  font-size: 13px;
  font-weight: 500;
}

.link-btn:hover {
  text-decoration: underline;
}

.fb-card-body {
  padding: 20px 24px;
}

.fb-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 32px;
  margin-bottom: 16px;
}

.fb-info-item {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fb-info-label {
  color: #a0aec0;
  font-size: 13px;
}

.fb-info-value {
  color: #2d3748;
  font-weight: 500;
}

.type-tag-sm {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: #ebf8ff;
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 500;
}

.fb-complaint-summary {
  background: #fffaf0;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 18px;
  border-left: 3px solid #f6ad55;
  font-size: 14px;
  line-height: 1.6;
}

.fb-summary-text {
  color: #5f4a1f;
}

.fb-timeline-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}

.fb-feedback-block {
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  overflow: hidden;
}

.fb-feedback-head {
  padding: 12px 16px;
  background: rgba(72, 187, 120, 0.08);
  border-bottom: 1px solid #c6f6d5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.fb-feedback-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.fb-feedback-index {
  font-weight: 600;
  color: #276749;
  font-size: 13px;
}

.fb-feedback-op {
  color: #2f855a;
  font-size: 13px;
  font-weight: 500;
}

.fb-feedback-time {
  color: #718096;
  font-size: 12px;
}

.resp-tag-large {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.resp-tag-large.brand {
  background: #bee3f8;
  color: #2b6cb0;
}

.resp-tag-large.store {
  background: #fefcbf;
  color: #975a16;
}

.resp-tag-large.customer {
  background: #fed7d7;
  color: #c53030;
}

.resp-tag-large.unclear {
  background: #e2e8f0;
  color: #4a5568;
}

.fb-feedback-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fb-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fb-field-label {
  font-size: 12px;
  font-weight: 600;
  color: #68d391;
}

.fb-field-text {
  color: #2d3748;
  font-size: 14px;
  line-height: 1.7;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
}

.fb-field-text.suggestion {
  border-left: 3px solid #48bb78;
}

.fb-ops-summary {
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.ops-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #718096;
}

.ops-meta-icon {
  font-size: 14px;
}

.list-footer {
  background: white;
  padding: 14px 24px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  font-size: 13px;
  color: #718096;
}

.empty-state {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 80px 40px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #a0aec0;
  margin-bottom: 24px;
}

.empty-actions {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.btn-outline {
  background: white;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.handover-summary {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 14px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 10px;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
}

.hs-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  flex: 1;
  min-width: 140px;
  border: 1px solid #e2e8f0;
}

.hs-submit {
  border-left: 3px solid #f6ad55;
}

.hs-brand {
  border-left: 3px solid #48bb78;
}

.hs-recheck {
  border-left: 3px solid #d69e2e;
}

.hs-current {
  border-left: 3px solid #4299e1;
}

.hs-icon {
  font-size: 20px;
  line-height: 1;
  margin-top: 2px;
}

.hs-content {
  flex: 1;
  min-width: 0;
}

.hs-label {
  font-size: 11px;
  color: #a0aec0;
  margin-bottom: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hs-value {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.hs-name {
  font-weight: 600;
  color: #1a202c;
  font-size: 13px;
}

.hs-role {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 3px;
  font-weight: 500;
}

.hs-role.manager {
  background: #fef5e7;
  color: #9c4221;
}

.hs-role.supervisor {
  background: #ebf8ff;
  color: #2b6cb0;
}

.hs-role.superintendent {
  background: #f0fff4;
  color: #276749;
}

.hs-resp {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 3px;
  font-weight: 500;
}

.hs-resp.brand {
  background: #bee3f8;
  color: #2b6cb0;
}

.hs-resp.store {
  background: #fefcbf;
  color: #975a16;
}

.hs-resp.customer {
  background: #fed7d7;
  color: #c53030;
}

.hs-resp.unclear {
  background: #e2e8f0;
  color: #4a5568;
}

.hs-time {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 3px;
  font-family: 'SF Mono', Consolas, monospace;
}

.hs-conclusion {
  font-size: 12px;
  color: #744210;
  margin-top: 5px;
  padding: 4px 8px;
  background: #fffff0;
  border-radius: 4px;
  line-height: 1.4;
  border-left: 2px solid #d69e2e;
}

.hs-arrow {
  display: flex;
  align-items: center;
  color: #cbd5e0;
  font-weight: 700;
  font-size: 16px;
  padding: 0 2px;
}

.toggle-remarks-btn {
  margin-left: auto;
  background: #ebf8ff;
  color: #2b6cb0;
  padding: 5px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.toggle-remarks-btn:hover {
  background: #bee3f8;
}

.key-remarks-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.remark-block {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.remark-return {
  border-left: 3px solid #e53e3e;
}

.remark-feedback {
  border-left: 3px solid #38a169;
}

.remark-recheck {
  border-left: 3px solid #d69e2e;
}

.remark-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 13px;
  color: #2d3748;
}

.remark-return .remark-head {
  background: #fff5f5;
}

.remark-feedback .remark-head {
  background: #f0fff4;
}

.remark-recheck .remark-head {
  background: #fffff0;
}

.remark-icon {
  font-size: 14px;
}

.remark-title {
  font-size: 13px;
}

.remark-items {
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.remark-item {
  padding: 10px 12px;
  background: #f7fafc;
  border-radius: 6px;
}

.remark-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.remark-op {
  font-weight: 600;
  font-size: 12px;
  color: #2d3748;
}

.remark-role {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 3px;
  font-weight: 500;
}

.remark-role.manager {
  background: #fef5e7;
  color: #9c4221;
}

.remark-role.supervisor {
  background: #ebf8ff;
  color: #2b6cb0;
}

.remark-role.superintendent {
  background: #f0fff4;
  color: #276749;
}

.remark-resp {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 3px;
  font-weight: 500;
}

.remark-resp.brand {
  background: #bee3f8;
  color: #2b6cb0;
}

.remark-resp.store {
  background: #fefcbf;
  color: #975a16;
}

.remark-resp.customer {
  background: #fed7d7;
  color: #c53030;
}

.remark-resp.unclear {
  background: #e2e8f0;
  color: #4a5568;
}

.remark-time {
  margin-left: auto;
  font-size: 11px;
  color: #a0aec0;
  font-family: 'SF Mono', Consolas, monospace;
}

.remark-text {
  font-size: 13px;
  color: #4a5568;
  line-height: 1.6;
}

.fb-ops-summary {
  position: relative;
  display: flex;
  align-items: center;
}
</style>
