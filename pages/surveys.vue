<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">📍 点位勘察</h2>
        <p class="text-gray-500 mt-1">管理点位勘察单的创建、处理和审核</p>
      </div>
      <div class="flex gap-3">
        <button @click="activeTab = 'all'" :class="activeTab === 'all' ? 'btn-primary' : 'btn-secondary'" class="text-sm">
          全部
        </button>
        <button @click="activeTab = 'my'" :class="activeTab === 'my' ? 'btn-primary' : 'btn-secondary'" class="text-sm">
          我的
        </button>
        <button v-if="canCreate" @click="showCreate = true" class="btn-primary text-sm">
          ➕ 新建勘察单
        </button>
      </div>
    </div>

    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">项目编号</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">项目名称</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">客户</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">点数</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">处理人</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">更新时间</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="survey in surveys" 
              :key="survey.id" 
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              :class="survey.stuck ? 'bg-red-50' : ''"
            >
              <td class="py-4 px-4 text-sm font-mono text-gray-600">{{ survey.projectCode }}</td>
              <td class="py-4 px-4">
                <div class="font-medium text-gray-900">{{ survey.projectName }}</div>
                <div v-if="survey.stuck" class="text-xs text-red-600 mt-1">
                  🔴 {{ survey.stuckReason }}
                </div>
              </td>
              <td class="py-4 px-4 text-sm text-gray-600">{{ survey.customerName }}</td>
              <td class="py-4 px-4 text-sm text-gray-600">{{ survey.pointCount }} 个</td>
              <td class="py-4 px-4">
                <span :class="['status-badge', getStatusColor(survey.status)]">
                  {{ getStatusText(survey.status) }}
                </span>
              </td>
              <td class="py-4 px-4 text-sm text-gray-600">
                {{ survey.assignedTo?.realName || '-' }}
              </td>
              <td class="py-4 px-4 text-sm text-gray-500">{{ formatDate(survey.updatedAt) }}</td>
              <td class="py-4 px-4">
                <button 
                  @click="navigateTo(`/surveys/${survey.id}`)" 
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  查看详情 →
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showCreate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">新建点位勘察单</h3>
          <button @click="showCreate = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">项目编号 *</label>
              <input v-model="form.projectCode" class="input-field" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
              <input v-model="form.projectName" class="input-field" required />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
              <input v-model="form.customerName" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">点位数量</label>
              <input type="number" v-model.number="form.pointCount" class="input-field" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目地址</label>
            <input v-model="form.address" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">点位描述</label>
            <textarea v-model="form.pointDescription" class="input-field" rows="4"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">初始备注</label>
            <textarea v-model="form.remarkContent" class="input-field" rows="2" placeholder="请输入备注信息"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showCreate = false" class="btn-secondary">取消</button>
            <button type="submit" class="btn-primary">创建</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const surveys = ref<any[]>([])
const activeTab = ref('all')
const showCreate = ref(false)
const form = ref({
  projectCode: '',
  projectName: '',
  customerName: '',
  address: '',
  pointDescription: '',
  pointCount: 0,
  remarkContent: ''
})

const canCreate = computed(() => authStore.isProjectManager || authStore.isConstructionLeader)

watch([() => authStore.isLoggedIn, activeTab], () => {
  if (authStore.isLoggedIn) {
    loadSurveys()
  } else {
    navigateTo('/login')
  }
}, { immediate: true })

async function loadSurveys() {
  if (!authStore.isLoggedIn) return
  const url = activeTab.value === 'my' ? '/surveys/my' : '/surveys'
  surveys.value = await apiRequest(url)
}

async function handleCreate() {
  try {
    await apiRequest('/surveys', { method: 'POST', body: form.value })
    showCreate.value = false
    form.value = { projectCode: '', projectName: '', customerName: '', address: '', pointDescription: '', pointCount: 0, remarkContent: '' }
    loadSurveys()
  } catch (e: any) {
    alert(e.message)
  }
}
</script>
