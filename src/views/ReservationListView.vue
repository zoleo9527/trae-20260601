<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reservationApi } from '../api/resources'
import { STATUS_LABELS } from '../types'
import type { Reservation } from '../types'

const router = useRouter()
const reservations = ref<Reservation[]>([])
const loading = ref(true)
const activeTab = ref<string>('all')
const showCreate = ref(false)
const creating = ref(false)
const form = ref({
  visitor_name: '',
  visitor_phone: '',
  reserved_date: '',
  fruit_type: '水蜜桃',
  reserved_qty: 0,
  notes: '',
})

const fruitTypes = ['水蜜桃', '巨峰葡萄', '阳光玫瑰', '红富士苹果']

onMounted(async () => {
  await loadData()
  loading.value = false
})

async function loadData() {
  try {
    const params: any = {}
    if (activeTab.value !== 'all') params.status = activeTab.value
    const res = await reservationApi.list(params)
    reservations.value = res.data
  } catch {}
}

async function handleTabChange(tab: string) {
  activeTab.value = tab
  await loadData()
}

function goToDetail(id: number) {
  router.push({ name: 'reservation-detail', params: { id } })
}

async function handleCreate() {
  creating.value = true
  try {
    await reservationApi.create(form.value)
    showCreate.value = false
    form.value = { visitor_name: '', visitor_phone: '', reserved_date: '', fruit_type: '水蜜桃', reserved_qty: 0, notes: '' }
    await loadData()
  } catch (e: any) {
    alert(e.response?.data?.detail || '创建失败')
  }
  creating.value = false
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">📅 预约管理</h1>
      <button class="btn btn-primary" @click="showCreate = true">+ 新建预约</button>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'all' }" @click="handleTabChange('all')">全部</button>
      <button class="tab" :class="{ active: activeTab === 'pending' }" @click="handleTabChange('pending')">待确认</button>
      <button class="tab" :class="{ active: activeTab === 'confirmed' }" @click="handleTabChange('confirmed')">已确认</button>
      <button class="tab" :class="{ active: activeTab === 'completed' }" @click="handleTabChange('completed')">已完成</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="card">
      <div v-if="reservations.length === 0" class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p>暂无预约记录</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>游客</th>
            <th>电话</th>
            <th>预约日期</th>
            <th>果品</th>
            <th>预约量</th>
            <th>实际量</th>
            <th>状态</th>
            <th>超量</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reservations" :key="r.id" class="clickable-row" @click="goToDetail(r.id)">
            <td>{{ r.visitor_name }}</td>
            <td class="text-sm">{{ r.visitor_phone }}</td>
            <td>{{ r.reserved_date }}</td>
            <td>{{ r.fruit_type }}</td>
            <td>{{ r.reserved_qty }}斤</td>
            <td>{{ r.actual_qty > 0 ? r.actual_qty + '斤' : '-' }}</td>
            <td>
              <span class="badge" :class="{
                'badge-warning': r.status === 'pending',
                'badge-info': r.status === 'confirmed',
                'badge-success': r.status === 'completed',
              }">{{ STATUS_LABELS[r.status] }}</span>
            </td>
            <td>
              <span v-if="r.overbook_flag" class="badge badge-danger">⚠️ 超量</span>
              <span v-else class="text-gray text-sm">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showCreate" class="dialog-overlay" @click.self="showCreate = false">
      <div class="dialog">
        <h3>新建预约</h3>
        <div class="form-group">
          <label class="form-label">游客姓名</label>
          <input v-model="form.visitor_name" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">联系电话</label>
          <input v-model="form.visitor_phone" class="form-input" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">预约日期</label>
            <input v-model="form.reserved_date" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">果品</label>
            <select v-model="form.fruit_type" class="form-select">
              <option v-for="f in fruitTypes" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">预约数量(斤)</label>
          <input v-model.number="form.reserved_qty" type="number" min="1" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">备注</label>
          <textarea v-model="form.notes" class="form-textarea" placeholder="特殊需求等"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showCreate = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate" :disabled="creating || !form.visitor_name">
            {{ creating ? '创建中...' : '创建预约' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 480px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow-y: auto;
}

.dialog h3 {
  font-size: 18px;
  margin-bottom: 16px;
}
</style>
