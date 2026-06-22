<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import type { WeighingReview, MixedCategoryItem, WeightDispute } from '@/types'
import dayjs from 'dayjs'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const store = useDataStore()

const reviewId = computed(() => route.params.id as string)
const review = ref<WeighingReview | null>(null)
const inbound = computed(() => review.value ? store.getInboundById(review.value.inboundId) : null)
const logs = ref<any[]>([])
const dispute = ref<WeightDispute | null>(null)

const showRejectModal = ref(false)
const rejectReason = ref('')

const showDisputeModal = ref(false)
const disputeWeight = ref(0)
const disputeReason = ref('')

const showResolveModal = ref(false)
const resolveResolution = ref('')
const resolveFinalWeight = ref(0)

const editMode = ref(false)
const reviewForm = ref<Partial<WeighingReview>>({
  confirmedGrossWeight: 0,
  confirmedTareWeight: 0,
  confirmedNetWeight: 0,
  confirmedMixedItems: [] as MixedCategoryItem[],
  reviewRemark: ''
})

const confirmedNetWeight = computed(() => {
  const gross = Number(reviewForm.value.confirmedGrossWeight) || 0
  const tare = Number(reviewForm.value.confirmedTareWeight) || 0
  return Math.max(0, gross - tare)
})

const weightDiff = computed(() => {
  if (!inbound.value) return 0
  return confirmedNetWeight.value - inbound.value.netWeight
})

const weightDiffPercent = computed(() => {
  if (!inbound.value || inbound.value.netWeight === 0) return 0
  return ((weightDiff.value / inbound.value.netWeight) * 100).toFixed(1)
})

function loadData() {
  const r = store.getReviewById(reviewId.value)
  if (r) {
    review.value = r
    reviewForm.value = { ...r }
    logs.value = store.getRecentLogs('review', reviewId.value, 20)

    if (r.disputeId) {
      dispute.value = store.disputes.find(d => d.id === r.disputeId) || null
    }

    store.addRecentItem({
      id: r.id,
      type: 'review',
      title: r.registrationNo,
      subtitle: `${inbound.value?.supplierName || ''} - ${inbound.value?.mainCategoryName || ''}`,
      status: r.status,
      visitedAt: dayjs().toISOString()
    })

    if (r.status === 'pending' && store.canConfirmReview) {
      editMode.value = true
    }
  }
}

onMounted(() => {
  loadData()
})

function startEdit() {
  editMode.value = true
}

function cancelEdit() {
  if (review.value) {
    reviewForm.value = { ...review.value }
  }
  editMode.value = false
}

function addMixedItem() {
  const item: MixedCategoryItem = {
    categoryId: store.categories[0]?.id || '',
    categoryName: store.categories[0]?.name || '',
    estimatedWeight: 0,
    estimatedRatio: 0,
    remark: ''
  }
  reviewForm.value.confirmedMixedItems?.push(item)
  recalcMixedRatios()
}

function removeMixedItem(index: number) {
  reviewForm.value.confirmedMixedItems?.splice(index, 1)
  recalcMixedRatios()
}

function onMixedCategoryChange(index: number) {
  const items = reviewForm.value.confirmedMixedItems || []
  const cat = store.categories.find(c => c.id === items[index].categoryId)
  if (cat) {
    items[index].categoryName = cat.name
  }
}

function onMixedWeightChange() {
  recalcMixedRatios()
}

function recalcMixedRatios() {
  const items = reviewForm.value.confirmedMixedItems || []
  const total = items.reduce((sum, item) => sum + (Number(item.estimatedWeight) || 0), 0)
  if (total > 0) {
    items.forEach(item => {
      item.estimatedRatio = Math.round((Number(item.estimatedWeight) / total) * 100)
    })
  }
}

const mixedTotalWeight = computed(() => {
  return (reviewForm.value.confirmedMixedItems || []).reduce(
    (sum, item) => sum + (Number(item.estimatedWeight) || 0),
    0
  )
})

function confirmReview() {
  if (!review.value) return

  const diff = weightDiff.value
  if (Math.abs(diff) > (inbound.value?.netWeight || 0) * 0.05) {
    if (!confirm(`复核净重与登记净重差异较大(${weightDiffPercent.value}%)，是否确认提交？`)) {
      return
    }
  }

  store.confirmReview(review.value.id, {
    ...reviewForm.value,
    confirmedNetWeight: confirmedNetWeight.value
  })

  loadData()
  editMode.value = false
  showToast('过磅复核已确认')
}

