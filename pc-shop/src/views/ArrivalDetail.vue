<template>
  <div v-if="arrival" class="page-container">
    <div class="page-header">
      <div>
        <button class="btn btn-secondary btn-sm mb-8" @click="router.back()">← 返回</button>
        <h1 class="page-title">到货详情 - {{ arrival.id }}</h1>
        <p class="page-subtitle">供应商: {{ arrival.supplier }} | 采购单: {{ arrival.poNo }}</p>
      </div>
      <div class="flex gap-8">
        <button v-if="arrival.status !== 'completed'" class="btn btn-outline btn-sm" @click="showBatchLookup = true">
          🔍 查询批次
        </button>
        <button v-if="arrival.status !== 'completed'" class="btn btn-primary btn-sm" @click="toggleChecking">
          {{ isChecking ? '完成验收' : '开始验收' }}
        </button>
      </div>
    </div>

    <!-- 异常提醒 -->
    <div v-if="arrival.anomaly" class="card mb-16" :class="arrival.anomaly.level === 'danger' ? 'anomaly-danger' : 'anomaly-warning'">
      <div class="card-body">
        <div class="flex gap-12 items-start">
          <span class="text-2xl">⚠️</span>
          <div class="flex-1">
            <div class="flex-between mb-8">
              <span class="font-semibold text-lg">{{ arrival.anomaly.title }}</span>
              <span class="tag" :class="arrival.anomaly.level === 'danger' ? 'tag-red' : 'tag-yellow'">
                {{ arrival.anomaly.status === 'processing' ? '处理中' : '需关注' }}
              </span>
            </div>
            <p class="text-sm text-muted mb-12">{{ arrival.anomaly.description }}</p>
            <div class="flex-between text-xs text-muted">
              <span>上报人: {{ arrival.anomaly.reportedBy }} | {{ arrival.anomaly.reportedAt }}</span>
              <button v-if="relatedRepairs.length > 0" class="btn-link btn text-sm" @click="showRelatedRepairs = true">
                查看关联返修 ({{ relatedRepairs.length }})
              </button>
              <span v-else class="text-muted">关联返修: 0</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <!-- 基本信息 -->
      <div class="card mb-16">
        <div class="card-header"><h3 class="card-title">基本信息</h3></div>
        <div class="card-body">
          <div class="info-grid">
            <div><span class="label">状态</span><span class="tag" :class="statusTagClass(arrival.status)">{{ statusLabel(arrival.status) }}</span></div>
            <div><span class="label">验收进度</span><b>{{ arrival.checkedItems }} / {{ arrival.totalItems }} 项</b></div>
            <div><span class="label">预计到货</span>{{ arrival.expectedDate }}</div>
            <div><span class="label">实际到货</span>{{ arrival.actualDate || '-' }}</div>
            <div><span class="label">供应商</span>{{ arrival.supplier }}</div>
            <div><span class="label">联系方式</span>{{ arrival.supplierContact }}</div>
            <div><span class="label">收货人</span>{{ arrival.receivedBy || '-' }}</div>
            <div><span class="label">采购总额</span><b class="text-primary">¥{{ arrival.totalCost.toLocaleString() }}</b></div>
          </div>
        </div>
      </div>

      <!-- 操作历史 -->
      <div class="card mb-16">
        <div class="card-header">
          <h3 class="card-title">操作历史</h3>
          <button class="btn-link btn text-sm" @click="router.push('/history?target=arrival&id='+arrival.id)">查看全部 →</button>
        </div>
        <div class="card-body">
          <div class="timeline">
            <div v-for="(h, i) in arrival.history.slice().reverse()" :key="i" class="timeline-item">
              <div class="timeline-time">{{ h.time }}</div>
              <div class="timeline-content"><b>{{ h.action }}</b>{{ h.detail ? ' - ' + h.detail : '' }}</div>
              <div class="timeline-operator">操作人: {{ h.operator }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配件明细 -->
    <div class="card mb-16">
      <div class="card-header">
        <h3 class="card-title">配件明细</h3>
        <div class="text-sm text-muted">
          已验: {{ receivedSum }} / {{ totalQtySum }} 件 | 金额: ¥{{ receivedAmount.toLocaleString() }}
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>配件</th>
            <th>批次号</th>
            <th>订购数</th>
            <th>实收数</th>
            <th>单价</th>
            <th>金额</th>
            <th>备注</th>
            <th>批次风险</th>
            <th v-if="isChecking">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in arrival.items" :key="idx">
            <td>
              <div class="font-semibold">{{ item.name }}</div>
              <div class="text-xs text-muted">{{ item.partId }}</div>
            </td>
            <td>
              <a @click="lookupBatch(item.batchCode)" class="batch-code">{{ item.batchCode }}</a>
            </td>
            <td>{{ item.qty }}</td>
            <td>
              <span v-if="!isChecking">{{ item.received }}</span>
              <input v-else type="number" v-model.number="item.received" 
                     :max="item.qty" min="0" style="width:70px;padding:4px 8px" />
            </td>
            <td>¥{{ item.unitCost.toLocaleString() }}</td>
            <td class="font-semibold">¥{{ (item.unitCost * (item.received || 0)).toLocaleString() }}</td>
            <td>
              <span v-if="!isChecking" class="text-sm text-muted">{{ item.note || '-' }}</span>
              <input v-else type="text" v-model="item.note" placeholder="备注（短缺/破损等）" 
                     style="width:180px;padding:4px 8px;font-size:13px" />
            </td>
            <td>
              <span v-if="getBatchRisk(item.batchCode)" class="tag tag-red">
                ⚠️ {{ getBatchRisk(item.batchCode) }}起返修
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td v-if="isChecking">
              <button class="btn btn-outline btn-sm" @click="saveItem(idx)">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 批次查询弹窗 -->
  <div v-if="showBatchLookup" class="modal-mask" @click.self="showBatchLookup = false">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="font-semibold">🔍 批次信息查询</h3>
        <button class="close-btn" @click="showBatchLookup = false">×</button>
      </div>
      <div class="modal-body">
        <div class="mb-12">
          <input v-model="lookupCode" type="text" class="w-full" placeholder="输入批次号查询返修记录" />
        </div>
        <div v-if="batchLookupResult.length > 0">
          <h4 class="font-semibold mb-8">查询到 {{ batchLookupResult.length }} 条返修记录关联该批次</h4>
          <div v-for="r in batchLookupResult" :key="r.id" class="repair-item">
            <div class="flex-between mb-4">
              <span class="font-semibold text-danger">{{ r.id }}</span>
              <span class="tag" :class="r.status === 'resolved' ? 'tag-green' : 'tag-yellow'">
                {{ r.status === 'resolved' ? '已解决' : '处理中' }}
              </span>
            </div>
            <div class="text-sm"><b>问题:</b> {{ r.issue }}</div>
            <div class="text-sm text-muted mt-4">
              客户: {{ r.customerName }} | 处理人: {{ r.technician }} | 上报: {{ r.reportedAt }}
            </div>
            <div v-if="r.responsible" class="text-sm mt-4">
              <b>责任认定:</b> {{ r.responsible.person }} - {{ r.responsible.detail }}
              <span class="text-warning">（{{ r.responsible.costBorne }}）</span>
            </div>
          </div>
        </div>
        <div v-else-if="lookupCode" class="empty">
          <p class="text-success">✅ 批次 {{ lookupCode }} 暂无返修记录</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showBatchLookup = false">关闭</button>
      </div>
    </div>

    <!-- 关联返修弹窗 -->
    <div v-if="showRelatedRepairs" class="modal-mask" @click.self="showRelatedRepairs = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="font-semibold">🔗 关联返修记录 - 批次风险预警</h3>
          <button class="close-btn" @click="showRelatedRepairs = false">×</button>
        </div>
        <div class="modal-body">
          <div v-for="r in relatedRepairs" :key="r.id" class="repair-item">
            <div class="flex-between mb-4">
              <div>
                <span class="font-semibold text-danger">{{ r.id }}</span>
                <span class="tag tag-cyan" style="margin-left:8px">{{ r.batchCode }}</span>
                <span class="tag" :class="r.status === 'resolved' ? 'tag-green' : 'tag-yellow'" style="margin-left:6px">
                  {{ r.status === 'resolved' ? '已解决' : '处理中' }}
                </span>
              </div>
              <span class="text-xs text-muted">{{ r.reportedAt }}</span>
            </div>
            <div class="text-sm mb-4"><b>问题:</b> {{ r.issue }}</div>
            <div class="text-sm text-muted">
              客户: {{ r.customerName }} | 处理人: {{ r.technician }}
            </div>
            <div v-if="r.responsible" class="responsible-box mt-8">
              <b>责任认定:</b> {{ r.responsible.person }} - {{ r.responsible.detail }}
              <span class="tag tag-yellow" style="margin-left:6px">{{ r.responsible.costBorne }}</span>
            </div>
            <div v-if="r.deadline" class="text-sm mt-8">
              <span :class="isOverdue(r.deadline) ? 'text-danger font-semibold' : 'text-warning'">
                ⏱️ {{ isOverdue(r.deadline) ? '已超时' : '处理截止: ' + r.deadline }}
              </span>
            </div>
          </div>
          <div class="warning-tip mt-16">
            ⚠️ <b>注意:</b> 该批次配件后续出库时，系统将自动提醒装机师做额外压力测试
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRelatedRepairs = false">关闭</button>
          <button class="btn btn-primary" @click="goToAnomalies">查看所有异常 →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const auth = useAuthStore()

const arrival = computed(() => appStore.getArrivalById(route.params.id))
const isChecking = ref(false)

const showBatchLookup = ref(false)
const showRelatedRepairs = ref(false)
const lookupCode = ref('')

const relatedRepairs = computed(() => {
  if (!arrival.value) return []
  const codes = arrival.value.items.map(i => i.batchCode)
  return appStore.repairs.filter(r => codes.includes(r.batchCode))
})

const batchLookupResult = computed(() => {
  if (!lookupCode.value.trim()) return []
  return appStore.repairs.filter(r => r.batchCode.toLowerCase().includes(lookupCode.value.toLowerCase()))
})

const totalQtySum = computed(() => arrival.value?.items.reduce((s, i) => s + i.qty, 0) || 0)
const receivedSum = computed(() => arrival.value?.items.reduce((s, i) => s + (i.received || 0), 0) || 0)
const receivedAmount = computed(() => 
  arrival.value?.items.reduce((s, i) => s + i.unitCost * (i.received || 0), 0) || 0
)

function statusLabel(s) { return { pending:'待验收', partial:'验收中', completed:'已完成' }[s] || s }
function statusTagClass(s) { return { pending:'tag-cyan', partial:'tag-yellow', completed:'tag-green' }[s] || 'tag-gray' }

function getBatchRisk(code) {
  const count = appStore.repairs.filter(r => r.batchCode === code).length
  return count > 0 ? count : null
}

function lookupBatch(code) {
  lookupCode.value = code
  showBatchLookup.value = true
}

function isOverdue(deadline) {
  if (!deadline) return false
  return new Date(deadline.replace(/-/g, '/')).getTime() < Date.now()
}

function goToAnomalies() {
  showRelatedRepairs.value = false
  router.push('/anomalies')
}

function toggleChecking() {
  if (!isChecking.value) {
    isChecking.value = true
  } else {
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    appStore.confirmArrivalComplete(arrival.value.id, auth.userName || '王仓管', now)
    isChecking.value = false
  }
}

function saveItem(idx) {
  const item = arrival.value.items[idx]
  appStore.updateArrivalItemReceived(arrival.value.id, idx, item.received, item.note)
}
</script>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}
.info-grid > div {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--gray-100);
}
.info-grid .label {
  color: var(--gray-500);
  font-size: 13px;
  min-width: 70px;
}
.batch-code {
  font-family: monospace;
  font-size: 12px;
  background: var(--gray-50);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--primary);
}
.batch-code:hover { background: var(--primary-light); }

.anomaly-danger { background: linear-gradient(90deg, #fef2f2, white); border-left: 4px solid var(--danger); }
.anomaly-warning { background: linear-gradient(90deg, #fffbeb, white); border-left: 4px solid var(--warning); }

.repair-item {
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  margin-bottom: 10px;
}
.w-full { width: 100%; }
.mb-16 { margin-bottom: 16px; }
.mb-12 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 8px; }
.mt-4 { margin-top: 4px; }
.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mb-4 { margin-bottom: 4px; }

.responsible-box {
  font-size: 12px;
  padding: 8px 12px;
  background: var(--warning-light);
  border-radius: 6px;
}

.warning-tip {
  font-size: 12px;
  padding: 10px 14px;
  background: var(--warning-light);
  border-radius: 6px;
  color: #92400e;
}

.text-danger { color: var(--danger) !important; }
.text-warning { color: var(--warning) !important; }
.font-semibold { font-weight: 600; }
.text-sm { font-size: 13px; }
.text-xs { font-size: 11px; }
.text-muted { color: var(--gray-500); }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-12 { gap: 12px; }
</style>
