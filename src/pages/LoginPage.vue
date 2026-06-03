<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Users, UtensilsCrossed, ChefHat } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import type { UserRole } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const selectedRole = ref<UserRole | null>(null)
const name = ref('')

const roles: { key: UserRole; icon: any; color: string }[] = [
  { key: 'sales', icon: Users, color: 'from-blue-600 to-blue-800' },
  { key: 'hall', icon: UtensilsCrossed, color: 'from-amber-500 to-amber-700' },
  { key: 'kitchen', icon: ChefHat, color: 'from-emerald-600 to-emerald-800' },
]

function selectRole(role: UserRole) {
  selectedRole.value = role
}

function handleLogin() {
  if (selectedRole.value && name.value.trim()) {
    userStore.login(selectedRole.value, name.value.trim())
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-serif text-white mb-3 tracking-wide">
        酒店宴会部
      </h1>
      <p class="text-slate-400 text-lg">尾款核对与客户反馈系统</p>
      <div class="w-24 h-1 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto mt-6 rounded-full"></div>
    </div>

    <div class="w-full max-w-4xl">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          v-for="role in roles"
          :key="role.key"
          @click="selectRole(role.key)"
          class="group relative p-8 rounded-2xl bg-slate-800/50 backdrop-blur border-2 transition-all duration-300 hover:transform hover:-translate-y-1"
          :class="selectedRole === role.key
            ? 'border-amber-500 shadow-lg shadow-amber-500/20'
            : 'border-slate-700 hover:border-slate-500'"
        >
          <div
            class="w-16 h-16 rounded-xl bg-gradient-to-br mb-5 flex items-center justify-center mx-auto transition-transform group-hover:scale-110"
            :class="role.color"
          >
            <component :is="role.icon" class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">
            {{ userStore.roleLabels[role.key] }}
          </h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            {{ userStore.roleDescriptions[role.key] }}
          </p>
          <div
            v-if="selectedRole === role.key"
            class="absolute top-4 right-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
          >
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </button>
      </div>

      <div class="max-w-md mx-auto">
        <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
          <label class="block text-slate-300 text-sm font-medium mb-2">
            请输入您的姓名
          </label>
          <input
            v-model="name"
            type="text"
            placeholder="例如：李销售"
            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all mb-6"
            @keyup.enter="handleLogin"
          />
          <button
            @click="handleLogin"
            :disabled="!selectedRole || !name.trim()"
            class="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/30"
          >
            进入工作台
          </button>
        </div>
      </div>
    </div>

    <p class="text-slate-500 text-sm mt-12">
      选择角色后即可进入对应工作台，支持交班时快速切换身份
    </p>
  </div>
</template>
