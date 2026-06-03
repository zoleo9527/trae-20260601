<template>
  <div class="review-form-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">归还复核 - {{ rental?.orderNo }}</h1>
        <p class="page-subtitle">
          {{ rental?.equipment.name }} · {{ rental?.equipment.serialNo }}
        </p>
      </div>
      <div class="header-actions">
        <el-button @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="key-points-review-card">
          <template #header>
            <div class="card-header-title key-points-header">
              <el-icon color="#f59e0b" size="18"><Star /></el-icon>
              出库验机关键判断 - 请以此为基准进行复核
              <el-tag type="warning" size="small" style="margin-left: 10px;">
                一线同事处理时必须对照
              </el-tag>
            </div>
          </template>

          <div v-if="outboundKeyPoints.length === 0" class="no-key-points">
            出库验机时未标记特殊关键判断
          </div>

          <div v-else class="key-points-grid">
            <div
              v-for="point in outboundKeyPoints"
              :key="point.key"
              class="key-point-card"
              :class="{ 'abnormal': point.result === 'abnormal' }"
            >
              <div class="key-point-header">
                <el-tag :type="point.result === 'abnormal' ? 'danger' : 'success'" size="small">
                  出库：{{ point.result === 'abnormal' ? '异常' : '正常' }}
                </el-tag>
                <span class="key-point-title">{{ point.label }}</span>
              </div>
              <p class="key-point-desc">{{ point.description }}</p>
              <div v-if="point.photos && point.photos.length > 0" class="key-point-photos">
                <div
                  v-for="(photo, idx) in point.photos.slice(0, 3)"
                  :key="idx"
                  class="photo-thumb"
                >
                  <img :src="getPhotoUrl(photo)" alt="出库照片" />
                </div>
                <span v-if="point.photos.length > 3" class="more-photos">
                  +{{ point.photos.length - 3 }}
                </span>
              </div>
              <div class="compare-indicator">
                <el-icon><ArrowDown /></el-icon>
                <span>请核对下方当前状态</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="comparison-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Comparison /></el-icon>
              复核项目 - 与出库状态对比
            </div>
          </template>

          <div
            v-for="item in inspectionItems"
            :key="item.key"
            class="inspection-item"
            :class="{
              'has-difference': hasDifference(item.key),
              'is-abnormal': form.items[item.key]?.result === 'abnormal'
            }"
          >
            <div class="inspection-item-header">
              <div class="inspection-item-title">
                <span>{{ item.label }}</span>
                <span class="item-desc">{{ item.description }}</span>
              </div>
              <div class="inspection-item-flags">
                <el-tag
                  v-if="isKeyPoint(item.key)"
                  size="small"
                  type="warning"
                  effect="light"
                >
                  <el-icon><StarFilled /></el-icon>
                  关键判断
                </el-tag>
                <el-tag
                  v-if="hasDifference(item.key)"
                  size="small"
                  type="danger"
                  effect="dark"
                >
                  <el-icon><WarningFilled /></el-icon>
                  与出库不一致
                </el-tag>
              </div>
            </div>

            <div class="comparison-row">
              <div class="comparison-col outbound">
                <div class="comparison-label">
                  <el-icon><Upload /></el-icon>
                  出库状态
                </div>
                <div class="comparison-content">
                  <el-tag :type="getOutboundResultType(item.key)" size="small">
                    {{ getOutboundResultLabel(item.key) }}
                  </el-tag>
                  <p class="comparison-desc">{{ getOutboundDescription(item.key) }}</p>
                </div>
              </div>

              <div class="comparison-divider">
                <el-icon :size="24" :color="hasDifference(item.key) ? '#ef4444' : '#10b981'">
                  <component :is="hasDifference(item.key) ? 'Close' : 'Check'" />
                </el-icon>
              </div>

              <div class="comparison-col return">
                <div class="comparison-label">
                  <el-icon><Download /></el-icon>
                  当前归还状态
                </div>
                <div class="comparison-content">
                  <el-radio-group
                    v-model="form.items[item.key].result"
                    size="small"
                    @change="handleResultChange(item.key)"
                  >
                    <el-radio-button value="normal">正常</el-radio-button>
                    <el-radio-button value="abnormal">异常</el-radio-button>
                    <el-radio-button value="not_applicable">不适用</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </div>

            <el-input
              v-if="form.items[item.key].result !== 'not_applicable'"
              v-model="form.items[item.key].description"
              type="textarea"
              :rows="2"
              placeholder="请详细描述当前状态，与出库不一致时请重点说明..."
              maxlength="500"
              show-word-limit
              style="margin-top: 12px;"
            />

            <div v-if="form.items[item.key].result === 'abnormal'" class="abnormal-section">
              <el-select
                v-model="form.items[item.key].abnormalType"
                placeholder="选择异常类型"
                size="small"
                style="width: 200px; margin-right: 10px;"
              >
                <el-option
                  v-for="type in abnormalTypes"
                  :key="type.key"
                  :label="type.label"
                  :value="type.key"
                />
              </el-select>
              <el-tag size="small" :type="getSeverityType(form.items[item.key].abnormalType)">
                {{ getSeverityLabel(form.items[item.key].abnormalType) }}
              </el-tag>
            </div>

            <div class="photo-upload-area">
              <div
                v-for="(photo, index) in form.items[item.key].photos"
                :key="index"
                class="photo-item"
              >
                <img :src="getPhotoUrl(photo)" alt="复核照片" />
                <div class="photo-badge return">归还</div>
                <el-button
                  class="photo-delete"
                  type="danger"
                  size="small"
                  circle
                  @click="removePhoto(item.key, index)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <div class="photo-upload-btn" @click="uploadPhoto(item.key)">
                <el-icon><Plus /></el-icon>
                <span>上传照片</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasAnyAbnormal" class="anomaly-report-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon color="#ef4444"><Warning /></el-icon>
              异常情况说明
            </div>
          </template>

          <el-form label-width="120px" size="default">
            <el-form-item label="异常类型">
              <el-radio-group v-model="form.anomalyReport.type">
                <el-radio value="damage">器材损坏</el-radio>
                <el-radio value="missing">配件缺失</el-radio>
                <el-radio value="other">其他</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="预估费用">
              <el-input-number
                v-model="form.anomalyReport.estimatedCost"
                :min="0"
                :step="100"
                prefix="¥"
              />
            </el-form-item>
            <el-form-item label="情况说明">
              <el-input
                v-model="form.anomalyReport.description"
                type="textarea"
                :rows="3"
                placeholder="请详细说明异常情况，包括损坏部位、可能原因等..."
              />
            </el-form-item>
            <el-form-item label="客户是否确认">
              <el-radio-group v-model="form.anomalyReport.customerAcknowledged">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="待处理事项">
              <el-input
                v-model="form.anomalyReport.pendingAction"
                placeholder="如：待与客户协商赔偿、送修等"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="summary-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Document /></el-icon>
              复核总结
            </div>
          </template>

          <el-radio-group v-model="form.overallResult" size="small">
            <el-radio-button value="normal">与出库一致，无异常</el-radio-button>
            <el-radio-button value="abnormal">发现异常（需注明）</el-radio-button>
          </el-radio-group>

          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入复核总结，如有异常请详细说明与出库状态的差异..."
            maxlength="1000"
            show-word-limit
            style="margin-top: 12px;"
          />

          <div class="customer-confirm" style="margin-top: 16px;">
            <el-checkbox v-model="form.customerConfirmed">
              客户已确认复核结果
            </el-checkbox>
          </div>
        </el-card>

        <div class="form-actions">
          <el-button size="large" @click="saveDraft">
            <el-icon><EditPen /></el-icon>
            保存草稿
          </el-button>
          <el-button
            type="primary"
            size="large"
            :disabled="!canSubmit"
            @click="submitReview"
          >
            <el-icon><Check /></el-icon>
            完成复核
          </el-button>
        </div>
      </el-col>

      <el-col :span="8">
        <el-card class="timeline-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><Time /></el-icon>
              状态流转记录
            </div>
          </template>
          <StatusTimeline :history="rental.statusHistory" />
        </el-card>

        <el-card class="diff-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Search /></el-icon>
              自动对比结果
            </div>
          </template>
          <div v-if="differences === null" class="empty-diff">
            完成填写后将自动对比
          </div>
          <div v-else-if="differences.length === 0" class="no-diff">
            <el-icon color="#10b981" size="24"><CircleCheck /></el-icon>
            <p>所有项目与出库状态一致</p>
          </div>
          <div v-else class="diff-list">
            <div
              v-for="(diff, index) in differences"
              :key="index"
              class="diff-item"
              :class="{ 'abnormal': diff.isAbnormal }"
            >
              <div class="diff-title">
                <el-icon color="#ef4444"><Warning /></el-icon>
                {{ getLabelByKey(diff.item) }}
              </div>
              <div class="diff-content">
                <div class="diff-outbound">
                  <span class="diff-label">出库：</span>
                  <el-tag size="small" :type="diff.outbound.result === 'abnormal' ? 'danger' : 'success'">
                    {{ diff.outbound.result === 'abnormal' ? '异常' : '正常' }}
                  </el-tag>
                </div>
                <div class="diff-return">
                  <span class="diff-label">归还：</span>
                  <el-tag size="small" :type="diff.return.result === 'abnormal' ? 'danger' : 'success'">
                    {{ diff.return.result === 'abnormal' ? '异常' : '正常' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Money /></el-icon>
              押金信息
            </div>
          </template>
          <div v-if="depositInfo" class="deposit-info">
            <div class="deposit-row">
              <span class="deposit-label">押金金额</span>
              <span class="deposit-value">¥{{ depositInfo.amount.toLocaleString() }}</span>
            </div>
            <div class="deposit-row">
              <span class="deposit-label">支付状态</span>
              <el-tag size="small" type="success">已支付</el-tag>
            </div>
            <div v-if="depositInfo.holdReason" class="deposit-row">
              <span class="deposit-label">冻结原因</span>
              <span class="hold-reason">{{ depositInfo.holdReason }}</span>
            </div>
          </div>
          <div class="integration-point" style="margin-top: 10px;">
            <el-icon><InfoFilled /></el-icon>
            押金退还功能待集成财务系统。位置：<code>src/data/mockData.js - mockDeposits</code>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { INSPECTION_ITEMS, ABNORMAL_TYPES, mockDeposits } from '@/data/mockData'
import StatusTimeline from '@/components/StatusTimeline.vue'

const route = useRoute()
const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const rentalId = computed(() => route.params.id)
const rental = computed(() => equipmentStore.getById(rentalId.value))

const inspectionItems = ref(INSPECTION_ITEMS)
const abnormalTypes = ref(ABNORMAL_TYPES)

const initForm = () => {
  const items = {}
  INSPECTION_ITEMS.forEach(item => {
    items[item.key] = {
      result: 'normal',
      description: '',
      photos: [],
      keyPoint: false,
      abnormalType: ''
    }
  })

  if (rental.value?.returnInspection) {
    Object.assign(items, rental.value.returnInspection.items)
  }

  return {
    items,
    overallResult: 'normal',
    summary: rental.value?.returnInspection?.summary || '',
    customerConfirmed: rental.value?.returnInspection?.customerConfirmed || false,
    anomalyReport: rental.value?.returnInspection?.anomalyReport || {
      type: 'damage',
      estimatedCost: 0,
      description: '',
      customerAcknowledged: false,
      pendingAction: ''
    }
  }
}

const form = reactive(initForm())

const outboundKeyPoints = computed(() => {
  if (!rental.value?.outboundInspection) return []
  return equipmentStore.getOutboundKeyPoints(rental.value)
    .map(p => ({
      key: p.key,
      label: INSPECTION_ITEMS.find(i => i.key === p.key)?.label || p.key,
      result: p.result,
      description: p.description,
      photos: p.photos || []
    }))
})

const depositInfo = computed(() =>
  mockDeposits.find(d => d.rentalId === rentalId.value)
)

const compareWithCurrentForm = () => {
  if (!rental.value?.outboundInspection) return null

  const outbound = rental.value.outboundInspection.items
  const current = form.items
  const differences = []

  Object.keys(outbound).forEach(key => {
    const outItem = outbound[key]
    const curItem = current[key]

    if (outItem.result === 'not_applicable' || curItem.result === 'not_applicable') {
      return
    }

    if (outItem.result !== curItem.result) {
      differences.push({
        item: key,
        outbound: outItem,
        return: curItem,
        isAbnormal: curItem.result === 'abnormal'
      })
    }
  })

  return differences
}

const differences = computed(() => {
  return compareWithCurrentForm()
})

const hasAnyAbnormal = computed(() =>
  Object.values(form.items).some(item => item.result === 'abnormal') ||
  form.overallResult === 'abnormal'
)

const hasDifference = (key) => {
  const diffs = differences.value
  if (!diffs) return false
  return diffs.some(d => d.item === key)
}

const canEdit = computed(() => authStore.hasPermission('return:review'))

const canSubmit = computed(() => {
  if (!canEdit.value) return false
  if (!form.summary.trim()) return false
  if (hasAnyAbnormal.value) {
    if (!form.anomalyReport.description) return false
    if (!form.anomalyReport.pendingAction) return false
  }
  return true
})

watch(hasAnyAbnormal, (val) => {
  if (val && form.overallResult === 'normal') {
    form.overallResult = 'abnormal'
  }
})

const isKeyPoint = (key) => {
  return rental.value?.outboundInspection?.items?.[key]?.keyPoint || false
}

const getOutboundResultType = (key) => {
  const result = rental.value?.outboundInspection?.items?.[key]?.result
  if (result === 'abnormal') return 'danger'
  if (result === 'not_applicable') return 'info'
  return 'success'
}

const getOutboundResultLabel = (key) => {
  const result = rental.value?.outboundInspection?.items?.[key]?.result
  if (result === 'abnormal') return '异常'
  if (result === 'not_applicable') return '不适用'
  return '正常'
}

const getOutboundDescription = (key) => {
  return rental.value?.outboundInspection?.items?.[key]?.description || '-'
}

const getLabelByKey = (key) => {
  return INSPECTION_ITEMS.find(i => i.key === key)?.label || key
}

const getSeverityType = (abnormalType) => {
  const type = abnormalTypes.value.find(t => t.key === abnormalType)
  if (!type) return 'info'
  if (type.severity === 'high') return 'danger'
  if (type.severity === 'medium') return 'warning'
  return 'info'
}

const getSeverityLabel = (abnormalType) => {
  const type = abnormalTypes.value.find(t => t.key === abnormalType)
  if (!type) return ''
  if (type.severity === 'high') return '严重'
  if (type.severity === 'medium') return '中等'
  return '轻微'
}

const getPhotoUrl = (photo) => {
  if (photo.startsWith('#mock') || photo.startsWith('#upload')) {
    return `https://picsum.photos/200/200?random=${photo}`
  }
  return photo || 'https://picsum.photos/200/200'
}

const handleResultChange = (key) => {
  if (form.items[key].result === 'abnormal') {
    form.items[key].keyPoint = true
  }
}

const uploadPhoto = (itemKey) => {
  const mockPhoto = `#upload-${Date.now()}`
  form.items[itemKey].photos.push(mockPhoto)
  ElMessage.success('照片上传成功（模拟）')
}

const removePhoto = (itemKey, index) => {
  form.items[itemKey].photos.splice(index, 1)
}

const saveDraft = () => {
  ElMessage.success('草稿已保存（本地模拟）')
}

const submitReview = async () => {
  if (!canSubmit.value) {
    if (!form.summary.trim()) {
      ElMessage.warning('请填写复核总结')
      return
    }
    if (hasAnyAbnormal.value && !form.anomalyReport.description) {
      ElMessage.warning('请填写异常情况说明')
      return
    }
    return
  }

  const diffCount = differences.value?.length || 0
  let confirmMessage = '确认完成归还复核？'

  if (diffCount > 0) {
    confirmMessage = `检测到 ${diffCount} 项与出库状态不一致，确认提交？`
  }

  if (hasAnyAbnormal.value) {
    confirmMessage += ' 异常情况将进入后续处理流程。'
  }

  try {
    await ElMessageBox.confirm(confirmMessage, '复核确认', {
      confirmButtonText: '确认完成',
      type: hasAnyAbnormal.value ? 'error' : 'warning'
    })

    const inspectionData = {
      items: form.items,
      overallResult: form.overallResult,
      summary: form.summary,
      customerConfirmed: form.customerConfirmed,
      anomalyReport: hasAnyAbnormal.value ? form.anomalyReport : null
    }

    equipmentStore.completeReturnInspection(rentalId.value, inspectionData)

    if (hasAnyAbnormal.value) {
      ElMessage.warning('复核完成，已标记为异常待处理')
    } else {
      ElMessage.success('复核完成，一切正常')
    }

    router.push('/return/completed')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('提交失败')
    }
  }
}

onMounted(() => {
  if (!rental.value) {
    ElMessage.error('找不到该订单')
    router.back()
    return
  }

  if (!rental.value.outboundInspection) {
    ElMessage.error('该订单尚未完成出库验机，无法进行归还复核')
    router.back()
  }
})
</script>

<style scoped>
.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.key-points-header {
  background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
  margin: -16px -20px;
  padding: 16px 20px;
  border-radius: 8px 8px 0 0;
}

.no-key-points {
  text-align: center;
  padding: 30px;
  color: #9ca3af;
}

.key-points-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-point-card {
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.key-point-card.abnormal {
  background: #fef2f2;
  border-color: #fca5a5;
  border-left-color: #ef4444;
}

.key-point-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.key-point-title {
  font-weight: 600;
  color: #92400e;
}

.key-point-card.abnormal .key-point-title {
  color: #991b1b;
}

.key-point-desc {
  font-size: 13px;
  color: #78350f;
  margin: 0 0 10px 0;
}

.key-point-card.abnormal .key-point-desc {
  color: #b91c1c;
}

.key-point-photos {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.photo-thumb {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid #fcd34d;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-photos {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.compare-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #92400e;
  padding-top: 8px;
  border-top: 1px dashed #fcd34d;
}

.inspection-item {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.inspection-item.has-difference {
  background: #fef2f2;
  border-color: #fecaca;
}

.inspection-item.is-abnormal {
  background: #fef2f2;
  border-color: #fca5a5;
}

.inspection-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.inspection-item-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inspection-item-title > span:first-child {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.item-desc {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
}

.inspection-item-flags {
  display: flex;
  gap: 6px;
}

.comparison-row {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.comparison-col {
  flex: 1;
  padding: 12px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.comparison-col.outbound {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.comparison-col.return {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.comparison-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.comparison-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
}

.abnormal-section {
  margin-top: 10px;
  display: flex;
  align-items: center;
}

.photo-upload-area {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.photo-item {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 2px solid #60a5fa;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-badge {
  position: absolute;
  top: 0;
  left: 0;
  padding: 2px 6px;
  font-size: 10px;
  color: #fff;
  border-radius: 0 0 6px 0;
}

.photo-badge.return {
  background: #3b82f6;
}

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 0;
  width: 24px;
  height: 24px;
}

.photo-upload-btn {
  width: 100px;
  height: 100px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #9ca3af;
}

.photo-upload-btn:hover {
  border-color: #60a5fa;
  color: #60a5fa;
}

.customer-confirm {
  padding: 12px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
}

.empty-diff {
  text-align: center;
  padding: 30px;
  color: #9ca3af;
  font-size: 13px;
}

.no-diff {
  text-align: center;
  padding: 30px;
}

.no-diff p {
  color: #059669;
  font-weight: 600;
  margin: 10px 0 0 0;
}

.diff-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.diff-item {
  padding: 12px;
  background: #fef2f2;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
}

.diff-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 8px;
}

.diff-content {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.diff-label {
  color: #6b7280;
}

.deposit-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.deposit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deposit-label {
  font-size: 13px;
  color: #6b7280;
}

.deposit-value {
  font-weight: 600;
  color: #059669;
}

.hold-reason {
  color: #b45309;
  font-size: 12px;
}
</style>
