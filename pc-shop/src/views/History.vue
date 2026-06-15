<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">📜 历史记录</h1>
        <p class="page-subtitle">所有到货、装机、异常操作的完整审计追踪</p>
      </div>
      <div class="flex gap-8 flex-wrap">
        <select v-model="filterType" class="form-select-sm">
          <option value="all">全部类型</option>
          <option value="schedule">装机单操作</option>
          <option value="arrival">到货单操作</option>
          <option value="anomaly">异常处理</option>
        </select>
        <input v-model="filterId" type="text" class="form-input-sm" placeholder="筛选单据号（如 SO-xxx / ARR-xxx）" style="width:200px" />
        <input v-model="filterKeyword" type="text" class="form-input-sm" placeholder="搜索操作人/备注" />
        <button v-if="filterId || filterKeyword || filterType !== 'all'" 
                class="btn btn-secondary btn-sm" @click="clearFilter">清除筛选</button>
      </div>
    </div>
    
    <div v-if="filterId" class="filter-info card mb-12" style="padding:10px 16px">
      <span class="text-sm">
        📌 当前筛选: <b>{{ filterType === 'all' ? '全部类型' : typeLabel(filterType) }}</b> 
        <span v-if="filterId">· 单据: <b>{{ filterId }}</b></span>
        <span v-if="filterKeyword">· 搜索: <b>{{ filterKeyword }}</b></span>
        <span class="text-muted">（共 {{ filteredEntries.length }} 条记录）</span>
      </span>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">操作时间线</h3>
        <div class="text-sm text-muted">共 {{ filteredEntries.length }} 条记录</div>
      </div>
      <div class="card-body">
        <div v-if="filteredEntries.length === 0" class="empty">暂无记录</div>
        <div v-else class="timeline">
          <div v-for="(entry, idx) in filteredEntries" :key="idx" class="timeline-item">
            <div class="flex-between items-start mb-4">
              <div class="flex gap-8 items-center flex-wrap">
                <span class="tag" :class="typeTagClass(entry.targetType)">{{ typeLabel(entry.targetType) }}</span>
                <a v-if="entry.targetId" @click="goTarget(entry)" class="font-semibold text-primary">
                  {{ entry.targetId }}
                </a>
                <span class="text-muted">·</span>
                <span class="font-semibold">{{ entry.action }}</span>
              </div>
              <span class="text-xs text-muted">{{ entry.time }}</span>
            </div>
            <div class="timeline-content mb-4">{{ entry.detail || '（无详细描述）' }}</div>
            <div class="flex-between">
              <span class="text-xs text-muted">操作人: <b>{{ entry.operator }}</b></span>
              <button class="btn-link btn text-xs" @click="goTarget(entry)">查看原始单据 →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const filterType = ref('all')
const filterKeyword = ref('')
const filterId = ref('')

onMounted(() => {
  if (route.query.target) filterType.value = route.query.target
  if (route.query.id) filterId.value = route.query.id
})

watch(() => [route.query.target, route.query.id], ([t, id]) => {
  if (t) filterType.value = t
  if (id) filterId.value = id
})

const allEntries = computed(() => {
  const list = []
  for (const sch of appStore.schedules) {
    for (const h of sch.history) {
      list.push({ ...h, targetType: 'schedule', targetId: sch.id })
    }
  }
  for (const arr of appStore.arrivals) {
    for (const h of arr.history) {
      list.push({ ...h, targetType: 'arrival', targetId: arr.id })
    }
  }
  for (const an of appStore.anomalies) {
    if (an.resolvedAt) {
      list.push({
        time: an.resolvedAt,
        operator: an.resolvedBy || '系统',
        action: `异常处理: ${an.title}`,
        detail: `状态: ${an.status} | 处理方式: ${an.resolution || '已解决'}`,
        targetType: 'anomaly',
        targetId: an.relatedId,
        anomalyId: an.id
      })
    }
    if (an.note) {
      list.push({
        time: an.createdAt,
        operator: an.responsible,
        action: `异常${an.status === 'pending' ? '待处理' : '处理中'}: ${an.title}`,
        detail: an.note || an.description,
        targetType: 'anomaly',
        targetId: an.relatedId,
        anomalyId: an.id
      })
    }
  }
  return list.sort((a, b) => b.time.localeCompare(a.time))
})

const filteredEntries = computed(() => {
  let list = allEntries.value
  if (filterType.value !== 'all') list = list.filter(e => e.targetType === filterType.value)
  if (filterId.value.trim()) list = list.filter(e => e.targetId === filterId.value.trim())
  if (filterKeyword.value.trim()) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(e => 
      (e.targetId || '').toLowerCase().includes(kw) ||
      (e.anomalyId || '').toLowerCase().includes(kw) ||
      e.operator.toLowerCase().includes(kw) ||
      e.action.toLowerCase().includes(kw) ||
      (e.detail || '').toLowerCase().includes(kw)
    )
  }
  return list
})

function typeLabel(t) {
  return { schedule: '装机单', arrival: '到货单', anomaly: '异常处理' }[t] || t
}
function typeTagClass(t) {
  return { schedule: 'tag-blue', arrival: 'tag-cyan', anomaly: 'tag-yellow' }[t] || 'tag-gray'
}

function goTarget(entry) {
  if (!entry.targetId) return
  if (entry.targetType === 'schedule') router.push('/schedules/' + entry.targetId)
  else if (entry.targetType === 'arrival') router.push('/arrivals/' + entry.targetId)
  else if (entry.targetType === 'anomaly') router.push('/anomalies')
}

function clearFilter() {
  filterId.value = ''
  filterType.value = 'all'
  filterKeyword.value = ''
}
</script>

<style scoped>
.form-select-sm, .form-input-sm { padding: 6px 10px; font-size: 13px; }
.gap-8 { gap: 8px; }
.mb-4 { margin-bottom: 4px; }
.items-start { align-items: flex-start; }
.flex-wrap { flex-wrap: wrap; }
</style>
