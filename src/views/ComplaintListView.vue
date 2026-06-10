<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { complaintApi } from '../api/resources'
import { STATUS_LABELS } from '../types'
import type { Complaint } from '../types'

const router = useRouter()
const complaints = ref<Complaint[]>([])
const loading = ref(true)
const activeTab = ref<string>('all')

onMounted(async () => {
  await loadData()
  loading.value = false
})

async function loadData() {
  try {
    const params: any = {}
    if (activeTab.value !== 'all') params.status = activeTab.value
    const res = await complaintApi.list(params)
    complaints.value = res.data
  } catch {}
}

async function handleTabChange(tab: string) {
  activeTab.value = tab
  await loadData()
}

function goToDetail(id: number) {
  router.push({ name: 'complaint-detail', params: { id } })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'badge-danger',
    processing: 'badge-warning',
    replied: 'badge-success',
  }
  return map[status] || 'badge-gray'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">💬 投诉处理</h1>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'all' }" @click="handleTabChange('all')">全部</button>
      <button class="tab" :class="{ active: activeTab === 'pending' }" @click="handleTabChange('pending')">待处理</button>
      <button class="tab" :class="{ active: activeTab === 'processing' }" @click="handleTabChange('processing')">处理中</button>
      <button class="tab" :class="{ active: activeTab === 'replied' }" @click="handleTabChange('replied')">已回复</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="complaints.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <p>暂无投诉记录</p>
      </div>
    </div>

    <div v-else>
      <div v-for="c in complaints" :key="c.id" class="card complaint-card" @click="goToDetail(c.id)">
        <div class="complaint-header">
          <div class="flex items-center gap-3">
            <span class="badge" :class="statusBadge(c.status)">{{ STATUS_LABELS[c.status] }}</span>
            <span class="badge badge-gray">{{ c.category }}</span>
          </div>
          <span class="text-xs text-gray">{{ c.created_at ? new Date(c.created_at).toLocaleString('zh-CN') : '' }}</span>
        </div>
        <div class="complaint-body">
          <div class="complaint-visitor">{{ c.visitor_name }} <span class="text-sm text-gray">{{ c.visitor_phone }}</span></div>
          <div class="complaint-content">{{ c.content }}</div>
          <div v-if="c.reply_content" class="complaint-reply">
            <span class="text-sm text-gray">回复:</span> {{ c.reply_content }}
          </div>
        </div>
        <div class="complaint-footer">
          <span v-if="c.handler_name" class="text-sm text-gray">处理人: {{ c.handler_name }}</span>
          <span v-else class="text-sm" style="color: var(--danger)">尚未分配处理人</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.complaint-card {
  cursor: pointer;
  transition: all 0.2s;
}

.complaint-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.complaint-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.complaint-visitor {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.complaint-content {
  font-size: 14px;
  color: var(--gray-700);
  line-height: 1.5;
}

.complaint-reply {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--success-light);
  border-radius: 6px;
  font-size: 13px;
  color: var(--success);
}

.complaint-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--gray-100);
}
</style>
