<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { ElButton, ElInput, ElCard, ElSelect, ElOption, ElMessage } from 'element-plus'

const router = useRouter()
const store = useAppStore()

const phone = ref('')
const selectedRole = ref('')

const mockUsers = [
  { phone: '13800138001', name: '张调度', role: 'dispatcher' },
  { phone: '13800138002', name: '李师傅', role: 'technician' },
  { phone: '13800138003', name: '王师傅', role: 'technician' },
  { phone: '13800138004', name: '陈客服', role: 'customer_service' },
]

const handleLogin = async () => {
  if (!phone.value) {
    ElMessage.error('请输入手机号')
    return
  }
  
  const success = await store.login(phone.value)
  if (success) {
    const user = store.state.currentUser
    if (user) {
      switch (user.role) {
        case 'dispatcher':
          router.push('/dispatch')
          break
        case 'technician':
          router.push('/installer')
          break
        case 'customer_service':
          router.push('/service')
          break
      }
    }
  } else {
    ElMessage.error('登录失败，请检查手机号')
  }
}

const selectUser = (user: typeof mockUsers[0]) => {
  phone.value = user.phone
  selectedRole.value = user.role
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
    <ElCard class="w-full max-w-md shadow-xl">
      <div class="text-center mb-8">
        <div class="text-4xl mb-4">🛁</div>
        <h1 class="text-2xl font-bold text-gray-800">卫浴安装管理系统</h1>
        <p class="text-gray-500 mt-2">漏水返工与责任判定</p>
      </div>
      
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-600 mb-3">快速登录 - 选择角色</h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="user in mockUsers"
            :key="user.phone"
            @click="selectUser(user)"
            :class="[
              'px-4 py-3 rounded-lg border-2 text-left transition-all',
              phone === user.phone 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            ]"
          >
            <div class="font-medium text-gray-800">{{ user.name }}</div>
            <div class="text-xs text-gray-500">
              {{ user.role === 'dispatcher' ? '调度员' : user.role === 'technician' ? '安装师傅' : '售后客服' }}
            </div>
          </button>
        </div>
      </div>
      
      <div class="space-y-4">
        <ElInput
          v-model="phone"
          placeholder="输入手机号登录"
          type="tel"
          size="large"
        />
        
        <ElButton
          type="primary"
          size="large"
          class="w-full"
          :loading="store.state.loading"
          @click="handleLogin"
        >
          登录系统
        </ElButton>
      </div>
      
      <div class="mt-6 text-center text-sm text-gray-500">
        <p>系统预设用户：</p>
        <p>调度员: 13800138001</p>
        <p>安装师傅: 13800138002 / 13800138003</p>
        <p>售后客服: 13800138004</p>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
</style>