<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const events = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const loadData = async () => {
  loading.value = true
  try {
    const result = await window.api.accessEvent.list(page.value, pageSize.value)
    events.value = result.data
    total.value = result.total
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const totalPages = () => Math.ceil(total.value / pageSize.value)

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'badge-active', inactive: 'badge-inactive',
    lost: 'badge-lost', expired: 'badge-expired', pending: 'badge-pending'
  }
  return map[status] || ''
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '正常', inactive: '停用',
    lost: '已挂失', expired: '已过期', pending: '待激活'
  }
  return map[status] || status
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-header">
        <span class="text-gray">共 {{ total }} 条事件记录</span>
        <button class="btn btn-primary" @click="loadData">刷新</button>
      </div>
      <div class="card-body" style="padding: 0;">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>卡号</th>
                <th>持卡人</th>
                <th>卡状态</th>
                <th>门禁点</th>
                <th>结果</th>
                <th>原因</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in events" :key="event.id">
                <td class="text-sm text-gray">
                  {{ dayjs(event.eventTime).format('YYYY-MM-DD HH:mm:ss') }}
                </td>
                <td class="font-mono">{{ event.cardNo }}</td>
                <td>{{ event.residentName || '未知' }}</td>
                <td>
                  <span v-if="event.cardStatus" class="badge" :class="getStatusBadge(event.cardStatus)">
                    {{ getStatusLabel(event.cardStatus) }}
                  </span>
                  <span v-else class="text-gray">-</span>
                </td>
                <td>{{ event.doorName }}</td>
                <td>
                  <span v-if="event.success" class="badge badge-active">✅ 成功</span>
                  <span v-else class="badge badge-lost">❌ 失败</span>
                </td>
                <td>
                  <span v-if="event.reason" class="text-danger">{{ event.reason }}</span>
                  <span v-else class="text-gray">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button :disabled="page === 1" @click="page--; loadData()">上一页</button>
          <button
            v-for="p in Math.min(5, totalPages())"
            :key="p"
            :class="{ active: p === page }"
            @click="page = p; loadData()"
          >
            {{ p }}
          </button>
          <span v-if="totalPages() > 5" class="text-gray">... {{ totalPages() }}</span>
          <button :disabled="page >= totalPages()" @click="page++; loadData()">下一页</button>
          <span class="text-gray ml-4">第 {{ page }} / {{ totalPages() }} 页</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: 'SF Mono', Monaco, monospace;
}
.ml-4 {
  margin-left: 16px;
}
</style>
