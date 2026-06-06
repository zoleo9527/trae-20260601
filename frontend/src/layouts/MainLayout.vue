<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="24" class="logo-icon"><Key /></el-icon>
        <span>钥匙管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1e3a5f"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
        class="menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item v-if="hasKeysPermission" index="/keys">
          <el-icon><List /></el-icon>
          <span>钥匙管理</span>
        </el-menu-item>
        <el-menu-item v-if="hasBorrowPermission" index="/borrow">
          <el-icon><SwitchButton /></el-icon>
          <span>借还处理</span>
        </el-menu-item>
        <el-menu-item v-if="hasLostPermission" index="/lost">
          <el-icon><Warning /></el-icon>
          <span>挂失补配</span>
        </el-menu-item>
        <el-menu-item v-if="hasSettingsPermission" index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h2>{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-tag :type="roleTagType" class="role-tag">
            {{ roleLabel }}
          </el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ userStore.user?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.user?.name }}</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  Key,
  DataAnalysis,
  List,
  SwitchButton,
  Warning,
  Setting,
  ArrowDown
} from "@element-plus/icons-vue"
import type { User } from "@/types"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  userStore.initUser()
})

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    "/dashboard": "仪表盘",
    "/keys": "钥匙管理",
    "/borrow": "借还处理",
    "/lost": "挂失补配",
    "/settings": "系统设置"
  }
  if (route.path.startsWith("/keys/")) return "钥匙详情"
  return titles[route.path] || ""
})

const roleLabel = computed(() => {
  const labels: Record<User['role'], string> = {
    dorm_manager: "宿管员",
    counselor: "辅导员",
    maintenance: "维修人员"
  }
  return userStore.user ? labels[userStore.user.role] : ""
})

const roleTagType = computed(() => {
  const types: Record<User['role'], 'primary' | 'success' | 'warning'> = {
    dorm_manager: "primary",
    counselor: "success",
    maintenance: "warning"
  }
  return userStore.user ? types[userStore.user.role] : "primary"
})

const hasKeysPermission = computed(() => {
  return userStore.hasPermission(['dorm_manager', 'counselor'])
})

const hasBorrowPermission = computed(() => {
  return userStore.hasPermission(['dorm_manager', 'maintenance'])
})

const hasLostPermission = computed(() => {
  return userStore.hasPermission(['dorm_manager', 'counselor'])
})

const hasSettingsPermission = computed(() => {
  return userStore.hasPermission(['dorm_manager'])
})

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    handleLogout()
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    userStore.logout()
    ElMessage.success("已退出登录")
    router.push("/login")
  } catch {
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #1e3a5f;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  color: #10b981;
}

.menu {
  border-right: none;
  flex: 1;
}

.menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu :deep(.el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.15);
}

.header {
  background: #fff;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-tag {
  font-size: 13px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f1f5f9;
}

.user-avatar {
  background: #1e3a5f;
  color: #fff;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.arrow-down {
  font-size: 12px;
  color: #64748b;
}

.main-content {
  background-color: #f8fafc;
  padding: 24px;
  overflow-y: auto;
}
</style>
