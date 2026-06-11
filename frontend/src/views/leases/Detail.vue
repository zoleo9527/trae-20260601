<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:16px;">
        <el-button :icon="ArrowLeft" text circle @click="$router.back()" />
        <div>
          <div class="page-title">
            租约详情
            <el-tag v-if="lease.liability_flag" type="danger" effect="dark" style="margin-left:10px;">
              ⚠️ {{ lease.liability_desc }}
            </el-tag>
          </div>
          <div style="color:#6b7280;font-size:13px;">
            编号：<b>{{ lease.lease_no }}</b> | 品牌：{{ lease.brand_name }} | 提交：{{ lease.submitted_at || '未提交' }}
          </div>
        </div>
        <el-status-tag :status="lease.status" />
      </div>
      <div>
        <el-button v-if="canEdit" @click="$router.push(`/leases/${id}/edit`)" :icon="Edit">编辑</el-button>
        <el-button v-if="canSubmit" type="warning" @click="handleSubmit" :icon="Promotion">提交审核</el-button>
        <el-button v-if="canConfirm" type="success" @click="handleConfirm" :icon="Check">确认生效</el-button>
        <el-popconfirm v-if="canReject" title="请填写驳回原因" @confirm="openRejectDialog">
          <template #reference>
            <el-button type="danger" :icon="Close">驳回</el-button>
          </template>
        </el-popconfirm>
        <el-dialog v-model="rejectDialog" title="驳回租约" width="500px">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因（招商经理将收到通知）" />
          <template #footer>
            <el-button @click="rejectDialog=false">取消</el-button>
            <el-button type="danger" @click="handleReject">确认驳回</el-button>
          </template>
        </el-dialog>
      </div>
    </div>

    <div v-if="rejectedReason" class="liability-banner">
      <el-icon :size="20" color="#dc2626"><Warning /></el-icon>
      <div><b>驳回原因：</b>{{ rejectedReason }}（请修改后重新提交）</div>
    </div>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card>
          <template #header><b>📄 租约基本信息</b></template>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="租约编号">{{ lease.lease_no }}</el-descriptions-item>
            <el-descriptions-item label="品牌名称">{{ lease.brand_name }}</el-descriptions-item>
            <el-descriptions-item label="品牌ID">{{ lease.brand_id }}</el-descriptions-item>
            <el-descriptions-item label="铺位">{{ lease.store_code || '-' }}</el-descriptions-item>
            <el-descriptions-item label="楼层">{{ lease.floor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="面积(㎡)">{{ lease.area || '-' }}</el-descriptions-item>
            <el-descriptions-item label="起租日期">{{ lease.start_date }}</el-descriptions-item>
            <el-descriptions-item label="到期日期">{{ lease.end_date }}</el-descriptions-item>
            <el-descriptions-item label="缴费方式">{{ lease.payment_method || '-' }}</el-descriptions-item>
            <el-descriptions-item label="基础租金(元/月)">{{ lease.base_rent || '-' }}</el-descriptions-item>
            <el-descriptions-item label="有特殊条款">
              <el-tag v-if="lease.has_special_clause" type="warning" size="small">是（请检查扣点规则）</el-tag>
              <span v-else>否</span>
            </el-descriptions-item>
            <el-descriptions-item label="提交人">{{ lease.submitter_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="确认人" :span="2">{{ lease.confirmer_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="合同摘要" :span="3">
              <div style="white-space:pre-wrap;">{{ lease.contract_content || '-' }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top:16px;">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <b>💰 扣点规则管理
                <el-tag v-if="currentRule?.liability_flag" type="danger" effect="dark" size="small" style="margin-left:8px;">
                  ⚠️ {{ currentRule?.liability_desc }}
                </el-tag>
              </b>
              <div>
                <el-select v-model="showRuleVersion" size="small" style="width:140px;margin-right:8px;" @change="loadVersionDetail">
                  <el-option v-for="r in deductionHistory" :key="r.version" :label="'v' + r.version + ' - ' + r.status" :value="r.version" />
                </el-select>
                <el-button v-if="canEditDeduction" size="small" @click="openDeductionDialog">
                  {{ deductionHistory.length === 0 ? '录入扣点' : '更新扣点规则' }}
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="deductionHistory.length === 0" style="padding:40px;text-align:center;color:#9ca3af;">
            <el-empty description="扣点规则尚未录入，招商经理请先录入扣点规则">
              <el-button v-if="canEditDeduction" type="primary" size="small" @click="openDeductionDialog">立即录入</el-button>
            </el-empty>
          </div>

          <div v-else>
            <div v-if="currentRule?.liability_flag" class="liability-banner">
              <el-icon :size="20"><Warning /></el-icon>
              <div>
                <b>【责任不清】</b>
                <span style="margin-right:12px;">{{ currentRule.liability_desc }}</span>
                <span v-if="currentRule.liability_reason" style="color:#6b7280;">（{{ currentRule.liability_reason }}）</span>
                <span style="color:#6b7280;margin-left:12px;">
                  标记人：{{ currentRule.liability_marker_name || '-' }} · {{ currentRule.liability_marked_at || '-' }}
                </span>
              </div>
              <div style="margin-left:auto;">
                <el-button v-if="canMarkLiability" size="small" type="warning" @click="openMarkDialog">修改标记</el-button>
                <el-button v-if="canMarkLiability" size="small" type="success" @click="openClearDialog">清除标记</el-button>
              </div>
            </div>

            <el-descriptions :column="2" border size="small" style="margin-top:8px;">
              <el-descriptions-item label="版本">v{{ currentRule?.version }} / 状态 <el-status-tag :status="currentRule?.status" /></el-descriptions-item>
              <el-descriptions-item label="录入/确认">
                {{ currentRule?.creator_name || '-' }} / {{ currentRule?.confirmer_name || '未确认' }}
              </el-descriptions-item>
              <el-descriptions-item label="基础扣点率">
                <span class="rate-num">{{ currentRule?.base_rate }}%</span>
              </el-descriptions-item>
              <el-descriptions-item label="促销活动扣点率">
                <span class="rate-num">{{ currentRule?.promotion_rate }}%</span>
              </el-descriptions-item>
              <el-descriptions-item label="生效期">{{ currentRule?.effective_start || '-' }} ～ {{ currentRule?.effective_end || '-' }}</el-descriptions-item>
              <el-descriptions-item label="确认时间">{{ currentRule?.confirmed_at || '-' }}</el-descriptions-item>
              <el-descriptions-item label="特殊条款" :span="2">
                <div v-if="currentRule?.special_clause" style="white-space:pre-wrap;">{{ currentRule.special_clause }}</div>
                <span v-else-if="lease.has_special_clause" style="color:#ef4444;">⚠️ 合同约定有特殊条款，但此处为空！</span>
                <span v-else style="color:#9ca3af;">无</span>
              </el-descriptions-item>
            </el-descriptions>

            <div style="display:flex;gap:10px;margin-top:12px;">
              <el-button v-if="canConfirmDeduction && currentRule?.status !== 'CONFIRMED'" type="success" @click="handleConfirmDeduction">
                确认扣点规则
              </el-button>
              <el-button v-if="canMarkLiability && !currentRule?.liability_flag" type="warning" @click="openMarkDialog">
                标记责任不清
              </el-button>
            </div>

            <el-divider content-position="left">📜 版本历史（回看）</el-divider>
            <el-table :data="deductionHistory" size="small" border>
              <el-table-column label="版本" width="80">
                <template #default="{ row }">
                  <b>v{{ row.version }}</b>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }"><el-status-tag :status="row.status" /></template>
              </el-table-column>
              <el-table-column label="基础扣点" prop="base_rate" width="100">
                <template #default="{ row }">{{ row.base_rate }}%</template>
              </el-table-column>
              <el-table-column label="活动扣点" prop="promotion_rate" width="100">
                <template #default="{ row }">{{ row.promotion_rate }}%</template>
              </el-table-column>
              <el-table-column label="责任标记" width="180">
                <template #default="{ row }">
                  <el-tag v-if="row.liability_flag" type="danger" size="small">{{ row.liability_desc }}</el-tag>
                  <span v-else>无</span>
                </template>
              </el-table-column>
              <el-table-column label="录入人" prop="creator_name" width="100" />
              <el-table-column label="确认人" prop="confirmer_name" width="100" />
              <el-table-column label="确认时间" prop="confirmed_at" width="160" />
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><b>📌 交接进度（主管追问版）</b></template>
          <el-steps direction="vertical" :active="progressStep" finish-status="success">
            <el-step title="1. 招商经理创建租约" :description="lease.submitter_name ? lease.submitter_name + ' 已创建' : '待创建'">
              <template #extra><small>{{ lease.created_at || '-' }}</small></template>
            </el-step>
            <el-step title="2. 招商经理录入扣点规则" :description="deductionHistory.length > 0 ? '已录入 v' + (currentRule?.version||1) : '⚠️ 未录入'">
              <template #extra v-if="currentRule?.version"><small>版本 v{{ currentRule.version }}</small></template>
            </el-step>
            <el-step title="3. 招商经理提交审核" :description="lease.status !== 'DRAFT' ? '已提交' : '待提交'">
              <template #extra><small>{{ lease.submitted_at || '-' }}</small></template>
            </el-step>
            <el-step :title="currentRule?.liability_flag ? '4. ⚠️ 处理责任不清' : '4. 营运督导确认扣点'" :description="liabilityStepDesc">
              <template #extra><small style="color:#ef4444;" v-if="currentRule?.liability_flag">待处理</small></template>
            </el-step>
            <el-step title="5. 租约生效" :description="lease.status === 'ACTIVE' ? '已生效' : '待确认'">
              <template #extra><small>{{ lease.activated_at || '-' }}</small></template>
            </el-step>
          </el-steps>
        </el-card>

        <el-card style="margin-top:16px;">
          <template #header><b>📝 操作留痕日志</b></template>
          <el-timeline class="log-timeline">
            <el-timeline-item
              v-for="log in lease.operation_logs || []"
              :key="log.id"
              :timestamp="log.created_at"
              :type="logTypeColor(log.action)"
              placement="top"
            >
              <div style="font-size:13px;">
                <b>{{ actionText(log.action) }}</b>
                <span style="color:#6b7280;margin-left:8px;">
                  {{ log.operator_name }}（{{ roleText(log.operator_role) }}）
                </span>
              </div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;" v-if="log.from_status || log.to_status">
                状态流转：<el-status-tag :status="log.from_status" /> → <el-status-tag :status="log.to_status" />
              </div>
              <div v-if="log.action_detail" class="log-detail">
                <pre style="margin:4px 0 0;font-size:11px;background:#f9fafb;padding:6px;border-radius:4px;white-space:pre-wrap;word-break:break-all;">{{ formatDetail(log.action_detail) }}</pre>
              </div>
            </el-timeline-item>
            <div v-if="!lease.operation_logs?.length" style="color:#9ca3af;text-align:center;padding:20px;">暂无日志</div>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="deductionDialog" :title="currentRule ? '更新扣点规则 (新版本)' : '录入扣点规则'" width="600px">
      <el-form :model="dForm" label-width="110px">
        <el-form-item label="基础扣点率(%)" required>
          <el-input-number v-model="dForm.base_rate" :min="0" :max="100" style="width:100%;" />
        </el-form-item>
        <el-form-item label="活动扣点率(%)" required>
          <el-input-number v-model="dForm.promotion_rate" :min="0" :max="100" style="width:100%;" />
        </el-form-item>
        <el-form-item label="生效起止日期">
          <el-date-picker v-model="dForm.dateRange" type="daterange" value-format="YYYY-MM-DD"
            start-placeholder="开始" end-placeholder="结束" style="width:100%;" />
        </el-form-item>
        <el-form-item label="特殊条款">
          <el-input v-model="dForm.special_clause" type="textarea" :rows="3"
            :placeholder="lease.has_special_clause ? '⚠️ 合同约定有特殊条款，请务必填写！' : '如有阶梯扣点、附加条件等请填写'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deductionDialog=false">取消</el-button>
        <el-button type="primary" @click="saveDeduction">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="markDialog" title="标记责任不清项" width="500px">
      <el-form label-width="120px">
        <el-form-item label="标记类型" required>
          <el-select v-model="markForm.flag" style="width:100%;">
            <el-option label="扣点比例异常 (>50%)" value="RATE_ABNORMAL" />
            <el-option label="特殊条款缺失 (合同有但此处空)" value="SPECIAL_CLAUSE_MISSING" />
            <el-option label="生效期与租约日期不一致" value="DATE_MISMATCH" />
            <el-option label="其他 (人工标记)" value="MANUAL_MARKED" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明 (必填)">
          <el-input v-model="markForm.reason" type="textarea" :rows="3" placeholder="请描述具体责任不清点，招商经理将收到通知" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="markDialog=false">取消</el-button>
        <el-button type="warning" @click="handleMarkLiability">确认标记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="clearDialog" title="清除责任标记" width="500px">
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom:16px;">
        清除后租约才能继续流转到生效。请务必填写确认说明，用于主管审计。
      </el-alert>
      <el-form label-width="110px">
        <el-form-item label="清除说明" required>
          <el-input v-model="clearReason" type="textarea" :rows="3" placeholder="说明已处理的方式，如：双方电话沟通、已补签协议等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="clearDialog=false">取消</el-button>
        <el-button type="success" @click="handleClearLiability">确认清除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Edit, Promotion, Check, Close, Warning,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getLeaseDetail, submitLease, confirmLease, rejectLease,
  getDeductionHistory, getDeductionVersion, createDeduction, updateDeduction,
  confirmDeduction, markLiability, clearLiability,
} from '@/api'

const route = useRoute()
const userStore = useUserStore()
const id = route.params.id
const loading = ref(false)
const lease = ref({ operation_logs: [] })
const deductionHistory = ref([])
const currentRule = ref(null)
const showRuleVersion = ref(null)

const rejectDialog = ref(false)
const rejectReason = ref('')
const deductionDialog = ref(false)
const dForm = reactive({ base_rate: 15, promotion_rate: 25, dateRange: [], special_clause: '' })
const markDialog = ref(false)
const markForm = reactive({ flag: '', reason: '' })
const clearDialog = ref(false)
const clearReason = ref('')

const rejectedReason = computed(() => lease.value.status === 'REJECTED' ? lease.value.rejected_reason : '')
const canEdit = computed(() => userStore.isMerchandise && lease.value.submitter_id === userStore.userInfo.id && ['DRAFT', 'REJECTED'].includes(lease.value.status))
const canSubmit = computed(() => canEdit.value)
const canConfirm = computed(() => userStore.canConfirm && lease.value.status === 'PENDING')
const canReject = computed(() => userStore.canConfirm && lease.value.status === 'PENDING')
const canEditDeduction = computed(() => userStore.isMerchandise && lease.value.submitter_id === userStore.userInfo.id && lease.value.status !== 'ACTIVE')
const canConfirmDeduction = computed(() => userStore.canConfirm && currentRule.value && currentRule.value.status !== 'CONFIRMED')
const canMarkLiability = computed(() => userStore.canConfirm)

const progressStep = computed(() => {
  let s = 0
  if (lease.value.submitter_id) s = 1
  if (deductionHistory.value.length > 0) s = 2
  if (lease.value.status !== 'DRAFT') s = 3
  if (s === 3 && !currentRule.value?.liability_flag && currentRule.value?.status === 'CONFIRMED') s = 4
  if (lease.value.status === 'ACTIVE') s = 5
  return s
})

const liabilityStepDesc = computed(() => {
  if (currentRule.value?.liability_flag) return '存在 ' + currentRule.value.liability_desc
  if (currentRule.value?.status === 'CONFIRMED') return '已确认'
  return '待确认扣点'
})

const roleText = (r) => ({
  ROLE_MERCHANDISE_MANAGER: '招商经理', ROLE_OPERATION_SUPERVISOR: '营运督导',
  ROLE_STORE_MANAGER: '品牌店长', ROLE_SUPERVISOR: '主管', SYSTEM: '系统',
}[r] || r)
const actionText = (a) => ({
  LEASE_CREATE: '创建租约', LEASE_EDIT: '编辑租约', LEASE_SUBMIT: '提交租约审核',
  LEASE_CONFIRM: '确认租约生效', LEASE_REJECT: '驳回租约',
  DEDUCTION_CREATE: '创建扣点规则', DEDUCTION_EDIT: '修改扣点规则',
  DEDUCTION_CONFIRM: '确认扣点规则', DEDUCTION_MARK_LIABILITY: '标记责任不清',
  DEDUCTION_CLEAR_LIABILITY: '清除责任标记', EXPORT_CREATE: '创建导出任务',
  EXPORT_COMPLETE: '导出任务完成',
}[a] || a)
const logTypeColor = (a) => {
  if (a.includes('CONFIRM')) return 'success'
  if (a.includes('REJECT') || a.includes('LIABILITY')) return 'danger'
  if (a.includes('SUBMIT') || a.includes('CREATE')) return 'warning'
  return 'primary'
}
const formatDetail = (d) => {
  if (typeof d === 'string') { try { d = JSON.parse(d) } catch (e) { return d } }
  return JSON.stringify(d, null, 2)
}

const loadAll = async () => {
  loading.value = true
  try {
    const res = await getLeaseDetail(id)
    lease.value = res.data
    const res2 = await getDeductionHistory(id)
    deductionHistory.value = res2.data
    currentRule.value = res2.data[0] || null
    showRuleVersion.value = currentRule.value?.version || null
  } finally {
    loading.value = false
  }
}

const loadVersionDetail = async (v) => {
  const res = await getDeductionVersion(id, v)
  currentRule.value = res.data
}

const handleSubmit = async () => {
  await ElMessageBox.confirm('确认提交租约和扣点规则给营运督导审核？', '提示', { type: 'warning' })
  await submitLease(id)
  ElMessage.success('已提交，已通知营运督导')
  loadAll()
}

const handleConfirm = async () => {
  await ElMessageBox.confirm('确认租约生效？确认后将通知招商经理。', '最终确认', { type: 'success' })
  await confirmLease(id)
  ElMessage.success('租约已生效')
  loadAll()
}

const openRejectDialog = () => { rejectDialog.value = true }
const handleReject = async () => {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  await rejectLease(id, { reason: rejectReason.value })
  rejectDialog.value = false
  ElMessage.success('已驳回并通知招商经理')
  loadAll()
}

const openDeductionDialog = () => {
  if (currentRule.value) {
    dForm.base_rate = currentRule.value.base_rate
    dForm.promotion_rate = currentRule.value.promotion_rate
    dForm.special_clause = currentRule.value.special_clause || ''
    dForm.dateRange = currentRule.value.effective_start ? [currentRule.value.effective_start, currentRule.value.effective_end] : []
  } else {
    dForm.dateRange = [lease.value.start_date, lease.value.end_date]
  }
  deductionDialog.value = true
}
const saveDeduction = async () => {
  const payload = {
    lease_id: id,
    base_rate: dForm.base_rate,
    promotion_rate: dForm.promotion_rate,
    special_clause: dForm.special_clause,
    effective_start: dForm.dateRange?.[0] || '',
    effective_end: dForm.dateRange?.[1] || '',
  }
  if (currentRule.value && currentRule.value.status !== 'CONFIRMED' && deductionHistory.value.length === 1) {
    await updateDeduction(currentRule.value.id, payload)
  } else {
    await createDeduction(payload)
  }
  deductionDialog.value = false
  ElMessage.success('扣点规则已保存')
  loadAll()
}

const handleConfirmDeduction = async () => {
  await ElMessageBox.confirm('确认扣点规则？确认后不可编辑，将版本化保存。', '确认扣点', { type: 'success' })
  await confirmDeduction(currentRule.value.id)
  ElMessage.success('扣点规则已确认')
  loadAll()
}

const openMarkDialog = () => { markForm.flag = 'MANUAL_MARKED'; markForm.reason = ''; markDialog.value = true }
const handleMarkLiability = async () => {
  if (!markForm.flag || !markForm.reason.trim()) { ElMessage.warning('类型和说明均必填'); return }
  await markLiability(currentRule.value.id, { liability_flag: markForm.flag, liability_reason: markForm.reason })
  markDialog.value = false
  ElMessage.success('已标记，通知已发送')
  loadAll()
}

const openClearDialog = () => { clearReason.value = ''; clearDialog.value = true }
const handleClearLiability = async () => {
  if (!clearReason.value.trim()) { ElMessage.warning('请填写说明'); return }
  await clearLiability(currentRule.value.id, { clear_reason: clearReason.value })
  clearDialog.value = false
  ElMessage.success('责任标记已清除')
  loadAll()
}

onMounted(loadAll)
</script>

<style scoped>
.rate-num { font-size: 18px; font-weight: 700; color: #4338ca; }
.log-detail :deep(pre) { max-height: 120px; overflow: auto; }
</style>
