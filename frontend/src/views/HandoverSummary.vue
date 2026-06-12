<template>
  <div class="page-container" v-loading="loading">
    <div class="summary-header">
      <div class="header-info">
        <h2>交班摘要</h2>
        <div class="meta">
          生成时间：{{ formatDateTime(summary.generated_at) }} |
          当班人员：{{ summary.generated_by || '-' }}
        </div>
      </div>
      <div class="header-actions">
        <el-select v-model="hoursRange" style="width: 180px" @change="loadSummary">
          <el-option label="最近 8 小时" :value="8" />
          <el-option label="最近 24 小时" :value="24" />
          <el-option label="最近 48 小时" :value="48" />
          <el-option label="最近 72 小时" :value="72" />
        </el-select>
        <el-button @click="loadSummary">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Check /></el-icon>
          生成交班单
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card vacant">
        <div class="stat-value">{{ summary.stats.vacant_count || 0 }}</div>
        <div class="stat-label">空置房源</div>
      </div>
      <div class="stat-card viewing">
        <div class="stat-value">{{ summary.stats.today_viewing_count || 0 }}</div>
        <div class="stat-label">今日待带看</div>
      </div>
      <div class="stat-card tomorrow">
        <div class="stat-value">{{ summary.stats.tomorrow_viewing_count || 0 }}</div>
        <div class="stat-label">明日待带看</div>
      </div>
      <div class="stat-card exception">
        <div class="stat-value">{{ summary.stats.pending_exception_count || 0 }}</div>
        <div class="stat-label">待处理异常</div>
      </div>
      <div class="stat-card change">
        <div class="stat-value">{{ summary.stats.recent_change_count || 0 }}</div>
        <div class="stat-label">近期变更</div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="section-header">
              <span><el-icon><Calendar /></el-icon> 今日带看安排</span>
              <el-tag v-if="todayViewings.length === 0" type="success">无待办</el-tag>
            </div>
          </template>
          <div class="section-content">
            <el-empty v-if="todayViewings.length === 0" description="今日无带看安排" :image-size="60" />
            <div v-else class="handover-list">
              <div v-for="v in todayViewings" :key="v.id" class="handover-item viewing-item">
                <div class="item-row">
                  <span class="item-time">{{ formatTime(v.viewing_date) }}</span>
                  <span class="item-customer">{{ v.customer_name }}</span>
                  <span class="item-handler">{{ v.handler_name }}</span>
                </div>
                <div class="item-property">
                  {{ v.property_info?.property_no }} - {{ v.property_info?.building }}
                  {{ v.property_info?.floor }} {{ v.property_info?.room_no }}
                  ({{ v.property_info?.area }}㎡)
                </div>
                <div v-if="v.remarks" class="item-remarks">
                  <el-icon><InfoFilled /></el-icon>
                  {{ v.remarks }}
                </div>
                <div v-if="v.property_info?.remarks" class="item-inherited">
                  <el-icon><Warning /></el-icon>
                  房源备注：{{ v.property_info.remarks }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="section-header">
              <span><el-icon><Warning /></el-icon> 待处理异常</span>
              <el-tag v-if="pendingExceptions.length > 0" type="danger">{{ pendingExceptions.length }}</el-tag>
            </div>
          </template>
          <div class="section-content">
            <el-empty v-if="pendingExceptions.length === 0" description="无待处理异常" :image-size="60" />
            <div v-else class="handover-list">
              <div v-for="e in pendingExceptions" :key="e.id" class="handover-item exception-item">
                <div class="item-row">
                  <el-tag
                    size="small"
                    :type="e.severity === 'high' || e.severity === 'critical' ? 'danger' : e.severity === 'normal' ? 'warning' : 'info'"
                  >
                    {{ e.severity === 'critical' ? '紧急' : e.severity === 'high' ? '高' : e.severity === 'normal' ? '中' : '低' }}
                  </el-tag>
                  <span class="exception-title">{{ e.title }}</span>
                  <status-tag type="exception" :status="e.status" size="small" />
                </div>
                <div class="exception-type">{{ e.exception_type }}</div>
                <div v-if="e.property_info" class="item-related">
                  关联房源：{{ e.property_info.property_no }} - {{ e.property_info.building }}
                </div>
                <div v-if="e.remarks" class="item-remarks">
                  <el-icon><InfoFilled /></el-icon>
                  {{ e.remarks }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <span><el-icon><OfficeBuilding /></el-icon> 空置房源一览</span>
          <span class="section-count">共 {{ vacantProperties.length }} 套</span>
        </div>
      </template>
      <div class="section-content">
        <el-empty v-if="vacantProperties.length === 0" description="无空置房源" :image-size="60" />
        <el-table v-else :data="vacantProperties" style="width: 100%" size="small">
          <el-table-column prop="property_no" label="编号" width="100" />
          <el-table-column label="位置" min-width="180">
            <template #default="{ row }">
              {{ row.building }} {{ row.floor }} {{ row.room_no }}
            </template>
          </el-table-column>
          <el-table-column prop="area" label="面积" width="90">
            <template #default="{ row }">{{ row.area }}㎡</template>
          </el-table-column>
          <el-table-column label="月租" width="100">
            <template #default="{ row }">
              ￥{{ row.monthly_rent?.toLocaleString() || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="vacancy_reason" label="空置原因" width="130" show-overflow-tooltip />
          <el-table-column label="空置天数" width="90">
            <template #default="{ row }">
              <span :class="{ 'long-vacant': row.days_vacant > 30 }">
                {{ row.days_vacant ?? '-' }}天
              </span>
            </template>
          </el-table-column>
          <el-table-column label="预计可租" width="110">
            <template #default="{ row }">
              {{ row.expected_available_date ? formatDate(row.expected_available_date) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="待带看" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.viewing_count > 0" size="small" type="primary">{{ row.viewing_count }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="待异常" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.pending_exception_count > 0" size="small" type="danger">{{ row.pending_exception_count }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="remarks" label="处理备注" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="remark-text">{{ row.remarks || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="handler_name" label="责任人" width="80" />
        </el-table>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <span><el-icon><Clock /></el-icon> 近期变更记录</span>
          <el-select v-model="logFilter" size="small" style="width: 140px">
            <el-option label="全部" value="all" />
            <el-option label="房源变更" value="property" />
            <el-option label="带看变更" value="viewing" />
            <el-option label="异常变更" value="exception" />
          </el-select>
        </div>
      </template>
      <div class="section-content">
        <el-empty v-if="filteredLogs.length === 0" description="无近期变更" :image-size="60" />
        <div v-else class="handover-list log-list">
          <div v-for="log in filteredLogs" :key="log.id" class="handover-item log-item">
            <div class="item-row">
              <el-tag size="small" :type="getLogTagType(log.target_type)">
                {{ getLogTargetText(log.target_type) }}
              </el-tag>
              <span class="log-operation">{{ getOperationText(log.operation_type) }}</span>
              <span class="log-operator">{{ log.operator_name }}</span>
              <span class="log-time">{{ formatDateTime(log.created_at) }}</span>
            </div>
            <div v-if="log.new_value" class="log-value">{{ log.new_value }}</div>
            <div v-if="log.remarks" class="item-remarks">{{ log.remarks }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <span><el-icon><Notebook /></el-icon> 交班记录</span>
        </div>
      </template>
      <div class="section-content">
        <el-empty v-if="records.length === 0" description="暂无交班记录" :image-size="60" />
        <el-table v-else :data="records" style="width: 100%" size="small">
          <el-table-column label="班次时间" min-width="200">
            <template #default="{ row }">
              {{ formatDateTime(row.shift_start) }} ~ {{ formatTime(row.shift_end) }}
            </template>
          </el-table-column>
          <el-table-column label="交班人" width="100">
            <template #default="{ row }">{{ row.outgoing_user_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="接班人" width="100">
            <template #default="{ row }">{{ row.incoming_user_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'confirmed' ? 'success' : row.status === 'submitted' ? 'warning' : 'info'" size="small">
                {{ row.status === 'confirmed' ? '已签收' : row.status === 'submitted' ? '待签收' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="空置" width="60" align="center">
            <template #default="{ row }">{{ row.vacant_count }}</template>
          </el-table-column>
          <el-table-column label="待带看" width="70" align="center">
            <template #default="{ row }">{{ row.pending_viewing_count }}</template>
          </el-table-column>
          <el-table-column label="待异常" width="70" align="center">
            <template #default="{ row }">{{ row.pending_exception_count }}</template>
          </el-table-column>
          <el-table-column prop="outgoing_remarks" label="交班备注" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" text @click="viewRecord(row)">查看</el-button>
              <el-button
                v-if="row.status === 'submitted' && row.outgoing_user_id !== currentUserId"
                size="small"
                type="success"
                text
                @click="confirmRecord(row)"
              >
                签收
              </el-button>
              <el-button size="small" type="primary" text @click="printRecord(row)">打印</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="生成交班单" width="560px" :close-on-click-modal="false">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="班次开始" prop="shift_start">
          <el-date-picker
            v-model="createForm.shift_start"
            type="datetime"
            placeholder="选择班次开始时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="班次结束" prop="shift_end">
          <el-date-picker
            v-model="createForm.shift_end"
            type="datetime"
            placeholder="选择班次结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="交班备注" prop="outgoing_remarks">
          <el-input
            v-model="createForm.outgoing_remarks"
            type="textarea"
            :rows="4"
            placeholder="请输入交班备注，如需接班人特别关注的事项"
          />
        </el-form-item>
        <el-alert
          type="info"
          show-icon
          style="margin-top: 8px"
        >
          <template #title>
            生成后交班记录状态为"待签收"，接班人登录后可签收确认。当前数据快照将被保存到交班记录中，交班后数据变化不影响已保存的交班单。
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">确认生成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="confirmDialogVisible" title="签收交班单" width="480px" :close-on-click-modal="false">
      <div v-if="confirmingRecord" class="confirm-info">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="交班人">{{ confirmingRecord.outgoing_user_name }}</el-descriptions-item>
          <el-descriptions-item label="班次时间">{{ formatDateTime(confirmingRecord.shift_start) }} ~ {{ formatTime(confirmingRecord.shift_end) }}</el-descriptions-item>
          <el-descriptions-item label="空置房源">{{ confirmingRecord.vacant_count }} 套</el-descriptions-item>
          <el-descriptions-item label="待带看">{{ confirmingRecord.pending_viewing_count }} 组</el-descriptions-item>
          <el-descriptions-item label="待处理异常">{{ confirmingRecord.pending_exception_count }} 条</el-descriptions-item>
          <el-descriptions-item label="交班备注">{{ confirmingRecord.outgoing_remarks || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form :model="confirmForm" label-width="100px" style="margin-top: 16px">
        <el-form-item label="签收备注">
          <el-input
            v-model="confirmForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="确认接收或有补充说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="confirming" @click="handleConfirm">确认签收</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="snapshotDialogVisible" title="交班单详情" width="900px">
      <div v-loading="snapshotLoading" class="snapshot-content">
        <template v-if="snapshotData">
          <div class="snapshot-record-info">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="交班人">{{ snapshotData.record_info?.outgoing_user_name }}</el-descriptions-item>
              <el-descriptions-item label="接班人">{{ snapshotData.record_info?.incoming_user_name || '待签收' }}</el-descriptions-item>
              <el-descriptions-item label="班次时间" :span="2">{{ formatDateTime(snapshotData.record_info?.shift_start) }} ~ {{ formatDateTime(snapshotData.record_info?.shift_end) }}</el-descriptions-item>
              <el-descriptions-item label="交班状态">
                <el-tag :type="snapshotData.record_info?.status === 'confirmed' ? 'success' : 'warning'" size="small">
                  {{ snapshotData.record_info?.status === 'confirmed' ? '已签收' : '待签收' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="交班备注">{{ snapshotData.record_info?.outgoing_remarks || '无' }}</el-descriptions-item>
              <el-descriptions-item v-if="snapshotData.record_info?.incoming_remarks" label="签收备注" :span="2">{{ snapshotData.record_info.incoming_remarks }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <el-divider />
          <div class="snapshot-stats-row">
            <div class="snapshot-stat">
              <div class="snapshot-stat-value">{{ snapshotData.stats?.vacant_count || 0 }}</div>
              <div class="snapshot-stat-label">空置</div>
            </div>
            <div class="snapshot-stat">
              <div class="snapshot-stat-value">{{ snapshotData.stats?.today_viewing_count || 0 }}</div>
              <div class="snapshot-stat-label">今日带看</div>
            </div>
            <div class="snapshot-stat">
              <div class="snapshot-stat-value">{{ snapshotData.stats?.tomorrow_viewing_count || 0 }}</div>
              <div class="snapshot-stat-label">明日带看</div>
            </div>
            <div class="snapshot-stat">
              <div class="snapshot-stat-value">{{ snapshotData.stats?.pending_exception_count || 0 }}</div>
              <div class="snapshot-stat-label">待异常</div>
            </div>
          </div>
          <el-tabs v-model="snapshotTab">
            <el-tab-pane label="空置房源" name="vacant">
              <el-table :data="snapshotData.vacant_properties || []" size="small" style="width: 100%">
                <el-table-column prop="property_no" label="编号" width="100" />
                <el-table-column label="位置" min-width="160">
                  <template #default="{ row }">{{ row.building }} {{ row.floor }} {{ row.room_no }}</template>
                </el-table-column>
                <el-table-column prop="area" label="面积" width="80">
                  <template #default="{ row }">{{ row.area }}㎡</template>
                </el-table-column>
                <el-table-column prop="vacancy_reason" label="空置原因" width="120" show-overflow-tooltip />
                <el-table-column prop="remarks" label="处理备注" min-width="200" show-overflow-tooltip />
                <el-table-column prop="handler_name" label="责任人" width="80" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="带看安排" name="viewings">
              <div v-for="v in (snapshotData.pending_viewings || [])" :key="v.id" class="snapshot-viewing-item">
                <div class="item-row">
                  <span class="item-time">{{ formatDateTime(v.viewing_date) }}</span>
                  <span class="item-customer">{{ v.customer_name }}</span>
                  <span class="item-handler">{{ v.handler_name }}</span>
                </div>
                <div v-if="v.property_info" class="item-property">
                  {{ v.property_info.property_no }} - {{ v.property_info.building }} {{ v.property_info.floor }} {{ v.property_info.room_no }}
                </div>
                <div v-if="v.remarks" class="item-remarks">{{ v.remarks }}</div>
              </div>
              <el-empty v-if="(snapshotData.pending_viewings || []).length === 0" description="无带看安排" :image-size="40" />
            </el-tab-pane>
            <el-tab-pane label="待处理异常" name="exceptions">
              <div v-for="e in (snapshotData.pending_exceptions || [])" :key="e.id" class="snapshot-exception-item">
                <div class="item-row">
                  <el-tag size="small" :type="e.severity === 'high' ? 'danger' : 'warning'">{{ e.exception_type }}</el-tag>
                  <span class="exception-title">{{ e.title }}</span>
                </div>
                <div class="exception-desc">{{ e.description }}</div>
              </div>
              <el-empty v-if="(snapshotData.pending_exceptions || []).length === 0" description="无待处理异常" :image-size="40" />
            </el-tab-pane>
          </el-tabs>
        </template>
      </div>
      <template #footer>
        <el-button @click="snapshotDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="printCurrentSnapshot">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Refresh, Check, Calendar, Warning, OfficeBuilding, Clock, InfoFilled, Notebook } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import StatusTag from '@/components/StatusTag.vue'
import { handoverApi } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const loading = ref(false)
const hoursRange = ref(24)
const logFilter = ref('all')

const summary = reactive({
  generated_at: '',
  generated_by: '',
  stats: {
    vacant_count: 0,
    pending_viewing_count: 0,
    pending_exception_count: 0,
    today_viewing_count: 0,
    tomorrow_viewing_count: 0,
    recent_change_count: 0
  },
  today_viewings: [],
  tomorrow_viewings: [],
  vacant_properties: [],
  pending_viewings: [],
  pending_exceptions: [],
  recent_changes: []
})

const records = ref([])

const createDialogVisible = ref(false)
const creating = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  shift_start: '',
  shift_end: '',
  outgoing_remarks: ''
})
const createRules = {
  shift_start: [{ required: true, message: '请选择班次开始时间', trigger: 'change' }],
  shift_end: [{ required: true, message: '请选择班次结束时间', trigger: 'change' }]
}

const confirmDialogVisible = ref(false)
const confirming = ref(false)
const confirmingRecord = ref(null)
const confirmForm = reactive({ remarks: '' })

const snapshotDialogVisible = ref(false)
const snapshotLoading = ref(false)
const snapshotData = ref(null)
const snapshotTab = ref('vacant')

const todayViewings = computed(() => summary.today_viewings || [])
const vacantProperties = computed(() => summary.vacant_properties || [])
const pendingExceptions = computed(() => summary.pending_exceptions || [])

const filteredLogs = computed(() => {
  const logs = summary.recent_changes || []
  if (logFilter.value === 'all') return logs
  return logs.filter(l => l.target_type === logFilter.value)
})

const operationTypeMap = {
  create: '创建',
  update: '更新',
  vacancy_update: '空置处理',
  status_update: '状态变更',
  add_attachment: '添加附件',
  upload_attachment: '上传附件',
  delete_attachment: '删除附件',
  confirm: '签收确认'
}

function getOperationText(type) {
  return operationTypeMap[type] || type
}

function getLogTargetText(type) {
  const map = { property: '房源', viewing: '带看', exception: '异常', handover: '交班' }
  return map[type] || type
}

function getLogTagType(type) {
  const map = { property: 'warning', viewing: 'primary', exception: 'danger', handover: 'success' }
  return map[type] || 'info'
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function formatTime(date) {
  return dayjs(date).format('HH:mm')
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function loadSummary() {
  loading.value = true
  try {
    const data = await handoverApi.getSummary({ hours: hoursRange.value })
    Object.assign(summary, data)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadRecords() {
  try {
    const data = await handoverApi.getRecords({ page_size: 50 })
    records.value = data.items || []
  } catch (e) {
    console.error(e)
  }
}

function openCreateDialog() {
  const now = dayjs()
  createForm.shift_start = now.startOf('day').format('YYYY-MM-DDTHH:mm:ss')
  createForm.shift_end = now.endOf('day').format('YYYY-MM-DDTHH:mm:ss')
  createForm.outgoing_remarks = ''
  createDialogVisible.value = true
}

async function handleCreate() {
  if (!createFormRef.value) return
  await createFormRef.value.validate()
  creating.value = true
  try {
    await handoverApi.createRecord({
      shift_start: new Date(createForm.shift_start).toISOString(),
      shift_end: new Date(createForm.shift_end).toISOString(),
      outgoing_remarks: createForm.outgoing_remarks
    })
    ElMessage.success('交班单已生成，等待接班人签收')
    createDialogVisible.value = false
    await loadRecords()
  } catch (e) {
    console.error(e)
  } finally {
    creating.value = false
  }
}

function confirmRecord(row) {
  confirmingRecord.value = row
  confirmForm.remarks = ''
  confirmDialogVisible.value = true
}

async function handleConfirm() {
  if (!confirmingRecord.value) return
  confirming.value = true
  try {
    await handoverApi.confirmRecord(confirmingRecord.value.id, { remarks: confirmForm.remarks })
    ElMessage.success('交班单签收成功')
    confirmDialogVisible.value = false
    await loadRecords()
  } catch (e) {
    console.error(e)
  } finally {
    confirming.value = false
  }
}

async function viewRecord(row) {
  snapshotDialogVisible.value = true
  snapshotLoading.value = true
  snapshotData.value = null
  snapshotTab.value = 'vacant'
  try {
    const data = await handoverApi.getSnapshot(row.id)
    snapshotData.value = data
  } catch (e) {
    console.error(e)
  } finally {
    snapshotLoading.value = false
  }
}

function printRecord(row) {
  viewRecord(row)
}

function printCurrentSnapshot() {
  if (!snapshotData.value) return
  const info = snapshotData.value.record_info || {}
  const stats = snapshotData.value.stats || {}
  const vacants = snapshotData.value.vacant_properties || []
  const viewings = snapshotData.value.pending_viewings || []
  const exceptions = snapshotData.value.pending_exceptions || []

  let vacantHtml = vacants.map(p =>
    `<div class="print-row">${p.property_no} | ${p.building} ${p.floor} ${p.room_no} | ${p.area}㎡ | 空置${p.days_vacant}天 | 负责人：${p.handler_name || '-'}${p.remarks ? ' | 备注：' + p.remarks : ''}</div>`
  ).join('')

  let viewingHtml = viewings.map(v =>
    `<div class="print-row">${formatDateTime(v.viewing_date)} | ${v.customer_name} | ${v.property_info?.property_no || '-'} | 负责人：${v.handler_name || '-'}${v.remarks ? ' | 备注：' + v.remarks : ''}</div>`
  ).join('')

  let exceptionHtml = exceptions.map(e =>
    `<div class="print-row">[${e.severity === 'high' ? '高' : '中'}] ${e.title} | ${e.exception_type} | 负责人：${e.handler_name || '-'}</div>`
  ).join('')

  const win = window.open('', '_blank')
  win.document.write(`
    <html>
    <head><title>交班单</title>
    <style>
      body { font-family: "Microsoft YaHei", sans-serif; padding: 40px; color: #333; }
      .print-title { font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 8px; }
      .print-meta { text-align: center; color: #666; margin-bottom: 24px; font-size: 14px; }
      .print-section { margin-bottom: 20px; }
      .print-section h3 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
      .print-stats { display: flex; gap: 40px; margin-top: 8px; }
      .print-row { margin: 6px 0; font-size: 13px; line-height: 1.8; }
      .print-signature { margin-top: 60px; }
      .signature-line { margin: 16px 0; font-size: 14px; }
    </style>
    </head>
    <body>
      <div class="print-title">写字楼租赁 · 房源空置与带看安排 · 交班单</div>
      <div class="print-meta">
        交班人：${info.outgoing_user_name || '-'} | 接班人：${info.incoming_user_name || '待签收'} |
        班次：${formatDateTime(info.shift_start)} ~ ${formatDateTime(info.shift_end)}
      </div>
      <div class="print-section">
        <h3>一、当班概要</h3>
        <div class="print-stats">
          <div>空置房源：<strong>${stats.vacant_count || 0}</strong> 套</div>
          <div>今日带看：<strong>${stats.today_viewing_count || 0}</strong> 组</div>
          <div>明日带看：<strong>${stats.tomorrow_viewing_count || 0}</strong> 组</div>
          <div>待处理异常：<strong>${stats.pending_exception_count || 0}</strong> 条</div>
        </div>
      </div>
      ${viewingHtml ? `<div class="print-section"><h3>二、带看安排</h3>${viewingHtml}</div>` : ''}
      ${exceptionHtml ? `<div class="print-section"><h3>三、待处理异常</h3>${exceptionHtml}</div>` : ''}
      ${vacantHtml ? `<div class="print-section"><h3>四、空置房源</h3>${vacantHtml}</div>` : ''}
      ${info.outgoing_remarks ? `<div class="print-section"><h3>交班备注</h3><div>${info.outgoing_remarks}</div></div>` : ''}
      ${info.incoming_remarks ? `<div class="print-section"><h3>签收备注</h3><div>${info.incoming_remarks}</div></div>` : ''}
      <div class="print-signature">
        <div class="signature-line">交班人签字：________________</div>
        <div class="signature-line">接班人签字：________________</div>
        <div class="signature-line">交班时间：________________</div>
      </div>
    </body>
    </html>
  `)
  win.document.close()
  win.print()
}

onMounted(() => {
  loadSummary()
  loadRecords()
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-header {
  background: white;
  padding: 20px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-header h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #303133;
}

.summary-header .meta {
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-row {
  display: flex;
  gap: 16px;
}

.stat-card {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid transparent;
}

.stat-card.vacant { border-left-color: #e6a23c; }
.stat-card.viewing { border-left-color: #409eff; }
.stat-card.tomorrow { border-left-color: #67c23a; }
.stat-card.exception { border-left-color: #f56c6c; }
.stat-card.change { border-left-color: #909399; }

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.stat-card.vacant .stat-value { color: #e6a23c; }
.stat-card.viewing .stat-value { color: #409eff; }
.stat-card.tomorrow .stat-value { color: #67c23a; }
.stat-card.exception .stat-value { color: #f56c6c; }
.stat-card.change .stat-value { color: #909399; }

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.section-card :deep(.el-card__header) {
  padding: 14px 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.section-header span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-count {
  font-weight: 400;
  font-size: 13px;
  color: #909399;
}

.section-content {
  max-height: 360px;
  overflow-y: auto;
}

.handover-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.handover-item {
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #e4e7ed;
}

.handover-item.viewing-item { border-left-color: #409eff; }
.handover-item.exception-item { border-left-color: #f56c6c; }
.handover-item.log-item { border-left-color: #909399; }

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.item-time {
  font-weight: 600;
  color: #409eff;
  min-width: 46px;
}

.item-customer {
  font-weight: 500;
  color: #303133;
}

.item-handler {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.item-property {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.item-remarks {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: #e6a23c;
  line-height: 1.5;
  margin-top: 4px;
}

.item-inherited {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.5;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #e4e7ed;
}

.exception-title {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.exception-type {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.item-related {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.long-vacant {
  color: #f56c6c;
  font-weight: 600;
}

.remark-text {
  color: #e6a23c;
}

.log-operation {
  font-weight: 500;
  color: #303133;
}

.log-operator {
  font-size: 12px;
  color: #909399;
}

.log-time {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.log-value {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.log-list .handover-item {
  padding: 8px 14px;
}

.confirm-info {
  margin-bottom: 16px;
}

.snapshot-stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.snapshot-stat {
  text-align: center;
}

.snapshot-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

.snapshot-stat-label {
  font-size: 12px;
  color: #909399;
}

.snapshot-viewing-item,
.snapshot-exception-item {
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.exception-desc {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}
</style>
