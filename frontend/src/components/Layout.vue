<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo-section">
        <el-icon :size="24" color="#409eff"><OfficeBuilding /></el-icon>
        <span class="logo-text">商场运营</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="side-menu"
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>

        <el-sub-menu index="tenant-group" v-if="showTenantMenu">
          <template #title>
            <el-icon><Shop /></el-icon>
            <span>租户入驻</span>
          </template>
          <el-menu-item index="/tenants">租户台账</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="license-group" v-if="showLicenseMenu">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>证照管理</span>
          </template>
          <el-menu-item index="/licenses">证照台账</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="activity-group" v-if="showActivityMenu">
          <template #title>
            <el-icon><Calendar /></el-icon>
            <span>活动申请</span>
          </template>
          <el-menu-item index="/activities">活动列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="complaint-group" v-if="showComplaintMenu">
          <template #title>
            <el-icon><Warning /></el-icon>
            <span>投诉记录</span>
          </template>
          <el-menu-item index="/complaints">{{ complaintMenuLabel }}</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <span class="role-badge" :class="'role-' + authStore.userRole">
            {{ roleLabel }}
          </span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleSwitchRole" v-if="authStore.isAdmin">
            <el-button type="primary" text>
              <el-icon><Switch /></el-icon>
              切换角色
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="r in switchableRoles"
                  :key="r.value"
                  :command="r.value"
                  :disabled="authStore.userRole === r.value"
                >
                  {{ r.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown @command="handleUserCommand">
            <span class="user-info">
              <el-avatar :size="28" class="user-avatar">{{ authStore.userName?.charAt(0) }}</el-avatar>
              <span class="user-name">{{ authStore.userName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const roleMap: Record<string, string> = {
  admin: '管理员',
  operation: '营运专员',
  customer_service: '客服台',
  engineering: '工程部'
}

const roleLabel = computed(() => roleMap[authStore.userRole] || authStore.userRole)

const complaintMenuLabel = computed(() => {
  if (authStore.isEngineering) return '我的工单'
  return '投诉列表'
})

const showTenantMenu = computed(() => {
  return ['admin', 'operation', 'customer_service'].includes(authStore.userRole)
})

const showLicenseMenu = computed(() => {
  return ['admin', 'operation'].includes(authStore.userRole)
})

const showActivityMenu = computed(() => {
  return ['admin', 'operation', 'customer_service', 'engineering'].includes(authStore.userRole)
})

const showComplaintMenu = computed(() => {
  return ['admin', 'operation', 'customer_service', 'engineering'].includes(authStore.userRole)
})

const switchableRoles = [
  { value: 'admin', label: '管理员' },
  { value: 'operation', label: '营运专员' },
  { value: 'customer_service', label: '客服台' },
  { value: 'engineering', label: '工程部' }
]

function handleSwitchRole(role: string) {
  const demoAccounts: Record<string, { username: string; password: string }> = {
    admin: { username: 'admin', password: 'admin123' },
    operation: { username: 'operation', password: 'op123' },
    customer_service: { username: 'service', password: 'sv123' },
    engineering: { username: 'engineering', password: 'en123' }
  }
  const account = demoAccounts[role]
  if (account) {
    authStore.logout()
    authStore.login(account.username, account.password).then(() => {
      router.push('/')
    })
  }
}

function handleUserCommand(command: string) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #001529;
  overflow-y: auto;
}

.logo-section {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid #ffffff1a;

  .logo-text {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 2px;
  }
}

.side-menu {
  border-right: none;

  .el-sub-menu__title,
  .el-menu-item {
    &:hover {
      background-color: #ffffff1a !important;
    }
  }
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  padding: 0 20px;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
}

.role-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;

  &.role-admin { background: #e6f7ff; color: #1890ff; }
  &.role-operation { background: #f6ffed; color: #52c41a; }
  &.role-customer_service { background: #fff7e6; color: #fa8c16; }
  &.role-engineering { background: #f9f0ff; color: #722ed1; }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .user-avatar {
    background: #409eff;
    color: #fff;
    font-size: 13px;
  }

  .user-name {
    font-size: 14px;
    color: #333;
  }
}

.layout-main {
  background: #f5f5f5;
  overflow-y: auto;
}
</style>
