<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <el-icon :size="28" color="#409EFF"><OfficeBuilding /></el-icon>
        <span>写字楼租赁管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#b8c4d0"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/properties">
          <el-icon><OfficeBuilding /></el-icon>
          <span>房源管理</span>
        </el-menu-item>
        <el-menu-item index="/viewings">
          <el-icon><Calendar /></el-icon>
          <span>带看安排</span>
        </el-menu-item>
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常处理</span>
          <el-badge
            v-if="pendingExceptionCount > 0"
            :value="pendingExceptionCount"
            :max="99"
            class="exception-badge"
          />
        </el-menu-item>
        <el-menu-item index="/handover">
          <el-icon><Notebook /></el-icon>
          <span>交班摘要</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-title">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button
            type="primary"
            size="small"
            @click="openExceptionDrawer"
          >
            <el-icon><Plus /></el-icon>
            快速上报异常
          </el-button>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ authStore.userName }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  角色：{{ authStore.user?.role === 'admin' ? '管理员' : '员工' }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <exception-drawer
      v-model="exceptionDrawerVisible"
      :property-id="exceptionPropertyId"
      :viewing-id="exceptionViewingId"
      @success="handleExceptionCreated"
    />
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  OfficeBuilding, Calendar, Warning, Plus, UserFilled, SwitchButton, Notebook
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { exceptionApi } from '@/utils/api'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const exceptionDrawerVisible = ref(false)
const exceptionPropertyId = ref(null)
const exceptionViewingId = ref(null)
const pendingExceptionCount = ref(0)

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => route.meta?.title || '')

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  }
}

function openExceptionDrawer() {
  exceptionPropertyId.value = null
  exceptionViewingId.value = null
  exceptionDrawerVisible.value = true
}

async function loadPendingCount() {
  try {
    const data = await exceptionApi.getList({ status: 'pending', page_size: 1 })
    pendingExceptionCount.value = data.total
  } catch (e) {
    console.error(e)
  }
}

function handleExceptionCreated() {
  loadPendingCount()
}

onMounted(() => {
  loadPendingCount()
})

defineExpose({
  openExceptionDrawer,
  loadPendingCount
})
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.layout-aside {
  background: #001529;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  position: relative;
}

.exception-badge {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.layout-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}

.user-info:hover {
  color: #409EFF;
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
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
