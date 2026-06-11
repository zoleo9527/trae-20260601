<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <el-icon :size="24" color="#fff"><Tools /></el-icon>
        <span class="logo-text">电梯维保系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item :index="`/${route.path}`">
            <el-icon><component :is="route.meta.icon" /></el-icon>
            <span>{{ route.meta.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon :size="20" class="collapse-icon"><Menu /></el-icon>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.name }}</span>
              <span class="role-tag">{{ roleLabel }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人信息</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getRoleLabel } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/plans/')) {
    return '/plans'
  }
  if (path.startsWith('/checkins/')) {
    return '/checkins'
  }
  return path
})

const menuRoutes = computed(() => {
  const routes = router.options.routes
    .find(r => r.path === '/')
    ?.children?.filter(r => !r.meta?.hidden) || []
  
  return routes.filter(r => {
    if (r.meta?.roles && r.meta.roles.length > 0) {
      return userStore.hasRole(r.meta.roles)
    }
    return true
  })
})

const roleLabel = computed(() => getRoleLabel(userStore.role))

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await userStore.logout()
      ElMessage.success('退出成功')
      router.push('/login')
    } catch (e) {
      if (e !== 'cancel') {
        console.error('Logout error:', e)
      }
    }
  } else if (command === 'profile') {
    ElMessage.info('个人信息功能开发中')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.layout-aside {
  background-color: #304156;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: #2b2f3a;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin-left: 12px;
}

.layout-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.layout-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.layout-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.collapse-icon {
  color: #606266;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  margin-left: 8px;
  color: #303133;
}

.role-tag {
  margin-left: 8px;
  padding: 2px 8px;
  background-color: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
}

.dropdown-icon {
  margin-left: 4px;
  color: #909399;
}

.layout-main {
  background-color: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}
</style>
