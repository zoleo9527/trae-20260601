<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">📋 今日待办</h1>
        <p class="page-subtitle">今天先处理以下事项，按优先级排序</p>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-outline btn-sm" @click="router.push('/arrivals')">查看全部到货</button>
        <button class="btn btn-primary btn-sm" @click="router.push('/schedules')">查看全部排程</button>
      </div>
    </div>

    <!-- 紧急异常卡片 - 最高优先级 -->
    <section v-if="appStore.dangerAnomalies.length > 0" class="mb-16">
      <div class="section-title flex-between mb-12">
        <h2 class="font-semibold text-danger">🚨 紧急异常（{{ appStore.dangerAnomalies.length }}） - 请立即处理</h2>
        <button class="btn-link btn text-sm" @click="router.push('/anomalies')">查看全部 →</button>
      </div>
      <div class="grid-2">
        <div v-for="an in appStore.dangerAnomalies.slice(0, 2)" :key="an.id" 
             class="card anomaly-card danger" 
             @click="goDetail(an)">
          <div class="card-body">
            <div class="flex-between mb-8">
              <div class="flex gap-8 items-center">
                <span class="tag tag-red">紧急</span>
                <span class="font-semibold">{{ an.title }}</span>
              </div>
              <div v-if="an.deadline" class="deadline">
                ⏱️ 截止: <span class="font-semibold">{{ an.deadline }}</span>
              </div>
            </div>
            <p class="text-sm text-muted mb-12">{{ an.description }}</p>
            <div class="flex-between text-xs">
              <span class="text-muted">责任人: <b>{{ an.responsible }}</b></span>
              <span class="text-muted">{{ an.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="grid-2">
      <!-- 配件到货处理 -->
      <section>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📦 配件到货处理</h3>
            <button class="btn-link btn text-sm" @click="router.push('/arrivals')">全部 →</button>
          </div>
          <div class="card-body p-0">
            <div v-if="pendingArrivalsList.length === 0" class="empty">暂无待处理到货</div>
            <div v-for="arr in pendingArrivalsList" :key="arr.id" 
                 class="arrival-row clickable"
                 @click="router.push('/arrivals/'+arr.id)">
              <div class="flex-between mb-8">
                <div class="flex gap-8 items-center">
                  <span class="tag" :class="arr.status==='partial' ? 'tag-yellow' : 'tag-cyan'">
                    {{ arr.status==='partial' ? '验收中' : '待验收' }}
                  </span>
                  <span class="font-semibold">{{ arr.id }}</span>
                </div>
                <span v-if="arr.anomaly" class="tag tag-yellow">⚠️ {{ arr.anomaly.title }}</span>
              </div>
              <div class="text-sm mb-8 truncate">供应商: {{ arr.supplier }}</div>
              <div class="flex-between text-xs text-muted">
                <span>预计到货: {{ arr.expectedDate }}</span>
                <span>{{ arr.checkedItems }}/{{ arr.totalItems }} 件已验</span>
              </div>
              <div class="progress-bar mt-8">
                <div class="progress-fill" :style="{width: progressPct(arr) + '%'}"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 装机排程 -->
      <section>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🛠️ 装机排程</h3>
            <button class="btn-link btn text-sm" @click="router.push('/schedules')">全部 →</button>
          </div>
          <div class="card-body p-0">
            <div v-if="todayScheduleList.length === 0" class="empty">今日无装机安排</div>
            <div v-for="sch in todayScheduleList" :key="sch.id" 
                 class="schedule-row clickable"
                 @click="router.push('/schedules/'+sch.id)">
              <div class="flex-between mb-8">
                <div class="flex gap-8 items-center flex-wrap">
                  <span class="tag" :class="scheduleTagClass(sch)">{{ scheduleStatusLabel(sch.status) }}</span>
                  <span v-if="sch.urgent" class="tag tag-red">🔥 急单</span>
                  <span class="font-semibold">{{ sch.id }}</span>
                </div>
                <span v-if="sch.anomaly" class="tag" :class="sch.anomaly.level==='danger' ? 'tag-red' : 'tag-yellow'">
                  ⚠️ {{ sch.anomaly.title.slice(0, 10) }}
                </span>
              </div>
              <div class="text-sm mb-8 truncate">{{ sch.customerName }} · {{ sch.usageType }}</div>
              <div class="flex-between text-xs text-muted mb-8">
                <span>销售: {{ sch.salesPerson }} | 装机师: {{ sch.technician || '待指派' }}</span>
                <span>完成日期: {{ sch.expectedComplete }}</span>
              </div>
              <div class="flex-between text-xs">
                <span class="text-muted">配件: {{ sch.partsReady }}/{{ sch.partsTotal }}</span>
                <span>
                  <span v-if="sch.priceChanged" class="text-danger font-semibold">💰 差价 ¥{{ sch.priceChangeDiff || 3200 }}</span>
                  <span v-else class="text-success">价格正常</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 其他待处理异常 -->
    <section class="mt-20" v-if="appStore.warningAnomalies.length > 0">
      <div class="section-title flex-between mb-12">
        <h2 class="font-semibold text-warning">⚠️ 待处理异常（{{ appStore.warningAnomalies.length }}）</h2>
        <button class="btn-link btn text-sm" @click="router.push('/anomalies')">查看全部 →</button>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div v-for="an in appStore.warningAnomalies" :key="an.id"
               class="anomaly-row clickable" @click="goDetail(an)">
            <div class="flex gap-12 items-center">
              <span class="tag tag-yellow">{{ an.type === 'shortage' ? '缺货' : an.type === 'batch_warning' ? '批次预警' : '价格' }}</span>
              <div class="flex-1">
                <div class="font-semibold">{{ an.title }}</div>
                <div class="text-sm text-muted">{{ an.description }}</div>
              </div>
              <div class="text-xs text-right">
                <div>责任人: <b>{{ an.responsible }}</b></div>
                <div v-if="an.deadline" class="text-warning mt-4">⏱️ {{ an.deadline }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据概览 -->
    <section class="mt-20">
      <h2 class="section-title font-semibold mb-12">📊 今日概览</h2>
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-label">待处理到货</div>
          <div class="stat-value text-primary">{{ appStore.pendingArrivals.length + appStore.partialArrivals.length }}</div>
          <div class="stat-change">
            <span class="text-success">待验 {{ appStore.pendingArrivals.length }}</span> · 
            <span class="text-warning">验收中 {{ appStore.partialArrivals.length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">今日装机任务</div>
          <div class="stat-value" style="color:#7c3aed">{{ appStore.todaySchedules.length }}</div>
          <div class="stat-change">
            <span class="text-success">装机中 {{ inProgressCount }}</span> · 
            <span class="text-warning">待排 {{ pendingCount }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">紧急异常</div>
          <div class="stat-value text-danger">{{ appStore.dangerAnomalies.length }}</div>
          <div class="stat-change">
            其他异常: <span class="text-warning">{{ appStore.warningAnomalies.length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">本周已完成装机</div>
          <div class="stat-value text-success">{{ completedCount }}</div>
          <div class="stat-change">
            平均交付及时
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'

const router = useRouter()
const appStore = useAppStore()

const pendingArrivalsList = computed(() => 
  [...appStore.arrivals].filter(a => a.status === 'pending' || a.status === 'partial')
    .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate))
)

const todayScheduleList = computed(() => 
  [...appStore.schedules].filter(s => s.status !== 'completed')
    .sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
      return a.expectedComplete.localeCompare(b.expectedComplete)
    })
)

const inProgressCount = computed(() => appStore.todaySchedules.filter(s => s.status === 'in_progress').length)
const pendingCount = computed(() => appStore.todaySchedules.filter(s => s.status === 'pending' || s.status === 'parts_missing').length)
const completedCount = computed(() => appStore.schedules.filter(s => s.status === 'completed').length)

function progressPct(arr) {
  return Math.round((arr.checkedItems / arr.totalItems) * 100)
}

function scheduleStatusLabel(s) {
  return { pending: '待排程', parts_missing: '待配件', in_progress: '装机中', completed: '已完成' }[s] || s
}
function scheduleTagClass(sch) {
  return { pending: 'tag-gray', parts_missing: 'tag-yellow', in_progress: 'tag-blue', completed: 'tag-green' }[sch.status] || 'tag-gray'
}

function goDetail(an) {
  if (an.relatedType === 'schedule') router.push('/schedules/' + an.relatedId)
  else if (an.relatedType === 'arrival') router.push('/arrivals/' + an.relatedId)
  else router.push('/anomalies')
}
</script>

<style scoped>
.section-title {
  font-size: 16px;
}
.mb-16 { margin-bottom: 16px; }
.mt-20 { margin-top: 20px; }
.mb-12 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 8px; }
.mt-8 { margin-top: 8px; }
.mt-4 { margin-top: 4px; }

.anomaly-card.danger {
  border-left: 4px solid var(--danger);
  background: linear-gradient(90deg, #fef2f2 0%, white 60%);
}
.anomaly-card.danger:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.anomaly-card {
  transition: all 0.15s;
  cursor: pointer;
}
.deadline {
  font-size: 13px;
  color: var(--danger);
}

.arrival-row, .schedule-row, .anomaly-row {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-100);
  transition: background 0.15s;
}
.arrival-row:last-child, .schedule-row:last-child, .anomaly-row:last-child { border-bottom: none; }
.arrival-row:hover, .schedule-row:hover, .anomaly-row:hover { background: var(--gray-50); }
.clickable { cursor: pointer; }

.progress-bar {
  height: 6px;
  background: var(--gray-100);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #60a5fa);
  border-radius: 3px;
  transition: width 0.3s;
}
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.flex-wrap { flex-wrap: wrap; }
</style>
