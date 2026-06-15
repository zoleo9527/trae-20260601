<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMenu, ElMenuItem, ElSubMenu, ElButton, ElBadge, ElIcon } from 'element-plus'
import { Bell, User, Document, Tools, Home, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const currentRole = computed(() => userStore.user?.role)
const userName = computed(() => userStore.user?.name)
const roleDisplayName = computed(() => userStore.roleDisplayName)

const menuItems = computed(() => {
  const role = currentRole.value
  if (role === 'DISPATCHER') {
    return [
      { path: '/dispatch', label: '调度管理', icon: Home },
      { path: '/dispatch/orders', label: '订单管理', icon: Document },
      { path: '/dispatch/alerts', label: '异常提醒', icon: Bell }
    ]
  } else if (role === 'INSTALLER') {
    return [
      { path: '/installer', label: '安装作业', icon: Tools },
      { path: '/installer/tasks', label: '待办任务', icon: Document }
    ]
  } else if (role === 'SERVICE') {
    return [
      { path: '/service', label: '售后客服', icon: User },
      { path: '/service/rework', label: '返工申请', icon: Tools },
      { path: '/service/liability', label: '责任判定', icon: Document }
    ]
  }
  return []
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const handleMenuSelect = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="layout">
    <div class="header">
      <div class="logo">卫浴安装队管理系统</div>
      <div class="user-info">
        <span class="role-tag">{{ roleDisplayName }}</span>
        <span class="user-name">{{ userName }}</span>
        <el-button type="text" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          切换角色
        </el-button>
      </div>
    </div>
    <div class="main">
      <div class="sidebar">
        <el-menu
          :default-active="router.currentRoute.value.path"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/history">
            <el-icon><Document /></el-icon>
            <span>历史回看</span>
          </el-menu-item>
          <el-sub-menu index="role-menu">
            <template #title>
              <el-icon><Home /></el-icon>
              <span>{{ roleDisplayName }}工作台</span>
            </template>
            <el-menu-item
              v-for="item in menuItems"
              :key="item.path"
              :index="item.path"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.user-name {
  font-size: 16px;
}

.main {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--border-color);
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>