<template>
  <div v-if="plan" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="navigateTo('/plans')" class="btn-secondary text-sm">← 返回列表</button>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">📋 {{ plan.projectName }}</h2>
          <p class="text-gray-500 text-sm mt-1">{{ plan.projectCode }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="plan.stuck" class="status-badge bg-orange-600 text-white animate-pulse">
          🟠 已卡住
        </span>
        <span :class="['status-badge', getStatusColor(plan.status)]">
          {{ getStatusText(plan.status) }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">基本信息</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">关联勘察单</span>
              <div class="font-medium text-gray-900 mt-1">
                <button @click="navigateTo(`/surveys/${plan.survey?.id}`)" class="text-primary-600 hover:underline">
                  查看勘察单 →
                </button>
              </div>
            </div>
            <div>
              <span class="text-gray-500">预估成本</span>
              <div class="font-medium text-gray-900 mt-1">¥{{ formatMoney(plan.estimatedCost) }}</div>
            </div>
            <div>
              <span class="text-gray-500">施工工期</span>
              <div class="font-medium text-gray-900 mt-1">{{ plan.constructionDays }} 天</div>
            </div>
            <div>
              <span class="text-gray-500">截止日期</span>
              <div class="font-medium text-gray-900 mt-1">{{ formatDate(plan.deadline) }}</div>
            </div>
            <div>
              <span class="text-gray-500">创建人</span>
              <div class="font-medium text-gray-900 mt-1">{{ plan.createdBy?.realName }}</div>
            </div>
            <div>
              <span class="text-gray-500">处理人</span>
              <div v-if="canAssign" class="flex items-center gap-2 mt-1">
                <select v-model="selectedAssigneeId" class="input-field py-1 text-sm">
                  <option :value="null">未分配</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.realName }} ({{ getRoleText(u.role) }})
                  </option>
                </select>
                <button @click="handleAssign" class="btn-primary text-xs px-3 py-1">分配</button>
              </div>
              <div v-else class="font-medium text-gray-900 mt-1">{{ plan.assignedTo?.realName || '未分配' }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4">方案内容</h3>
          <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{{ plan.planContent }}</pre>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4">设备清单</h3>
          <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{{ plan.equipmentList }}</pre>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">📝 备注历史（含继承自勘察）</h3>
            <button @click="showAddRemark = true" class="btn-primary text-sm">➕ 添加备注</button>
          </div>
          <div class="space-y-4">
            <div v-for="remark in remarks" :key="remark.id" class="p-4 rounded-xl"
                 :class="remark.inherited ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ remark.createdByName }}</span>
                  <span v-if="remark.inherited" class="status-badge bg-blue-100 text-blue-700 text-xs">继承自勘察</span>
                </div>
                <span class="text-xs text-gray-500">{{ formatDate(remark.createdAt) }}</span>
              </div>
              <p class="text-sm" :class="remark.inherited ? 'text-blue-700' : 'text-gray-700'">{{ remark.content }}</p>
            </div>
            <div v-if="remarks.length === 0" class="text-center py-8 text-gray-500">
              暂无备注
            </div>
          </div>
        </div>

        <div v-if="authStore.isProjectManager" class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">📜 审计日志</h3>
            <span class="text-xs text-gray-500">仅项目经理可见</span>
          </div>
          <div class="space-y-3">
            <div v-for="log in auditLogs" :key="log.id" class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <div class="w-2 h-2 rounded-full bg-primary-500 mt-1.5"></div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ log.performedByName }}</span>
                  <span class="text-gray-400">·</span>
                  <span class="text-gray-500">{{ getActionText(log.action) }}</span>
                </div>
                <div class="text-gray-600 mt-1">{{ log.detail }}</div>
                <div class="text-gray-400 text-xs mt-1">{{ formatDate(log.performedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">⚡ 常用动作</h3>
          <div class="space-y-2">
            <template v-if="plan.status === 'PENDING' || plan.status === 'IN_PROGRESS'">
              <button @click="handleSubmit" class="w-full btn-primary text-left">
                📤 提交客户确认
              </button>
            </template>
            <template v-if="plan.status === 'SUBMITTED' || plan.status === 'CUSTOMER_REVIEWING'">
              <button v-if="canConfirm" @click="handleConfirm" class="w-full btn-primary text-left">
                ✅ 客户确认
              </button>
              <button v-if="canConfirm" @click="handleReject" class="w-full btn-danger text-left">
                ❌ 客户拒绝
              </button>
            </template>
            <template v-if="plan.status === 'REJECTED' || plan.status === 'REVISED'">
              <button @click="handleRevise" class="w-full btn-primary text-left">
                🔄 修改后重新提交
              </button>
            </template>
            <template v-if="plan.status !== 'STUCK' && plan.status !== 'CONFIRMED'">
              <button @click="handleMarkStuck" class="w-full btn-secondary text-left text-orange-600">
                🚩 标记为卡住
              </button>
            </template>
            <template v-if="plan.status === 'STUCK'">
              <button @click="handleUnstick" class="w-full btn-primary text-left">
                🔄 解除卡住
              </button>
            </template>
          </div>
        </div>

        <div class="card bg-blue-50 border border-blue-200">
          <h3 class="text-lg font-semibold mb-3 text-blue-700">📥 勘察备注继承</h3>
          <p class="text-sm text-blue-600 mb-3">
            本方案单已自动继承关联勘察单的所有备注，标注为「继承自勘察」
          </p>
          <div class="text-xs text-blue-500">
            继承备注数: {{ inheritedRemarkCount }} 条
          </div>
        </div>

        <div v-if="plan.status === 'CONFIRMED'" class="card bg-green-50 border border-green-200">
          <h3 class="text-lg font-semibold mb-2 text-green-700">✅ 已确认</h3>
          <p class="text-sm text-green-600">客户已于 {{ formatDate(plan.confirmedAt) }} 确认方案</p>
        </div>

        <div v-if="plan.stuck" class="card bg-orange-50 border border-orange-200">
          <h3 class="text-lg font-semibold mb-2 text-orange-700">🟠 卡住原因</h3>
          <p class="text-sm text-orange-600">{{ plan.stuckReason }}</p>
          <p class="text-xs text-orange-500 mt-2">卡住时间: {{ formatDate(plan.stuckAt) }}</p>
        </div>
      </div>
    </div>

    <div v-if="showAddRemark" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddRemark = false">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 class="text-xl font-semibold mb-4">添加备注</h3>
        <textarea 
          v-model="newRemark" 
          class="input-field" 
          rows="4" 
          placeholder="请输入备注内容..."
          autofocus
        ></textarea>
        <div class="flex justify-end gap-3 mt-4">
          <button @click="showAddRemark = false" class="btn-secondary">取消</button>
          <button @click="submitRemark" class="btn-primary">提交</button>
        </div>
      </div>
    </div>

    <div v-if="showStuckDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showStuckDialog = false">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 class="text-xl font-semibold mb-4">🚩 标记为卡住</h3>
        <p class="text-sm text-gray-600 mb-4">请说明卡住的原因，这将帮助团队快速定位问题</p>
        <textarea 
          v-model="stuckReason" 
          class="input-field" 
          rows="3" 
          placeholder="例如：客户对设备选型有异议，要求更换..."
          autofocus
        ></textarea>
        <div class="flex justify-end gap-3 mt-4">
          <button @click="showStuckDialog = false" class="btn-secondary">取消</button>
          <button @click="submitStuck" class="btn-primary">确认标记</button>
        </div>
      </div>
    </div>

    <div v-if="showRejectDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showRejectDialog = false">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 class="text-xl font-semibold mb-4">❌ 客户拒绝</h3>
        <p class="text-sm text-gray-600 mb-4">请说明客户拒绝的原因</p>
        <textarea 
          v-model="rejectReason" 
          class="input-field" 
          rows="3" 
          placeholder="请输入拒绝原因..."
          autofocus
        ></textarea>
        <div class="flex justify-end gap-3 mt-4">
          <button @click="showRejectDialog = false" class="btn-secondary">取消</button>
          <button @click="submitReject" class="btn-danger">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const plan = ref<any>(null)
const remarks = ref<any[]>([])
const auditLogs = ref<any[]>([])
const showAddRemark = ref(false)
const showStuckDialog = ref(false)
const showRejectDialog = ref(false)
const newRemark = ref('')
const stuckReason = ref('')
const rejectReason = ref('')
const users = ref<any[]>([])
const selectedAssigneeId = ref<number | null>(null)

const canConfirm = computed(() => authStore.isProjectManager)
const canAssign = computed(() => authStore.isProjectManager || authStore.isConstructionLeader)
const id = computed(() => route.params.id as string)

const inheritedRemarkCount = computed(() => 
  remarks.value.filter(r => r.inherited).length
)

watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadData()
  } else {
    navigateTo('/login')
  }
}, { immediate: true })

