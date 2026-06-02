<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #304156;">
      <div style="padding: 20px; text-align: center; color: white; font-size: 18px; font-weight: bold;">
        器械追踪系统
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        
        <el-sub-menu index="query">
          <template #title>
            <el-icon><Search /></el-icon>
            <span>信息查询</span>
          </template>
          <el-menu-item index="/packages">器械包列表</el-menu-item>
          <el-menu-item index="/batches">灭菌批次</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="workflow">
          <template #title>
            <el-icon><Operation /></el-icon>
            <span>工作流程</span>
          </template>
          <el-menu-item index="/workflow/recycle">回收提交</el-menu-item>
          <el-menu-item index="/workflow/cleaning">清洗处理</el-menu-item>
          <el-menu-item index="/workflow/sterilization">灭菌管理</el-menu-item>
          <el-menu-item index="/workflow/delivery">配送签收</el-menu-item>
          <el-menu-item index="/workflow/feedback">使用反馈</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常管理</span>
        </el-menu-item>
        
        <el-menu-item index="/recalls">
          <el-icon><RefreshLeft /></el-icon>
          <span>召回管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header style="background: white; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center; padding: 0 20px;">
        <div style="font-size: 16px; color: #666;">医疗器械包全链路追踪系统</div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span>{{ user?.name }} ({{ roleText }})</span>
          <el-button type="danger" size="small" @click="logout">退出</el-button>
        </div>
      </el-header>
      
      <el-main style="background: #f0f2f5; padding: 20px;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const activeMenu = computed(() => route.path)

const roleMap = {
  admin: '管理员',
  nurse: '护士',
  cleaner: '清洗员',
  sterilizer: '灭菌员',
  deliverer: '配送员',
  inspector: '质检员'
}

const roleText = computed(() => roleMap[user.value.role] || user.value.role)

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>
