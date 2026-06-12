<template>
  <div class="login-container">
    <div class="login-card">
      <h2>产业园招商入驻验收系统</h2>
      <p>请选择您的角色登录</p>
      
      <div class="login-btn-group">
        <div v-for="role in roles" :key="role.value" class="login-role-btn">
          <div class="role-name">{{ role.label }}</div>
          <div class="role-desc">{{ role.desc }}</div>
          <div class="role-users">
            <span 
              v-for="user in authStore.getUsersByRole(role.value)" 
              :key="user.id"
              class="role-user"
              @click="handleLogin(user.id)"
              style="cursor: pointer;"
            >
              {{ user.name }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="text-sm text-muted" style="margin-top: 2rem; text-align: center;">
        点击用户名即可登录，体验不同角色的业务流程
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserRole } from '~/types'

const authStore = useAuthStore()

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'manager', label: '招商经理', desc: '发起入驻验收申请，查看处理进度' },
  { value: 'director', label: '招商主管', desc: '审核验收结果，确认费用起算日期' },
  { value: 'engineer', label: '物业工程', desc: '现场验收，填写验收结果和退回原因' }
]

const handleLogin = (userId: string) => {
  authStore.login(userId)
  const user = authStore.users.find(u => u.id === userId)
  if (user) {
    const roleMap: Record<string, string> = {
      manager: '/manager',
      director: '/director',
      engineer: '/engineer'
    }
    navigateTo(roleMap[user.role], { replace: true })
  }
}
</script>
