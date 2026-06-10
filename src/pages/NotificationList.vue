<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getNotifications, markAsRead, markAllRead } from '@/api/notifications'
import { useUnreadCount } from '@/composables/useUnreadCount'
import type { Notification } from '@/types'

const router = useRouter()
const { refreshUnread } = useUnreadCount()
const notifications = ref<Notification[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  type: '',
  isRead: null as number | null,
})

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '待到货提醒', value: 'arrival_reminder' },
  { label: '到货异常', value: 'exception_alert' },
]

const readOptions = [
  { label: '全部', value: null },
  { label: '未读', value: 0 },
  { label: '已读', value: 1 },
]

const typeMap: Record<string, { label: string; color: string; tagType: string }> = {
  arrival_reminder: { label: '待到货', color: '#2E7D32', tagType: 'success' },
  exception_alert: { label: '异常', color: '#C62828', tagType: 'danger' },
}

async function fetchNotifications() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filters.value.type) params.type = filters.value.type
    if (filters.value.isRead !== null) params.is_read = filters.value.isRead
    const res = await getNotifications(params)
    notifications.value = res.data.items || []
    total.value = res.data.total || 0
  } catch {
  } finally {
    loading.value = false
  }
}

async function handleMarkRead(row: Notification) {
  if (row.is_read) return
  try {
    await markAsRead(row.id)
    ElMessage.success('已标记为已读')
    await Promise.all([fetchNotifications(), refreshUnread()])
  } catch {
  }
}

async function handleMarkAllRead() {
  try {
    await markAllRead()
    ElMessage.success('全部标记已读')
    await Promise.all([fetchNotifications(), refreshUnread()])
  } catch {
  }
}

function goOrder(orderId: number | null) {
  if (orderId) router.push(`/orders/${orderId}`)
}

function goArrival(arrivalId: number | null) {
  if (arrivalId) router.push(`/arrivals/${arrivalId}`)
}

function goLogs(entityType: string, entityId: number) {
  router.push({ path: '/logs', query: { entity_type: entityType, entity_id: String(entityId) } })
}

function handlePageChange(val: number) {
  page.value = val
  fetchNotifications()
}

onMounted(fetchNotifications)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold m-0">消息通知</h1>
      <el-button type="primary" @click="handleMarkAllRead">全部标记已读</el-button>
    </div>

    <el-card class="mb-5">
      <div class="flex items-center gap-4 flex-wrap">
        <el-select v-model="filters.type" placeholder="类型筛选" style="width: 160px" @change="fetchNotifications">
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select v-model="filters.isRead" placeholder="已读状态" style="width: 140px" @change="fetchNotifications">
          <el-option v-for="opt in readOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
    </el-card>

    <el-card>
      <div v-if="notifications.length === 0 && !loading" class="text-center text-gray-400 py-10">暂无通知</div>
      <div
        v-for="item in notifications"
        :key="item.id"
        class="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 px-3 rounded"
        :class="{ 'bg-[#FFF8E1]': !item.is_read }"
        @click="handleMarkRead(item)"
      >
        <div class="flex-shrink-0 mt-1">
          <el-tag :type="typeMap[item.type]?.tagType" size="small">{{ typeMap[item.type]?.label }}</el-tag>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-sm" :class="{ 'font-bold': !item.is_read }">{{ item.title }}</span>
            <span v-if="!item.is_read" class="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
          </div>
          <p class="text-sm text-gray-500 m-0 leading-relaxed">{{ item.content }}</p>
          <div class="flex items-center gap-3 mt-2">
            <span v-if="item.order_no" class="text-xs text-[#5D4037] cursor-pointer hover:underline" @click.stop="goOrder(item.order_id)">
              订单: {{ item.order_no }}
            </span>
            <span v-if="item.arrival_no" class="text-xs text-[#2E7D32] cursor-pointer hover:underline" @click.stop="goArrival(item.arrival_id)">
              到货单: {{ item.arrival_no }}
            </span>
            <span class="text-xs text-blue-500 cursor-pointer hover:underline" @click.stop="goLogs('notification', item.id)">
              查看日志
            </span>
            <span class="text-xs text-gray-400 ml-auto">{{ item.created_at }}</span>
          </div>
        </div>
        <div class="flex-shrink-0">
          <el-button v-if="!item.is_read" link type="primary" size="small" @click.stop="handleMarkRead(item)">标为已读</el-button>
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>
