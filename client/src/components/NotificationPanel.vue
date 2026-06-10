<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { notificationApi } from '@/api'
import type { Notification } from '@/types'

const router = useRouter()
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'close'): void; (e: 'count-changed', n: number): void }>()

const list = ref<Notification[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const unreadCount = ref(0)

async function loadUnreadCount() {
  try {
    const res = await notificationApi.getUnreadCount()
    unreadCount.value = res.count
    emit('count-changed', res.count)
  } catch (e) {
    console.error('加载未读数失败:', e)
  }
}

async function loadList(reset = true) {
  if (reset) page.value = 1
  loading.value = true
  try {
    const res = await notificationApi.getList({ page: page.value, pageSize: pageSize.value })
    list.value = reset ? res.list : list.value.concat(res.list)
    total.value = res.total
  } catch (e) {
    console.error('加载通知失败:', e)
  } finally {
    loading.value = false
  }
}

async function markRead(item: Notification) {
  if (item.is_read) return
  try {
    await notificationApi.markRead(item.id)
    item.is_read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    emit('count-changed', unreadCount.value)
  } catch (e) {
    console.error('标记已读失败:', e)
  }
}

async function markAllRead() {
  if (unreadCount.value === 0) return
  if (!confirm(`确定要将全部 ${unreadCount.value} 条未读标记为已读吗？`)) return
  try {
    await notificationApi.markAllRead()
    list.value.forEach(n => (n.is_read = 1))
    unreadCount.value = 0
    emit('count-changed', 0)
  } catch (e) {
    console.error('全部已读失败:', e)
  }
}

function jumpTo(item: Notification) {
  markRead(item)
  closePanel()
  if (!item.biz_type || !item.biz_id) return
  switch (item.biz_type) {
    case 'reception':
      router.push(`/receptions/${item.biz_id}`)
      break
    case 'guide_task':
      // 向导任务也从接待详情进入，先查接待单 ID
      // 这里直接导航到接待列表，由详情 Tab 展示
      router.push(`/receptions`)
      break
    case 'warehouse_transfer':
      router.push(`/warehouse/${item.biz_id}`)
      break
  }
}

function closePanel() {
  emit('update:visible', false)
  emit('close')
}

function loadMore() {
  if (loading.value) return
  if (list.value.length >= total.value) return
  page.value++
  loadList(false)
}

function formatTime(t: string) {
  if (!t) return ''
  return t.slice(0, 16).replace('T', ' ')
}

const typeLabel = computed(() => (t: string) => {
  const map: Record<string, string> = {
    system: '系统',
    reception: '接待',
    task: '任务',
    warehouse: '仓库'
  }
  return map[t] || t
})

const typeColor = computed(() => (t: string) => {
  const map: Record<string, string> = {
    system: '#8c8c8c',
    reception: '#1890ff',
    task: '#52c41a',
    warehouse: '#fa8c16'
  }
  return map[t] || '#8c8c8c'
})

watch(() => props.visible, v => {
  if (v) {
    loadUnreadCount()
    loadList()
  }
})

onMounted(() => {
  loadUnreadCount()
})

defineExpose({ loadUnreadCount })
</script>

<template>
  <div v-if="visible" class="panel-mask" @click.self="closePanel">
    <div class="panel">
      <div class="panel-header">
        <div>
          <span style="font-size: 15px; font-weight: 600;">消息通知</span>
          <span v-if="unreadCount > 0" class="badge" style="margin-left: 8px;">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <a
            class="link"
            :class="{ disabled: unreadCount === 0 }"
            href="javascript:void(0)"
            @click="markAllRead"
          >全部已读</a>
          <span class="close" @click="closePanel">×</span>
        </div>
      </div>

      <div class="panel-body">
        <div v-if="loading && list.length === 0" class="empty">加载中...</div>
        <div v-else-if="list.length === 0" class="empty">暂无通知</div>
        <div v-else class="notif-list">
          <div
            v-for="item in list"
            :key="item.id"
            class="notif-item"
            :class="{ unread: !item.is_read }"
            @click="jumpTo(item)"
          >
            <div class="notif-header">
              <span class="type-tag" :style="{ background: typeColor(item.type) + '20', color: typeColor(item.type) }">
                {{ typeLabel(item.type) }}
              </span>
              <span class="notif-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <div class="notif-title">{{ item.title }}</div>
            <div v-if="item.content" class="notif-content">{{ item.content }}</div>
          </div>
        </div>

        <div
          v-if="list.length > 0 && list.length < total"
          class="load-more"
          @click="loadMore"
        >
          {{ loading ? '加载中...' : `加载更多（${list.length}/${total}）` }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.12);
  z-index: 999;
}

.panel {
  position: absolute;
  top: 60px;
  right: 24px;
  width: 380px;
  max-height: 70vh;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 10px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  min-width: 18px;
  text-align: center;
}

.link {
  font-size: 13px;
  color: #1890ff;
  text-decoration: none;
}
.link.disabled {
  color: #ccc;
  cursor: not-allowed;
}

.close {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}
.close:hover { color: #333; }

.panel-body {
  flex: 1;
  overflow-y: auto;
}

.empty {
  padding: 50px 0;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.notif-list {
  padding: 4px 0;
}

.notif-item {
  padding: 12px 18px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}
.notif-item:hover { background: #fafafa; }
.notif-item.unread { background: #f0f7ff; }
.notif-item.unread:hover { background: #e6f4ff; }

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.type-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 3px;
}

.notif-time {
  font-size: 11px;
  color: #999;
}

.notif-title {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  margin-bottom: 4px;
}

.notif-content {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.load-more {
  padding: 12px;
  text-align: center;
  color: #1890ff;
  font-size: 13px;
  cursor: pointer;
  border-top: 1px solid #f0f0f0;
}
.load-more:hover { background: #fafafa; }
</style>
