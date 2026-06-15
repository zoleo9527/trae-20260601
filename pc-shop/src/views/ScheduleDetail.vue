<template>
  <div v-if="schedule" class="page-container">
    <div class="page-header">
      <div>
        <button class="btn btn-secondary btn-sm mb-8" @click="router.back()">← 返回</button>
        <div class="flex gap-8 items-center">
          <h1 class="page-title">{{ schedule.id }}</h1>
          <span v-if="schedule.urgent" class="tag tag-red">🔥 急单</span>
          <span class="tag" :class="statusTagClass(schedule.status)">{{ statusLabel(schedule.status) }}</span>
        </div>
        <p class="page-subtitle">{{ schedule.customerName }} · {{ schedule.usageType }} · {{ schedule.customerPhone }}</p>
      </div>
      <div class="flex gap-8">
        <button v-if="schedule.anomaly" class="btn btn-outline btn-sm" @click="showHistoryModal = true">
          📜 责任时效
        </button>
        <button v-if="schedule.priceChanged" class="btn btn-warning btn-sm" @click="showPriceModal = true">
          💰 处理价格异常
        </button>
        <button v-if="schedule.status === 'in_progress'" class="btn btn-success btn-sm" @click="markCompleted">
          ✓ 标记完成
        </button>
      </div>
    </div>

    <!-- 异常提醒 -->
    <div v-if="schedule.anomaly" class="card mb-16 anomaly-block" :class="schedule.anomaly.level === 'danger' ? 'danger' : 'warning'">
      <div class="card-body">
        <div class="flex gap-12 items-start">
          <span class="text-2xl">{{ schedule.anomaly.level === 'danger' ? '🚨' : '⚠️' }}</span>
          <div class="flex-1">
            <div class="flex-between mb-8 flex-wrap">
              <span class="font-semibold text-lg">{{ schedule.anomaly.title }}</span>
              <div class="flex gap-8 items-center">
                <span v-if="schedule.anomaly.deadline" class="deadline-tag">
                  ⏱️ 截止: <b>{{ schedule.anomaly.deadline }}</b>
                </span>
                <button v-if="schedule.anomaly.type === 'price_change'" class="btn btn-primary btn-sm" @click="showPriceModal = true">
                  处理
                </button>
              </div>
            </div>
            <p class="text-sm text-muted mb-12">{{ schedule.anomaly.description }}</p>
            <div v-if="schedule.anomaly.relatedRepairs?.length" class="mb-12">
              <a @click="showRelatedRepairs = true" class="text-sm">
                🔗 查看关联返修记录 ({{ schedule.anomaly.relatedRepairs.length }})
              </a>
            </div>
            <div class="flex-between text-xs text-muted">
              <span>触发: {{ schedule.anomaly.operator }} | {{ schedule.anomaly.reportedAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2 mb-16">
      <!-- 订单信息 + 价格变更对比 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">订单信息</h3>
          <span v-if="schedule.priceChanged" class="tag tag-yellow">⚠️ 价格变更待确认</span>
        </div>
        <div class="card-body">
          <div class="info-grid mb-16">
            <div><span class="label">销售</span>{{ schedule.salesPerson }}</div>
            <div><span class="label">装机师</span>{{ schedule.technician || '<span class="text-muted">待指派</span>' }}</div>
            <div><span class="label">创建时间</span>{{ schedule.createdAt }}</div>
            <div><span class="label">预计完成</span>{{ schedule.expectedComplete }}</div>
            <div><span class="label">实际完成</span>{{ schedule.actualComplete || '-' }}</div>
            <div><span class="label">收款状态</span>
              <span v-if="schedule.remainingAmount > 0" class="text-warning">欠 ¥{{ schedule.remainingAmount.toLocaleString() }}</span>
              <span v-else class="text-success">已付清</span>
            </div>
          </div>

          <!-- 价格对比卡 -->
          <div class="price-compare">
            <h4 class="font-semibold mb-8 flex-between">
              <span>💵 价格追踪</span>
              <span v-if="schedule.priceChanged" class="tag tag-red">未确认差价</span>
              <span v-else class="tag tag-green">价格正常</span>
            </h4>
            <div class="price-rows">
              <div class="price-row">
                <span class="price-label">原总价</span>
                <span>¥{{ originalTotal.toLocaleString() }}</span>
              </div>
              <div class="price-row highlight" v-if="schedule.priceChanged">
                <span class="price-label">差价 (需补收)</span>
                <span class="text-danger font-bold">+ ¥{{ schedule.priceChangeDiff.toLocaleString() }}</span>
              </div>
              <div class="price-row final">
                <span class="price-label">当前应收</span>
                <span class="font-bold">¥{{ currentShouldBe.toLocaleString() }}</span>
              </div>
              <div class="price-row">
                <span class="price-label">当前账面总价</span>
                <span>¥{{ schedule.totalAmount.toLocaleString() }}</span>
              </div>
              <div class="price-row" v-if="schedule.priceChanged">
                <span class="price-label text-danger">⚠️ 账面漏记</span>
                <span class="text-danger font-bold">¥{{ schedule.priceChangeDiff.toLocaleString() }}</span>
              </div>
              <div class="divider" style="margin:8px 0"></div>
              <div class="price-row">
                <span class="price-label">已收款</span>
                <span class="text-success">¥{{ schedule.paidAmount.toLocaleString() }}</span>
              </div>
              <div class="price-row final">
                <span class="price-label">当前欠款</span>
                <span :class="schedule.remainingAmount > 0 ? 'text-warning font-bold' : 'text-success font-bold'">
                  ¥{{ schedule.remainingAmount.toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史操作 + 责任时效 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">操作历史 · 责任追踪</h3>
          <button class="btn-link btn text-sm" @click="router.push('/history?target=schedule&id='+schedule.id)">全部 →</button>
        </div>
        <div class="card-body">
          <div class="timeline">
            <div v-for="(h, i) in schedule.history.slice().reverse()" :key="i" class="timeline-item">
              <div class="flex-between">
                <div class="timeline-time">{{ h.time }}</div>
                <span class="responsibility-tag">{{ extractRole(h.operator) }}</span>
              </div>
              <div class="timeline-content">
                <b>{{ h.action }}</b>
                <span v-if="h.detail" class="text-muted"> - {{ h.detail }}</span>
              </div>
              <div class="timeline-operator">操作人: <b>{{ h.operator }}</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置配件清单 -->
    <div class="card mb-16">
      <div class="card-header">
        <h3 class="card-title">配置清单</h3>
        <div class="text-sm">
          共 {{ totalPieces }} 件 · 
          <span :class="schedule.partsReady === schedule.partsTotal ? 'text-success' : 'text-warning'">
            齐套 {{ schedule.partsReady }}/{{ schedule.partsTotal }}
          </span>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>配件</th>
            <th>数量</th>
            <th>原报价</th>
            <th>现报价</th>
            <th>差异</th>
            <th>批次关联</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, idx) in schedule.config" :key="idx" :class="c.originalPrice !== c.currentPrice ? 'changed-row' : ''">
            <td>
              <div class="font-semibold">{{ c.name }}</div>
              <div class="text-xs text-muted">{{ c.partId }}</div>
            </td>
            <td>x{{ c.qty }}</td>
            <td>¥{{ c.originalPrice.toLocaleString() }}</td>
            <td :class="c.originalPrice !== c.currentPrice ? 'font-semibold text-primary' : ''">
              ¥{{ c.currentPrice.toLocaleString() }}
            </td>
            <td>
              <span v-if="c.originalPrice !== c.currentPrice" class="tag" :class="(c.currentPrice - c.originalPrice) > 0 ? 'tag-red' : 'tag-green'">
                {{ (c.currentPrice - c.originalPrice) > 0 ? '+' : '' }}¥{{ ((c.currentPrice - c.originalPrice) * c.qty).toLocaleString() }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <div v-if="getRelatedBatches(c.partId).length > 0">
                <a v-for="b in getRelatedBatches(c.partId).slice(0, 1)" :key="b"
                   @click="lookupBatch(b)" class="batch-code">{{ b }}</a>
                <span v-if="getRelatedBatches(c.partId).length > 1" class="text-xs text-muted">等{{ getRelatedBatches(c.partId).length }}个</span>
              </div>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="text-sm text-muted">{{ c.note || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 关联到货单 -->
    <div class="card">
      <div class="card-header"><h3 class="card-title">📦 关联到货单</h3></div>
      <div class="card-body p-0">
        <div v-for="aid in schedule.arrivalsRef" :key="aid" class="arrival-link-row" @click="router.push('/arrivals/'+aid)">
          <div class="flex gap-8 items-center">
            <span class="tag tag-cyan">到货单</span>
            <b>{{ aid }}</b>
          </div>
          <button class="btn-link btn text-sm">查看 →</button>
        </div>
      </div>
    </div>

    <!-- 价格异常处理弹窗 -->
    <div v-if="showPriceModal" class="modal-mask" @click.self="showPriceModal = false">
      <div class="modal-content" style="max-width:560px">
        <div class="modal-header">
          <h3 class="font-semibold">💰 配置变更价格确认</h3>
          <button class="close-btn" @click="showPriceModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="price-alert mb-16">
            <p><b>系统检测到配置已变更，但销售未更新报价单</b></p>
            <p class="text-sm text-muted mt-4">请与客户确认差价并更新订单，避免结算纠纷</p>
          </div>

          <div class="info-highlight mb-16">
            <div class="flex-between py-8">
              <span>订单号</span><b>{{ schedule.id }}</b>
            </div>
            <div class="flex-between py-8">
              <span>客户</span><b>{{ schedule.customerName }}</b>
            </div>
            <div class="flex-between py-8">
              <span>销售责任人</span><b class="text-warning">{{ schedule.salesPerson }}（需补录差价）</b>
            </div>
          </div>

          <h4 class="font-semibold mb-8">变更明细:</h4>
          <div class="changed-list">
            <div v-for="c in changedItems" :key="c.partId" class="changed-item">
              <div class="flex-between">
                <span>{{ c.name }}</span>
                <span class="text-danger font-semibold">+ ¥{{ ((c.currentPrice - c.originalPrice) * c.qty).toLocaleString() }}</span>
              </div>
              <div class="text-xs text-muted">
                ¥{{ c.originalPrice.toLocaleString() }} → ¥{{ c.currentPrice.toLocaleString() }} x{{ c.qty }}
                <span v-if="c.note">（{{ c.note }}）</span>
              </div>
            </div>
          </div>

          <div class="divider"></div>
          <div class="flex-between text-lg">
            <span class="font-semibold">需补收差价:</span>
            <span class="text-danger font-bold text-xl">¥{{ priceDiff.toLocaleString() }}</span>
          </div>

          <div class="form-row mt-16">
            <label class="form-label">确认方式</label>
            <div class="form-input">
              <select v-model="confirmMethod" style="width:100%">
                <option value="cash">客户现场补交现金/转账</option>
                <option value="internal">内部记账，销售跟进</option>
                <option value="waive">经店长审批免差价</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showPriceModal = false">稍后处理</button>
          <button class="btn btn-danger" @click="handleConfirm(false)">标记为争议</button>
          <button class="btn btn-primary" @click="handleConfirm(true)">已确认，更新订单</button>
        </div>
      </div>
    </div>

    <!-- 关联返修弹窗 -->
    <div v-if="showRelatedRepairs" class="modal-mask" @click.self="showRelatedRepairs = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="font-semibold">🔗 关联返修记录（批次蓝屏风险）</h3>
          <button class="close-btn" @click="showRelatedRepairs = false">×</button>
        </div>
        <div class="modal-body">
          <div v-for="r in relatedRepairsDetail" :key="r.id" class="repair-card">
            <div class="flex-between mb-8">
              <div>
                <span class="font-semibold text-danger">{{ r.id }}</span>
                <span class="tag tag-yellow" style="margin-left:8px">{{ r.mainPart }}</span>
              </div>
              <span class="tag" :class="r.status === 'resolved' ? 'tag-green' : 'tag-yellow'">
                {{ r.status === 'resolved' ? '已解决' : '处理中' }}
              </span>
            </div>
            <p class="text-sm mb-8"><b>问题:</b> {{ r.issue }}</p>
            <div class="sla-bar">
              <div class="flex-between text-xs text-muted mb-4">
                <span>SLA: {{ r.slaHours }}小时 | 实际: {{ r.actualHours }}小时</span>
                <span v-if="r.deadline" class="text-danger">
                  ⏱️ 处理截止: {{ r.deadline }}
                </span>
              </div>
              <div style="height:4px;background:var(--gray-100);border-radius:2px;overflow:hidden">
                <div style="height:100%;background:var(--danger);border-radius:2px"
                     :style="{width: Math.min(100, (r.actualHours/r.slaHours)*100) + '%'}"></div>
              </div>
            </div>
            <div v-if="r.responsible" class="responsible mt-8">
              <b>责任认定:</b> {{ r.responsible.person }} - {{ r.responsible.detail }}
              <span class="tag tag-yellow" style="margin-left:6px">{{ r.responsible.costBorne }}</span>
            </div>
            <div class="text-xs text-muted mt-8">
              客户: {{ r.customerName }} | 处理: {{ r.technician }} | 上报: {{ r.reportedAt }}
            </div>
          </div>
          <div class="warning-tip mt-16">
            ⚠️ <b>装机师注意:</b> 当前订单使用了同批次配件，必须完成4小时压力测试并记录后方可交付
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showRelatedRepairs = false">我已知晓</button>
        </div>
      </div>
    </div>

    <!-- 责任时效弹窗 -->
    <div v-if="showHistoryModal" class="modal-mask" @click.self="showHistoryModal = false">
      <div class="modal-content" style="max-width:640px">
        <div class="modal-header">
          <h3 class="font-semibold">📜 责任时效追踪 - {{ schedule.id }}</h3>
          <button class="close-btn" @click="showHistoryModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="schedule.anomaly" class="mb-16">
            <div class="anomaly-summary" :class="schedule.anomaly.level === 'danger' ? 'danger' : 'warning'">
              <div class="flex-between mb-8">
                <span class="font-semibold">
                  {{ schedule.anomaly.type === 'price_change' ? '💰 价格异常' : 
                     schedule.anomaly.type === 'bsod_risk' ? '🔵 蓝屏返修风险' : '⚠️ 异常' }}
                  : {{ schedule.anomaly.title }}
                </span>
                <span class="tag" :class="schedule.anomaly.level === 'danger' ? 'tag-red' : 'tag-yellow'">
                  {{ schedule.anomaly.level === 'danger' ? '紧急' : '一般' }}
                </span>
              </div>
              <p class="text-sm text-muted">{{ schedule.anomaly.description }}</p>
              <div v-if="schedule.anomaly.deadline" class="mt-8">
                <div class="flex-between text-xs text-muted mb-4">
                  <span>触发: {{ schedule.anomaly.operator }} | {{ schedule.anomaly.reportedAt }}</span>
                  <span :class="isOverdue(schedule.anomaly.deadline) ? 'text-danger font-semibold' : 'text-warning'">
                    ⏱️ 处理截止: {{ schedule.anomaly.deadline }}
                    {{ isOverdue(schedule.anomaly.deadline) ? '（已超时）' : '' }}
                  </span>
                </div>
                <div style="height:6px;background:var(--gray-100);border-radius:3px;overflow:hidden">
                  <div style="height:100%;border-radius:3px"
                       :class="isOverdue(schedule.anomaly.deadline) ? 'bg-danger' : 'bg-warning'"
                       :style="{width: slaProgress(schedule.anomaly.reportedAt, schedule.anomaly.deadline) + '%'}"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="relatedRepairsAll.length > 0" class="mb-16">
            <h4 class="font-semibold mb-8">🔗 关联返修记录（{{ relatedRepairsAll.length }} 条）</h4>
            <div v-for="r in relatedRepairsAll" :key="r.id" class="repair-card-mini">
              <div class="flex-between mb-4">
                <div>
                  <span class="font-semibold text-danger">{{ r.id }}</span>
                  <span class="tag" :class="r.status === 'resolved' ? 'tag-green' : 'tag-yellow'" style="margin-left:8px">
                    {{ r.status === 'resolved' ? '已解决' : '处理中' }}
                  </span>
                  <span class="tag tag-cyan" style="margin-left:6px">{{ r.batchCode }}</span>
                </div>
                <span class="text-xs text-muted">{{ r.reportedAt }}</span>
              </div>
              <div class="text-sm mb-4"><b>问题:</b> {{ r.issue }}</div>
              <div class="flex-between">
                <div class="text-xs text-muted">
                  客户: {{ r.customerName }} | 处理人: {{ r.technician }}
                </div>
                <span v-if="r.status === 'resolved'" class="text-xs text-success">
                  解决: {{ r.resolvedAt }}
                </span>
              </div>
              <div v-if="r.responsible" class="responsible-box mt-8">
                <b>责任认定:</b> {{ r.responsible.person }} - {{ r.responsible.detail }}
                <span class="tag tag-yellow" style="margin-left:6px">{{ r.responsible.costBorne }}</span>
              </div>
              <div class="sla-mini mt-8">
                <div class="flex-between text-xs text-muted mb-2">
                  <span>SLA: {{ r.slaHours }}小时 | 实际: {{ r.actualHours }}小时</span>
                  <span v-if="r.deadline" :class="isOverdue(r.deadline) ? 'text-danger' : 'text-warning'">
                    ⏱️ {{ isOverdue(r.deadline) ? '已超时' : '截止: ' + r.deadline }}
                  </span>
                </div>
                <div style="height:4px;background:var(--gray-100);border-radius:2px;overflow:hidden">
                  <div style="height:100%;border-radius:2px"
                       :class="r.actualHours > r.slaHours ? 'bg-danger' : r.actualHours > r.slaHours * 0.8 ? 'bg-warning' : 'bg-success'"
                       :style="{width: Math.min(100, (r.actualHours/r.slaHours)*100) + '%'}"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty">该订单暂无关联返修记录</div>

          <div class="divider"></div>

          <h4 class="font-semibold mb-8">⏱️ 处理时效统计</h4>
          <div class="grid-3">
            <div class="stat-card">
              <div class="stat-label">平均修复时长</div>
              <div class="stat-value text-primary">{{ avgRepairHours }}h</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">SLA达标率</div>
              <div class="stat-value" :class="slaPassRate >= 80 ? 'text-success' : 'text-danger'">{{ slaPassRate }}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">成本承担</div>
              <div class="stat-value text-warning">{{ costBorneSummary }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showHistoryModal = false">关闭</button>
          <button class="btn btn-primary" @click="router.push('/history?target=schedule&id='+schedule.id)">查看完整历史 →</button>
        </div>
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
              <div v-if="r.deadline" class="text-sm mt-4">
                <span :class="isOverdue(r.deadline) ? 'text-danger' : 'text-warning'">
                  ⏱️ {{ isOverdue(r.deadline) ? '已超时' : '处理截止: ' + r.deadline }}
                </span>
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

const schedule = computed(() => appStore.getScheduleById(route.params.id))
const showPriceModal = ref(false)
const showRelatedRepairs = ref(false)
const showHistoryModal = ref(false)
const showBatchLookup = ref(false)
const lookupCode = ref('')
const confirmMethod = ref('cash')

const changedItems = computed(() => schedule.value?.config.filter(c => c.originalPrice !== c.currentPrice) || [])
const originalTotal = computed(() => schedule.value?.config.reduce((s, c) => s + c.originalPrice * c.qty, 0) || 0)
const currentShouldBe = computed(() => schedule.value?.config.reduce((s, c) => s + c.currentPrice * c.qty, 0) || 0)
const priceDiff = computed(() => currentShouldBe.value - originalTotal.value)
const totalPieces = computed(() => schedule.value?.config.reduce((s, c) => s + c.qty, 0) || 0)

const relatedRepairsDetail = computed(() => {
  if (!schedule.value?.anomaly?.relatedRepairs) return []
  return appStore.repairs.filter(r => schedule.value.anomaly.relatedRepairs.includes(r.id))
})

const batchLookupResult = computed(() => {
  if (!lookupCode.value.trim()) return []
  return appStore.repairs.filter(r => r.batchCode.toLowerCase().includes(lookupCode.value.toLowerCase()))
})

const relatedRepairsAll = computed(() => {
  const codes = new Set()
  for (const c of schedule.value?.config || []) {
    for (const aid of schedule.value?.arrivalsRef || []) {
      const arr = appStore.getArrivalById(aid)
      if (!arr) continue
      for (const it of arr.items) {
        if (it.partId === c.partId && it.batchCode) codes.add(it.batchCode)
      }
    }
  }
  if (codes.size === 0) return []
  return appStore.repairs.filter(r => [...codes].some(c => r.batchCode === c))
})

function statusLabel(s) {
  return { pending: '待排程', parts_missing: '待配件', in_progress: '装机中', completed: '已完成' }[s] || s
}
function statusTagClass(s) {
  return { pending: 'tag-gray', parts_missing: 'tag-yellow', in_progress: 'tag-blue', completed: 'tag-green' }[s] || 'tag-gray'
}

function getRelatedBatches(partId) {
  const batches = []
  for (const aid of schedule.value?.arrivalsRef || []) {
    const arr = appStore.getArrivalById(aid)
    if (!arr) continue
    for (const it of arr.items) {
      if (it.partId === partId && it.batchCode && !batches.includes(it.batchCode)) {
        batches.push(it.batchCode)
      }
    }
  }
  return batches
}

function extractRole(name) {
  if (name.includes('销售')) return '<span class="tag tag-cyan">销售</span>'
  if (name.includes('仓管') || name.includes('仓库')) return '<span class="tag tag-green">仓储</span>'
  if (name.includes('工') || name.includes('技')) return '<span class="tag tag-purple">技术</span>'
  if (name.includes('店长') || name.includes('经理')) return '<span class="tag tag-blue">管理</span>'
  if (name.includes('客服')) return '<span class="tag tag-yellow">售后</span>'
  return '<span class="tag tag-gray">系统</span>'
}

function lookupBatch(code) {
  lookupCode.value = code
  showBatchLookup.value = true
}

function handleConfirm(confirmed) {
  appStore.confirmPriceChange(schedule.value.id, confirmed, auth.userName || '张店长', confirmMethod.value)
  showPriceModal.value = false
}

function markCompleted() {
  if (confirm('确认标记为装机完成？')) {
    appStore.updateScheduleStatus(schedule.value.id, 'completed', auth.userName || '陈工')
  }
}

function isOverdue(deadline) {
  if (!deadline) return false
  return new Date(deadline.replace(/-/g, '/')).getTime() < Date.now()
}

function slaProgress(start, end) {
  if (!start || !end) return 50
  const s = new Date(start.replace(/-/g, '/')).getTime()
  const e = new Date(end.replace(/-/g, '/')).getTime()
  const now = Date.now()
  return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)))
}

const avgRepairHours = computed(() => {
  if (relatedRepairsAll.value.length === 0) return 0
  const sum = relatedRepairsAll.value.reduce((s, r) => s + r.actualHours, 0)
  return Math.round(sum / relatedRepairsAll.value.length)
})

const slaPassRate = computed(() => {
  if (relatedRepairsAll.value.length === 0) return 100
  const passed = relatedRepairsAll.value.filter(r => r.actualHours <= r.slaHours).length
  return Math.round((passed / relatedRepairsAll.value.length) * 100)
})

const costBorneSummary = computed(() => {
  if (relatedRepairsAll.value.length === 0) return '-'
  const supplier = relatedRepairsAll.value.filter(r => r.responsible?.person === '供应商').length
  const internal = relatedRepairsAll.value.filter(r => r.responsible?.person !== '供应商' && r.responsible).length
  if (supplier > internal) return `供应商 ${supplier} 次`
  if (internal > supplier) return `店内 ${internal} 次`
  return `各 ${supplier} 次`
})
</script>

<style scoped>
.anomaly-block.danger { background: linear-gradient(90deg, #fef2f2, white); border-left: 4px solid var(--danger); }
.anomaly-block.warning { background: linear-gradient(90deg, #fffbeb, white); border-left: 4px solid var(--warning); }
.deadline-tag {
  background: var(--danger-light);
  color: var(--danger);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}
.info-grid > div {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--gray-100);
}
.info-grid .label {
  color: var(--gray-500);
  font-size: 13px;
  min-width: 80px;
}

.price-compare {
  background: var(--gray-50);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--gray-200);
}
.price-rows { display: flex; flex-direction: column; gap: 8px; }
.price-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}
.price-row.highlight {
  background: var(--danger-light);
  margin: 0 -16px;
  padding: 8px 16px;
}
.price-row.final {
  border-top: 1px solid var(--gray-200);
  padding-top: 10px;
  margin-top: 4px;
}
.price-label { color: var(--gray-500); }

.changed-row { background: #fffbeb; }
.batch-code {
  font-family: monospace;
  font-size: 12px;
  background: var(--gray-50);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--primary);
}
.batch-code:hover { background: var(--primary-light); cursor: pointer; }

.arrival-link-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
}
.arrival-link-row:hover { background: var(--gray-50); }
.arrival-link-row:last-child { border-bottom: none; }

.price-alert {
  background: var(--warning-light);
  border: 1px solid var(--warning);
  border-radius: 8px;
  padding: 12px 16px;
}
.info-highlight {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 12px 16px;
}
.py-8 { padding: 4px 0; padding-left: 0; padding-right: 0; }

.changed-list { display: flex; flex-direction: column; gap: 10px; }
.changed-item {
  padding: 10px 12px;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  background: white;
}

.repair-card {
  padding: 14px;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  margin-bottom: 12px;
  background: white;
}
.responsible {
  font-size: 13px;
  padding: 8px 12px;
  background: var(--warning-light);
  border-radius: 6px;
}
.warning-tip {
  background: var(--danger-light);
  color: var(--danger);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
}

.divider { height: 1px; background: var(--gray-200); margin: 16px 0; }
.mb-16 { margin-bottom: 16px; }
.mb-12 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 8px; }
.mt-8 { margin-top: 8px; }
.mt-4 { margin-top: 4px; }
.mt-16 { margin-top: 16px; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.flex-wrap { flex-wrap: wrap; }
.responsibility-tag :deep(span) { font-size: 11px; padding: 1px 6px; }

.anomaly-summary {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.anomaly-summary.danger {
  background: var(--danger-light);
  border-left: 3px solid var(--danger);
}
.anomaly-summary.warning {
  background: var(--warning-light);
  border-left: 3px solid var(--warning);
}

.bg-danger { background: var(--danger) !important; }
.bg-warning { background: var(--warning) !important; }
.bg-success { background: var(--success) !important; }

.repair-card-mini {
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  margin-bottom: 10px;
  background: white;
}

.responsible-box {
  font-size: 12px;
  padding: 8px 12px;
  background: var(--warning-light);
  border-radius: 6px;
}

.sla-mini {
  padding-top: 8px;
  border-top: 1px dashed var(--gray-200);
}

.w-full { width: 100%; }
.mb-12 { margin-bottom: 12px; }
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.repair-item {
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 20px;
}
.stat-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 4px;
}
</style>
