<template>
  <div id="app">
    <router-view v-if="$route.path === '/' || !token">
    </router-view>
    <template v-else>
      <el-container class="app-container">
        <el-aside width="200px" class="sidebar">
          <div class="logo">手机维修店管理系统</div>
          <el-menu :default-active="$route.name" class="sidebar-menu">
            <el-menu-item index="Dashboard">
              <el-icon><component :is="icons.Home" /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>
            <el-menu-item index="RepairOrders">
              <el-icon><component :is="icons.FileText" /></el-icon>
              <span>维修工单</span>
            </el-menu-item>
            <el-menu-item index="SpareParts">
              <el-icon><component :is="icons.Package" /></el-icon>
              <span>备件管理</span>
            </el-menu-item>
            <el-menu-item index="Records">
              <el-icon><component :is="icons.History" /></el-icon>
              <span>维修记录</span>
            </el-menu-item>
            <el-menu-item index="ShiftReport">
              <el-icon><component :is="icons.BarChart" /></el-icon>
              <span>交班报表</span>
            </el-menu-item>
          </el-menu>
          <div class="logout">
            <el-button @click="logout" type="text">退出登录</el-button>
          </div>
        </el-aside>
        <el-container>
          <el-header class="header">
            <div class="header-left">
              <span>欢迎, {{ user?.full_name || user?.username }}</span>
            </div>
            <div class="header-right">
              <el-badge :value="unreadCount" class="notification-badge">
                <el-button @click="showNotifications" icon="Bell" />
              </el-badge>
            </div>
          </el-header>
          <el-main>
            <router-view />
          </el-main>
        </el-container>
      </el-container>
      <el-dialog title="通知" v-model="showNotificationDialog" width="500px">
        <el-list>
          <el-list-item v-for="n in notifications" :key="n.id">
            <template #default>
              <div :class="{ 'unread': !n.read }">
                <div class="notification-title">{{ n.title }}</div>
                <div class="notification-content">{{ n.content }}</div>
                <div class="notification-time">{{ formatTime(n.created_at) }}</div>
              </div>
            </template>
          </el-list-item>
        </el-list>
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Home, FileText, Package, History, BarChart } from '@element-plus/icons-vue'
import { records } from './api'

const router = useRouter()
const icons = { Home, FileText, Package, History, BarChart }

const token = computed(() => localStorage.getItem('token'))
const user = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))
const notifications = ref([])
const unreadCount = ref(0)
const showNotificationDialog = ref(false)

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}

const showNotifications = async () => {
  showNotificationDialog.value = true
  const res = await records.getNotifications(user.value.username)
  notifications.value = res.data
  notifications.value.forEach(n => {
    if (!n.read) {
      records.markNotificationRead(n.id)
    }
  })
  unreadCount.value = 0
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const loadUnreadCount = async () => {
  if (token.value && user.value.username) {
    const res = await records.getNotifications(user.value.username, { unread_only: true })
    unreadCount.value = res.data.length
  }
}

onMounted(() => {
  loadUnreadCount()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.sidebar {
  background: #2c3e50;
  color: white;
}

.logo {
  padding: 20px;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #34495e;
}

.sidebar-menu {
  border-right: none;
}

.logout {
  position: absolute;
  bottom: 20px;
  width: 100%;
  padding: 0 20px;
}

.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  padding-left: 20px;
}

.header-right {
  padding-right: 20px;
}

.notification-badge {
  margin-right: 10px;
}

.unread {
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.notification-content {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}
</style>