function openRejectModal() {
  rejectReason.value = ''
  showRejectModal.value = true
}

function submitReject() {
  if (!review.value || !rejectReason.value.trim()) {
    showToast('请填写驳回原因', 'warning')
    return
  }
  store.rejectReview(review.value.id, rejectReason.value)
  showRejectModal.value = false
  loadData()
  showToast('已驳回')
}

function openDisputeModal() {
  disputeWeight.value = confirmedNetWeight.value
  disputeReason.value = ''
  showDisputeModal.value = true
}

function submitDispute() {
  if (!review.value) return
  if (!disputeReason.value.trim()) {
    showToast('请填写争议原因', 'warning')
    return
  }
  store.createDispute(review.value.inboundId, disputeWeight.value, disputeReason.value)
  showDisputeModal.value = false
  loadData()
  showToast('争议已提交')
}

function openResolveModal() {
  if (!dispute.value) return
  resolveFinalWeight.value = dispute.value.disputedWeight
  resolveResolution.value = ''
  showResolveModal.value = true
}

function submitResolve() {
  if (!dispute.value) return
  if (!resolveResolution.value.trim()) {
    showToast('请填写处理结果', 'warning')
    return
  }
  store.resolveDispute(dispute.value.id, resolveResolution.value, resolveFinalWeight.value)
  showResolveModal.value = false
  loadData()
  showToast('争议已处理')
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

function goInbound() {
  if (inbound.value) {
    router.push(`/inbound/${inbound.value.id}`)
  }
}
</script>

<template>
  <div class="review-detail-page">
    <div class="form-header">
      <button class="btn btn-sm" @click="goBack">← 返回</button>
      <div class="header-title">
        过磅复核 - {{ review?.registrationNo }}
        <StatusBadge v-if="review" :status="review.status" size="sm" class="ml-8" />
        <span v-if="review?.confirmedMixedItems?.length" class="badge badge-warning ml-8">
          ⚠️ 品类混装
        </span>
      </div>
      <div class="header-actions">
        <button class="btn btn-sm" @click="goInbound">查看登记单</button>
        <button
          v-if="store.canConfirmReview && review?.status === 'pending' && !editMode"
          class="btn btn-primary btn-sm"
          @click="startEdit"
        >
          开始复核
        </button>
        <template v-if="store.canConfirmReview && editMode && review?.status === 'pending'">
          <button class="btn btn-sm" @click="cancelEdit">取消</button>
          <button class="btn btn-warning btn-sm" @click="openRejectModal">驳回</button>
          <button class="btn btn-danger btn-sm" @click="openDisputeModal">发起争议</button>
          <button class="btn btn-success btn-sm" @click="confirmReview">确认通过</button>
        </template>
        <template v-if="store.canHandleDispute && dispute?.status === 'pending'">
          <button class="btn btn-warning btn-sm" @click="openResolveModal">处理争议</button>
        </template>
        <div v-if="review?.status === 'pending' && !store.canConfirmReview" class="permission-tip">
          仅分拣班长可复核
        </div>
      </div>
    </div>

    <div class="form-body">
      <div class="form-left">
        <div class="card section-card">
          <div class="card-header">
            <span class="card-title">📋 进厂登记信息</span>
            <span class="card-subtitle text-secondary text-sm">登记时的原始数据</span>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">供应商</div>
                <div class="info-value">{{ inbound?.supplierName || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">车牌号</div>
                <div class="info-value">{{ inbound?.vehicleNo || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">司机</div>
                <div class="info-value">{{ inbound?.driverName || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">主品类</div>
                <div class="info-value">{{ inbound?.mainCategoryName || '-' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card section-card mt-16">
          <div class="card-header">
            <span class="card-title">📝 登记备注</span>
            <span class="hint-badge">来自进厂登记</span>
          </div>
          <div class="card-body">
            <div class="remark-box origin-remark">
              <div v-if="review?.registrationRemarkSnapshot" class="remark-content">
                {{ review.registrationRemarkSnapshot }}
              </div>
              <div v-else class="empty-remark">
                无备注
              </div>
            </div>
          </div>
        </div>

        <div class="card section-card mt-16">
          <div class="card-header">
            <span class="card-title">⚖️ 重量对比</span>
            <span class="diff-badge" :class="{
              'diff-up': weightDiff > 0,
              'diff-down': weightDiff < 0,
              'diff-zero': weightDiff === 0
            }">
              <span v-if="weightDiff > 0">↑</span>
              <span v-else-if="weightDiff < 0">↓</span>
              {{ Math.abs(weightDiff) }}kg ({{ weightDiffPercent }}%)
            </span>
          </div>
          <div class="card-body">
            <div class="weight-compare">
              <div class="weight-side">
                <div class="weight-side-label">登记重量</div>
                <div class="weight-side-value mono">{{ inbound?.netWeight?.toLocaleString() || 0 }}</div>
                <div class="weight-side-detail">
                  毛重 {{ inbound?.grossWeight?.toLocaleString() }} − 皮重 {{ inbound?.tareWeight?.toLocaleString() }}
                </div>
              </div>
              <div class="weight-arrow">→</div>
              <div class="weight-side confirm-side">
                <div class="weight-side-label">
                  {{ editMode ? '复核重量 (编辑中)' : '复核重量' }}
                </div>
                <div class="weight-side-value mono" :class="{
                  'text-success': weightDiff > 0,
                  'text-error': weightDiff < 0
                }">
                  {{ confirmedNetWeight.toLocaleString() }}
                </div>
                <div class="weight-side-detail">
                  毛重 {{ reviewForm.confirmedGrossWeight?.toLocaleString() }} − 皮重 {{ reviewForm.confirmedTareWeight?.toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-if="editMode" class="edit-weight-form">
              <div class="form-row">
                <div class="form-item form-item-half">
                  <label class="form-label">复核毛重 (kg)</label>
                  <input
                    v-model.number="reviewForm.confirmedGrossWeight"
                    type="number"
                    class="form-input"
                  />
                </div>
                <div class="form-item form-item-half">
                  <label class="form-label">复核皮重 (kg)</label>
                  <input
                    v-model.number="reviewForm.confirmedTareWeight"
                    type="number"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="diff-warning" v-if="Math.abs(weightDiff) > (inbound?.netWeight || 0) * 0.03">
                ⚠️ 重量差异超过 3%，请仔细核对，必要时发起重量争议
              </div>
            </div>
          </div>
        </div>

        <div v-if="inbound?.isMixed || review?.confirmedMixedItems?.length" class="card section-card mt-16">
          <div class="card-header">
            <span class="card-title">📦 混装品类复核</span>
            <span class="badge badge-warning">扯皮高发区</span>
          </div>
          <div class="card-body">
            <div class="mixed-warning">
              <span class="warning-icon">⚠️</span>
              <span>混装品类分拣后实际比例可能与预估有差异，请仔细核对后确认</span>
            </div>

            <table class="mixed-table">
              <thead>
                <tr>
                  <th>品类</th>
                  <th>登记预估</th>
                  <th>复核确认</th>
                  <th>差异</th>
                  <th>备注</th>
                  <th v-if="editMode">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in reviewForm.confirmedMixedItems" :key="index">
                  <td>
                    <span v-if="!editMode">{{ item.categoryName }}</span>
                    <select
                      v-else
                      v-model="item.categoryId"
                      class="form-select"
                      @change="onMixedCategoryChange(index)"
                    >
                      <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
                        {{ cat.name }}
                      </option>
                    </select>
                  </td>
                  <td class="mono">
                    {{ inbound?.mixedItems?.[index]?.estimatedWeight || '-' }}kg
                    ({{ inbound?.mixedItems?.[index]?.estimatedRatio || 0 }}%)
                  </td>
                  <td>
                    <span v-if="!editMode" class="mono">{{ item.estimatedWeight }}kg ({{ item.estimatedRatio }}%)</span>
                    <input
                      v-else
                      v-model.number="item.estimatedWeight"
                      type="number"
                      class="form-input"
                      style="width: 100px"
                      @input="onMixedWeightChange"
                    />
                  </td>
                  <td>
                    <span
                      :class="{
                        'text-success': (item.estimatedWeight || 0) - (inbound?.mixedItems?.[index]?.estimatedWeight || 0) > 0,
                        'text-error': (item.estimatedWeight || 0) - (inbound?.mixedItems?.[index]?.estimatedWeight || 0) < 0
                      }"
                      class="mono"
                    >
                      {{ ((item.estimatedWeight || 0) - (inbound?.mixedItems?.[index]?.estimatedWeight || 0)) > 0 ? '+' : '' }}
                      {{ (item.estimatedWeight || 0) - (inbound?.mixedItems?.[index]?.estimatedWeight || 0) }}kg
                    </span>
                  </td>
                  <td>
                    <span v-if="!editMode">{{ item.remark || '-' }}</span>
                    <input
                      v-else
                      v-model="item.remark"
                      type="text"
                      class="form-input"
                      placeholder="备注"
                    />
                  </td>
                  <td v-if="editMode">
                    <button class="btn btn-sm btn-danger" @click="removeMixedItem(index)">删除</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>合计</strong></td>
                  <td class="mono">
                    {{ inbound?.mixedItems?.reduce((s, i) => s + i.estimatedWeight, 0) || 0 }}kg
                  </td>
                  <td class="mono">{{ mixedTotalWeight }}kg</td>
                  <td class="mono">
                    <span
                      :class="{
                        'text-success': mixedTotalWeight - (inbound?.mixedItems?.reduce((s, i) => s + i.estimatedWeight, 0) || 0) > 0,
                        'text-error': mixedTotalWeight - (inbound?.mixedItems?.reduce((s, i) => s + i.estimatedWeight, 0) || 0) < 0
                      }"
                    >
                      {{ mixedTotalWeight - (inbound?.mixedItems?.reduce((s, i) => s + i.estimatedWeight, 0) || 0) > 0 ? '+' : '' }}
                      {{ mixedTotalWeight - (inbound?.mixedItems?.reduce((s, i) => s + i.estimatedWeight, 0) || 0) }}kg
                    </span>
                  </td>
                  <td v-if="editMode" colspan="2">
                    <button class="btn btn-sm" @click="addMixedItem">➕ 添加</button>
                  </td>
                  <td v-else></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="card section-card mt-16">
          <div class="card-header">
            <span class="card-title">📝 复核备注</span>
          </div>
          <div class="card-body">
            <textarea
              v-if="editMode"
              v-model="reviewForm.reviewRemark"
              class="form-textarea"
              rows="4"
              placeholder="请输入复核意见..."
            ></textarea>
            <div v-else class="remark-box">
              <div v-if="review?.reviewRemark" class="remark-content">
                {{ review.reviewRemark }}
              </div>
              <div v-else class="empty-remark">暂无复核备注</div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-right">
        <div v-if="dispute" class="card dispute-card">
          <div class="card-header dispute-header">
            <span class="card-title">⚠️ 重量争议</span>
            <StatusBadge :status="dispute.status" size="sm" />
          </div>
          <div class="card-body">
            <div class="dispute-row">
              <span class="dispute-label">原重量</span>
              <span class="dispute-value mono">{{ dispute.originalWeight }}kg</span>
            </div>
            <div class="dispute-row">
              <span class="dispute-label">争议重量</span>
              <span class="dispute-value mono text-error">{{ dispute.disputedWeight }}kg</span>
            </div>
            <div class="dispute-row">
              <span class="dispute-label">差异</span>
              <span class="dispute-value mono text-error">
                {{ dispute.difference > 0 ? '+' : '' }}{{ dispute.difference }}kg
              </span>
            </div>
            <div class="dispute-divider"></div>
            <div class="dispute-section">
              <div class="dispute-section-title">争议原因</div>
              <div class="dispute-section-content">{{ dispute.reason }}</div>
            </div>
            <div v-if="dispute.status === 'resolved'" class="dispute-section">
              <div class="dispute-section-title">处理结果</div>
              <div class="dispute-section-content">{{ dispute.resolution }}</div>
              <div class="dispute-handler">
                处理人：{{ dispute.handler }} · {{ dayjs(dispute.handledAt).format('MM-DD HH:mm') }}
              </div>
            </div>
          </div>
        </div>

        <div class="card info-card mt-16">
          <div class="card-header">
            <span class="card-title">📋 单据信息</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">复核状态</span>
              <StatusBadge v-if="review" :status="review.status" />
            </div>
            <div class="info-row">
              <span class="info-label">复核人</span>
              <span class="info-value">{{ review?.reviewer || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">复核时间</span>
              <span class="info-value text-secondary text-sm">
                {{ review?.reviewedAt ? dayjs(review.reviewedAt).format('YYYY-MM-DD HH:mm') : '-' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">登记提交人</span>
              <span class="info-value">{{ inbound?.submittedBy || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">登记提交时间</span>
              <span class="info-value text-secondary text-sm">
                {{ inbound?.submittedAt ? dayjs(inbound.submittedAt).format('YYYY-MM-DD HH:mm') : '-' }}
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

    <div v-if="showRejectModal" class="modal-mask" @click.self="showRejectModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">驳回复核</h3>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">驳回原因 <span class="required">*</span></label>
            <textarea
              v-model="rejectReason"
              class="form-textarea"
              rows="4"
              placeholder="请输入驳回原因，将反馈给过磅员"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-sm" @click="showRejectModal = false">取消</button>
          <button class="btn btn-danger btn-sm" @click="submitReject">确认驳回</button>
        </div>
      </div>
    </div>

    <div v-if="showDisputeModal" class="modal-mask" @click.self="showDisputeModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">发起重量争议</h3>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">争议重量 (kg) <span class="required">*</span></label>
            <input v-model.number="disputeWeight" type="number" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">争议原因 <span class="required">*</span></label>
            <textarea
              v-model="disputeReason"
              class="form-textarea"
              rows="4"
              placeholder="请说明争议原因，如：分拣后实际重量不符、品类比例差异大等"
            ></textarea>
          </div>
          <div class="dispute-tip">
            💡 发起争议后，单据将标记为"有争议"状态，需相关人员协调处理
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-sm" @click="showDisputeModal = false">取消</button>
          <button class="btn btn-danger btn-sm" @click="submitDispute">发起争议</button>
        </div>
      </div>
    </div>

    <div v-if="showResolveModal" class="modal-mask" @click.self="showResolveModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">处理争议</h3>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">最终确认重量 (kg) <span class="required">*</span></label>
            <input v-model.number="resolveFinalWeight" type="number" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">处理结果 <span class="required">*</span></label>
            <textarea
              v-model="resolveResolution"
              class="form-textarea"
              rows="4"
              placeholder="请说明处理结果和协调过程"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-sm" @click="showResolveModal = false">取消</button>
          <button class="btn btn-success btn-sm" @click="submitResolve">确认处理</button>
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
.review-detail-page {
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

.section-card {
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

.card-subtitle {
  font-size: 12px;
}

.card-body {
  padding: 20px;
}

.hint-badge {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.remark-box {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 16px;
  min-height: 60px;
}

.origin-remark {
  background: #f6ffed;
  border: 1px dashed #b7eb8f;
}

.remark-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.empty-remark {
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
  padding: 10px 0;
}

.weight-compare {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.weight-side {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
}

.weight-side.confirm-side {
  border: 2px solid #1890ff;
}

.weight-side-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.weight-side-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.weight-side-detail {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 6px;
}

.weight-arrow {
  font-size: 24px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.diff-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.diff-zero {
  background: #f0f0f0;
  color: #595959;
}

.diff-up {
  background: #f6ffed;
  color: #52c41a;
}

.diff-down {
  background: #fff2f0;
  color: #ff4d4f;
}

.edit-weight-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-item-half {
  flex: 1;
}

.diff-warning {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  font-size: 12px;
  color: #ad6800;
}

.mixed-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #cf1322;
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
  padding: 10px 12px;
  text-align: left;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
}

.mixed-table td {
  padding: 10px;
  border-bottom: 1px solid var(--border-light);
}

.mixed-table tfoot td {
  background: var(--bg-secondary);
  font-weight: 500;
  padding: 10px;
}

.mono {
  font-family: 'SF Mono', Monaco, monospace;
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

.dispute-card {
  border: 1px solid #ffa39e;
  background: #fff2f0;
}

.dispute-header {
  background: #ffccc7;
  border-bottom: 1px solid #ffa39e;
}

.dispute-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.dispute-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.dispute-value {
  font-size: 14px;
  font-weight: 600;
}

.dispute-divider {
  height: 1px;
  background: #ffccc7;
  margin: 12px 0;
}

.dispute-section {
  margin-bottom: 12px;
}

.dispute-section:last-child {
  margin-bottom: 0;
}

.dispute-section-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.dispute-section-content {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
}

.dispute-handler {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 6px;
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

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 480px;
  max-width: 90vw;
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dispute-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fffbe6;
  border-radius: 4px;
  font-size: 12px;
  color: #ad6800;
}

.required {
  color: #ff4d4f;
}

.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 1001;
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

.permission-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
}
</style>
