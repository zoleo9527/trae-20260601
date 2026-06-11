<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center">
          <span class="text-3xl">🔒</span>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          安防工程商管理系统
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          点位勘察与方案确认
        </p>
      </div>
      
      <div class="card">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input 
              v-model="username" 
              type="text" 
              class="input-field"
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input 
              v-model="password" 
              type="password" 
              class="input-field"
              placeholder="请输入密码"
              required
            />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>
          
          <button 
            type="submit" 
            class="w-full btn-primary py-3 text-base"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-100">
          <p class="text-xs text-gray-500 text-center mb-3">测试账号（密码均为 123456）</p>
          <div class="grid grid-cols-3 gap-2 text-xs text-center">
            <div class="bg-gray-50 p-2 rounded-lg">
              <div class="font-medium text-gray-700">pm</div>
              <div class="text-gray-500">项目经理</div>
            </div>
            <div class="bg-gray-50 p-2 rounded-lg">
              <div class="font-medium text-gray-700">leader</div>
              <div class="text-gray-500">施工队长</div>
            </div>
            <div class="bg-gray-50 p-2 rounded-lg">
              <div class="font-medium text-gray-700">engineer</div>
              <div class="text-gray-500">售后工程师</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const username = ref('pm')
const password = ref('123456')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  try {
    error.value = ''
    loading.value = true
    await authStore.login(username.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>
