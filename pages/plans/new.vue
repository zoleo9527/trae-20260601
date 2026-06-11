<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button @click="navigateBack" class="btn-secondary text-sm">← 返回</button>
      <div>
        <h2 class="text-2xl font-bold text-gray-900">📋 新建方案确认单</h2>
        <p class="text-gray-500 mt-1">基于点位勘察单创建设计方案</p>
      </div>
    </div>

    <div v-if="survey" class="card">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📍</span>
          <div>
            <div class="font-medium text-blue-900">关联勘察单: {{ survey.projectCode }} - {{ survey.projectName }}</div>
            <div class="text-sm text-blue-600 mt-1">点位数量: {{ survey.pointCount }} 个 · 客户: {{ survey.customerName }}</div>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleCreate" class="space-y-6">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">预估成本 (元)</label>
            <input type="number" v-model.number="form.estimatedCost" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">施工工期 (天)</label>
            <input type="number" v-model.number="form.constructionDays" class="input-field" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">方案内容</label>
          <textarea v-model="form.planContent" class="input-field" rows="8" placeholder="请详细描述设计方案..."></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">设备清单</label>
          <textarea v-model="form.equipmentList" class="input-field" rows="6" placeholder="请列出主要设备..."></textarea>
        </div>
        <div>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="form.inheritRemarks" class="w-4 h-4 text-primary-600 rounded" />
            <span class="text-sm font-medium text-gray-700">继承点位勘察的所有备注（推荐）</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">勾选后，勘察阶段的所有备注将自动带入方案确认单，并标注为「继承自勘察」</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">初始备注</label>
          <textarea v-model="form.remarkContent" class="input-field" rows="2" placeholder="请输入备注信息"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" @click="navigateBack" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">创建方案确认单</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const survey = ref<any>(null)
const form = ref({
  surveyId: 0,
  projectCode: '',
  projectName: '',
  planContent: '',
  equipmentList: '',
  estimatedCost: 0,
  constructionDays: 0,
  inheritRemarks: true,
  remarkContent: ''
})

const surveyId = computed(() => Number(route.query.surveyId))

watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (!loggedIn) {
    navigateTo('/login')
    return
  }
  if (surveyId.value) {
    loadSurvey()
  }
}, { immediate: true })

async function loadSurvey() {
  survey.value = await apiRequest(`/surveys/${surveyId.value}`)
  form.value.surveyId = surveyId.value
  form.value.projectCode = survey.value.projectCode
  form.value.projectName = survey.value.projectName
  form.value.estimatedCost = survey.value.pointCount * 3500
  form.value.constructionDays = Math.ceil(survey.value.pointCount / 10) + 5
}

async function handleCreate() {
  try {
    const result = await apiRequest('/plans', { method: 'POST', body: form.value })
    navigateTo(`/plans/${result.id}`)
  } catch (e: any) {
    alert(e.message)
  }
}

function navigateBack() {
  if (surveyId.value) {
    navigateTo(`/surveys/${surveyId.value}`)
  } else {
    navigateTo('/plans')
  }
}
</script>