async function loadData() {
  if (!authStore.isLoggedIn) return
  plan.value = await apiRequest(`/plans/${id.value}`)
  remarks.value = await apiRequest(`/plans/${id.value}/remarks`)
  
  if (canAssign.value && users.value.length === 0) {
    try {
      users.value = await apiRequest('/users')
    } catch (e) {
      users.value = []
    }
  }
  
  selectedAssigneeId.value = plan.value.assignedTo?.id || null
  
  if (authStore.isProjectManager) {
    auditLogs.value = await apiRequest(`/audit/PLAN/${id.value}`)
  }
}

async function handleSubmit() {
  await apiRequest(`/plans/${id.value}/submit`, { method: 'POST' })
  loadData()
}

async function handleConfirm() {
  await apiRequest(`/plans/${id.value}/confirm`, { method: 'POST' })
  loadData()
}

async function handleReject() {
  showRejectDialog.value = true
}

async function submitReject() {
  await apiRequest(`/plans/${id.value}/reject`, { 
    method: 'POST', 
    body: { reason: rejectReason.value } 
  })
  showRejectDialog.value = false
  rejectReason.value = ''
  loadData()
}

async function handleRevise() {
  await apiRequest(`/plans/${id.value}/revise`, { method: 'POST' })
  loadData()
}

