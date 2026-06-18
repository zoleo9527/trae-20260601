<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>志愿服务站</h2>
    </div>
    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        <el-icon><component :is="LayoutDashboard" /></el-icon>
        <span>首页</span>
      </router-link>
      <router-link to="/activities" class="nav-item" :class="{ active: $route.path.startsWith('/activities') }">
        <el-icon><component :is="Calendar" /></el-icon>
        <span>活动管理</span>
      </router-link>
      <router-link to="/applications" class="nav-item" :class="{ active: $route.path.startsWith('/applications') }">
        <el-icon><component :is="FileText" /></el-icon>
        <span>报名处理</span>
      </router-link>
      <router-link to="/posts" class="nav-item" :class="{ active: $route.path.startsWith('/posts') }">
        <el-icon><component :is="Users" /></el-icon>
        <span>岗位分配</span>
      </router-link>
      <router-link to="/exceptions" class="nav-item" :class="{ active: $route.path.startsWith('/exceptions') }">
        <el-icon><component :is="AlertCircle" /></el-icon>
        <span>异常处理</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { LayoutDashboard, Calendar, FileText, Users, AlertCircle } from '@element-plus/icons-vue'
</script>

<style scoped>
.sidebar {
  width: 220px;
  background: #001529;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #1f3a5f;
}

.sidebar-header h2 {
  font-size: 16px;
  margin: 0;
  color: #fff;
}

.sidebar-nav {
  flex: 1;
  padding: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: #1890ff;
  color: #fff;
}

.nav-item span {
  font-size: 14px;
}
</style>