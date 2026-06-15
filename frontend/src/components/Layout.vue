<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">手机维修店管理系统</div>
      <el-menu :default-active="currentRouteName" class="sidebar-menu" router>
        <template v-if="userRole === 'frontdesk'">
          <el-menu-item index="/dashboard">
            <el-icon><Home /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/repair-orders">
            <el-icon><Document /></el-icon>
            <span>新建工单</span>
          </el-menu-item>
          <el-menu-item index="/shift-report">
            <el-icon><DataLine /></el-icon>
            <span>交班查看</span>
          </el-menu-item>
        </template>
        
        <template v-else-if="userRole === 'technician'">
          <el-menu-item index="/dashboard">
            <el-icon><Home /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/repair-orders">
            <el-icon><Document /></el-icon>
            <span>待修工单</span>
          </el-menu-item>
          <el-menu-item index="/spare-parts">
            <el-icon><Box /></el-icon>
            <span>备件领用</span>
          </el-menu-item>
        </template>
        
        <template v-else-if="userRole === 'manager'">
          <el-menu-item index="/dashboard">
            <el-icon><Home /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/repair-orders">
            <el-icon><Document /></el-icon>
            <span>工单管理</span>
          </el-menu-item>
          <el-menu-item index="/spare-parts">
            <el-icon><Box /></el-icon>
            <span>备件管理</span>
          </el-menu-item>
          <el-menu-item index="/records">
            <el-icon><Clock /></el-icon>
            <span>维修记录</span>
          </el-menu-item>
          <el-menu-item index="/shift-report">
            <el-icon><DataLine /></el-icon>
            <span>交班管理</span>
          </el-menu-item>
        </template>
        
        <template v-else>
          <el-menu-item index="/dashboard">
            <el-icon><Home /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/repair-orders">
            <el-icon><Document /></el-icon>
            <span>维修工单</span>
          </el-menu-item>
          <el-menu-item index="/spare-parts">
            <el-icon><Box /></el-icon>
            <span>备件管理</span>
          </el-menu-item>
          <el-menu-item index="/records">
            <el-icon><Clock /></el-icon>
            <span>维修记录</span>
          </el-menu-item>
          <el-menu-item index="/shift-report">
            <el-icon><DataLine /></el-icon>
            <span>交班报表</span>
          </el-menu-item>
        </template>
      </el-menu>
      <div class="logout">
        <el-button @click="logout" type="text" style="color: #fff;">退出登录</el-button>
      </div>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span>欢迎, {{ user?.full_name || user?.username }}</span>
          <el-tag :type="getRoleTagType(userRole)" style="margin-left: 10px">{{ getRoleText(userRole) }}</el-tag>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button @click="showNotifications" :icon="Bell" circle />
          </el-badge>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  <el-dialog title="通知" v-model="showNotificationDialog" width="500px">
    <el-empty v-if="notifications.length === 0" description="暂无通知" />
    <el-list v-else>
      <el-list-item v-for="n in notifications" :key="n.id">
        <div :class="{ 'unread': !n.read }">
          <div class="notification-title">{{ n.title }}</div>
          <div class="notification-content">{{ n.content }}</div>
          <div class="notification-time">{{ formatTime(n.created_at) }}</div>
        </div>
      </el-list-item>
    </el-list>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Home, Document, Box, Clock, DataLine, Bell } from '@element-plus/icons-vue'
import { records as recordsApi } from '../api'

const router = useRouter()
const route = useRoute()

const user = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))
const userRole = computed(() => user.value.role || 'admin')
const currentRouteName = computed(() => route.name || '')

const notifications = ref([])
const unreadCount = ref(0)
const showNotificationDialog = ref(false)

const getRoleTagType = (role) => {
  const types = {
    admin: 'info',
    frontdesk: 'primary',
    technician: 'success',
    manager: 'warning'
  }
  return types[role] || 'info'
}

const getRoleText = (role) => {
  const texts = {
    admin: '管理员',
    frontdesk: '前台',
    technician: '维修师',
    manager: '店长'
  }
  return texts[role] || role
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}

const showNotifications = async () => {
  showNotificationDialog.value = true
  try {
    const res = await recordsApi.getNotifications(user.value.username)
    notifications.value = res.data
    notifications.value.forEach(n => {
      if (!n.read) {
        recordsApi.markNotificationRead(n.id)
      }
    })
    unreadCount.value = 0
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const loadUnreadCount = async () => {
  if (user.value.username) {
    try {
      const res = await recordsApi.getNotifications(user.value.username, { unread_only: true })
      unreadCount.value = res.data.length
    } catch (error) {
      console.error('获取未读通知失败:', error)
    }
  }
}

onMounted(() => {
  loadUnreadCount()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #2c3e50;
  color: white;
  position: relative;
}

.logo {
  padding: 20px;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #34495e;
  text-align: center;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.sidebar-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-menu-item.is-active {
  background: #34495e;
  color: #fff;
}

.logout {
  position: absolute;
  bottom: 20px;
  width: 100%;
  padding: 0 20px;
  text-align: center;
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
  font-weight: 500;
}

.header-right {
  padding-right: 20px;
}

.notification-badge {
  margin-right: 10px;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
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
