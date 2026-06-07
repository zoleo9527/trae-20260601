<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background: #001529; color: #fff">
      <div style="padding: 20px; text-align: center; font-size: 18px; font-weight: bold; border-bottom: 1px solid #1f3a5c">
        KTV管理系统
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#ffd04b"
        style="border: none"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <template v-if="isBooking || isAdmin || isFloor">
          <el-menu-item index="/booking">
            <el-icon><Calendar /></el-icon>
            <span>包厢预订</span>
          </el-menu-item>
        </template>
        <template v-if="isBooking || isAdmin || isFloor">
          <el-menu-item index="/verification">
            <el-icon><Present /></el-icon>
            <span>赠品核销</span>
          </el-menu-item>
        </template>
        <template v-if="isBar || isAdmin || isFloor">
          <el-menu-item index="/outbound">
            <el-icon><Goods /></el-icon>
            <span>酒水出库</span>
          </el-menu-item>
        </template>
        <template v-if="isBar || isAdmin">
          <el-menu-item index="/drink">
            <el-icon><CoffeeCup /></el-icon>
            <span>酒水管理</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center">
        <div style="font-size: 16px; font-weight: 500">{{ pageTitle }}</div>
        <div style="display: flex; align-items: center; gap: 16px">
          <el-tag :type="roleTagType">{{ userStore.roleName }}</el-tag>
          <span>{{ userStore.realName }}</span>
          <el-button type="text" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </el-header>
      <el-main style="background: #f5f7fa">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '')

const isBooking = computed(() => userStore.isBooking)
const isFloor = computed(() => userStore.isFloor)
const isBar = computed(() => userStore.isBar)
const isAdmin = computed(() => userStore.isAdmin)

const roleTagType = computed(() => {
  const map = {
    BOOKING: '',
    FLOOR: 'warning',
    BAR: 'success',
    ADMIN: 'danger'
  }
  return map[userStore.role] || ''
})

const logout = () => {
  userStore.clearUser()
  router.push('/login')
}
</script>
