<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#409eff"><ShoppingCart /></el-icon>
        <span class="logo-text">奥特莱斯运营</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2d3d"
        text-color="#c0ccda"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/discount">
          <el-icon><Discount /></el-icon>
          <span>折扣活动</span>
        </el-menu-item>
        <el-menu-item index="/price-report">
          <el-icon><Money /></el-icon>
          <span>价格报备</span>
        </el-menu-item>
        <el-menu-item index="/exception">
          <el-icon><Warning /></el-icon>
          <span>异常处理</span>
          <el-badge v-if="exceptionCount > 0" :value="exceptionCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item v-if="!isStoreManager" index="/logs">
          <el-icon><Document /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userInfo?.name }}
              <el-tag size="small" :type="roleTagType">{{ roleLabel }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { discountApi, priceReportApi } from '@/api'
import { ROLE_LABELS } from '@/utils/constants'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
const isStoreManager = computed(() => userStore.isStoreManager)
const roleLabel = computed(() => ROLE_LABELS[userStore.userRole] || '')
const exceptionCount = ref(0)

const roleTagType = computed(() => {
  switch (userStore.userRole) {
    case 'store_manager': return 'warning'
    case 'operation_supervisor': return 'primary'
    case 'investment_manager': return 'success'
    default: return 'info'
  }
})

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/discount')) return '/discount'
  if (path.startsWith('/price-report')) return '/price-report'
  return path
})

async function loadExceptionCount() {
  try {
    const [dRes, pRes] = await Promise.all([
      discountApi.getStatistics(),
      priceReportApi.getStatistics()
    ])
    exceptionCount.value = (dRes.exception || 0) + (pRes.exception || 0)
  } catch (e) {
    console.error('Load exception count error:', e)
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  }
}

onMounted(() => {
  loadExceptionCount()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #1f2d3d;
  overflow-y: auto;
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
  border-bottom: 1px solid #304156;
}

.logo-text {
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.menu-badge {
  margin-left: 8px;
}

.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.main-content {
  background-color: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
