<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" class="layout-aside service-aside">
      <div class="aside-header">
        <el-icon :size="24"><Service /></el-icon>
        <span>客服台工作台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#2b4c1a"
        text-color="#bfcbd9"
        active-text-color="#67C23A"
        router
      >
        <el-menu-item index="/service/pending">
          <el-icon><Clock /></el-icon>
          <span>待受理报修</span>
        </el-menu-item>
        <el-menu-item index="/service/complaint-link">
          <el-icon><Link /></el-icon>
          <span>投诉归属关联</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header service-header">
        <div class="header-title">商场运营-公共报修与工程派单系统</div>
        <div class="header-user">
          <el-icon><User /></el-icon>
          <span>{{ userName }}</span>
          <el-button type="danger" text size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)
const userName = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr).name : ''
})

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.layout-aside {
  background-color: #2b4c1a;
}
.aside-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 60px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.service-header {
  border-bottom-color: #67C23A;
}
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 2px solid #67C23A;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}
.layout-main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
