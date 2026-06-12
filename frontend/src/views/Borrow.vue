<template>
  <div class="page-container">
    <div class="dispute-highlight" v-if="disputedHandovers.length > 0">
      <div class="alert-header">
        <el-icon size="18" color="#f56c6c"><Warning /></el-icon>
        <strong>交房验收争议预警</strong>
        <span style="margin-left: 8px; font-size: 13px; color: #909399">
          共 {{ disputedHandovers.length }} 笔验收存在争议待处理
        </span>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">交房验收流程</div>

      <div class="action-bar">
        <el-button
          v-if="authStore.userRole === 'consultant'"
          type="primary"
          :icon="Plus"
          @click="openSubmitDialog"
        >
          提交交房验收
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
          <el-option label="已解决" value="resolved" />
        </el-select>
        <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
      </div>

      <el-table :data="filteredHandovers" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="房源" width="220">
          <template #default="{ row }">
            <span v-if="propertyMap[row.propertyId]">
              <div class="prop-name">
                <el-icon color="#409eff"><OfficeBuilding /></el-icon>
                <strong>{{ propertyMap[row.propertyId].building }}</strong>
              </div>
              <div class="prop-sub">
                {{ propertyMap[row.propertyId].floor }}层{{ propertyMap[row.propertyId].unit }} · {{ propertyMap[row.propertyId].area }}㎡
              </div>
            </span>
            <span v-else>{{ row.propertyId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交人" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.submittedByName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">{{ formatTime(row.submittedAt) }}</template>
        </el-table-column>
        <el-table-column label="验收问题" min-width="180">
          <template #default="{ row }">
            <div v-if="row.issues && row.issues.length > 0">
              <el-tag
                v-for="(issue, idx) in row.issues.slice(0, 3)"
                :key="idx"
                type="warning"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ issue }}
              </el-tag>
              <span v-if="row.issues.length > 3" style="color: #909399; font-size: 12px">
                等 {{ row.issues.length }} 项
              </span>
            </div>
            <span v-else style="color: #67c23a">无问题</span>
          </template>
        </el-table-column>
        <el-table-column label="争议信息" min-width="200">
          <template #default="{ row }">
            <div v-if="row.dispute">
              <p style="margin: 0; color: #f56c6c; font-weight: 500">{{ row.dispute.reason }}</p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #909399">
                提出方：{{ row.dispute.raisedByName }} · {{ formatTime(row.dispute.raisedAt) }}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #606266">
                争议项：{{ row.dispute.disputedItems?.join('、') }}
              </p>
            </div>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="确认信息" width="200">
          <template #default="{ row }">
            <div v-if="row.confirmedBy">
              <p style="margin: 0">{{ row.confirmedByName }}</p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #909399">{{ formatTime(row.confirmedAt) }}</p>
            </div>
            <span v-else style="color: #c0c4cc">待确认</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">查看详情</el-button>
            <el-button
              v-if="row.status === 'pending' && authStore.userRole === 'operations'"
              size="small"
              type="success"
              link
              @click="confirmHandover(row)"
            >
              确认验收
            </el-button>
            <el-button
              v-if="row.status === 'pending' && authStore.userRole === 'operations'"
              size="small"
              type="danger"
              link
              @click="openDisputeDialog(row)"
            >
              提出异议
            </el-button>
            <el-button
              v-if="row.status === 'disputed' && authStore.userRole === 'operations'"
              size="small"
              type="warning"
              link
              @click="openResolveDialog(row)"
            >
              解决争议
            </el-button>
            <el-button
              v-if="row.status === 'confirmed'"
              size="small"
              type="warning"
              link
              @click="goKeyTransfer(row)"
            >
              钥匙移交
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="submitDialogVisible" title="提交交房验收" width="700px">
      <el-form :model="submitForm" :rules="submitRules" ref="submitFormRef" label-width="100px">
        <el-form-item label="房源" prop="propertyId">
          <el-select v-model="submitForm.propertyId" placeholder="请选择房源" style="width: 100%">
            <el-option
              v-for="p in leasableProperties"
              :key="p.id"
              :label="`${p.building} ${p.floor}层${p.unit} · ${p.area}㎡ · ¥${p.rentPrice}/月`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="验收清单">
          <div class="checklist-section">
            <div
              v-for="(item, idx) in submitForm.checklist"
              :key="idx"
              class="checklist-item"
            >
              <span class="checklist-label">{{ item.item }}</span>
              <el-radio-group v-model="item.status" size="small">
                <el-radio-button value="pass">通过</el-radio-button>
                <el-radio-button value="fail">不通过</el-radio-button>
                <el-radio-button value="na">不适用</el-radio-button>
              </el-radio-group>
              <el-input
                v-if="item.status === 'fail'"
                v-model="item.notes"
                size="small"
                placeholder="说明问题"
                style="width: 180px; margin-left: 12px"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="问题汇总">
          <el-select
            v-model="submitForm.issues"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入存在的问题"
            style="width: 100%"
          >
            <el-option label="门窗损坏" value="门窗损坏" />
            <el-option label="水电异常" value="水电异常" />
            <el-option label="空调故障" value="空调故障" />
            <el-option label="墙面破损" value="墙面破损" />
            <el-option label="消防设施不全" value="消防设施不全" />
            <el-option label="网络不通" value="网络不通" />
            <el-option label="卫生不达标" value="卫生不达标" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitHandover">提交验收</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="disputeDialogVisible" title="提出验收异议" width="500px">
      <el-form :model="disputeForm" :rules="disputeRules" ref="disputeFormRef" label-width="100px">
        <el-form-item label="异议原因" prop="reason">
          <el-input
            v-model="disputeForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请详细说明异议原因"
          />
        </el-form-item>
        <el-form-item label="争议项" prop="disputedItems">
          <el-select
            v-model="disputeForm.disputedItems"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择争议的验收项"
            style="width: 100%"
          >
            <el-option label="门窗完好" value="门窗完好" />
            <el-option label="水电正常" value="水电正常" />
            <el-option label="空调设备正常" value="空调设备正常" />
            <el-option label="墙面地面无破损" value="墙面地面无破损" />
            <el-option label="消防设施完好" value="消防设施完好" />
            <el-option label="网络线路正常" value="网络线路正常" />
            <el-option label="卫生清洁完成" value="卫生清洁完成" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disputeDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="submitDispute">提交异议</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveDialogVisible" title="解决验收争议" width="500px">
      <el-form :model="resolveForm" :rules="resolveRules" ref="resolveFormRef" label-width="100px">
        <el-form-item label="解决方案" prop="resolution">
          <el-input
            v-model="resolveForm.resolution"
            type="textarea"
            :rows="4"
            placeholder="请详细说明解决方案和处理结果"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitResolve">提交解决</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="交房验收详情" width="700px">
      <div v-if="currentHandover">
        <div class="detail-header">
          <div class="detail-prop">
            <el-icon size="20" color="#409eff"><OfficeBuilding /></el-icon>
            <span v-if="propertyMap[currentHandover.propertyId]">
              <strong>{{ propertyMap[currentHandover.propertyId].building }} {{ propertyMap[currentHandover.propertyId].floor }}层{{ propertyMap[currentHandover.propertyId].unit }}</strong>
            </span>
            <span v-else>{{ currentHandover.propertyId }}</span>
          </div>
          <el-tag :type="statusTagType(currentHandover.status)" size="large">
            {{ statusLabel(currentHandover.status) }}
          </el-tag>
        </div>

        <div class="flow-steps">
          <el-steps :active="getCurrentStep(currentHandover.status)" finish-status="success" align-center>
            <el-step title="提交验收" :description="currentHandover.submittedByName" />
            <el-step title="运营确认" :description="currentHandover.confirmedByName || '待确认'" />
            <el-step
              title="争议处理"
              :status="currentHandover.status === 'disputed' ? 'error' : (currentHandover.dispute ? 'success' : '')"
              :description="currentHandover.dispute?.raisedByName || '无争议'"
            />
            <el-step
              title="完成"
              :status="currentHandover.status === 'confirmed' || currentHandover.status === 'resolved' ? 'success' : ''"
            />
          </el-steps>
        </div>

        <div class="section-card" style="margin-top: 20px">
          <div class="section-title" style="font-size: 14px">验收清单</div>
          <el-table :data="currentHandover.checklist" size="small">
            <el-table-column prop="item" label="检查项" width="160" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'pass'" type="success" size="small">通过</el-tag>
                <el-tag v-else-if="row.status === 'fail'" type="danger" size="small">不通过</el-tag>
                <el-tag v-else type="info" size="small">不适用</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" />
          </el-table>
        </div>

        <div v-if="currentHandover.dispute" class="section-card" style="background: #fef0f0">
          <div class="section-title" style="font-size: 14px; border-left-color: #f56c6c">争议信息</div>
          <p><strong>原因：</strong>{{ currentHandover.dispute.reason }}</p>
          <p><strong>争议项：</strong>{{ currentHandover.dispute.disputedItems?.join('、') }}</p>
          <p><strong>提出方：</strong>{{ currentHandover.dispute.raisedByName }} · {{ formatTime(currentHandover.dispute.raisedAt) }}</p>
          <div v-if="currentHandover.resolution" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #fbc4c4">
            <p><strong>解决方案：</strong>{{ currentHandover.resolution }}</p>
            <p><strong>处理人：</strong>{{ currentHandover.resolvedByName }} · {{ formatTime(currentHandover.resolvedAt) }}</p>
          </div>
        </div>

        <div class="section-card" style="margin-top: 20px">
          <div class="section-title" style="font-size: 14px">审计追踪</div>
          <div class="audit-trail">
            <div v-if="!auditTrail.length" class="empty-state">暂无审计记录</div>
            <div v-for="(log, idx) in auditTrail" :key="idx" class="audit-item">
              <span class="audit-time">{{ formatTime(log.timestamp) }}</span>
              <span class="audit-user">
                <el-tag size="small" :type="roleTagType(log.userRole)">{{ roleLabel(log.userRole) }}</el-tag>
                {{ log.userName }}
              </span>
              <span class="audit-action">
                <strong>{{ actionLabel(log.action) }}</strong>
              </span>
            </div>
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
import { Plus, Refresh, OfficeBuilding, Warning } from '@element-plus/icons-vue'
import { handoverApi, propertyApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const handovers = ref([])
const properties = ref([])
const propertyMap = ref({})
const filterProperty = ref('')
const filterStatus = ref('')

const submitDialogVisible = ref(false)
const submitFormRef = ref(null)
const submitForm = ref({
  propertyId: '',
  checklist: [
    { item: '门窗完好', status: 'na', notes: '' },
    { item: '水电正常', status: 'na', notes: '' },
    { item: '空调设备正常', status: 'na', notes: '' },
    { item: '墙面地面无破损', status: 'na', notes: '' },
    { item: '消防设施完好', status: 'na', notes: '' },
    { item: '网络线路正常', status: 'na', notes: '' },
    { item: '卫生清洁完成', status: 'na', notes: '' },
  ],
  issues: []
})
const submitRules = {
  propertyId: [{ required: true, message: '请选择房源', trigger: 'change' }]
}

const disputeDialogVisible = ref(false)
const disputeFormRef = ref(null)
const disputeForm = ref({ id: '', reason: '', disputedItems: [] })
const disputeRules = {
  reason: [{ required: true, message: '请填写异议原因', trigger: 'blur' }],
  disputedItems: [{ required: true, message: '请选择争议项', trigger: 'change' }]
}

const resolveDialogVisible = ref(false)
const resolveFormRef = ref(null)
const resolveForm = ref({ id: '', resolution: '' })
const resolveRules = {
  resolution: [{ required: true, message: '请填写解决方案', trigger: 'blur' }]
}

const detailDialogVisible = ref(false)
const currentHandover = ref(null)
const auditTrail = ref([])

const disputedHandovers = computed(() => {
  return handovers.value.filter(h => h.status === 'disputed')
})

const leasableProperties = computed(() => {
  return properties.value.filter(p => p.status === 'leased' || p.status === 'handover_pending')
})

const filteredHandovers = computed(() => {
  let result = [...handovers.value]
  if (filterProperty.value) {
    result = result.filter(h => h.propertyId === filterProperty.value)
  }
  if (filterStatus.value) {
    result = result.filter(h => h.status === filterStatus.value)
  }
  return result.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
})

function statusLabel(s) {
  const m = {
    pending: '待确认', confirmed: '已确认',
    disputed: '争议中', resolved: '已解决'
  }
  return m[s] || s
}

function statusTagType(s) {
  const m = {
    pending: 'warning', confirmed: 'success',
    disputed: 'danger', resolved: 'info'
  }
  return m[s] || 'info'
}

function roleLabel(r) {
  const m = { consultant: '租赁顾问', operations: '运营经理', finance: '财务' }
  return m[r] || r
}

function roleTagType(r) {
  const m = { consultant: '', operations: 'success', finance: 'warning' }
  return m[r] || 'info'
}

function actionLabel(a) {
  const m = { submit: '提交验收', confirm: '确认验收', dispute: '提出异议', resolve: '解决争议' }
  return m[a] || a
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

function getCurrentStep(status) {
  if (status === 'pending') return 0
  if (status === 'confirmed' || status === 'resolved') return 1
  if (status === 'disputed') return 2
  return 0
}

async function loadData() {
  loading.value = true
  try {
    const [handData, propData] = await Promise.all([
      handoverApi.findAll(),
      propertyApi.findAll()
    ])
    handovers.value = handData
    properties.value = propData
    propData.forEach(p => { propertyMap.value[p.id] = p })

    if (route.query.propertyId) {
      filterProperty.value = route.query.propertyId
    }
    if (route.query.id) {
      const target = handData.find(h => h.id === route.query.id)
      if (target) setTimeout(() => viewDetail(target), 300)
    }
  } finally {
    loading.value = false
  }
}

function openSubmitDialog() {
  submitForm.value = {
    propertyId: '',
    checklist: [
      { item: '门窗完好', status: 'na', notes: '' },
      { item: '水电正常', status: 'na', notes: '' },
      { item: '空调设备正常', status: 'na', notes: '' },
      { item: '墙面地面无破损', status: 'na', notes: '' },
      { item: '消防设施完好', status: 'na', notes: '' },
      { item: '网络线路正常', status: 'na', notes: '' },
      { item: '卫生清洁完成', status: 'na', notes: '' },
    ],
    issues: []
  }
  submitDialogVisible.value = true
}

async function submitHandover() {
  if (!submitFormRef.value) return
  await submitFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await handoverApi.submit({
        propertyId: submitForm.value.propertyId,
        checklist: submitForm.value.checklist,
        issues: submitForm.value.issues
      })
      ElMessage.success('交房验收提交成功')
      submitDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

async function confirmHandover(row) {
  try {
    await ElMessageBox.confirm('确认该交房验收通过吗？', '确认验收', {
      type: 'success',
      confirmButtonText: '确认通过',
      cancelButtonText: '取消'
    })
    await handoverApi.confirm(row.id)
    ElMessage.success('验收已确认')
    loadData()
  } catch (e) {}
}

function openDisputeDialog(row) {
  disputeForm.value = { id: row.id, reason: '', disputedItems: [] }
  disputeDialogVisible.value = true
}

async function submitDispute() {
  if (!disputeFormRef.value) return
  await disputeFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await handoverApi.dispute(disputeForm.value.id, {
        reason: disputeForm.value.reason,
        disputedItems: disputeForm.value.disputedItems
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
  resolveForm.value = { id: row.id, resolution: '' }
  resolveDialogVisible.value = true
}

async function submitResolve() {
  if (!resolveFormRef.value) return
  await resolveFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await handoverApi.resolve(resolveForm.value.id, resolveForm.value.resolution)
      ElMessage.success('争议已解决，状态回到待确认')
      resolveDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

async function viewDetail(row) {
  currentHandover.value = row
  try {
    auditTrail.value = await handoverApi.getAuditTrail(row.id)
  } catch (e) {
    auditTrail.value = []
  }
  detailDialogVisible.value = true
}

function goKeyTransfer(row) {
  router.push({ path: '/key-transfers', query: { handoverId: row.id } })
}

onMounted(loadData)
</script>

<style scoped>
.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.prop-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.prop-sub {
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

.checklist-section {
  width: 100%;
}

.checklist-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.checklist-item:last-child {
  border-bottom: none;
}

.checklist-label {
  width: 140px;
  font-size: 14px;
  color: #606266;
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

.detail-prop {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}
</style>
