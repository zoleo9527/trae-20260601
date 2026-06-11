<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)

const menuItems = [
  { path: '/history', label: '历史回看', icon: 'Clock' },
  { path: '/allocations', label: '调拨单列表', icon: 'Tickets' },
  { path: '/pending-review', label: '待到柜复核', icon: 'CircleCheck' },
]
</script>

<template>
  <el-container style="height: 100%">
    <el-aside width="220px" style="background: #1f2937; color: #fff">
      <div style="padding: 20px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #374151">
        🏬 百货专柜系统
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#1f2937"
        text-color="#e5e7eb"
        active-text-color="#818cf8"
        router
        style="border: none"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
      <div style="padding: 16px; font-size: 12px; color: #9ca3af; margin-top: 20px; border-top: 1px solid #374151">
        当前用户：张柜长<br />
        品牌：雅诗兰黛 · 2F
      </div>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center">
        <div style="font-size: 18px; font-weight: 500; color: #1f2937">
          {{ (route.meta.title as string) || '' }}
        </div>
        <div style="margin-left: auto; color: #6b7280; font-size: 13px">
          角色：柜长 / 楼层主管 / 品牌督导
        </div>
      </el-header>
      <el-main style="background: #f3f4f6; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
