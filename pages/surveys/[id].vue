<template>
  <div v-if="survey" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="navigateTo('/surveys')" class="btn-secondary text-sm">← 返回列表</button>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">📍 {{ survey.projectName }}</h2>
          <p class="text-gray-500 text-sm mt-1">{{ survey.projectCode }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="survey.stuck" class="status-badge bg-red-600 text-white animate-pulse">
          🔴 已卡住
        </span>
        <span :class="['status-badge', getStatusColor(survey.status)]">
          {{ getStatusText(survey.status) }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">基本信息</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">客户名称</span>
              <div class="font-medium text-gray-900 mt-1">{{ survey.customerName }}</div>
            </div>
            <div>
              <span class="text-gray-500">项目地址</span>
              <div class="font-medium text-gray-900 mt-1">{{ survey.address }}</div>
            </div>
            <div>
              <span class="text-gray-500">点位数量</span>
              <div class="font-medium text-gray-900 mt-1">{{ survey.pointCount }} 个</div>
            </div>
            <div>
              <span class="text-gray-500">截止日期</span>
              <div class="font-medium text-gray-900 mt-1">{{ formatDate(survey.deadline) }}</div>
            </div>
            <div>
              <span class="text-gray-500">创建人</span>
              <div class="font-medium text-gray-900 mt-1">{{ survey.createdBy?.realName }}</div>
            </div>
            <div>
              <span class="text-gray-500">处理人</span>
              <div class="font-medium text-gray-900 mt-1">{{ survey.assignedTo?.realName || '未分配' }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4">点位描述</h3>
          <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{{ survey.pointDescription }}</pre>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">📝 备注历史</h3>
            <button @click="showAddRemark = true" class="btn-primary text-sm">➕ 添加备注</button>
          </div>
          <div class="space-y-4">
            <div v-for="remark in remarks" :key="remark.id" class="p-4 bg-gray-50 rounded-xl">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ remark.createdByName }}</span>
                  <span v-if="remark.inherited" class="status-badge bg-blue-100 text-blue-700 text-xs">继承</span>
                </div>
                <span class="text-xs text-gray-500">{{ formatDate(remark.createdAt) }}</span>
              </div>
              <p class="text-sm text-gray-700">{{ remark.content }}</p>
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
            <template v-if="survey.status === 'PENDING' || survey.status === 'IN_PROGRESS'">
              <button @click="handleSubmit" class="w-full btn-primary text-left">
                📤 提交审核
              </button>
            </template>
            <template v-if="survey.status === 'SUBMITTED' || survey.status === 'REVIEWING'">
              <button v-if="canApprove" @click="handleApprove" class="w-full btn-primary text-left">
                ✅ 审核通过
              </button>
              <button v-if="canApprove" @click="handleReject" class="w-full btn-danger text-left">
                ❌ 审核拒绝
              </button>
            </template>
            <template v-if="survey.status === 'APPROVED'">
              <button @click="goToCreatePlan" class="w-full btn-primary text-left">
                📋 生成方案确认单
              </button>
            </template>
            <template v-if="survey.status !== 'STUCK'">
              <button @click="handleMarkStuck" class="w-full btn-secondary text-left text-orange-600">
                🚩 标记为卡住
              </button>
            </template>
            <template v-if="survey.status === 'STUCK'">
              <button @click="handleUnstick" class="w-full btn-primary text-left">
                🔄 解除卡住
              </button>
            </template>
          </div>
        </div>

        <div v-if="survey.status === 'APPROVED'" class="card">
          <h3 class="text-lg font-semibold mb-4">📋 关联方案</h3>
          <div v-if="relatedPlan" class="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-green-900">方案确认单已创建</div>
                <div class="text-sm text-green-600 mt-1">状态: {{ getStatusText(relatedPlan.status) }}</div>
              </div>
              <button @click="navigateTo(`/plans/${relatedPlan.id}`)" class="text-primary-600 font-medium text-sm">
                查看 →
              </button>
            </div>
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            尚未创建方案确认单
          </div>
        </div>

        <div v-if="survey.stuck" class="card bg-red-50 border border-red-200">
          <h3 class="text-lg font-semibold mb-2 text-red-700">🔴 卡住原因</h3>
          <p class="text-sm text-red-600">{{ survey.stuckReason }}</p>
          <p class="text-xs text-red-500 mt-2">卡住时间: {{ formatDate(survey.stuckAt) }}</p>
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
          placeholder="例如：客户需求变更，需重新评估..."
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
        <h3 class="text-xl font-semibold mb-4">❌ 审核拒绝</h3>
        <p class="text-sm text-gray-600 mb-4">请说明拒绝的原因</p>
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
const survey = ref<any>(null)
const remarks = ref<any[]>([])
const auditLogs = ref<any[]>([])
const relatedPlan = ref<any>(null)
const showAddRemark = ref(false)
const showStuckDialog = ref(false)
const showRejectDialog = ref(false)
const newRemark = ref('')
const stuckReason = ref('')
const rejectReason = ref('')

const canApprove = computed(() => authStore.isProjectManager)
const id = computed(() => route.params.id as string)

watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadData()
  } else {
    navigateTo('/login')
  }
}, { immediate: true })

async function loadData() {
  if (!authStore.isLoggedIn) return
  survey.value = await apiRequest(`/surveys/${id.value}`)
  remarks.value = await apiRequest(`/surveys/${id.value}/remarks`)
  
  if (authStore.isProjectManager) {
    auditLogs.value = await apiRequest(`/audit/SURVEY/${id.value}`)
  }
  
  if (survey.value.status === 'APPROVED') {
    try {
      relatedPlan.value = await apiRequest(`/plans/survey/${id.value}`)
    } catch (e) {
      relatedPlan.value = null
    }
  }
}

async function handleSubmit() {
  await apiRequest(`/surveys/${id.value}/submit`, { method: 'POST' })
  loadData()
}

async function handleApprove() {
  await apiRequest(`/surveys/${id.value}/approve`, { method: 'POST' })
  loadData()
}

async function handleReject() {
  showRejectDialog.value = true
}

async function submitReject() {
  await apiRequest(`/surveys/${id.value}/reject`, { 
    method: 'POST', 
    body: { reason: rejectReason.value } 
  })
  showRejectDialog.value = false
  rejectReason.value = ''
  loadData()
}

async function handleMarkStuck() {
  showStuckDialog.value = true
}

async function submitStuck() {
  await apiRequest(`/surveys/${id.value}/stuck`, { 
    method: 'POST', 
    body: { reason: stuckReason.value } 
  })
  showStuckDialog.value = false
  stuckReason.value = ''
  loadData()
}

async function handleUnstick() {
  await apiRequest(`/surveys/${id.value}/unstick`, { method: 'POST' })
  loadData()
}

async function submitRemark() {
  if (!newRemark.value.trim()) return
  await apiRequest(`/surveys/${id.value}/remarks`, { 
    method: 'POST', 
    body: { remark: newRemark.value } 
  })
  showAddRemark.value = false
  newRemark.value = ''
  loadData()
}

function goToCreatePlan() {
  navigateTo({
    path: '/plans/new',
    query: { surveyId: id.value }
  })
}

function getActionText(action: string): string {
  const map: Record<string, string> = {
    'CREATE': '创建',
    'UPDATE': '更新',
    'STATUS_CHANGE': '状态变更',
    'ADD_REMARK': '添加备注',
    'ASSIGN': '分配处理人',
    'APPROVE': '审核通过',
    'REJECT': '审核拒绝',
    'SUBMIT': '提交',
    'VIEW': '查看'
  }
  return map[action] || action
}
</script>
