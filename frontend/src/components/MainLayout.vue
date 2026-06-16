<template>
  <div class="main-layout">
    <header class="header">
      <div class="logo">窗帘门店管理系统</div>
      <div class="user-info">
        <span class="role">{{ user.role }}：{{ user.username }}</span>
        <el-button type="text" @click="handleLogout">退出登录</el-button>
      </div>
    </header>
    
    <aside class="sidebar">
      <el-menu :default-active="activeMenu" mode="vertical" background-color="#2c3e50" text-color="#fff" active-text-color="#409eff">
        <el-menu-item index="measure" @click="activeMenu = 'measure'">
          <el-icon><Layout /></el-icon>
          <span>业务接力</span>
        </el-menu-item>
        <el-menu-item index="logs" @click="activeMenu = 'logs'">
          <el-icon><Document /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
        <el-menu-item index="reset" @click="showResetModal = true">
          <el-icon><Refresh /></el-icon>
          <span>数据重置</span>
        </el-menu-item>
      </el-menu>
    </aside>
    
    <main class="main-content">
      <MeasureList v-if="activeMenu === 'measure'" :user="user" @refresh="handleRefresh" />
      <LogList v-else-if="activeMenu === 'logs'" />
    </main>
    
    <ResetModal v-if="showResetModal" @close="showResetModal = false" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MeasureList from './MeasureList.vue'
import LogList from './LogList.vue'
import ResetModal from './ResetModal.vue'

defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['logout'])

const activeMenu = ref('measure')
const showResetModal = ref(false)

const handleLogout = () => {
  emit('logout')
}

const handleRefresh = () => {
}
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
}

.logo {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.role {
  color: white;
  font-size: 14px;
}

.user-info button {
  color: white;
}

.sidebar {
  width: 200px;
  background: #2c3e50;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
}

.main-content {
  flex: 1;
  margin-top: 60px;
  padding: 20px;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  margin: 0 !important;
}
</style>
