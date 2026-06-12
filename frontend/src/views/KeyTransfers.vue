<template>
  <div class="page-container">
    <div class="warning-highlight" v-if="pendingTransfers.length > 0">
      <div class="alert-header">
        <el-icon size="18" color="#e6a23c"><Key /></el-icon>
        <strong>钥匙待接收提醒</strong>
        <span style="margin-left: 8px; font-size: 13px; color: #909399">
          共 {{ pendingTransfers.length }} 笔钥匙移交待运营经理确认接收
        </span>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">钥匙移交与回看</div>

      <div class="action-bar">
        <el-button
          v-if="authStore.userRole === 'consultant'"
          type="primary"
          :icon="Plus"
          @click="openInitiateDialog"
        >
          发起钥匙移交
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
          <el-option label="待接收" value="pending_transfer" />
          <el-option label="已移交" value="transferred" />
          <el-option label="已归还" value="returned" />
        </el-select>
        <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
      </div>

      <el-table :data="filteredTransfers" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="房源" width="220">
          <template #default="{ row }">
            <span v-if="propertyMap[row.propertyId]">
              <div class="prop-name">
                <el-icon color="#409eff"><OfficeBuilding /></el-icon>
                <strong>{{ propertyMap[row.propertyId].building }}</strong>
              </div>
              <div class="prop-sub">
                {{ propertyMap[row.propertyId].floor }}层{{ propertyMap[row.propertyId].unit }}
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
        <el-table-column label="钥匙信息" width="180">
          <template #default="{ row }">
            <div>
              <span>共 <strong>{{ row.keyCount }}</strong> 把</span>
              <div style="margin-top: 4px">
                <el-tag
                  v-for="(t, idx) in row.keyTypes.slice(0, 2)"
                  :key="idx"
                  size="small"
                  type="info"
                  style="margin-right: 4px"
                >
                  {{ t }}
                </el-tag>
                <span v-if="row.keyTypes.length > 2" style="font-size: 12px; color: #909399">
                  +{{ row.keyTypes.length - 2 }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="移交人" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.transferredByName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="移交时间" width="180">
          <template #default="{ row }">{{ formatTime(row.transferredAt) }}</template>
        </el-table-column>
        <el-table-column label="接收人" width="100">
          <template #default="{ row }">
            <span v-if="row.receivedByName">
              <el-tag size="small" type="success">{{ row.receivedByName }}</el-tag>
            </span>
            <span v-else style="color: #c0c4cc">待接收</span>
          </template>
        </el-table-column>
        <el-table-column label="接收时间" width="180">
          <template #default="{ row }">
            <span v-if="row.receivedAt">{{ formatTime(row.receivedAt) }}</span>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewTimeline(row)">时间线</el-button>
            <el-button size="small" type="info" link @click="viewHistory(row)">审计</el-button>
            <el-button
              v-if="row.status === 'pending_transfer' && authStore.userRole === 'operations'"
              size="small"
              type="success"
              link
              @click="confirmReception(row)"
            >
              确认接收
            </el-button>
            <el-button
              v-if="row.status === 'transferred' && authStore.userRole === 'operations'"
              size="small"
              type="warning"
              link
              @click="openReturnDialog(row)"
            >
              归还
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="initiateDialogVisible" title="发起钥匙移交" width="600px">
      <el-alert
        title="前置条件：交房验收必须已确认通过"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />
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
              :label="`${p.building} ${p.floor}层${p.unit}`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="交房验收" prop="handoverId">
          <el-select v-model="initiateForm.handoverId" placeholder="请选择已确认的交房验收" style="width: 100%">
            <el-option
              v-for="h in confirmedHandovers"
              :key="h.id"
              :label="`提交人: ${h.submittedByName} · ${formatTime(h.submittedAt)}`"
              :value="h.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="钥匙数量" prop="keyCount">
          <el-input-number v-model="initiateForm.keyCount" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="钥匙类型" prop="keyTypes">
          <el-select
            v-model="initiateForm.keyTypes"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入钥匙类型"
            style="width: 100%"
          >
            <el-option label="大门钥匙" value="大门钥匙" />
            <el-option label="门禁卡" value="门禁卡" />
            <el-option label="空调控制面板" value="空调控制面板" />
            <el-option label="水电表钥匙" value="水电表钥匙" />
            <el-option label="消防通道钥匙" value="消防通道钥匙" />
            <el-option label="保险柜钥匙" value="保险柜钥匙" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="initiateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitInitiate">发起移交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="归还钥匙" width="500px">
      <el-form :model="returnForm" ref="returnFormRef" label-width="100px">
        <el-form-item label="归还备注">
          <el-input
            v-model="returnForm.returnNotes"
            type="textarea"
            :rows="3"
            placeholder="请填写归还时的情况说明（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReturn">确认归还</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="timelineDialogVisible" title="钥匙移交时间线" width="700px">
      <div v-if="timelineData">
        <div class="timeline-header">
          <div class="timeline-prop">
            <el-icon size="20" color="#409eff"><Key /></el-icon>
            <span v-if="propertyMap[timelineData.propertyId]">
              <strong>{{ propertyMap[timelineData.propertyId].building }} {{ propertyMap[timelineData.propertyId].floor }}层{{ propertyMap[timelineData.propertyId].unit }}</strong>
            </span>
            <span v-else>{{ timelineData.propertyId }}</span>
          </div>
          <el-tag :type="statusTagType(timelineData.currentStatus)" size="large">
            {{ statusLabel(timelineData.currentStatus) }}
          </el-tag>
        </div>

        <div class="timeline-summary">
          <div class="summary-item">
            <div class="summary-label">钥匙数量</div>
            <div class="summary-value">{{ timelineData.keyCount }} 把</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">钥匙类型</div>
            <div class="summary-value">{{ timelineData.keyTypes?.join('、') }}</div>
          </div>
        </div>

        <el-timeline style="margin-top: 20px">
          <el-timeline-item
            v-for="(item, idx) in timelineData.timeline"
            :key="idx"
            :timestamp="item.timestamp ? formatTime(item.timestamp) : '待处理'"
            :type="item.status === 'pending' ? 'warning' : (item.status === 'completed' ? 'primary' : '')"
            :hollow="item.status === 'pending'"
          >
            <div class="timeline-item-content">
              <div class="timeline-event">
                <strong>{{ item.event }}</strong>
                <el-tag
                  v-if="!item.fromAudit"
                  size="small"
                  :type="item.status === 'pending' ? 'warning' : 'success'"
                  style="margin-left: 8px"
                >
                  {{ item.status === 'pending' ? '待处理' : '已完成' }}
                </el-tag>
                <el-tag v-else size="small" type="info" style="margin-left: 8px">审计记录</el-tag>
              </div>
              <div class="timeline-operator">
                <span v-if="item.operator">
                  <el-tag :type="roleTagType(item.operatorRole)" size="small">
                    {{ roleLabel(item.operatorRole) }}
                  </el-tag>
                  {{ item.operator }}
                </span>
                <span v-else style="color: #909399">待{{ roleLabel(item.operatorRole) }}处理</span>
              </div>
              <div v-if="item.details" class="timeline-details">
                <template v-if="typeof item.details === 'object'">
                  <div v-for="(v, k) in item.details" :key="k" class="detail-row">
                    <span class="detail-key">{{ detailLabel(k) }}:</span>
                    <span class="detail-value">{{ formatDetailValue(k, v) }}</span>
                  </div>
                </template>
                <template v-else>
                  {{ item.details }}
                </template>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="审计历史" width="600px">
      <div class="audit-trail">
        <div v-if="!transferHistory.length" class="empty-state">暂无审计记录</div>
        <div v-for="(log, idx) in transferHistory" :key="idx" class="audit-item">
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
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Key, OfficeBuilding } from '@element-plus/icons-vue'
import { keyTransferApi, propertyApi, handoverApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const transfers = ref([])
const properties = ref([])
const propertyMap = ref({})
const confirmedHandovers = ref([])
const filterProperty = ref('')
const filterStatus = ref('')

const initiateDialogVisible = ref(false)
const initiateFormRef = ref(null)
const initiateForm = ref({
  propertyId: '',
  handoverId: '',
  keyCount: 1,
  keyTypes: []
})
const initiateRules = {
  propertyId: [{ required: true, message: '请选择房源', trigger: 'change' }],
  handoverId: [{ required: true, message: '请选择交房验收', trigger: 'change' }],
  keyCount: [{ required: true, message: '请输入钥匙数量', trigger: 'blur' }],
  keyTypes: [{ required: true, message: '请选择钥匙类型', trigger: 'change' }]
}

const returnDialogVisible = ref(false)
const returnForm = ref({ id: '', returnNotes: '' })

const timelineDialogVisible = ref(false)
const timelineData = ref(null)

const historyDialogVisible = ref(false)
const transferHistory = ref([])

const pendingTransfers = computed(() => {
  return transfers.value.filter(t => t.status === 'pending_transfer')
})

const filteredTransfers = computed(() => {
  let result = [...transfers.value]
  if (filterProperty.value) {
    result = result.filter(t => t.propertyId === filterProperty.value)
  }
  if (filterStatus.value) {
    result = result.filter(t => t.status === filterStatus.value)
  }
  return result.sort((a, b) => new Date(b.transferredAt) - new Date(a.transferredAt))
})

function statusLabel(s) {
  const m = {
    pending_transfer: '待接收', transferred: '已移交', returned: '已归还'
  }
  return m[s] || s
}

function statusTagType(s) {
  const m = {
    pending_transfer: 'warning', transferred: 'success', returned: 'info'
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
  const m = {
    initiate_transfer: '发起移交', confirm_reception: '确认接收', return_keys: '归还钥匙'
  }
  return m[a] || a
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

function detailLabel(k) {
  const m = {
    keyCount: '钥匙数量', keyTypes: '钥匙类型',
    propertyStatusUpdated: '房源状态更新为', expectedAction: '下一步',
    returnNotes: '归还备注'
  }
  return m[k] || k
}

function formatDetailValue(k, v) {
  if (k === 'keyTypes' && Array.isArray(v)) return v.join('、')
  if (k === 'propertyStatusUpdated') {
    const m = { occupied: '已入驻', returning: '退租中' }
    return m[v] || v
  }
  return v
}

async function loadData() {
  loading.value = true
  try {
    const [transferData, propData, handoverData] = await Promise.all([
      keyTransferApi.findAll(),
      propertyApi.findAll(),
      handoverApi.findAll({ status: 'confirmed' })
    ])
    transfers.value = transferData
    properties.value = propData
    confirmedHandovers.value = handoverData
    propData.forEach(p => { propertyMap.value[p.id] = p })

    if (route.query.propertyId) {
      filterProperty.value = route.query.propertyId
    }
    if (route.query.handoverId) {
      const target = transferData.find(t => t.handoverId === route.query.handoverId)
      if (target) setTimeout(() => viewTimeline(target), 300)
    }
  } finally {
    loading.value = false
  }
}

async function onPropertyChange() {
  if (initiateForm.value.propertyId) {
    try {
      confirmedHandovers.value = await handoverApi.findAll({
        status: 'confirmed',
        propertyId: initiateForm.value.propertyId
      })
    } catch (e) {
      confirmedHandovers.value = []
    }
  } else {
    confirmedHandovers.value = []
  }
  initiateForm.value.handoverId = ''
}

function openInitiateDialog() {
  initiateForm.value = {
    propertyId: '',
    handoverId: '',
    keyCount: 1,
    keyTypes: []
  }
  initiateDialogVisible.value = true
}

async function submitInitiate() {
  if (!initiateFormRef.value) return
  await initiateFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await keyTransferApi.initiateTransfer({
        propertyId: initiateForm.value.propertyId,
        handoverId: initiateForm.value.handoverId,
        keyCount: initiateForm.value.keyCount,
        keyTypes: initiateForm.value.keyTypes
      })
      ElMessage.success('钥匙移交已发起，待运营经理确认接收')
      initiateDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

async function confirmReception(row) {
  try {
    await ElMessageBox.confirm(
      '确认已收到全部钥匙吗？确认后房源状态将更新为「已入驻」',
      '确认接收',
      { type: 'success', confirmButtonText: '确认接收', cancelButtonText: '取消' }
    )
    await keyTransferApi.confirmReception(row.id)
    ElMessage.success('钥匙已确认接收')
    loadData()
  } catch (e) {}
}

function openReturnDialog(row) {
  returnForm.value = { id: row.id, returnNotes: '' }
  returnDialogVisible.value = true
}

async function submitReturn() {
  submitting.value = true
  try {
    await keyTransferApi.returnKeys(returnForm.value.id, {
      returnNotes: returnForm.value.returnNotes
    })
    ElMessage.success('钥匙已归还')
    returnDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function viewTimeline(row) {
  try {
    timelineData.value = await keyTransferApi.getTransferTimeline(row.id)
    timelineDialogVisible.value = true
  } catch (e) {}
}

async function viewHistory(row) {
  try {
    transferHistory.value = await keyTransferApi.getTransferHistory(row.id)
    historyDialogVisible.value = true
  } catch (e) {
    transferHistory.value = []
  }
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

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.timeline-prop {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.timeline-summary {
  display: flex;
  gap: 40px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.summary-item {
  text-align: left;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.timeline-item-content {
  padding: 8px 0;
}

.timeline-event {
  font-size: 14px;
  margin-bottom: 4px;
}

.timeline-operator {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.timeline-details {
  background: #f5f7fa;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.detail-row {
  display: flex;
  gap: 8px;
  line-height: 1.8;
}

.detail-key {
  color: #909399;
  min-width: 90px;
}

.detail-value {
  color: #606266;
  flex: 1;
}
</style>
