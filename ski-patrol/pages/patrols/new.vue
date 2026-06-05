<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <button @click="navigateTo('/patrols')" class="text-slate-400 hover:text-white transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-white">新建巡查</h1>
        <p class="text-slate-400 text-sm">选择雪道并创建巡查单</p>
      </div>
    </div>

    <div class="max-w-lg">
      <div class="card">
        <div class="space-y-5">
          <div>
            <label class="label-text">选择雪道</label>
            <select v-model="form.trailId" class="input-field w-full">
              <option value="">请选择雪道</option>
              <option v-for="trail in trails" :key="trail.id" :value="trail.id">
                {{ trail.name }} ({{ difficultyLabel(trail.difficulty) }})
              </option>
            </select>
          </div>

          <div>
            <label class="label-text">巡查类型</label>
            <div class="flex gap-3">
              <button
                @click="form.type = 'daily'"
                class="flex-1 py-3 rounded-lg border text-sm font-medium transition-all"
                :class="form.type === 'daily' ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                日常巡查
              </button>
              <button
                @click="form.type = 'special'"
                class="flex-1 py-3 rounded-lg border text-sm font-medium transition-all"
                :class="form.type === 'special' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                专项巡查
              </button>
            </div>
          </div>

          <button
            @click="handleSubmit"
            :disabled="submitting || !form.trailId"
            class="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? '创建中...' : '创建巡查单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const trails = ref<any[]>([])
const submitting = ref(false)
const form = ref({ trailId: '', type: 'daily' })

async function loadTrails() {
  try {
    trails.value = await $fetch('/api/trails') as any[]
  } catch (e) {
    console.error('加载雪道列表失败', e)
  }
}

function difficultyLabel(d: string) {
  const map: Record<string, string> = { beginner: '初级', intermediate: '中级', advanced: '高级', expert: '专家' }
  return map[d] || d
}

async function handleSubmit() {
  if (!form.value.trailId) return
  submitting.value = true
  try {
    const result = await $fetch('/api/patrols', {
      method: 'POST',
      body: {
        trailId: Number(form.value.trailId),
        type: form.value.type,
      },
    }) as any
    navigateTo(`/patrols/${result.id}`)
  } catch (e) {
    console.error('创建巡查失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(loadTrails)
</script>
