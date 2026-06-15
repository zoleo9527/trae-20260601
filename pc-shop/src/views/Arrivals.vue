<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">📦 配件到货</h1>
        <p class="page-subtitle">到货验收、批次追踪、异常上报</p>
      </div>
      <div class="flex gap-8">
        <select v-model="filterStatus" class="form-select-sm">
          <option value="all">全部状态</option>
          <option value="pending">待验收</option>
          <option value="partial">验收中</option>
          <option value="completed">已完成</option>
        </select>
        <button class="btn btn-primary btn-sm">+ 新增到货单</button>
      </div>
    </div>

    <div class="grid-4 mb-16">
      <div class="stat-card">
        <div class="stat-label">待验收</div>
        <div class="stat-value text-primary">{{ appStore.pendingArrivals.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">验收中</div>
        <div class="stat-value text-warning">{{ appStore.partialArrivals.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">本周到货</div>
        <div class="stat-value" style="color:#7c3aed">{{ appStore.arrivals.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">批次预警</div>
        <div class="stat-value text-danger">{{ batchWarningCount }}</div>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>到货单号</th>
            <th>供应商</th>
            <th>采购单号</th>
            <th>状态</th>
            <th>验收进度</th>
            <th>预计到货</th>
            <th>批次异常</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="arr in filteredList" :key="arr.id">
            <td><a @click="goDetail(arr.id)" class="font-semibold">{{ arr.id }}</a></td>
            <td>{{ arr.supplier }}</td>
            <td class="text-muted">{{ arr.poNo }}</td>
            <td>
              <span class="tag" :class="statusTagClass(arr.status)">{{ statusLabel(arr.status) }}</span>
            </td>
            <td>
              <div class="flex gap-8 items-center">
                <div style="width:80px;height:6px;background:var(--gray-100);border-radius:3px;overflow:hidden">
                  <div class="progress-fill" :style="{width: Math.round(arr.checkedItems/arr.totalItems*100) + '%'}"></div>
                </div>
                <span class="text-xs text-muted">{{ arr.checkedItems }}/{{ arr.totalItems }}</span>
              </div>
            </td>
            <td class="text-sm">{{ arr.expectedDate }}</td>
            <td>
              <span v-if="arr.anomaly" class="tag" :class="arr.anomaly.level==='danger' ? 'tag-red' : 'tag-yellow'">
                ⚠️ {{ arr.anomaly.title }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <div class="flex gap-8">
                <button class="btn-link btn text-sm" @click="goDetail(arr.id)">查看</button>
                <button v-if="arr.status !== 'completed'" class="btn-link btn text-sm" @click="goCheck(arr.id)">验收</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'

const router = useRouter()
const appStore = useAppStore()

const filterStatus = ref('all')

const batchWarningCount = computed(() => 
  appStore.arrivals.filter(a => a.anomaly && (a.anomaly.type === 'defective' || a.anomaly.type === 'batch_warning')).length
)

const filteredList = computed(() => {
  let list = [...appStore.arrivals]
  if (filterStatus.value !== 'all') list = list.filter(a => a.status === filterStatus.value)
  return list
})

function statusLabel(s) {
  return { pending: '待验收', partial: '验收中', completed: '已完成' }[s] || s
}
function statusTagClass(s) {
  return { pending: 'tag-cyan', partial: 'tag-yellow', completed: 'tag-green' }[s] || 'tag-gray'
}

function goDetail(id) { router.push('/arrivals/' + id) }
function goCheck(id) { router.push('/arrivals/' + id) }
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #60a5fa);
  border-radius: 3px;
}
.form-select-sm {
  padding: 6px 10px;
  font-size: 13px;
}
.gap-8 { gap: 8px; }
</style>
