<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import type { MixedCategoryItem, InboundRegistration } from '@/types'
import dayjs from 'dayjs'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const store = useDataStore()

const isEdit = computed(() => !!route.params.id)
const inboundId = computed(() => route.params.id as string)

const form = ref<Partial<InboundRegistration>>({
  supplierName: '',
  vehicleNo: '',
  driverName: '',
  driverPhone: '',
  mainCategoryId: '',
  mainCategoryName: '',
  isMixed: false,
  mixedItems: [] as MixedCategoryItem[],
  grossWeight: 0,
  tareWeight: 0,
  netWeight: 0,
  registrationRemark: ''
})

const activeTab = ref('basic')
const logs = ref<any[]>([])

const mainCategoryOptions = computed(() => store.categories)

const netWeight = computed(() => {
  const gross = Number(form.value.grossWeight) || 0
  const tare = Number(form.value.tareWeight) || 0
  return Math.max(0, gross - tare)
})

watch(() => form.value.grossWeight, () => {
  form.value.netWeight = netWeight.value
})
watch(() => form.value.tareWeight, () => {
  form.value.netWeight = netWeight.value
})

watch(
  () => form.value.mainCategoryId,
  (newId) => {
    const cat = store.categories.find(c => c.id === newId)
    if (cat) {
      form.value.mainCategoryName = cat.name
    }
  }
)

function loadInbound() {
  if (!isEdit.value) return
  const inbound = store.getInboundById(inboundId.value)
  if (inbound) {
    form.value = { ...inbound }
    logs.value = store.getRecentLogs('inbound', inboundId.value, 20)

    store.addRecentItem({
      id: inbound.id,
      type: 'inbound',
      title: inbound.registrationNo,
      subtitle: `${inbound.supplierName} - ${inbound.mainCategoryName}`,
      status: inbound.status,
      visitedAt: dayjs().toISOString()
    })
  }
}

onMounted(() => {
  if (isEdit.value) {
    loadInbound()
  } else {
    form.value = {
      supplierName: '',
      vehicleNo: '',
      driverName: '',
      driverPhone: '',
      mainCategoryId: store.categories[0]?.id || '',
      mainCategoryName: store.categories[0]?.name || '',
      isMixed: false,
      mixedItems: [],
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
      registrationRemark: ''
    }
  }
})

function addMixedItem() {
  const defaultCat = store.categories.find(c => c.id !== form.value.mainCategoryId)
  const item: MixedCategoryItem = {
    categoryId: defaultCat?.id || store.categories[0]?.id || '',
    categoryName: defaultCat?.name || store.categories[0]?.name || '',
    estimatedWeight: 0,
    estimatedRatio: 0,
    remark: ''
  }
  form.value.mixedItems?.push(item)
  recalcMixedRatios()
}

function removeMixedItem(index: number) {
  form.value.mixedItems?.splice(index, 1)
  recalcMixedRatios()
}

function onMixedCategoryChange(index: number) {
  const items = form.value.mixedItems || []
  const cat = store.categories.find(c => c.id === items[index].categoryId)
  if (cat) {
    items[index].categoryName = cat.name
  }
}

function onMixedWeightChange() {
  recalcMixedRatios()
}

function recalcMixedRatios() {
  const items = form.value.mixedItems || []
  const total = items.reduce((sum, item) => sum + (Number(item.estimatedWeight) || 0), 0)
  if (total > 0) {
    items.forEach(item => {
      item.estimatedRatio = Math.round((Number(item.estimatedWeight) / total) * 100)
    })
  } else {
    items.forEach(item => {
      item.estimatedRatio = 0
    })
  }
}

const mixedTotalWeight = computed(() => {
  return (form.value.mixedItems || []).reduce((sum, item) => sum + (Number(item.estimatedWeight) || 0), 0)
})

const canSubmit = computed(() => {
  if (!form.value.supplierName) return false
  if (!form.value.vehicleNo) return false
  if (!form.value.mainCategoryId) return false
  if (netWeight.value <= 0) return false
  if (form.value.isMixed && (form.value.mixedItems?.length || 0) === 0) return false
  return true
})

function saveDraft() {
  if (isEdit.value) {
    store.updateInbound(inboundId.value, form.value)
  } else {
    const newInbound = store.createInbound(form.value)
    router.replace(`/inbound/${newInbound.id}`)
    return
  }
  showToast('草稿已保存')
}

