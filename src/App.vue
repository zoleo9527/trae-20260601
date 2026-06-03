<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon><Camera /></el-icon>
        <span>器材租赁管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        background-color="#1f2937"
        text-color="#d1d5db"
        active-text-color="#60a5fa"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-sub-menu index="outbound">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>出库验机</span>
          </template>
          <el-menu-item index="/outbound/pending">待验机</el-menu-item>
          <el-menu-item index="/outbound/completed">已完成</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="return">
          <template #title>
            <el-icon><Refresh /></el-icon>
            <span>归还复核</span>
          </template>
          <el-menu-item index="/return/pending">待复核</el-menu-item>
          <el-menu-item index="/return/completed">已完成</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/history">
          <el-icon><Document /></el-icon>
          <span>历史记录</span>
        </el-menu-item>
        <el-menu-item index="/batch">
          <el-icon><Select /></el-icon>
          <span>批量处理</span>
        </el-menu-item>
        <el-sub-menu index="settings" class="settings-menu">
          <template #title>
            <el-icon><User /></el-icon>
            <span>{{ currentRole.name }}</span>
          </template>
          <el-menu-item index="#" @click.prevent="switchRole('frontline')">
            <span>切换到：一线操作员</span>
          </el-menu-item>
          <el-menu-item index="#" @click.prevent="switchRole('manager')">
            <span>切换到：门店经理</span>
          </el-menu-item>
          <el-menu-item index="#" @click.prevent="switchRole('admin')">
            <span>切换到：系统管理员</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag :type="statusTagType">
            {{ systemStatus }}
          </el-tag>
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

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const currentRole = computed(() => authStore.currentRole)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    name: item.meta.title
  }))
})

const systemStatus = computed(() => {
  if (authStore.currentRole.key === 'frontline') return '一线操作模式'
  if (authStore.currentRole.key === 'manager') return '管理回看模式'
  return '系统管理模式'
})

const statusTagType = computed(() => {
  if (authStore.currentRole.key === 'frontline') return 'success'
  if (authStore.currentRole.key === 'manager') return 'warning'
  return 'info'
})

const switchRole = (roleKey) => {
  authStore.switchRole(roleKey)
  ElMessage.success(`已切换到${authStore.getRoleInfo(roleKey).name}`)
  router.push('/dashboard')
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.sidebar {
  background-color: #1f2937;
  overflow-y: auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #374151;
}

.logo .el-icon {
  font-size: 28px;
  color: #60a5fa;
}

.sidebar-menu {
  border-right: none;
}

.settings-menu {
  position: absolute;
  bottom: 0;
  width: 100%;
  border-top: 1px solid #374151;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-content {
  background-color: #f3f4f6;
  padding: 24px;
  overflow-y: auto;
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
