<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">🛠️ 装机排程</h1>
        <p class="page-subtitle">排程管理、配置变更追踪、责任时效记录</p>
      </div>
      <div class="flex gap-8">
        <select v-model="filterStatus" class="form-select-sm">
          <option value="all">全部状态</option>
          <option value="pending">待排程</option>
          <option value="parts_missing">待配件</option>
          <option value="in_progress">装机中</option>
          <option value="completed">已完成</option>
        </select>
        <button class="btn btn-secondary btn-sm" disabled title="后端集成点：对接CRM/销售系统创建订单">
          + 新建装机单
        </button>
      </div>
    </div>

    <div class="grid-4 mb-16">
      <div class="stat-card">
        <div class="stat-label">待排程</div>
        <div class="stat-value" style="color:var(--gray-600)">{{ countBy('pending') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">待配件</div>
        <div class="stat-value text-warning">{{ countBy('parts_missing') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">装机中</div>
        <div class="stat-value text-primary">{{ countBy('in_progress') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">价格异常</div>
        <div class="stat-value text-danger">{{ priceAnomalyCount }}</div>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户/用途</th>
            <th>金额</th>
            <th>状态</th>
            <th>装机师</th>
            <th>配件齐套</th>
            <th>异常</th>
            <th>预计完成</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sch in filteredList" :key="sch.id">
            <td>
              <a @click="goDetail(sch.id)" class="font-semibold">{{ sch.id }}</a>
              <span v-if="sch.urgent" class="tag tag-red" style="margin-left:6px">🔥 急</span>
            </td>
            <td>
              <div class="font-semibold">{{ sch.customerName }}</div>
              <div class="text-xs text-muted">{{ sch.usageType }} · {{ sch.customerPhone }}</div>
            </td>
            <td>
              <div class="font-semibold">¥{{ sch.totalAmount.toLocaleString() }}</div>
              <div class="text-xs" :class="sch.remainingAmount > 0 ? 'text-warning' : 'text-success'">
                {{ sch.remainingAmount > 0 ? '欠 ¥' + sch.remainingAmount.toLocaleString() : '已付清' }}
              </div>
            </td>
            <td>
              <span class="tag" :class="statusTagClass(sch.status)">{{ statusLabel(sch.status) }}</span>
            </td>
            <td class="text-sm">{{ sch.technician || '<span class="text-muted">待指派</span>' }}</td>
            <td>
              <div class="flex gap-8 items-center">
                <div style="width:60px;height:6px;background:var(--gray-100);border-radius:3px;overflow:hidden">
                  <div class="progress-fill" :style="{width: Math.round(sch.partsReady/sch.partsTotal*100) + '%'}"></div>
                </div>
                <span class="text-xs">{{ sch.partsReady }}/{{ sch.partsTotal }}</span>
              </div>
            </td>
            <td>
              <span v-if="sch.anomaly" class="tag" :class="sch.anomaly.level === 'danger' ? 'tag-red' : 'tag-yellow'">
                ⚠️ {{ sch.anomaly.type === 'price_change' ? '漏算价' : sch.anomaly.type === 'bsod_risk' ? '批次风险' : '异常' }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="text-sm">{{ sch.expectedComplete }}</td>
            <td>
              <div class="flex gap-8">
                <button class="btn-link btn text-sm" @click="goDetail(sch.id)">查看</button>
                <button v-if="!sch.technician && sch.partsReady === sch.partsTotal" 
                        class="btn-link btn text-sm" @click="assignTech(sch)">指派</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 指派装机师弹窗 -->
    <div v-if="showAssignModal" class="modal-mask" @click.self="showAssignModal = false">
      <div class="modal-content" style="max-width:420px">
        <div class="modal-header">
          <h3 class="font-semibold">指派装机师 - {{ targetSch?.id }}</h3>
          <button class="close-btn" @click="showAssignModal = false">×</button>
        </div>
        <div class="modal-body">
          <select v-model="selectedTech" class="w-full mb-16">
            <option value="">请选择装机师</option>
            <option value="陈工">陈工</option>
            <option value="李工">李工</option>
          </select>
          <div class="text-sm text-muted">
            当前订单: <b>{{ targetSch?.customerName }}</b> · {{ targetSch?.usageType }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAssignModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmAssign">确认指派</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const appStore = useAppStore()
const auth = useAuthStore()

const filterStatus = ref('all')
const showAssignModal = ref(false)
const targetSch = ref(null)
const selectedTech = ref('')

const filteredList = computed(() => {
  let list = [...appStore.schedules]
  if (filterStatus.value !== 'all') list = list.filter(s => s.status === filterStatus.value)
  return list.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    return a.expectedComplete.localeCompare(b.expectedComplete)
  })
})

const priceAnomalyCount = computed(() => appStore.schedules.filter(s => s.priceChanged).length)
const countBy = (s) => appStore.schedules.filter(x => x.status === s).length

function statusLabel(s) {
  return { pending: '待排程', parts_missing: '待配件', in_progress: '装机中', completed: '已完成' }[s] || s
}
function statusTagClass(s) {
  return { pending: 'tag-gray', parts_missing: 'tag-yellow', in_progress: 'tag-blue', completed: 'tag-green' }[s] || 'tag-gray'
}

function goDetail(id) { router.push('/schedules/' + id) }

function assignTech(sch) {
  targetSch.value = sch
  selectedTech.value = ''
  showAssignModal.value = true
}

function confirmAssign() {
  if (targetSch.value && selectedTech.value) {
    appStore.assignTechnician(targetSch.value.id, selectedTech.value, auth.userName || '张店长')
    appStore.updateScheduleStatus(targetSch.value.id, 'in_progress', auth.userName || '张店长')
    showAssignModal.value = false
  }
}
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #60a5fa);
  border-radius: 3px;
}
.form-select-sm { padding: 6px 10px; font-size: 13px; }
.gap-8 { gap: 8px; }
.w-full { width: 100%; }
</style>
