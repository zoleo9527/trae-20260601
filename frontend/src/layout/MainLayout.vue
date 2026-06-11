<template>
  <el-container class="layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">🏬 Outlet-ERP</div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#1f2937"
        text-color="#d1d5db"
        active-text-color="#fff"
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
          <el-badge v-if="m.badge === 'liability' && liabilityCount > 0" :value="liabilityCount" class="nav-badge" />
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="crumbs">
          <el-icon><Location /></el-icon>
          <span>{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-popover placement="bottom-end" :width="360" trigger="click">
            <template #reference>
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notif-btn">
                <el-icon :size="22"><Bell /></el-icon>
              </el-badge>
            </template>
            <div class="notif-popover">
              <div class="notif-head">
                <b>通知消息 ({{ unreadCount }}未读)</b>
                <el-button link type="primary" size="small" @click="markAllRead">全部已读</el-button>
              </div>
              <div class="notif-list">
                <div v-for="n in notifications.slice(0, 8)" :key="n.id"
                     class="notif-item" :class="{ read: n.is_read }" @click="readNotif(n)">
                  <div class="type-tag" :class="n.type.toLowerCase()">{{ n.type === 'SYSTEM' ? '系统' : '通知' }}</div>
                  <div class="content">
                    <div class="title">{{ n.title }}</div>
                    <div class="desc">{{ n.content }}</div>
                    <div class="time">{{ n.created_at }}</div>
                  </div>
                </div>
                <div v-if="notifications.length === 0" class="empty">暂无消息</div>
              </div>
            </div>
          </el-popover>

          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" style="background:#4f46e5">{{ userStore.userName?.charAt(0) }}</el-avatar>
              <div class="info">
                <div class="name">{{ userStore.userName }}</div>
                <div class="role">{{ userStore.roleName }}</div>
              </div>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, Bell, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getNotifications, markNotifRead, markAllNotifRead, getLeaseList } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menus = computed(() => [
  { path: '/dashboard', title: '工作台 - 主管进度视图', icon: 'DataBoard' },
  { path: '/pending', title: '待办列表', icon: 'List' },
  { path: '/leases', title: '品牌租约', icon: 'Document' },
  { path: '/deduction', title: '扣点规则管理', icon: 'Money' },
  { path: '/liability', title: '责任不清台账', icon: 'Warning', badge: 'liability' },
  ...(userStore.canExport ? [{ path: '/export', title: '导出中心', icon: 'Download' }] : []),
])

const currentTitle = computed(() => route.meta.title || '')

const notifications = ref([])
const unreadCount = ref(0)
const liabilityCount = ref(0)

const loadNotifications = async () => {
  const res = await getNotifications({ pageSize: 20 })
  notifications.value = res.data.list
  unreadCount.value = res.data.unreadCount
}
const loadLiabilityCount = async () => {
  try {
    const res = await getLeaseList({ liability_flag: 1, pageSize: 1 })
    liabilityCount.value = res.data.total || 0
  } catch (e) {}
}
const readNotif = async (n) => {
  if (!n.is_read) await markNotifRead(n.id)
  if (n.related_lease_id) router.push(`/leases/${n.related_lease_id}`)
  loadNotifications()
}
const markAllRead = async () => {
  await markAllNotifRead()
  unreadCount.value = 0
  notifications.value = notifications.value.map(n => ({ ...n, is_read: 1 }))
}
const handleCommand = async (cmd) => {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
    userStore.logout()
    ElMessage.success('已退出')
    router.replace('/login')
  }
}

onMounted(() => {
  loadNotifications()
  loadLiabilityCount()
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadNotifications()
      loadLiabilityCount()
    }
  }, 60000)
})
</script>

<style scoped>
.layout { height: 100vh; }
.sidebar { background: #1f2937; display: flex; flex-direction: column; }
.logo { color: #fff; font-size: 18px; font-weight: 700; padding: 20px; border-bottom: 1px solid #374151; }
.el-menu { border-right: none; flex: 1; }
.nav-badge { margin-left: 8px; }
.header { background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
.crumbs { display: flex; align-items: center; gap: 8px; color: #374151; font-weight: 500; }
.header-right { display: flex; align-items: center; gap: 24px; }
.notif-btn { cursor: pointer; color: #374151; }
.user-info { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.user-info:hover { background: #f3f4f6; }
.user-info .info { text-align: right; }
.user-info .name { font-size: 13px; color: #111827; font-weight: 500; line-height: 1.2; }
.user-info .role { font-size: 11px; color: #6b7280; }
.main { background: #f9fafb; overflow-y: auto; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.notif-popover :deep(.type-tag) {
  font-size: 11px; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
  background: #eef2ff; color: #4338ca;
}
.notif-popover :deep(.type-tag.system) { background: #fef3c7; color: #92400e; }
.notif-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; margin-bottom: 8px;}
.notif-list { max-height: 400px; overflow-y: auto; }
.notif-item { padding: 10px 0; border-bottom: 1px solid #f9fafb; display: flex; gap: 10px; cursor: pointer; }
.notif-item:hover { background: #f9fafb; }
.notif-item.read { opacity: 0.6; }
.notif-item .title { font-size: 13px; font-weight: 500; color: #111827; }
.notif-item .desc { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.5; }
.notif-item .time { font-size: 11px; color: #9ca3af; margin-top: 4px; }
.empty { text-align: center; color: #9ca3af; padding: 20px; font-size: 12px; }
</style>
