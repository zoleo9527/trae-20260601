<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { batchApi, pickingLossApi } from '../api/resources'
import { STATUS_LABELS } from '../types'
import { useAuthStore } from '../stores/auth'
import type { FruitBatch } from '../types'

const router = useRouter()

const auth = useAuthStore()
const batches = ref<FruitBatch[]>([])
const loading = ref(true)
const showCreate = ref(false)
const creating = ref(false)
const showLossReport = ref(false)
const reportingLoss = ref(false)
const selectedBatch = ref<FruitBatch | null>(null)
const activeTab = ref<string>('all')

const createForm = ref({
  fruit_type: '水蜜桃',
  picking_date: new Date().toISOString().split('T')[0],
  picking_area: '东坡桃园',
  quantity_picked: 0,
  unit: '斤',
})

const lossForm = ref({
  expected_qty: 0,
  actual_qty: 0,
  loss_reason: '',
})

const fruitTypes = ['水蜜桃', '巨峰葡萄', '阳光玫瑰', '红富士苹果']
const areas = ['东坡桃园', '北坡葡萄园', '南湖葡萄园', '西山苹果园']

onMounted(async () => {
  await loadData()
  loading.value = false
})

async function loadData() {
  try {
    const params: any = {}
    if (activeTab.value !== 'all') params.status = activeTab.value
    if (auth.currentUser) params.guide_name = auth.currentUser.display_name
    const res = await batchApi.list(params)
    batches.value = res.data
  } catch {}
}

async function handleTabChange(tab: string) {
  activeTab.value = tab
  await loadData()
}

async function handleCreate() {
  creating.value = true
  try {
    await batchApi.create({
      ...createForm.value,
      guide_name: auth.currentUser!.display_name,
    })
    showCreate.value = false
    createForm.value.quantity_picked = 0
    await loadData()
  } catch (e: any) {
    alert(e.response?.data?.detail || '创建失败')
  }
  creating.value = false
}

function openLossReport(batch: FruitBatch) {
  selectedBatch.value = batch
  lossForm.value = {
    expected_qty: batch.quantity_picked,
    actual_qty: batch.quantity_picked,
    loss_reason: '',
  }
  showLossReport.value = true
}

async function handleLossReport() {
  if (!selectedBatch.value) return
  reportingLoss.value = true
  try {
    await pickingLossApi.create(
      {
        batch_id: selectedBatch.value.id,
        expected_qty: lossForm.value.expected_qty,
        actual_qty: lossForm.value.actual_qty,
        loss_reason: lossForm.value.loss_reason,
      },
      auth.currentUser!.display_name,
    )
    showLossReport.value = false
    await loadData()
  } catch (e: any) {
    alert(e.response?.data?.detail || '上报失败')
  }
  reportingLoss.value = false
}

function viewBatch(id: number) {
  router.push({ name: 'batch-detail', params: { id } })
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🧺 采摘记录</h1>
      <button class="btn btn-primary" @click="showCreate = true">+ 提交采摘批次</button>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'all' }" @click="handleTabChange('all')">全部</button>
      <button class="tab" :class="{ active: activeTab === 'picked' }" @click="handleTabChange('picked')">待分级</button>
      <button class="tab" :class="{ active: activeTab === 'grading' }" @click="handleTabChange('grading')">分级中</button>
      <button class="tab" :class="{ active: activeTab === 'stored' }" @click="handleTabChange('stored')">已入库</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="batches.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-state-icon">🧺</div>
        <p>暂无采摘记录，点击上方按钮提交新批次</p>
      </div>
    </div>

    <div v-else class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>批次号</th>
            <th>果品</th>
            <th>采摘日期</th>
            <th>采摘区</th>
            <th>数量</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in batches" :key="b.id" class="clickable-row" @click="viewBatch(b.id)">
            <td class="font-bold">{{ b.batch_no }}</td>
            <td>{{ b.fruit_type }}</td>
            <td>{{ b.picking_date }}</td>
            <td>{{ b.picking_area }}</td>
            <td>{{ b.quantity_picked }}{{ b.unit }}</td>
            <td>
              <span class="badge" :class="{
                'badge-gray': b.status === 'picked',
                'badge-info': b.status === 'grading',
                'badge-warning': b.status === 'graded',
                'badge-success': b.status === 'stored',
              }">{{ STATUS_LABELS[b.status] }}</span>
            </td>
            <td @click.stop>
              <button
                v-if="b.status === 'picked'"
                class="btn btn-warning btn-sm"
                @click="openLossReport(b)"
              >
                上报损耗
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showCreate" class="dialog-overlay" @click.self="showCreate = false">
      <div class="dialog">
        <h3>提交采摘批次</h3>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">果品</label>
            <select v-model="createForm.fruit_type" class="form-select">
              <option v-for="f in fruitTypes" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">采摘区</label>
            <select v-model="createForm.picking_area" class="form-select">
              <option v-for="a in areas" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">采摘日期</label>
            <input v-model="createForm.picking_date" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">采摘量(斤)</label>
            <input v-model.number="createForm.quantity_picked" type="number" min="0" step="0.5" class="form-input" />
          </div>
        </div>
        <div class="flex gap-2 justify-between mt-2">
          <button class="btn btn-ghost" @click="showCreate = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate" :disabled="creating || createForm.quantity_picked <= 0">
            {{ creating ? '提交中...' : '提交批次' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showLossReport && selectedBatch" class="dialog-overlay" @click.self="showLossReport = false">
      <div class="dialog">
        <h3>上报采摘损耗 - {{ selectedBatch.batch_no }}</h3>
        <p class="text-sm text-gray mb-4">{{ selectedBatch.fruit_type }} · {{ selectedBatch.picking_area }}</p>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">预期数量(斤)</label>
            <input v-model.number="lossForm.expected_qty" type="number" min="0" step="0.5" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">实际数量(斤)</label>
            <input v-model.number="lossForm.actual_qty" type="number" min="0" step="0.5" class="form-input" />
          </div>
        </div>
        <div v-if="lossForm.expected_qty > 0" class="alert" :class="lossForm.expected_qty - lossForm.actual_qty > 0 ? 'alert-warning' : 'alert-info'">
          损耗量: {{ (lossForm.expected_qty - lossForm.actual_qty).toFixed(1) }} 斤
          · 损耗率: {{ ((lossForm.expected_qty - lossForm.actual_qty) / lossForm.expected_qty * 100).toFixed(1) }}%
        </div>
        <div class="form-group">
          <label class="form-label">损耗原因</label>
          <textarea v-model="lossForm.loss_reason" class="form-textarea" placeholder="描述损耗原因，如运输损伤、天气等"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showLossReport = false">取消</button>
          <button class="btn btn-primary" @click="handleLossReport" :disabled="reportingLoss">
            {{ reportingLoss ? '上报中...' : '确认上报' }}
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
}

.dialog h3 {
  font-size: 18px;
  margin-bottom: 16px;
}
</style>