async function handleMarkStuck() {
  showStuckDialog.value = true
}

async function submitStuck() {
  await apiRequest(`/plans/${id.value}/stuck`, { 
    method: 'POST', 
    body: { reason: stuckReason.value } 
  })
  showStuckDialog.value = false
  stuckReason.value = ''
  loadData()
}

async function handleUnstick() {
  await apiRequest(`/plans/${id.value}/unstick`, { method: 'POST' })
  loadData()
}

async function submitRemark() {
  if (!newRemark.value.trim()) return
  await apiRequest(`/plans/${id.value}/remarks`, { 
    method: 'POST', 
    body: { remark: newRemark.value } 
  })
  showAddRemark.value = false
  newRemark.value = ''
  loadData()
}

function formatMoney(amount: number): string {
  return amount?.toLocaleString('zh-CN') || '-'
}

function getActionText(action: string): string {
  const map: Record<string, string> = {
    'CREATE': '创建',
    'UPDATE': '更新',
    'STATUS_CHANGE': '状态变更',
    'ADD_REMARK': '添加备注',
    'ASSIGN': '分配处理人',
    'APPROVE': '确认通过',
    'REJECT': '客户拒绝',
    'SUBMIT': '提交',
    'VIEW': '查看',
    'MARK_STUCK': '标记卡住',
    'UNSTICK': '解除卡住'
  }
  return map[action] || action
}

async function handleAssign() {
  await apiRequest(`/plans/${id.value}/assign`, {
    method: 'PATCH',
    body: { assignedToId: selectedAssigneeId.value }
  })
  loadData()
}

function getRoleText(role: string): string {
  const map: Record<string, string> = {
    'PROJECT_MANAGER': '项目经理',
    'CONSTRUCTION_LEADER': '施工队长',
    'AFTER_SALES_ENGINEER': '售后工程师'
  }
  return map[role] || role
}
</script>