function submitInbound() {
  if (!canSubmit.value) {
    showToast('请填写完整信息', 'warning')
    return
  }

  if (form.value.isMixed) {
    const total = mixedTotalWeight.value
    if (Math.abs(total - netWeight.value) > netWeight.value * 0.1) {
      if (!confirm(`混装总重量(${total}kg)与净重(${netWeight.value}kg)差异较大，是否继续提交？`)) {
        return
      }
    }
  }

  if (isEdit.value) {
    store.updateInbound(inboundId.value, form.value)
    store.submitInbound(inboundId.value)
  } else {
    const newInbound = store.createInbound(form.value)
    store.submitInbound(newInbound.id)
    router.replace(`/inbound/${newInbound.id}`)
    return
  }
  showToast('已提交，等待过磅复核')
  loadInbound()
}

const toast = ref({ visible: false, message: '', type: 'info' })

function showToast(message: string, type: string = 'info') {
  toast.value = { visible: true, message, type }
  setTimeout(() => {
    toast.value.visible = false
  }, 2000)
}

function goBack() {
  router.back()
}

function goReview() {
  const review = store.getReviewByInboundId(inboundId.value)
  if (review) {
    router.push(`/review/${review.id}`)
  }
}
</script>

<template>
  <div class="inbound-form-page">
    <div class="form-header">
      <button class="btn btn-sm" @click="goBack">← 返回</button>
      <div class="header-title">
        <span v-if="isEdit">{{ form.registrationNo }}</span>
        <span v-else>新建进厂登记</span>
        <StatusBadge v-if="isEdit" :status="form.status!" size="sm" class="ml-8" />
        <span v-if="form.isMixed" class="badge badge-warning ml-8">⚠️ 品类混装</span>
      </div>
      <div class="header-actions">
        <button
          v-if="isEdit && form.status === 'confirmed'"
          class="btn btn-sm"
          @click="goReview"
        >
          查看过磅复核
        </button>
        <button v-if="!isEdit || form.status === 'draft'" class="btn btn-sm" @click="saveDraft">
          保存草稿
        </button>
        <button
          v-if="!isEdit || form.status === 'draft'"
          class="btn btn-primary btn-sm"
          :disabled="!canSubmit"
          @click="submitInbound"
        >
          提交登记
        </button>
      </div>
    </div>

    <div class="form-body">
      <div class="form-left">
        <div class="card form-card">
          <div class="card-header">
            <span class="card-title">📝 基本信息</span>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-item form-item-half">
                <label class="form-label">供应商名称 <span class="required">*</span></label>
                <input
                  v-model="form.supplierName"
                  type="text"
                  class="form-input"
                  placeholder="请输入供应商名称"
                  :disabled="form.status && form.status !== 'draft'"
                />
              </div>
              <div class="form-item form-item-half">
                <label class="form-label">车牌号 <span class="required">*</span></label>
                <input
                  v-model="form.vehicleNo"
                  type="text"
                  class="form-input"
                  placeholder="请输入车牌号"
                  :disabled="form.status && form.status !== 'draft'"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item form-item-half">
                <label class="form-label">司机姓名</label>
                <input
                  v-model="form.driverName"
                  type="text"
                  class="form-input"
                  placeholder="请输入司机姓名"
                  :disabled="form.status && form.status !== 'draft'"
                />
              </div>
              <div class="form-item form-item-half">
                <label class="form-label">联系电话</label>
                <input
                  v-model="form.driverPhone"
                  type="text"
                  class="form-input"
                  placeholder="请输入联系电话"
                  :disabled="form.status && form.status !== 'draft'"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="card form-card mt-16">
          <div class="card-header">
            <span class="card-title">📦 品类信息</span>
            <label class="mixed-toggle">
              <input
                type="checkbox"
                v-model="form.isMixed"
                :disabled="form.status && form.status !== 'draft'"
              />
              <span>品类混装</span>
              <span class="tip">（扯皮高发）</span>
            </label>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-item form-item-half">
                <label class="form-label">主品类 <span class="required">*</span></label>
                <select
                  v-model="form.mainCategoryId"
                  class="form-select"
                  :disabled="form.status && form.status !== 'draft'"
                >
                  <option v-for="cat in mainCategoryOptions" :key="cat.id" :value="cat.id">
                    {{ cat.name }} ({{ cat.code }})
                  </option>
                </select>
              </div>
              <div class="form-item form-item-half">
                <label class="form-label">参考单价</label>
                <div class="price-display">
                  <span class="price-symbol">¥</span>
                  <span class="price-value">
                    {{ mainCategoryOptions.find(c => c.id === form.mainCategoryId)?.defaultPrice?.toFixed(2) || '0.00' }}
                  </span>
                  <span class="price-unit">/kg</span>
                </div>
              </div>
            </div>

            <div v-if="form.isMixed" class="mixed-section">
              <div class="section-header-warning">
                <span class="warning-icon">⚠️</span>
                <span>混装品类需仔细核对，分拣后重量可能有差异，容易产生争议</span>
              </div>

              <table class="mixed-table">
                <thead>
                  <tr>
                    <th style="width: 30%">品类</th>
                    <th style="width: 25%">预估重量 (kg)</th>
                    <th style="width: 20%">占比</th>
                    <th style="width: 20%">备注</th>
                    <th style="width: 5%"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in form.mixedItems" :key="index">
                    <td>
                      <select
                        v-model="item.categoryId"
                        class="form-select"
                        :disabled="form.status && form.status !== 'draft'"
                        @change="onMixedCategoryChange(index)"
                      >
                        <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
                          {{ cat.name }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        v-model.number="item.estimatedWeight"
                        type="number"
                        class="form-input"
                        :disabled="form.status && form.status !== 'draft'"
                        @input="onMixedWeightChange"
                      />
                    </td>
                    <td>
                      <div class="ratio-bar">
                        <div
                          class="ratio-fill"
                          :style="{ width: item.estimatedRatio + '%' }"
                        ></div>
                        <span class="ratio-text">{{ item.estimatedRatio }}%</span>
                      </div>
                    </td>
                    <td>
                      <input
                        v-model="item.remark"
                        type="text"
                        class="form-input"
                        placeholder="备注"
                        :disabled="form.status && form.status !== 'draft'"
                      />
                    </td>
                    <td>
                      <button
                        v-if="form.status === 'draft' || !form.status"
                        class="btn btn-sm btn-danger"
                        @click="removeMixedItem(index)"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>合计</strong></td>
                    <td>
                      <strong>{{ mixedTotalWeight }}</strong> kg
                    </td>
                    <td colspan="3">
                      <span v-if="mixedTotalWeight > 0 && Math.abs(mixedTotalWeight - netWeight) > netWeight * 0.05" class="text-warning">
                        ⚠️ 与净重差 {{ (mixedTotalWeight - netWeight).toFixed(0) }}kg
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>

              <button
                v-if="form.status === 'draft' || !form.status"
                class="btn btn-sm mt-8"
                @click="addMixedItem"
              >
                ➕ 添加混装品类
              </button>
            </div>
          </div>
        </div>

        <div class="card form-card mt-16">
          <div class="card-header">
            <span class="card-title">⚖️ 过磅重量</span>
          </div>
          <div class="card-body">
            <div class="weight-grid">
              <div class="weight-item">
                <div class="weight-label">毛重 (Gross)</div>
                <div class="weight-input-wrapper">
                  <input
                    v-model.number="form.grossWeight"
                    type="number"
                    class="weight-input"
                    :disabled="form.status && form.status !== 'draft'"
                  />
                  <span class="weight-unit">kg</span>
                </div>
              </div>
              <div class="weight-minus">−</div>
              <div class="weight-item">
                <div class="weight-label">皮重 (Tare)</div>
                <div class="weight-input-wrapper">
                  <input
                    v-model.number="form.tareWeight"
                    type="number"
                    class="weight-input"
                    :disabled="form.status && form.status !== 'draft'"
                  />
                  <span class="weight-unit">kg</span>
                </div>
              </div>
              <div class="weight-equal">=</div>
              <div class="weight-item net">
                <div class="weight-label">净重 (Net)</div>
                <div class="weight-input-wrapper">
                  <input
                    :value="netWeight"
                    type="number"
                    class="weight-input"
                    readonly
                  />
                  <span class="weight-unit">kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card form-card mt-16">
          <div class="card-header">
            <span class="card-title">📝 登记备注</span>
            <span class="hint-badge">会同步到过磅复核</span>
          </div>
          <div class="card-body">
            <textarea
              v-model="form.registrationRemark"
              class="form-textarea"
              rows="4"
              placeholder="请输入备注信息，如货物情况、特殊要求、注意事项等。此备注会同步到过磅复核环节。"
              :disabled="form.status && form.status !== 'draft'"
            ></textarea>
            <div class="remark-tip">
              💡 提示：关于品类混装、重量预估的重要信息请写在这里，过磅复核时可以看到。
            </div>
          </div>
        </div>
      </div>

      <div class="form-right">
        <div class="card info-card">
          <div class="card-header">
            <span class="card-title">📋 单据信息</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">登记单号</span>
              <span class="info-value mono">{{ form.registrationNo || '自动生成' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">单据状态</span>
              <StatusBadge v-if="form.status" :status="form.status" />
              <span v-else class="text-tertiary">草稿</span>
            </div>
            <div class="info-row">
              <span class="info-label">创建时间</span>
              <span class="info-value text-secondary text-sm">
                {{ form.createdAt ? dayjs(form.createdAt).format('YYYY-MM-DD HH:mm') : '-' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">提交人</span>
              <span class="info-value">{{ form.submittedBy || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">提交时间</span>
              <span class="info-value text-secondary text-sm">
                {{ form.submittedAt ? dayjs(form.submittedAt).format('YYYY-MM-DD HH:mm') : '-' }}
              </span>
            </div>
          </div>
        </div>

        <div class="card info-card mt-16">
          <div class="card-header">
            <span class="card-title">📜 操作记录</span>
          </div>
          <div class="card-body logs-body">
            <div v-if="logs.length === 0" class="empty-logs">
              暂无操作记录
            </div>
            <div v-for="log in logs" :key="log.id" class="log-item">
              <div class="log-dot"></div>
              <div class="log-content">
                <div class="log-header">
                  <span class="log-action">{{ log.action }}</span>
                  <span class="log-time">{{ dayjs(log.timestamp).format('HH:mm:ss') }}</span>
                </div>
                <div class="log-operator">{{ log.operator }} ({{ log.operatorRole }})</div>
                <div class="log-detail">{{ log.detail }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div v-if="toast.visible" :class="['toast', 'toast-' + toast.type]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.inbound-form-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.form-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.form-left {
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
}

.form-right {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
}

.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-light);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-light);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-item-half {
  flex: 1;
}

.required {
  color: #ff4d4f;
}

.mixed-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
}

.mixed-toggle input {
  cursor: pointer;
}

.mixed-toggle .tip {
  color: #ff4d4f;
  font-size: 11px;
}

.mixed-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.section-header-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #ad6800;
}

.warning-icon {
  font-size: 14px;
}

.mixed-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mixed-table th {
  background: var(--bg-secondary);
  padding: 8px 10px;
  text-align: left;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
}

.mixed-table td {
  padding: 8px;
  border-bottom: 1px solid var(--border-light);
}

.mixed-table tfoot td {
  background: var(--bg-secondary);
  font-weight: 500;
  padding: 10px 8px;
}

.ratio-bar {
  position: relative;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.ratio-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #69c0ff);
  transition: width 0.3s;
  border-radius: 4px;
}

.ratio-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.weight-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.weight-item {
  flex: 1;
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 14px;
}

.weight-item.net {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.weight-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.weight-input-wrapper {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.weight-input {
  flex: 1;
  width: 100%;
  border: none;
  background: transparent;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'SF Mono', Monaco, monospace;
  outline: none;
}

.weight-item.net .weight-input {
  color: #1890ff;
}

.weight-unit {
  font-size: 13px;
  color: var(--text-tertiary);
}

.weight-minus,
.weight-equal {
  font-size: 20px;
  color: var(--text-tertiary);
  font-weight: 300;
  flex-shrink: 0;
}

.hint-badge {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.remark-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.info-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-light);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.info-value.mono {
  font-family: 'SF Mono', Monaco, monospace;
}

.price-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.price-symbol {
  font-size: 13px;
  color: var(--text-secondary);
}

.price-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'SF Mono', Monaco, monospace;
}

.price-unit {
  font-size: 12px;
  color: var(--text-tertiary);
}

.logs-body {
  max-height: 300px;
  overflow-y: auto;
}

.empty-logs {
  text-align: center;
  padding: 24px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.log-item:last-child {
  border-bottom: none;
}

.log-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  margin-top: 6px;
  flex-shrink: 0;
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.log-action {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.log-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.log-operator {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.log-detail {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-info {
  background: #fff;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.toast-success {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.toast-warning {
  background: #fffbe6;
  color: #d46b08;
  border: 1px solid #ffd591;
}

.toast-error {
  background: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
