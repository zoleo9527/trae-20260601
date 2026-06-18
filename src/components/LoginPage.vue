<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="bg-primary-600 px-6 py-8 text-center">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Users class="w-8 h-8 text-primary-600" />
        </div>
        <h1 class="text-2xl font-bold text-white">社区志愿服务站</h1>
        <p class="text-primary-100 mt-2">重点对象回访与问题上报系统</p>
      </div>
      
      <div class="p-6">
        <div v-if="store.state.error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {{ store.state.error }}
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择角色</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="role in roleOptions"
                :key="role.value"
                @click="selectedRole = role.value"
                :class="[
                  'p-3 rounded-lg border-2 transition-all',
                  selectedRole === role.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <component :is="roleIcons[role.value]" class="w-6 h-6 mx-auto mb-1" :class="selectedRole === role.value ? 'text-primary-600' : 'text-gray-400'" />
                <span class="text-xs block" :class="selectedRole === role.value ? 'text-primary-700 font-medium' : 'text-gray-600'">{{ role.label }}</span>
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码（默认123456）"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          <button
            @click="handleLogin"
            :disabled="store.state.loading || !username"
            class="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Loader2 v-if="store.state.loading" class="w-5 h-5 animate-spin" />
            <span>{{ store.state.loading ? '登录中...' : '登录' }}</span>
          </button>
        </div>
        
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-500 mb-2">测试账号：</p>
          <div class="space-y-1 text-xs text-gray-600">
            <p><span class="font-medium">站点社工：</span>李社工 / 123456</p>
            <p><span class="font-medium">志愿队长：</span>王队长 / 123456</p>
            <p><span class="font-medium">社区干部：</span>张主任 / 123456</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, Loader2, UserCheck, Users2, Building2 } from 'lucide-vue-next'
import { useStore } from '@/store'
import { getRoleOptions } from '@/api'
import type { Role } from '@/types'

const store = useStore()
const username = ref('')
const password = ref('123456')
const selectedRole = ref<Role>('socialWorker')
const roleOptions = ref<{ value: Role; label: string }[]>([])

const roleIcons: Record<Role, typeof UserCheck> = {
  socialWorker: UserCheck,
  volunteerLeader: Users2,
  communityLeader: Building2
}

onMounted(async () => {
  roleOptions.value = await getRoleOptions()
})

async function handleLogin() {
  store.clearError()
  await store.login(username.value, password.value)
}
</script>
