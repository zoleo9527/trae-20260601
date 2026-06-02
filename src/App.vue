<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <div class="logo-icon">🏪</div>
        <div class="logo-text">市场摊位管理系统</div>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>首页概览</span>
        </el-menu-item>
        <el-menu-item index="/stalls">
          <el-icon><OfficeBuilding /></el-icon>
          <span>摊位管理</span>
        </el-menu-item>
        <el-menu-item index="/tenants">
          <el-icon><User /></el-icon>
          <span>摊主管理</span>
        </el-menu-item>
        <el-menu-item index="/rent">
          <el-icon><Wallet /></el-icon>
          <span>租金账单</span>
        </el-menu-item>
        <el-menu-item index="/utilities">
          <el-icon><Lightning /></el-icon>
          <span>水电记录</span>
        </el-menu-item>
        <el-menu-item index="/hygiene">
          <el-icon><Brush /></el-icon>
          <span>卫生检查</span>
        </el-menu-item>
        <el-menu-item index="/deductions">
          <el-icon><Warning /></el-icon>
          <span>扣分整改</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><Document /></el-icon>
          <span>报表中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-right">
          <el-icon :size="20" style="margin-right: 8px;"><Calendar /></el-icon>
          <span>{{ currentDate }}</span>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  DataLine, OfficeBuilding, User, Wallet, Lightning, 
  Brush, Warning, Document, Calendar 
} from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': '首页概览',
    '/stalls': '摊位管理',
    '/tenants': '摊主管理',
    '/rent': '租金账单',
    '/utilities': '水电记录',
    '/hygiene': '卫生检查',
    '/deductions': '扣分整改',
    '/reports': '报表中心'
  }
  return titles[route.path] || '市场摊位管理系统'
})

const currentDate = ref('')

function updateDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  currentDate.value = `${year}年${month}月${day}日 ${weekDays[now.getDay()]}`
}

updateDate()
setInterval(updateDate, 60000)
</script>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #001529;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid #1f1f1f;
}

.logo-icon {
  font-size: 28px;
  margin-right: 8px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #1890ff20;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #1890ff;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.main-content {
  padding: 0;
  overflow: auto;
  background-color: #f5f7fa;
}
</style>
