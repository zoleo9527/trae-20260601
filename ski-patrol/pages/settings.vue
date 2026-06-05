<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-1">系统管理</h1>
      <p class="text-slate-400 text-sm">数据重置与演示账号管理</p>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <RotateCcw class="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 class="font-semibold text-white">数据重置</h3>
            <p class="text-xs text-slate-400">将所有数据恢复至初始演示状态</p>
          </div>
        </div>
        <p class="text-sm text-slate-400 mb-4">此操作将清除所有巡查记录、风险上报和操作日志，仅保留初始演示账号和雪道数据。操作不可逆。</p>
        <button @click="showResetModal = true" class="btn-danger">重置数据</button>
      </div>

      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
            <Users class="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 class="font-semibold text-white">演示账号</h3>
            <p class="text-xs text-slate-400">系统预设的三个演示账号</p>
          </div>
        </div>
        <div class="space-y-3">
          <div v-for="account in demoAccounts" :key="account.role" class="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                 :class="accountAvatarClass(account.role)">
              {{ account.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">{{ account.name }}</p>
              <p class="text-xs text-slate-400">{{ account.description }}</p>
            </div>
            <span class="badge"
                  :class="account.role === 'rental' ? 'bg-emerald-500/20 text-emerald-400' : account.role === 'coach' ? 'bg-purple-500/20 text-purple-400' : 'bg-sky-500/20 text-sky-400'">
              {{ account.role === 'rental' ? '租赁员' : account.role === 'coach' ? '教练主管' : '安全巡逻员' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showResetModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showResetModal = false">
      <div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-red-500/30">
        <h3 class="text-lg font-semibold text-white mb-2">确认重置数据？</h3>
        <p class="text-sm text-slate-400 mb-6">此操作将清除所有巡查记录、风险上报和操作日志，仅保留初始演示数据。此操作不可逆。</p>
        <div class="flex gap-3">
          <button @click="showResetModal = false" class="btn-secondary flex-1">取消</button>
          <button @click="handleReset" :disabled="resetting" class="btn-danger flex-1 disabled:opacity-50">
            {{ resetting ? '重置中...' : '确认重置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw, Users } from 'lucide-vue-next'

const authStore = useAuthStore()
const demoAccounts = ref<any[]>([])
const showResetModal = ref(false)
const resetting = ref(false)

async function loadDemoAccounts() {
  try {
    const res = await $fetch('/api/system/demo-accounts') as any
    demoAccounts.value = res.accounts
  } catch (e) {
    console.error('加载演示账号失败', e)
  }
}

async function handleReset() {
  resetting.value = true
  try {
    await $fetch('/api/system/reset', { method: 'POST' })
    await authStore.logout()
    showResetModal.value = false
    navigateTo('/login')
  } catch (e) {
    console.error('重置失败', e)
  } finally {
    resetting.value = false
  }
}

function accountAvatarClass(role: string) {
  const map: Record<string, string> = {
    rental: 'bg-emerald-500/20 text-emerald-400',
    coach: 'bg-purple-500/20 text-purple-400',
    patrol: 'bg-sky-500/20 text-sky-400',
  }
  return map[role] || ''
}

onMounted(loadDemoAccounts)
</script>
