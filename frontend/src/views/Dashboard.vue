<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value" style="color: #409eff;">{{ stats.totalPackages }}</div>
            <div class="stat-label">器械包总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ stats.processingBatches }}</div>
            <div class="stat-label">灭菌进行中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value" style="color: #e6a23c;">{{ stats.pendingExceptions }}</div>
            <div class="stat-label">待处理异常</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ stats.activeRecalls }}</div>
            <div class="stat-label">活跃召回</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">器械包状态分布</span>
          </template>
          <div style="height: 200px; display: flex; flex-direction: column; justify-content: center;">
            <div v-for="item in statusDistribution" :key="item.status" style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>{{ statusMap[item.status] || item.status }}</span>
                <span>{{ item.count }} 个</span>
              </div>
              <el-progress :percentage="Math.round(item.count / stats.totalPackages * 100)" :show-text="false" :color="statusColor[item.status]" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">最近动态</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in stats.recentActivity"
              :key="index"
              :timestamp="formatTime(item.created_at)"
              placement="top"
            >
              <el-tag size="small">{{ item.action }}</el-tag>
              <span style="margin-left: 8px;">{{ item.package_no }}</span>
              <span style="color: #909399; margin-left: 8px;">- {{ item.operator_name }}</span>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">快捷操作</span>
          </template>
          <el-space wrap>
            <el-button type="primary" @click="$router.push('/packages')">
              <el-icon><Box /></el-icon> 查看器械包
            </el-button>
            <el-button type="success" @click="$router.push('/batches')">
              <el-icon><Files /></el-icon> 查看灭菌批次
            </el-button>
            <el-button type="warning" @click="$router.push('/workflow/recycle')">
              <el-icon><Download /></el-icon> 提交回收
            </el-button>
            <el-button type="danger" @click="$router.push('/exceptions')">
              <el-icon><Warning /></el-icon> 处理异常
            </el-button>
            <el-button @click="$router.push('/recalls')">
              <el-icon><RefreshLeft /></el-icon> 召回管理
            </el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { dashboardAPI } from '../api'

const stats = ref({
  totalPackages: 0,
  processingBatches: 0,
  pendingExceptions: 0,
  activeRecalls: 0,
  statusStats: [],
  recentActivity: []
})

const statusMap = {
  available: '可用',
  recycling: '待回收',
  recycled: '已回收',
  cleaning: '清洗中',
  cleaned: '已清洗',
  packaged: '已打包',
  sterilizing: '灭菌中',
  sterilized: '已灭菌',
  qualified: '质检合格',
  delivering: '配送中',
  received: '已签收',
  in_use: '使用中'
}

const statusColor = {
  available: '#409eff',
  recycling: '#e6a23c',
  recycled: '#909399',
  cleaning: '#67c23a',
  cleaned: '#67c23a',
  packaged: '#909399',
  sterilizing: '#409eff',
  sterilized: '#67c23a',
  qualified: '#67c23a',
  delivering: '#409eff',
  received: '#67c23a',
  in_use: '#e6a23c'
}

const statusDistribution = computed(() => {
  return stats.value.statusStats || []
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const loadStats = async () => {
  try {
    const res = await dashboardAPI.getStats()
    stats.value = res.data
  } catch (err) {
    console.error('加载统计数据失败', err)
  }
}

onMounted(() => {
  loadStats()
})
</script>
