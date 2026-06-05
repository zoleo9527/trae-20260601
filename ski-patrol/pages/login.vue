<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-6">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-400/5 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <div class="text-center mb-10">
        <div class="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center mx-auto mb-4">
          <MountainSnow class="w-8 h-8 text-sky-400" />
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">雪道巡查与风险上报</h1>
        <p class="text-slate-400 text-sm">选择演示账号登录系统</p>
      </div>

      <div class="space-y-3">
        <button
          v-for="account in accounts"
          :key="account.role"
          @click="handleLogin(account.role)"
          :disabled="loading"
          class="w-full p-5 rounded-xl border transition-all duration-300 text-left group"
          :class="accountCardClass(account.role)"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                 :class="accountAvatarClass(account.role)">
              {{ account.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-white mb-0.5">{{ account.name }}</h3>
              <p class="text-xs text-slate-400">{{ account.description }}</p>
            </div>
            <ChevronRight class="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </button>
      </div>

      <div v-if="loading" class="mt-6 text-center">
        <div class="inline-flex items-center gap-2 text-sky-400 text-sm">
          <Loader2 class="w-4 h-4 animate-spin" />
          登录中...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MountainSnow, ChevronRight, Loader2 } from 'lucide-vue-next'

const authStore = useAuthStore()
const loading = ref(false)
const accounts = ref([
  { role: 'rental', name: '张租赁', description: '租赁柜台 · 创建巡查单 · 查看待办' },
  { role: 'coach', name: '李教练', description: '教练主管 · 审批风险 · 改期驳回' },
  { role: 'patrol', name: '王巡逻', description: '安全巡逻 · 执行巡查 · 上报风险' },
])

function accountCardClass(role: string) {
  const map: Record<string, string> = {
    rental: 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10',
    coach: 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10',
    patrol: 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10',
  }
  return map[role] || ''
}

function accountAvatarClass(role: string) {
  const map: Record<string, string> = {
    rental: 'bg-emerald-500/20 text-emerald-400',
    coach: 'bg-purple-500/20 text-purple-400',
    patrol: 'bg-sky-500/20 text-sky-400',
  }
  return map[role] || ''
}

async function handleLogin(role: string) {
  loading.value = true
  try {
    await authStore.login(role)
    navigateTo('/dashboard')
  } catch (e: any) {
    console.error('登录失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await authStore.fetchMe()
  if (authStore.isLoggedIn) {
    navigateTo('/dashboard')
  }
})

definePageMeta({ layout: false })
</script>
