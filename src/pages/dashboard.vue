<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-left">
        <h1>彩票门店-兑奖登记与资料留存系统</h1>
      </div>
      <div class="header-right">
        <span class="user-info">欢迎，{{ currentUser?.name }}（{{ currentUser?.role }}）</span>
        <span class="store-info">{{ currentUser?.storeName }}</span>
        <button class="btn btn-secondary" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <nav class="dashboard-nav">
      <button 
        class="nav-btn" 
        :class="{ active: currentTab === 'processing' }"
        @click="currentTab = 'processing'"
      >
        兑奖登记处理
      </button>
      <button 
        class="nav-btn" 
        :class="{ active: currentTab === 'materials' }"
        @click="currentTab = 'materials'"
      >
        资料留存回看
      </button>
      <button 
        class="nav-btn" 
        :class="{ active: currentTab === 'exceptions' }"
        @click="currentTab = 'exceptions'"
      >
        异常处理
      </button>
    </nav>

    <main class="dashboard-content">
      <div v-if="currentTab === 'processing'">
        <ProcessingPanel 
          :records="filterByStatus(['pending', 'processing'])" 
          :user="currentUser"
          @update="loadRecords"
        />
      </div>
      <div v-else-if="currentTab === 'materials'">
        <MaterialsPanel 
          :records="prizeRecords" 
          :user="currentUser"
        />
      </div>
      <div v-else-if="currentTab === 'exceptions'">
        <ExceptionsPanel 
          :records="filterByStatus(['exception'])" 
          :user="currentUser"
          @handle="openExceptionDrawer"
        />
      </div>
    </main>

    <ExceptionDrawer 
      :record="selectedException" 
      :visible="showExceptionDrawer"
      :user="currentUser"
      @close="showExceptionDrawer = false"
      @resolve="handleResolveException"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { PrizeRecord, User } from '~/types'
import ProcessingPanel from '~/components/ProcessingPanel.vue'
import MaterialsPanel from '~/components/MaterialsPanel.vue'
import ExceptionsPanel from '~/components/ExceptionsPanel.vue'
import ExceptionDrawer from '~/components/ExceptionDrawer.vue'

const currentUser = ref<User | null>(null)
const prizeRecords = ref<PrizeRecord[]>([])
const currentTab = ref('processing')
const showExceptionDrawer = ref(false)
const selectedException = ref<PrizeRecord | null>(null)

const filterByStatus = (statuses: string[]) => {
  return prizeRecords.value.filter(r => statuses.includes(r.status))
}

const loadRecords = async () => {
  const response = await fetch('/api/prize')
  const result = await response.json()
  if (result.success) {
    prizeRecords.value = result.data
  }
}

const handleLogout = () => {
  localStorage.removeItem('user')
  window.location.href = '/'
}

const handleResolveException = async () => {
  await loadRecords()
  showExceptionDrawer.value = false
  selectedException.value = null
}

const openExceptionDrawer = (record: PrizeRecord) => {
  selectedException.value = record
  showExceptionDrawer.value = true
}

defineExpose({ openExceptionDrawer })

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    window.location.href = '/'
    return
  }
  currentUser.value = JSON.parse(userStr)
  loadRecords()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left h1 {
  font-size: 20px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  font-size: 14px;
  color: #666;
}

.store-info {
  font-size: 14px;
  color: #999;
  padding: 4px 12px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.dashboard-nav {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #eee;
}

.nav-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.nav-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.nav-btn.active {
  background-color: #4080ff;
  color: white;
}

.dashboard-content {
  padding: 24px;
}
</style>
