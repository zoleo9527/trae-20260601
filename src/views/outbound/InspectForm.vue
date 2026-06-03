<template>
  <div class="inspect-form-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">出库验机 - {{ rental?.orderNo }}</h1>
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
        <el-card class="info-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><InfoFilled /></el-icon>
              订单与器材信息
            </div>
          </template>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="订单号">{{ rental.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ rental.customer.name }} ({{ rental.customer.phone }})</el-descriptions-item>
            <el-descriptions-item label="租期">
              {{ rental.rentalPeriod.start }} ~ {{ rental.rentalPeriod.end }}
            </el-descriptions-item>
            <el-descriptions-item label="器材名称">{{ rental.equipment.name }}</el-descriptions-item>
            <el-descriptions-item label="序列号">{{ rental.equipment.serialNo }}</el-descriptions-item>
            <el-descriptions-item label="原值">¥{{ rental.equipment.originalValue.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="押金">¥{{ rental.deposit.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="日租金">¥{{ rental.dailyRate }}/天</el-descriptions-item>
            <el-descriptions-item label="租金总额">¥{{ rental.totalAmount }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="inspection-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Search /></el-icon>
              验机项目
              <el-tag size="small" type="info" style="margin-left: 10px;">
                标记为「关键判断」的项目在归还复核时会重点提示
              </el-tag>
            </div>
          </template>

          <div
            v-for="item in inspectionItems"
            :key="item.key"
            class="inspection-item"
            :class="{ 'not-applicable': form.items[item.key]?.result === 'not_applicable' }"
          >
            <div class="inspection-item-header">
              <div class="inspection-item-title">
                <span>{{ item.label }}</span>
                <span class="item-desc">{{ item.description }}</span>
              </div>
              <div class="inspection-item-actions">
                <el-checkbox
                  v-model="form.items[item.key].keyPoint"
                  label="关键判断"
                  size="small"
                />
              </div>
            </div>

            <el-radio-group
              v-model="form.items[item.key].result"
              @change="handleResultChange(item.key)"
              size="small"
            >
              <el-radio-button value="normal">正常</el-radio-button>
              <el-radio-button value="abnormal">异常</el-radio-button>
              <el-radio-button value="not_applicable">不适用</el-radio-button>
            </el-radio-group>

            <el-input
              v-if="form.items[item.key].result !== 'not_applicable'"
              v-model="form.items[item.key].description"
              type="textarea"
              :rows="2"
              placeholder="请详细描述检查结果..."
              maxlength="500"
              show-word-limit
              style="margin-top: 10px;"
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
                <img :src="getPhotoUrl(photo)" alt="验机照片" />
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

        <el-card class="summary-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Document /></el-icon>
              验机总结
            </div>
          </template>

          <el-radio-group v-model="form.overallResult" size="small">
            <el-radio-button value="normal">全部正常</el-radio-button>
            <el-radio-button value="abnormal">有异常备注</el-radio-button>
          </el-radio-group>

          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入验机总结，如有异常请详细说明..."
            maxlength="1000"
            show-word-limit
            style="margin-top: 12px;"
          />

          <div class="customer-confirm" style="margin-top: 16px;">
            <el-checkbox v-model="form.customerConfirmed">
              客户已确认验机结果并签字
            </el-checkbox>
            <div class="integration-point" style="margin-top: 10px;">
              <el-icon><InfoFilled /></el-icon>
              电子签名待集成，当前为模拟确认。位置：<code>src/data/mockData.js - signature字段</code>
            </div>
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
            @click="submitInspection"
          >
            <el-icon><Check /></el-icon>
            完成验机
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

        <el-card class="key-points-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon color="#f59e0b"><Star /></el-icon>
              本次标记的关键判断
            </div>
          </template>
          <div v-if="currentKeyPoints.length === 0" class="empty-key-points">
            暂未标记任何关键判断
          </div>
          <div v-else class="key-points-list">
            <div
              v-for="(point, index) in currentKeyPoints"
              :key="index"
              class="key-point-item"
            >
              <div class="key-point-header">
                <el-tag size="small" :type="point.result === 'abnormal' ? 'danger' : 'success'">
                  {{ point.result === 'abnormal' ? '异常' : point.result === 'not_applicable' ? '不适用' : '正常' }}
                </el-tag>
                <span class="key-point-label">{{ point.label }}</span>
              </div>
              <p class="key-point-desc">{{ point.description || '未填写描述' }}</p>
            </div>
          </div>
          <div class="key-points-hint">
            <el-icon><InfoFilled /></el-icon>
            这些关键判断会在归还复核时显示给复核人员，作为对比基准
          </div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Link /></el-icon>
              关联押金凭证
            </div>
          </template>
          <div v-if="depositInfo" class="deposit-info">
            <div class="deposit-row">
              <span class="deposit-label">押金金额</span>
              <span class="deposit-value">¥{{ depositInfo.amount.toLocaleString() }}</span>
            </div>
            <div class="deposit-row">
              <span class="deposit-label">支付方式</span>
              <span class="deposit-value">
                <el-tag size="small">{{ depositInfo.paymentMethod === 'wechat' ? '微信' : '支付宝' }}</el-tag>
              </span>
            </div>
            <div class="deposit-row">
              <span class="deposit-label">支付凭证</span>
              <el-button type="primary" size="small" text @click="viewDepositScreenshot">
                <el-icon><Picture /></el-icon>
                查看截图
              </el-button>
            </div>
          </div>
          <div class="integration-point">
            <el-icon><InfoFilled /></el-icon>
            押金数据待集成支付系统。位置：<code>src/data/mockData.js - mockDeposits</code>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { INSPECTION_ITEMS, ABNORMAL_TYPES } from '@/data/mockData'
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

  if (rental.value?.outboundInspection) {
    Object.assign(items, rental.value.outboundInspection.items)
  }

  return {
    items,
    overallResult: 'normal',
    summary: rental.value?.outboundInspection?.summary || '',
    customerConfirmed: rental.value?.outboundInspection?.customerConfirmed || false,
    signature: rental.value?.outboundInspection?.signature || ''
  }
}

const form = reactive(initForm())

const depositInfo = computed(() =>
  equipmentStore.getDepositByRentalId(rentalId.value))

const currentKeyPoints = computed(() => {
  return Object.entries(form.items)
    .filter(([_, item]) => item.keyPoint)
    .map(([key, item]) => ({
      key,
      label: INSPECTION_ITEMS.find(i => i.key === key)?.label || key,
      result: item.result,
      description: item.description
    }))
})

const canEdit = computed(() => authStore.hasPermission('outbound:inspect'))

const canSubmit = computed(() => {
  if (!canEdit.value) return false
  if (!form.customerConfirmed) return false
  if (!form.summary.trim()) return false
  return true
})

const handleResultChange = (key) => {
  if (form.items[key].result === 'abnormal') {
    form.items[key].keyPoint = true
  }
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
  if (photo.startsWith('#mock')) {
    return `https://picsum.photos/200/200?random=${photo}`
  }
  return photo || 'https://picsum.photos/200/200'
}

const uploadPhoto = (itemKey) => {
  const mockPhoto = `#upload-${Date.now()}`
  form.items[itemKey].photos.push(mockPhoto)
  ElMessage.success('照片上传成功（模拟）')
}

const removePhoto = (itemKey, index) => {
  form.items[itemKey].photos.splice(index, 1)
}

const viewDepositScreenshot = () => {
  ElMessage.info('押金截图查看功能待集成')
}

const saveDraft = () => {
  ElMessage.success('草稿已保存（本地模拟）')
}

const submitInspection = async () => {
  if (!canSubmit.value) {
    if (!form.customerConfirmed) {
      ElMessage.warning('请确认客户已签字')
      return
    }
    if (!form.summary.trim()) {
      ElMessage.warning('请填写验机总结')
      return
    }
    return
  }

  try {
    await ElMessageBox.confirm(
      '确认完成出库验机？验机结果将作为归还复核的基准，无法撤回。',
      '验机确认',
      {
        confirmButtonText: '确认完成',
        type: 'warning'
      }
    )

    const inspectionData = {
      items: form.items,
      overallResult: form.overallResult,
      summary: form.summary,
      customerConfirmed: form.customerConfirmed
    }

    equipmentStore.completeOutboundInspection(rentalId.value, inspectionData)

    ElMessage.success('出库验机完成，设备已出库')
    router.push('/outbound/completed')
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

.inspection-item {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.inspection-item.not-applicable {
  opacity: 0.6;
  background: #f3f4f6;
}

.inspection-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  border: 2px solid #e5e7eb;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.empty-key-points {
  text-align: center;
  padding: 30px;
  color: #9ca3af;
  font-size: 13px;
}

.key-points-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-point-item {
  padding: 10px 12px;
  background: #fef3c7;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
}

.key-point-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.key-point-label {
  font-weight: 600;
  color: #92400e;
  font-size: 13px;
}

.key-point-desc {
  font-size: 12px;
  color: #78350f;
  margin: 0;
}

.key-points-hint {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
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
</style>
