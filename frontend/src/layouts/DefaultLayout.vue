<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <el-icon size="24" color="#409eff"><OfficeBuilding /></el-icon>
        <span>租赁交付系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="transparent"
        text-color="#606266"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>扯皮预警总览</span>
        </el-menu-item>
        <el-menu-item index="/properties">
          <el-icon><OfficeBuilding /></el-icon>
          <span>房源台账</span>
        </el-menu-item>
        <el-menu-item index="/viewings">
          <el-icon><View /></el-icon>
          <span>看房反馈</span>
        </el-menu-item>
        <el-menu-item index="/borrow">
          <el-icon><DocumentChecked /></el-icon>
          <span>交房验收流程</span>
          <el-badge v-if="handoverPendingCount > 0" :value="handoverPendingCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/key-transfers">
          <el-icon><Key /></el-icon>
          <span>钥匙移交</span>
          <el-badge v-if="keyPendingCount > 0" :value="keyPendingCount" type="warning" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/deposits">
          <el-icon><Wallet /></el-icon>
          <span>押金结算</span>
          <el-badge v-if="depositDisputeCount > 0" :value="depositDisputeCount" type="danger" class="menu-badge" />
        </el-menu-item>
        <el-menu-item v-if="authStore.canAccess(['operations', 'finance'])" index="/audit">
          <el-icon><Tickets /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
        <el-menu-item index="/integration-map">
          <el-icon><Connection /></el-icon>
          <span>模拟数据&集成点</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h2 class="page-title">{{ currentTitle }}</h2>
        </div>
        <div class="header-right">
          <span class="role-tag" :class="`role-${authStore.userRole}`">
            {{ roleLabel }}
          </span>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar size="small" style="background: #409eff">{{ authStore.userName[0] }}</el-avatar>
              <span class="user-name">{{ authStore.userName }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  账号: {{ authStore.user?.username }}
                </el-dropdown-item>
                <el-dropdown-item disabled>
                  角色权限: {{ roleLabel }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { overviewApi } from '@/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')

const handoverPendingCount = ref(0)
const keyPendingCount = ref(0)
const depositDisputeCount = ref(0)

const roleLabel = computed(() => {
  const map = {
    consultant: '租赁顾问',
    operations: '运营经理',
    finance: '财务'
  }
  return map[authStore.userRole] || authStore.userRole
})

async function loadCounts() {
  try {
    const overview = await overviewApi.getDisputeOverview()
    handoverPendingCount.value = overview.summary.handoverDisputes
    keyPendingCount.value = overview.summary.pendingKeyTransfers
    depositDisputeCount.value = overview.summary.depositDisputes
  } catch (e) {}
}

function handleCommand(command) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

onMounted(loadCounts)
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-menu) {
  border-right: none;
  padding: 10px;
}

:deep(.el-menu-item) {
  border-radius: 6px;
  margin: 4px 0;
  position: relative;
}

.menu-badge {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #606266;
}

.main-content {
  background: #f5f7fa;
  overflow-y: auto;
  padding: 0;
}
</style>
