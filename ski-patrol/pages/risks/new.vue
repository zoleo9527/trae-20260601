<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <button @click="navigateTo('/risks')" class="text-slate-400 hover:text-white transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-white">新建风险上报</h1>
        <p class="text-slate-400 text-sm">关联巡查单并上报风险</p>
      </div>
    </div>

    <div class="max-w-lg">
      <div class="card">
        <div class="space-y-5">
          <div>
            <label class="label-text">关联巡查单</label>
            <select v-model="form.patrolId" class="input-field w-full">
              <option value="">请选择巡查单</option>
              <option v-for="p in eligiblePatrols" :key="p.id" :value="p.id">
                #{{ p.id }} {{ p.trailName }} - {{ p.type === 'daily' ? '日常' : '专项' }}
              </option>
            </select>
          </div>

          <div>
            <label class="label-text">风险等级</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="lv in levels"
                :key="lv.value"
                @click="form.level = lv.value"
                class="py-3 rounded-lg border text-sm font-medium transition-all"
                :class="form.level === lv.value ? lv.activeClass : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                {{ lv.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="label-text">紧急程度</label>
            <div class="flex gap-3">
              <button
                v-for="ug in urgencies"
                :key="ug.value"
                @click="form.urgency = ug.value"
                class="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all"
                :class="form.urgency === ug.value ? ug.activeClass : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                {{ ug.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="label-text">风险描述</label>
            <textarea v-model="form.description" rows="4" class="input-field w-full" placeholder="请详细描述发现的风险情况..."></textarea>
          </div>

          <button
            @click="handleSubmit"
            :disabled="submitting || !form.patrolId || !form.level || !form.description"
            class="btn-danger w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? '提交中...' : '上报风险' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const patrols = ref<any[]>([])
const submitting = ref(false)
const form = ref({
  patrolId: route.query.patrolId ? String(route.query.patrolId) : '',
  level: '',
  urgency: 'normal',
  description: '',
})

const levels = [
  { value: 'low', label: '低', activeClass: 'bg-sky-500/20 border-sky-500/50 text-sky-400' },
  { value: 'medium', label: '中', activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
  { value: 'high', label: '高', activeClass: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
  { value: 'critical', label: '严重', activeClass: 'bg-red-500/20 border-red-500/50 text-red-400' },
]

const urgencies = [
  { value: 'normal', label: '常规', activeClass: 'bg-slate-600 border-slate-500 text-white' },
  { value: 'urgent', label: '紧急', activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
  { value: 'immediate', label: '立即', activeClass: 'bg-red-500/20 border-red-500/50 text-red-400' },
]

const eligiblePatrols = computed(() => {
  return patrols.value.filter((p: any) => {
    if (p.status === 'completed' && p.result === 'issue') return true
    if (form.value.patrolId && String(p.id) === String(form.value.patrolId) && p.status === 'completed') return true
    return false
  })
})

async function loadPatrols() {
  try {
    const data = await $fetch('/api/patrols') as any[]
    patrols.value = data
  } catch (e) {
    console.error('加载巡查列表失败', e)
  }
}

async function handleSubmit() {
  if (!form.value.patrolId || !form.value.level || !form.value.description) return
  submitting.value = true
  try {
    const result = await $fetch('/api/risks', {
      method: 'POST',
      body: {
        patrolId: Number(form.value.patrolId),
        level: form.value.level,
        description: form.value.description,
        urgency: form.value.urgency,
      },
    }) as any
    navigateTo(`/risks/${result.id}`)
  } catch (e) {
    console.error('创建风险上报失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(loadPatrols)
</script>
