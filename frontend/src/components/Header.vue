<template>
  <header class="header">
    <div class="header-left">
      <span class="page-title">{{ pageTitle }}</span>
    </div>
    <div class="header-right">
      <div class="user-info">
        <span class="role-badge">{{ authStore.roleText }}</span>
        <span class="username">{{ authStore.user?.name }}</span>
      </div>
      <el-button type="text" @click="handleLogout" class="logout-btn">
        <el-icon><component :is="LogOut" /></el-icon>
        <span>退出</span>
      </el-button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LogOut } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const route = useRoute()
const authStore = useAuthStore()

const pageTitleMap = {
  '/': '首页',
  '/activities': '活动管理',
  '/applications': '报名处理',
  '/posts': '岗位分配',
  '/exceptions': '异常处理'
}

const pageTitle = computed(() => {
  for (const path of Object.keys(pageTitleMap)) {
    if (route.path.startsWith(path)) {
      return pageTitleMap[path]
    }
  }
  return '社区志愿服务站'
})

function handleLogout() {
  authStore.logout()
  ElMessage.success('已退出登录')
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  padding: 4px 10px;
  background: #e6f4ff;
  color: #1890ff;
  border-radius: 12px;
  font-size: 12px;
}

.username {
  font-size: 14px;
  color: #666;
}

.logout-btn {
  color: #999;
}

.logout-btn:hover {
  color: #1890ff;
}
</style>