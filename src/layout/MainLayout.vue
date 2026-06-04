<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo-section">
        <el-icon :size="28" color="#fff"><OfficeBuilding /></el-icon>
        <span class="logo-text">眼科手术中心</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        background-color="#1f2d3d"
        text-color="#c0c4cc"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>首页概览</span>
        </el-menu-item>

        <el-menu-item index="/medication">
          <el-icon><Box /></el-icon>
          <span>术后用药</span>
        </el-menu-item>

        <el-menu-item index="/followup">
          <el-icon><Calendar /></el-icon>
          <span>复诊提醒</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ $route.meta.title || '首页' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-tag :type="roleTagType" effect="dark" size="small">
            {{ authStore.roleName }}
          </el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ authStore.user?.name?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ authStore.user?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/useAuthStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  authStore.restoreSession()
})

const activeMenu = computed(() => route.path)

const roleTagType = computed(() => {
  const map: Record<string, any> = {
    nurse: 'success',
    surgeon: 'primary',
    specialist: 'warning'
  }
  return map[authStore.role || ''] || 'info'
})

function handleCommand(command: string) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.sidebar {
  background: #1f2d3d;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
}

.logo-section {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  border-bottom: 1px solid #304156;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.el-container {
  margin-left: 220px;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
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
}

.avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.username {
  color: #606266;
  font-size: 14px;
}

.main-content {
  padding: 0;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
