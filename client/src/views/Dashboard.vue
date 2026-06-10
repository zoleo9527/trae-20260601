<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { receptionApi, guideTaskApi, warehouseTransferApi } from '@/api'
import { receptionStatusColors, guideTaskStatusColors, warehouseStatusColors } from '@/utils/constants'
import type { Reception, GuideTask, WarehouseTransfer } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({
  pendingReceptions: 0,
  todayReceptions: 0,
  activeGuideTasks: 0,
  pendingWarehouse: 0
})

const recentReceptions = ref<Reception[]>([])
const myTasks = ref<GuideTask[]>([])
const pendingTransfers = ref<WarehouseTransfer[]>([])

const currentRole = computed(() => userStore.currentUser?.role || 'service')

async function loadStats() {
  try {
    const [recvData, taskData, transferData] = await Promise.all([
      receptionApi.getList({ pageSize: 5 }),
      guideTaskApi.getList({ status: 'assigned', pageSize: 5 }),
      warehouseTransferApi.getList({ status: 'pending', pageSize: 5 })
    ])
    stats.value.pendingReceptions = recvData.total
    stats.value.todayReceptions = recvData.total
    recentReceptions.value = recvData.list
    stats.value.activeGuideTasks = taskData.total
    myTasks.value = taskData.list
    stats.value.pendingWarehouse = transferData.total
    pendingTransfers.value = transferData.list
  } catch (e) {
    console.error('加载数据失败:', e)
  }
}

function goReceptionList() {
  router.push('/receptions')
}

function goReceptionDetail(id: number) {
  router.push(`/receptions/${id}`)
}

function goGuideTasks() {
  router.push('/guide-tasks')
}

function goGuideTaskDetail(id: number) {
  router.push(`/guide-tasks/${id}`)
}

function goWarehouse() {
  router.push('/warehouse')
}

function goWarehouseDetail(id: number) {
  router.push(`/warehouse/${id}`)
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">工作台</h1>
      <div>
        <span style="color: #666; font-size: 13px;">
          当前身份：{{ currentRole === 'service' ? '园区客服' : currentRole === 'guide' ? '采摘向导' : '仓库员' }}
        </span>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card" @click="goReceptionList" style="cursor: pointer;">
        <div class="stat-card-title">待分配接待</div>
        <div class="stat-card-value" :style="{ color: receptionStatusColors.pending }">
          {{ stats.pendingReceptions }}
        </div>
      </div>
      <div class="stat-card" @click="goGuideTasks" style="cursor: pointer;">
        <div class="stat-card-title">进行中任务</div>
        <div class="stat-card-value" :style="{ color: guideTaskStatusColors.in_progress }">
          {{ stats.activeGuideTasks }}
        </div>
      </div>
      <div class="stat-card" @click="goWarehouse" style="cursor: pointer;">
        <div class="stat-card-title">待仓库接收</div>
        <div class="stat-card-value" :style="{ color: warehouseStatusColors.pending }">
          {{ stats.pendingWarehouse }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">今日接待</div>
        <div class="stat-card-value" style="color: #1890ff;">
          {{ stats.todayReceptions }}
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
      <div class="card">
        <div class="detail-section-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>最近接待单</span>
          <button class="btn btn-sm btn-link" @click="goReceptionList">查看全部</button>
        </div>
        <div v-if="recentReceptions.length === 0" style="color: #999; text-align: center; padding: 20px 0;">
          暂无数据
        </div>
        <div v-else>
          <div
            v-for="item in recentReceptions"
            :key="item.id"
            style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer;"
            @click="goReceptionDetail(item.id)"
          >
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">{{ item.group_name }}</span>
              <span
                class="tag"
                :style="{
                  background: receptionStatusColors[item.status] + '20',
                  color: receptionStatusColors[item.status]
                }"
              >
                {{ item.status === 'pending' ? '待分配' : item.status === 'assigned' ? '已分配' : item.status }}
              </span>
            </div>
            <div style="font-size: 12px; color: #999;">
              {{ item.scheduled_date }} · {{ item.people_count }}人
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="detail-section-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>我的向导任务</span>
          <button class="btn btn-sm btn-link" @click="goGuideTasks">查看全部</button>
        </div>
        <div v-if="myTasks.length === 0" style="color: #999; text-align: center; padding: 20px 0;">
          暂无任务
        </div>
        <div v-else>
          <div
            v-for="item in myTasks"
            :key="item.id"
            style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer;"
            @click="goGuideTaskDetail(item.id)"
          >
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">{{ item.group_name }}</span>
              <span
                class="tag"
                :style="{
                  background: guideTaskStatusColors[item.status] + '20',
                  color: guideTaskStatusColors[item.status]
                }"
              >
                {{ item.status === 'assigned' ? '待开始' : item.status === 'in_progress' ? '进行中' : '已完成' }}
              </span>
            </div>
            <div style="font-size: 12px; color: #999;">
              {{ item.task_no }} · {{ item.scheduled_date }}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="detail-section-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>待仓库交接</span>
          <button class="btn btn-sm btn-link" @click="goWarehouse">查看全部</button>
        </div>
        <div v-if="pendingTransfers.length === 0" style="color: #999; text-align: center; padding: 20px 0;">
          暂无待交接
        </div>
        <div v-else>
          <div
            v-for="item in pendingTransfers"
            :key="item.id"
            style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer;"
            @click="goWarehouseDetail(item.id)"
          >
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">{{ item.group_name }}</span>
              <span
                class="tag"
                :style="{
                  background: warehouseStatusColors[item.status] + '20',
                  color: warehouseStatusColors[item.status]
                }"
              >
                {{ item.status === 'pending' ? '待接收' : item.status === 'received' ? '待入库' : '已入库' }}
              </span>
            </div>
            <div style="font-size: 12px; color: #999;">
              {{ item.transfer_no }} · {{ item.total_weight }}斤
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="detail-section-title">业务流程说明</div>
      <div class="step-nav" style="margin-bottom: 0; background: #fafafa;">
        <div class="step-item active">
          <div class="step-num">1</div>
          <div>
            <div class="step-title">园区客服</div>
            <div style="font-size: 12px; color: #999;">创建接待单 → 分配向导</div>
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">2</div>
          <div>
            <div class="step-title">采摘向导</div>
            <div style="font-size: 12px; color: #999;">接收任务 → 带队采摘 → 完成交接</div>
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">3</div>
          <div>
            <div class="step-title">仓库员</div>
            <div style="font-size: 12px; color: #999;">接收果品 → 入库确认</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
