<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { login, getAvailableRoles } = useAuth()
const roles = getAvailableRoles()

const selectUser = (userId: string) => {
  login(userId)
}
</script>

<template>
  <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
    <div class="card" style="width: 400px; text-align: center;">
      <h2 style="margin-bottom: 8px;">搬家公司管理工具</h2>
      <p style="color: #999; margin-bottom: 32px;">请选择您的角色登录</p>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button
          v-for="role in roles"
          :key="role.id"
          @click="selectUser(role.id)"
          class="btn"
          style="width: 100%; padding: 16px; font-size: 16px; background-color: #f5f7fa; color: #333; border: 1px solid #e8e8e8;"
        >
          <div style="font-weight: 600; margin-bottom: 4px;">{{ role.name }}</div>
          <div style="font-size: 12px; color: #999;">{{ role.roleName }}</div>
        </button>
      </div>
      
      <p style="margin-top: 24px; font-size: 12px; color: #999;">
        提示：选择任意角色即可体验对应功能
      </p>
    </div>
  </div>
</template>
