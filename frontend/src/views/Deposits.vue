<template>
  <div class="page-container">
    <div class="dispute-highlight" v-if="disputedDeposits.length > 0">
      <div class="alert-header">
        <el-icon size="18" color="#f56c6c"><Wallet /></el-icon>
        <strong>押金结算争议预警</strong>
        <span style="margin-left: 8px; font-size: 13px; color: #909399">
          共 {{ disputedDeposits.length }} 笔押金结算存在争议待处理
        </span>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">押金结算</div>

      <div class="action-bar">
        <el-button
          v-if="authStore.userRole === 'consultant'"
          type="primary"
          :icon="Plus"
          @click="openInitiateDialog"
        >
          发起押金结算
        </el-button>
        <el-select v-model="filterProperty" placeholder="筛选房源" clearable style="width: 200px">
          <el-option
            v-for="p in properties"
            :key="p.id"
            :label="`${p.building} ${p.floor}层${p.unit}`"
            :value="p.id"
          />
        </el-select>
        <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 140px">
          <el-option label="待确认" value="pending" />
          <el-option label="已确认" value="confirmed" />
          <el-option label="争议中" value="disputed" />
          <el-option label="已结算" value="settled" />
        </el-select>
        <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
      </div>

      <el-table :data="filteredDeposits" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="租户" width="180">
          <template #default="{ row }">
            <div class="tenant-name">
              <el-icon color="#409eff"><User /></el-icon>
              <strong>{{ row.tenantName }}</strong>
            </div>
            <div class="tenant-prop" v-if="propertyMap[row.propertyId]">
              {{ propertyMap[row.propertyId].building }} {{ propertyMap[row.propertyId].floor }}层{{ propertyMap[row.propertyId].unit }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="原始押金" width="120">
          <template #default="{ row }">¥{{ row.originalDeposit.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="扣除项" min-width="200">
          <template #default="{ row }">
            <div v-if="row.deductions && row.deductions.length > 0">
              <div
                v-for="(d, idx) in row.deductions.slice(0, 2)"
                :key="idx"
                class="deduction-item"
              >
                <span>{{ d.item }}</span>
                <span class="deduction-amount">-¥{{ d.amount.toLocaleString() }}</span>
              </div>
              <div v-if="row.deductions.length > 2" style="font-size: 12px; color: #909399">
                等 {{ row.deductions.length }} 项，共 -¥{{ row.totalDeductions.toLocaleString() }}
              </div>
            </div>
            <span v-else style="color: #67c23a">无扣除</span>
          </template>
        </el-table-column>
        <el-table-column label="应退金额" width="120">
          <template #default="{ row }">
            <strong :class="{ 'refund-positive': row.refundAmount > 0 }">
              ¥{{ row.refundAmount.toLocaleString() }}
            </strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发起人" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.initiatedByName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发起时间" width="180">
          <template #default="{ row }">{{ formatTime(row.initiatedAt) }}</template>
        </el-table-column>
        <el-table-column label="争议信息" min-width="200">
          <template #default="{ row }">
            <div v-if="row.dispute">
              <p style="margin: 0; color: #f56c6c; font-weight: 500">
                争议金额：¥{{ row.dispute.disputedAmount.toLocaleString() }}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #606266">
                {{ row.dispute.disputeReason }}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #909399">
                提出方：{{ row.dispute.raisedByName }} · {{ formatTime(row.dispute.raisedAt) }}
              </p>
            </div>
            <div v-else-if="row.resolution">
              <p style="margin: 0; color: #67c23a; font-weight: 500">
                最终结算：¥{{ row.resolution.finalAmount.toLocaleString() }}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #606266">
                {{ row.resolution.resolutionNotes }}
              </p>
            </div>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending' && authStore.userRole === 'finance'"
              size="small"
              type="success"
              link
              @click="confirmDeposit(row)"
            >
              确认
            </el-button>
            <el-button
              v-if="(row.status === 'pending' || row.status === 'confirmed') && authStore.userRole === 'finance'"
              size="small"
              type="danger"
              link
              @click="openDisputeDialog(row)"
            >
              提异议
            </el-button>
            <el-button
              v-if="row.status === 'disputed' && authStore.userRole === 'finance'"
              size="small"
              type="warning"
              link
              @click="openResolveDialog(row)"
            >
              解决
            </el-button>
            <el-button
              v-if="row.status === 'confirmed' && authStore.userRole === 'finance'"
              size="small"
              type="primary"
              link
              @click="markSettled(row)"
            >
              标记结算
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="initiateDialogVisible" title="发起押金结算" width="600px">
      <el-form :model="initiateForm" :rules="initiateRules" ref="initiateFormRef" label-width="100px">
        <el-form-item label="房源" prop="propertyId">
          <el-select
            v-model="initiateForm.propertyId"
            placeholder="请选择房源"
            style="width: 100%"
            @change="onPropertyChange"
          >
            <el-option
              v-for="p in properties"
              :key="p.id"
              :label="`${p.building} ${p.floor}层${p.unit} · 押金 ¥${p.deposit}`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联交房验收" prop="handoverId">
          <el-select v-model="initiateForm.handoverId" placeholder="请选择交房验收（选填）" style="width: 100%" clearable>
            <el-option
              v-for="h in propertyHandovers"
              :key="h.id"
              :label="`提交人: ${h.submittedByName} · ${formatTime(h.submittedAt)}`"
              :value="h.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="租户名称" prop="tenantName">
          <el-input v-model="initiateForm.tenantName" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="原始押金" prop="originalDeposit">
          <el-input-number v-model="initiateForm.originalDeposit" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="扣除项">
          <div class="deductions-section">
            <div
              v-for="(d, idx) in initiateForm.deductions"
              :key="idx"
              class="deduction-row"
            >
              <el-input
                v-model="d.item"
                placeholder="扣除项目"
                style="flex: 1; margin-right: 12px"
                size="small"
              />
              <el-input-number
                v-model="d.amount"
                :min="0"
                :step="100"
                size="small"
                style="width: 140px; margin-right: 12px"
              />
              <el-button
                size="small"
                type="danger"
                link
                @click="removeDeduction(idx)"
              >
                删除
              </el-button>
            </div>
            <el-button size="small" type="primary" link @click="addDeduction">
              + 添加扣除项
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="应退金额">
          <div style="font-size: 18px; font-weight: 700; color: #67c23a">
            ¥{{ calculatedRefund.toLocaleString() }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="initiateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitInitiate">发起结算</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="disputeDialogVisible" title="提出押金异议" width="550px">
      <el-form :model="disputeForm" :rules="disputeRules" ref="disputeFormRef" label-width="110px">
        <el-form-item label="异议原因" prop="disputeReason">
          <el-input
            v-model="disputeForm.disputeReason"
            type="textarea"
            :rows="3"
            placeholder="请详细说明异议原因"
          />
        </el-form-item>
        <el-form-item label="争议金额" prop="disputedAmount">
          <el-input-number v-model="disputeForm.disputedAmount" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="争议扣除项" prop="deductionItems">
          <div class="deductions-section">
            <div
              v-for="(d, idx) in disputeForm.deductionItems"
              :key="idx"
              class="deduction-row"
            >
              <el-input
                v-model="d.item"
                placeholder="扣除项目"
                style="flex: 1; margin-right: 12px"
                size="small"
              />
              <el-input-number
                v-model="d.amount"
                :min="0"
                :step="100"
                size="small"
                style="width: 140px; margin-right: 12px"
              />
              <el-button
                size="small"
                type="danger"
                link
                @click="removeDisputeDeduction(idx)"
              >
                删除
              </el-button>
            </div>
            <el-button size="small" type="primary" link @click="addDisputeDeduction">
              + 添加争议扣除项
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disputeDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="submitDispute">提交异议</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveDialogVisible" title="解决押金争议" width="500px">
      <el-form :model="resolveForm" :rules="resolveRules" ref="resolveFormRef" label-width="110px">
        <el-form-item label="最终结算金额" prop="finalAmount">
          <el-input-number v-model="resolveForm.finalAmount" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="解决方案" prop="resolutionNotes">
          <el-input
            v-model="resolveForm.resolutionNotes"
            type="textarea"
            :rows="4"
            placeholder="请详细说明解决方案和双方协商结果"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitResolve">提交解决</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="押金结算详情" width="650px">
      <div v-if="currentDeposit">
        <div class="detail-header">
          <div class="detail-tenant">
            <el-icon size="20" color="#409eff"><Wallet /></el-icon>
            <strong>{{ currentDeposit.tenantName }}</strong>
            <span style="color: #909399; font-size: 13px; margin-left: 12px">
              {{ propertyMap[currentDeposit.propertyId]?.building }}
              {{ propertyMap[currentDeposit.propertyId]?.floor }}层
              {{ propertyMap[currentDeposit.propertyId]?.unit }}
            </span>
          </div>
          <el-tag :type="statusTagType(currentDeposit.status)" size="large">
            {{ statusLabel(currentDeposit.status) }}
          </el-tag>
        </div>

        <div class="amount-section">
          <div class="amount-row">
            <span class="amount-label">原始押金</span>
            <span class="amount-value">¥{{ currentDeposit.originalDeposit.toLocaleString() }}</span>
          </div>
          <div v-if="currentDeposit.deductions.length > 0" class="amount-row deduction">
            <span class="amount-label">扣除项（共 {{ currentDeposit.deductions.length }} 项）</span>
            <span class="amount-value">-¥{{ currentDeposit.totalDeductions.toLocaleString() }}</span>
          </div>
          <div class="deduction-detail" v-if="currentDeposit.deductions.length > 0">
            <div v-for="(d, idx) in currentDeposit.deductions" :key="idx" class="deduction-item">
              <span>{{ d.item }}</span>
              <span>-¥{{ d.amount.toLocaleString() }}</span>
            </div>
          </div>
          <div class="amount-row total">
            <span class="amount-label">应退金额</span>
            <span class="amount-value">¥{{ currentDeposit.refundAmount.toLocaleString() }}</span>
          </div>
        </div>

        <el-steps
          :active="getCurrentStep(currentDeposit)"
          finish-status="success"
          align-center
          style="margin: 24px 0"
        >
          <el-step title="发起结算" :description="currentDeposit.initiatedByName" />
          <el-step title="财务确认" :description="currentDeposit.confirmedByName || '待确认'" />
          <el-step
            title="争议处理"
            :status="currentDeposit.status === 'disputed' ? 'error' : (currentDeposit.dispute ? 'success' : '')"
            :description="currentDeposit.dispute?.raisedByName || '无争议'"
          />
          <el-step
            title="完成结算"
            :status="currentDeposit.status === 'settled' ? 'success' : ''"
            :description="currentDeposit.settledByName || '待结算'"
          />
        </el-steps>

        <div v-if="currentDeposit.dispute" class="section-card" style="background: #fef0f0">
          <div class="section-title" style="font-size: 14px; border-left-color: #f56c6c">争议信息</div>
          <p><strong>争议金额：</strong>¥{{ currentDeposit.dispute.disputedAmount.toLocaleString() }}</p>
          <p><strong>原因：</strong>{{ currentDeposit.dispute.disputeReason }}</p>
          <p><strong>争议扣除项：</strong></p>
          <div class="deduction-detail">
            <div v-for="(d, idx) in currentDeposit.dispute.deductionItems" :key="idx" class="deduction-item">
              <span>{{ d.item }}</span>
              <span>-¥{{ d.amount.toLocaleString() }}</span>
            </div>
          </div>
          <p style="margin-top: 8px">
            <strong>提出方：</strong>{{ currentDeposit.dispute.raisedByName }} · {{ formatTime(currentDeposit.dispute.raisedAt) }}
          </p>
          <div v-if="currentDeposit.resolution" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #fbc4c4">
            <p><strong>最终结算金额：</strong>¥{{ currentDeposit.resolution.finalAmount.toLocaleString() }}</p>
            <p><strong>解决方案：</strong>{{ currentDeposit.resolution.resolutionNotes }}</p>
            <p><strong>处理人：</strong>{{ currentDeposit.resolution.resolvedByName }} · {{ formatTime(currentDeposit.resolution.resolvedAt) }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Wallet, User } from '@element-plus/icons-vue'
import { depositApi, propertyApi, handoverApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const deposits = ref([])
const properties = ref([])
const propertyMap = ref({})
const propertyHandovers = ref([])
const filterProperty = ref('')
const filterStatus = ref('')

const initiateDialogVisible = ref(false)
const initiateFormRef = ref(null)
const initiateForm = ref({
  propertyId: '',
  handoverId: '',
  tenantName: '',
  originalDeposit: 0,
  deductions: []
})
const initiateRules = {
  propertyId: [{ required: true, message: '请选择房源', trigger: 'change' }],
  tenantName: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  originalDeposit: [{ required: true, message: '请输入原始押金', trigger: 'blur' }]
}

const disputeDialogVisible = ref(false)
const disputeFormRef = ref(null)
const disputeForm = ref({
  id: '',
  disputeReason: '',
  disputedAmount: 0,
  deductionItems: []
})
const disputeRules = {
  disputeReason: [{ required: true, message: '请填写异议原因', trigger: 'blur' }],
  disputedAmount: [{ required: true, message: '请输入争议金额', trigger: 'blur' }],
  deductionItems: [{ required: true, message: '请添加争议扣除项', trigger: 'change' }]
}

const resolveDialogVisible = ref(false)
const resolveFormRef = ref(null)
const resolveForm = ref({
  id: '',
  finalAmount: 0,
  resolutionNotes: ''
})
const resolveRules = {
  finalAmount: [{ required: true, message: '请输入最终结算金额', trigger: 'blur' }],
  resolutionNotes: [{ required: true, message: '请填写解决方案', trigger: 'blur' }]
}

const detailDialogVisible = ref(false)
const currentDeposit = ref(null)

const disputedDeposits = computed(() => {
  return deposits.value.filter(d => d.status === 'disputed')
})

const calculatedRefund = computed(() => {
  const total = initiateForm.value.deductions.reduce((sum, d) => sum + (d.amount || 0), 0)
  return Math.max(0, initiateForm.value.originalDeposit - total)
})

const filteredDeposits = computed(() => {
  let result = [...deposits.value]
  if (filterProperty.value) {
    result = result.filter(d => d.propertyId === filterProperty.value)
  }
  if (filterStatus.value) {
    result = result.filter(d => d.status === filterStatus.value)
  }
  return result.sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt))
})

function statusLabel(s) {
  const m = {
    pending: '待确认', confirmed: '已确认',
    disputed: '争议中', settled: '已结算'
  }
  return m[s] || s
}

function statusTagType(s) {
  const m = {
    pending: 'warning', confirmed: 'success',
    disputed: 'danger', settled: 'info'
  }
  return m[s] || 'info'
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

function getCurrentStep(d) {
  if (d.status === 'pending') return 0
  if (d.status === 'confirmed') return 1
  if (d.status === 'disputed') return 2
  if (d.status === 'settled') return 3
  return 0
}

async function loadData() {
  loading.value = true
  try {
    const [depositData, propData] = await Promise.all([
      depositApi.findAll(),
      propertyApi.findAll()
    ])
    deposits.value = depositData
    properties.value = propData
    propData.forEach(p => { propertyMap.value[p.id] = p })

    if (route.query.propertyId) {
      filterProperty.value = route.query.propertyId
    }
    if (route.query.id) {
      const target = depositData.find(d => d.id === route.query.id)
      if (target) setTimeout(() => viewDetail(target), 300)
    }
  } finally {
    loading.value = false
  }
}

async function onPropertyChange() {
  if (initiateForm.value.propertyId) {
    const p = properties.value.find(x => x.id === initiateForm.value.propertyId)
    if (p) initiateForm.value.originalDeposit = p.deposit
    try {
      propertyHandovers.value = await handoverApi.findAll({
        propertyId: initiateForm.value.propertyId
      })
    } catch (e) {
      propertyHandovers.value = []
    }
  } else {
    propertyHandovers.value = []
  }
  initiateForm.value.handoverId = ''
}

function openInitiateDialog() {
  initiateForm.value = {
    propertyId: '',
    handoverId: '',
    tenantName: '',
    originalDeposit: 0,
    deductions: []
  }
  initiateDialogVisible.value = true
}

function addDeduction() {
  initiateForm.value.deductions.push({ item: '', amount: 0 })
}

function removeDeduction(idx) {
  initiateForm.value.deductions.splice(idx, 1)
}

function addDisputeDeduction() {
  disputeForm.value.deductionItems.push({ item: '', amount: 0 })
}

function removeDisputeDeduction(idx) {
  disputeForm.value.deductionItems.splice(idx, 1)
}

async function submitInitiate() {
  if (!initiateFormRef.value) return
  await initiateFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await depositApi.initiate({
        propertyId: initiateForm.value.propertyId,
        handoverId: initiateForm.value.handoverId || undefined,
        tenantName: initiateForm.value.tenantName,
        originalDeposit: initiateForm.value.originalDeposit,
        deductions: initiateForm.value.deductions.filter(d => d.item && d.amount > 0)
      })
      ElMessage.success('押金结算已发起，待财务确认')
      initiateDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

async function confirmDeposit(row) {
  try {
    await ElMessageBox.confirm('确认该押金结算吗？', '确认结算', {
      type: 'success',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    await depositApi.confirm(row.id)
    ElMessage.success('押金结算已确认')
    loadData()
  } catch (e) {}
}

function openDisputeDialog(row) {
  disputeForm.value = {
    id: row.id,
    disputeReason: '',
    disputedAmount: row.totalDeductions || 0,
    deductionItems: row.deductions.map(d => ({ ...d })) || []
  }
  disputeDialogVisible.value = true
}

async function submitDispute() {
  if (!disputeFormRef.value) return
  await disputeFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await depositApi.dispute(disputeForm.value.id, {
        disputeReason: disputeForm.value.disputeReason,
        disputedAmount: disputeForm.value.disputedAmount,
        deductionItems: disputeForm.value.deductionItems.filter(d => d.item && d.amount > 0)
      })
      ElMessage.success('异议已提交')
      disputeDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

function openResolveDialog(row) {
  resolveForm.value = {
    id: row.id,
    finalAmount: row.originalDeposit,
    resolutionNotes: ''
  }
  resolveDialogVisible.value = true
}

async function submitResolve() {
  if (!resolveFormRef.value) return
  await resolveFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await depositApi.resolve(resolveForm.value.id, {
        finalAmount: resolveForm.value.finalAmount,
        resolutionNotes: resolveForm.value.resolutionNotes
      })
      ElMessage.success('争议已解决，结算完成')
      resolveDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

async function markSettled(row) {
  try {
    await ElMessageBox.confirm('确认该押金已完成结算吗？', '标记结算', {
      type: 'success',
      confirmButtonText: '确认结算',
      cancelButtonText: '取消'
    })
    await depositApi.markSettled(row.id)
    ElMessage.success('押金已标记为已结算')
    loadData()
  } catch (e) {}
}

function viewDetail(row) {
  currentDeposit.value = row
  detailDialogVisible.value = true
}

onMounted(loadData)
</script>

<style scoped>
.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.tenant-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.tenant-prop {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  padding-left: 26px;
}

.alert-header {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.deduction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}

.deduction-amount {
  color: #f56c6c;
  font-weight: 500;
}

.refund-positive {
  color: #67c23a;
}

.deductions-section {
  width: 100%;
}

.deduction-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.detail-tenant {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.amount-section {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.amount-row.deduction {
  color: #f56c6c;
}

.amount-row.total {
  border-top: 1px dashed #ebeef5;
  margin-top: 8px;
  padding-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.amount-label {
  color: #606266;
}

.amount-value {
  font-weight: 500;
}

.deduction-detail {
  padding: 8px 16px;
  background: #fff;
  border-radius: 4px;
  margin: 8px 0;
}
</style>
