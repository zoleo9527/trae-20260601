<template>
  <div class="page-container">
    <div class="workbench-header">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="workbench-title">
            <el-icon style="color:#409eff;margin-right:8px;"><Operation /></el-icon>
            商场运营 · 客诉登记与租户回访工作台
          </div>
          <div class="workbench-subtitle">
            当前登录：{{ store.currentUser.name }}（{{ store.currentUser.role }}） · 处理时效管理 · 一线处理与管理回看数据同源
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <el-button type="primary" @click="activeTab = 'pending'">
            <el-icon><List /></el-icon>待处理工作台
          </el-button>
          <el-button @click="$router.push('/service/tenant-visit')">
            <el-icon><User /></el-icon>租户回访管理
          </el-button>
        </div>
      </div>
    </div>

    <div style="padding:16px 24px 0;">
      <el-row :gutter="12">
        <el-col :span="4">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid #e6a23c;">
            <div class="stat-card-label">待处理总数</div>
            <div class="stat-card-value warning">{{ store.pendingCount }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid #f56c6c;">
            <div class="stat-card-label">已超时</div>
            <div class="stat-card-value danger">{{ store.overdueCount }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid #9b59b6;">
            <div class="stat-card-label">判定中</div>
            <div class="stat-card-value" style="color:#9b59b6;">{{ store.judgingCount }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid #409eff;">
            <div class="stat-card-label">回访中</div>
            <div class="stat-card-value info">{{ store.visitingCount }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid #67c23a;">
            <div class="stat-card-label">今日登记</div>
            <div class="stat-card-value success">{{ store.todayRegisteredCount }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid #606266;">
            <div class="stat-card-label">总数</div>
            <div class="stat-card-value">{{ store.complaints.length }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="workbench-body">
      <div class="workbench-main">
        <div class="section-header">
          <div class="section-title">
            <el-icon><Tickets /></el-icon>
            客诉登记待处理列表
            <el-tag size="small" type="info" style="margin-left:8px;">共 {{ filteredComplaints.length }} 条</el-tag>
          </div>
          <div>
            <el-button size="small" @click="store.refreshSlaLevel()">
              <el-icon><Refresh /></el-icon>刷新时效
            </el-button>
            <el-button size="small" type="primary" @click="handleRegisterDialog">
              <el-icon><Plus /></el-icon>登记客诉
            </el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-select v-model="filter.status" placeholder="状态" clearable size="default" style="width:130px;">
            <el-option label="已登记" value="registered" />
            <el-option label="判定中" value="judging" />
            <el-option label="已派单" value="assigned" />
            <el-option label="处理中" value="processing" />
            <el-option label="回访中" value="visiting" />
            <el-option label="处理完成" value="completed" />
            <el-option label="已结案" value="closed" />
          </el-select>
          <el-select v-model="filter.category" placeholder="投诉类别" clearable style="width:150px;">
            <el-option v-for="(label, key) in COMPLAINT_CATEGORY_MAP" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="filter.sla" placeholder="时效状态" clearable style="width:130px;">
            <el-option label="时效正常" value="normal" />
            <el-option label="即将超时" value="warning" />
            <el-option label="已超时" value="overdue" />
          </el-select>
          <el-select v-model="filter.responsibility" placeholder="责任归属" clearable style="width:140px;">
            <el-option v-for="(label, key) in RESPONSIBILITY_PARTY_MAP" :key="key" :label="label" :value="key" />
          </el-select>
          <el-input
            v-model="filter.keyword"
            placeholder="搜索编号/标题/商铺/投诉人"
            clearable
            style="width:260px;"
            :prefix-icon="Search"
          />
          <el-button @click="resetFilter">重置</el-button>
        </div>

        <div style="flex:1;overflow:auto;">
          <el-table
            :data="filteredComplaints"
            style="width:100%"
            @row-click="handleRowClick"
            :row-class-name="getRowClassName"
            highlight-current-row
            height="100%"
            stripe
          >
            <el-table-column prop="code" label="编号" width="160" fixed="left">
              <template #default="{ row }">
                <span style="font-family:monospace;font-size:12px;color:#606266;">{{ row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标题与类别" min-width="260">
              <template #default="{ row }">
                <div style="line-height:1.5;">
                  <div style="font-weight:500;color:#1f2d3d;margin-bottom:4px;">{{ row.title }}</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <el-tag
                      size="small"
                      :type="categoryTagType(row.category)"
                      effect="light"
                    >
                      {{ COMPLAINT_CATEGORY_MAP[row.category] }}
                    </el-tag>
                    <el-tag
                      size="small"
                      :style="{ backgroundColor: PRIORITY_MAP[row.priority].color + '22', color: PRIORITY_MAP[row.priority].color, borderColor: PRIORITY_MAP[row.priority].color + '55' }"
                      effect="plain"
                    >
                      {{ PRIORITY_MAP[row.priority].label }}
                    </el-tag>
                    <el-tag size="small" effect="plain" type="info">{{ COMPLAINT_SOURCE_MAP[row.complaintSource] }}</el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="位置/商铺" width="180">
              <template #default="{ row }">
                <div style="font-size:12px;line-height:1.5;">
                  <div style="color:#606266;">{{ row.locationFloor }} {{ row.locationArea }}</div>
                  <div v-if="row.shopName" style="color:#303133;margin-top:2px;">{{ row.shopName }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  effect="dark"
                  :style="{ backgroundColor: COMPLAINT_STATUS_MAP[row.status].color, borderColor: 'transparent' }"
                >
                  {{ COMPLAINT_STATUS_MAP[row.status].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时效" width="120" align="center">
              <template #default="{ row }">
                <div v-if="row.status === 'closed'" style="color:#909399;font-size:12px;">—</div>
                <div v-else class="sla-wrapper">
                  <div v-if="row.slaLevel === 'normal'" class="sla-level normal">
                    <el-icon style="margin-right:3px;"><Clock /></el-icon>
                    <span>{{ formatDeadline(row.slaDeadline) }}</span>
                  </div>
                  <div v-else-if="row.slaLevel === 'warning'" class="sla-warning" style="display:inline-flex;align-items:center;">
                    <el-icon style="margin-right:3px;"><Warning /></el-icon>
                    {{ formatDeadline(row.slaDeadline) }}
                  </div>
                  <div v-else class="sla-overdue" style="display:inline-flex;align-items:center;">
                    <el-icon style="margin-right:3px;"><WarningFilled /></el-icon>
                    {{ formatDeadline(row.slaDeadline) }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="处理人" width="110">
              <template #default="{ row }">
                <div style="font-size:12px;">
                  <div style="color:#1f2d3d;">{{ row.currentHandler }}</div>
                  <div style="color:#909399;font-size:11px;">{{ row.currentHandlerRole }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="登记时间" width="150">
              <template #default="{ row }">
                <span style="color:#606266;font-size:12px;font-family:monospace;">{{ row.registeredAt }}</span>
              </template>
            </el-table-column>
            <el-table-column label="责任归属" width="120">
              <template #default="{ row }">
                <span v-if="row.responsibilityParty !== 'undetermined'" style="font-size:12px;color:#606266;">
                  {{ RESPONSIBILITY_PARTY_MAP[row.responsibilityParty] }}
                </span>
                <span v-else style="font-size:12px;color:#e6a23c;font-weight:500;">待判定</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click.stop="handleRowClick(row)">查看</el-button>
                <el-button
                  v-if="row.status === 'judging'"
                  size="small"
                  type="warning"
                  link
                  @click.stop="openJudgeDialog(row)"
                >判定</el-button>
                <el-button
                  v-if="row.status === 'visiting'"
                  size="small"
                  type="success"
                  link
                  @click.stop="openVisitDialog(row)"
                >回访</el-button>
                <el-button
                  v-if="row.status === 'processing'"
                  size="small"
                  link
                  @click.stop="openCompleteDialog(row)"
                >完成</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="workbench-side">
        <SideDetail
          v-if="store.selectedComplaint"
          :complaint="store.selectedComplaint"
          @open-judge="openJudgeDialog(store.selectedComplaint!)"
          @open-visit="openVisitDialog(store.selectedComplaint!)"
          @open-complete="openCompleteDialog(store.selectedComplaint!)"
          @open-close="openCloseDialog(store.selectedComplaint!)"
          @open-assign="openAssignDialog(store.selectedComplaint!)"
        />
        <div v-else class="empty-side">
          <el-icon :size="56"><Document /></el-icon>
          <div style="margin-top:16px;font-size:15px;">从左侧列表选择一条客诉</div>
          <div style="font-size:12px;margin-top:6px;">查看详情、判定责任、进行回访</div>
        </div>
      </div>
    </div>

    <JudgeDialog
      v-model:visible="judgeDialog.visible"
      :complaint="judgeDialog.complaint"
      @submit="handleJudgeSubmit"
    />

    <VisitDialog
      v-model:visible="visitDialog.visible"
      :complaint="visitDialog.complaint"
      @submit="handleVisitSubmit"
    />

    <CompleteDialog
      v-model:visible="completeDialog.visible"
      :complaint="completeDialog.complaint"
      @submit="handleCompleteSubmit"
    />

    <AssignDialog
      v-model:visible="assignDialog.visible"
      :complaint="assignDialog.complaint"
      @submit="handleAssignSubmit"
    />

    <CloseDialog
      v-model:visible="closeDialog.visible"
      :complaint="closeDialog.complaint"
      @submit="handleCloseSubmit"
    />

    <el-dialog v-model="registerDialogVisible" title="登记客诉" width="620px">
      <el-form :model="registerForm" label-width="100px">
        <el-form-item label="投诉类别">
          <el-select v-model="registerForm.category" style="width:100%;">
            <el-option v-for="(label, key) in COMPLAINT_CATEGORY_MAP" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="registerForm.title" placeholder="请输入投诉概述" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="投诉来源">
              <el-select v-model="registerForm.complaintSource" style="width:100%;">
                <el-option v-for="(label, key) in COMPLAINT_SOURCE_MAP" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="registerForm.priority" style="width:100%;">
                <el-option label="紧急" value="urgent" />
                <el-option label="高" value="high" />
                <el-option label="普通" value="normal" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="投诉详情">
          <el-input v-model="registerForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="投诉人">
              <el-input v-model="registerForm.complainantName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="registerForm.complainantPhone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="楼层">
              <el-input v-model="registerForm.locationFloor" placeholder="如1F" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区域">
              <el-input v-model="registerForm.locationArea" placeholder="如A区" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="商铺">
              <el-select v-model="registerForm.shopCode" clearable style="width:100%;" placeholder="可选">
                <el-option v-for="s in mockShops" :key="s.code" :label="s.name" :value="s.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRegisterSubmit">提交登记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Clock } from '@element-plus/icons-vue'
import { useComplaintStore } from '@/stores/complaint'
import {
  COMPLAINT_CATEGORY_MAP,
  COMPLAINT_STATUS_MAP,
  RESPONSIBILITY_PARTY_MAP,
  SLA_LEVEL_MAP,
  COMPLAINT_SOURCE_MAP,
  PRIORITY_MAP
} from '@/types/complaint'
import type { Complaint, ComplaintCategory, ComplaintStatus, ResponsibilityParty, Complaint as ComplaintType } from '@/types/complaint'
import { mockShops } from '@/mock/complaintData'
import dayjs from 'dayjs'

import SideDetail from '@/components/SideDetail.vue'
import JudgeDialog from '@/components/JudgeDialog.vue'
import VisitDialog from '@/components/VisitDialog.vue'
import CompleteDialog from '@/components/CompleteDialog.vue'
import AssignDialog from '@/components/AssignDialog.vue'
import CloseDialog from '@/components/CloseDialog.vue'

const store = useComplaintStore()
store.refreshSlaLevel()

const activeTab = ref<'pending' | 'all'>('pending')

const filter = reactive({
  status: '' as ComplaintStatus | '',
  category: '' as ComplaintCategory | '',
  sla: '' as 'normal' | 'warning' | 'overdue' | '',
  responsibility: '' as ResponsibilityParty | '',
  keyword: ''
})

const filteredComplaints = computed(() => {
  let list = store.pendingList
  if (filter.status) list = list.filter(c => c.status === filter.status)
  if (filter.category) list = list.filter(c => c.category === filter.category)
  if (filter.sla) list = list.filter(c => c.slaLevel === filter.sla)
  if (filter.responsibility) list = list.filter(c => c.responsibilityParty === filter.responsibility)
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    list = list.filter(c =>
      c.code.toLowerCase().includes(kw) ||
      c.title.toLowerCase().includes(kw) ||
      (c.shopName && c.shopName.toLowerCase().includes(kw)) ||
      c.complainantName.toLowerCase().includes(kw)
    )
  }
  return [...list].sort((a, b) => {
    const slaOrder = { overdue: 0, warning: 1, normal: 2 }
    const orderA = slaOrder[a.slaLevel] ?? 99
    const orderB = slaOrder[b.slaLevel] ?? 99
    if (orderA !== orderB) return orderA - orderB
    return dayjs(a.registeredAt).isAfter(dayjs(b.registeredAt)) ? -1 : 1
  })
})

function resetFilter() {
  filter.status = ''
  filter.category = ''
  filter.sla = ''
  filter.responsibility = ''
  filter.keyword = ''
}

function categoryTagType(cat: ComplaintCategory) {
  const map: Record<string, any> = {
    activity_occupation: 'warning',
    repair_timeout: 'danger',
    attribution_unclear: '',
    noise: 'info',
    cleanliness: 'success',
    facility: '',
    other: 'info'
  }
  return map[cat] || 'info'
}

function getRowClassName({ row }: { row: Complaint }) {
  if (row.id === store.selectedComplaintId) return 'current-row'
  if (row.slaLevel === 'overdue' && row.status !== 'closed') return 'row-overdue'
  if (row.slaLevel === 'warning' && row.status !== 'closed') return 'row-warning'
  return ''
}

function formatDeadline(d: string) {
  const now = dayjs()
  const deadline = dayjs(d)
  if (deadline.isBefore(now)) {
    const diff = now.diff(deadline, 'hour')
    if (diff < 1) return `超时${now.diff(deadline, 'minute')}分钟`
    return `超时${diff}小时`
  }
  const diff = deadline.diff(now, 'minute')
  if (diff < 60) return `剩${diff}分钟`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `剩${h}h${m}m`
}

function handleRowClick(row: Complaint) {
  store.selectComplaint(row.id)
}

function categoryOfRow(row: Complaint) {
  return row
}

const judgeDialog = reactive({ visible: false, complaint: null as Complaint | null })
const visitDialog = reactive({ visible: false, complaint: null as Complaint | null })
const completeDialog = reactive({ visible: false, complaint: null as Complaint | null })
const assignDialog = reactive({ visible: false, complaint: null as Complaint | null })
const closeDialog = reactive({ visible: false, complaint: null as Complaint | null })

function openJudgeDialog(c: Complaint) {
  judgeDialog.complaint = c
  judgeDialog.visible = true
}
function openVisitDialog(c: Complaint) {
  visitDialog.complaint = c
  visitDialog.visible = true
}
function openCompleteDialog(c: Complaint) {
  completeDialog.complaint = c
  completeDialog.visible = true
}
function openAssignDialog(c: Complaint) {
  assignDialog.complaint = c
  assignDialog.visible = true
}
function openCloseDialog(c: Complaint) {
  closeDialog.complaint = c
  closeDialog.visible = true
}

function handleJudgeSubmit(payload: any) {
  if (!judgeDialog.complaint) return
  store.updateResponsibility(
    judgeDialog.complaint!.id,
    payload.party,
    payload.detail,
    payload.judgement
  )
  if (payload.handler) {
    store.assignHandler(judgeDialog.complaint!.id, payload.handler, payload.handlerRole, '责任判定完成后同步派单')
  } else {
    store.updateComplaintStatus(judgeDialog.complaint!.id, 'assigned', payload.remark || '责任判定完成')
  }
  ElMessage.success('责任判定已记录')
  judgeDialog.visible = false
}

function handleVisitSubmit(payload: any) {
  if (!visitDialog.complaint) return
  const c = visitDialog.complaint
  const pendingVisit = c.tenantVisits.find(v => v.result === 'pending')
  if (pendingVisit) {
    store.submitTenantVisit(
      c.id,
      pendingVisit.id,
      payload.result,
      payload.feedback,
      payload.improvementItems || [],
      payload.nextFollowUp || null
    )
  } else {
    const shop = mockShops.find(s => s.code === c.shopCode)
    const visit = store.createTenantVisit(
      c.id,
      shop?.contact || c.complainantName,
      shop?.phone || c.complainantPhone,
      shop?.tenantName || c.tenantName || c.complainantName,
      c.shopCode || ''
    )
    if (visit) {
      store.submitTenantVisit(
        c.id,
        visit.id,
        payload.result,
        payload.feedback,
        payload.improvementItems || [],
        payload.nextFollowUp || null
      )
    }
  }
  ElMessage.success('回访记录已保存')
  visitDialog.visible = false
}

function handleCompleteSubmit(payload: any) {
  if (!completeDialog.complaint) return
  if (payload.addJudgement) {
    store.addKeyJudgement(completeDialog.complaint.id, payload.addJudgement, 'other')
  }
  store.completeProcessing(completeDialog.complaint.id, payload.remark)
  if (payload.needVisit) {
    const c = completeDialog.complaint
    const shop = mockShops.find(s => s.code === c.shopCode)
    store.createTenantVisit(
      c.id,
      shop?.contact || c.complainantName,
      shop?.phone || c.complainantPhone,
      shop?.tenantName || c.tenantName || c.complainantName,
      c.shopCode || ''
    )
  }
  ElMessage.success('处理完成，已转入回访阶段')
  completeDialog.visible = false
}

function handleAssignSubmit(payload: any) {
  if (!assignDialog.complaint) return
  store.assignHandler(assignDialog.complaint.id, payload.handler, payload.handlerRole, payload.remark || '重新派单')
  ElMessage.success('已重新派单')
  assignDialog.visible = false
}

function handleCloseSubmit(payload: any) {
  if (!closeDialog.complaint) return
  store.closeComplaint(closeDialog.complaint.id, payload.remark)
  ElMessage.success('客诉已结案')
  closeDialog.visible = false
}

const registerDialogVisible = ref(false)
const registerForm = reactive({
  category: 'other' as ComplaintCategory,
  title: '',
  complaintSource: 'customer' as ComplaintType['complaintSource'],
  priority: 'normal' as ComplaintType['priority'],
  description: '',
  complainantName: '',
  complainantPhone: '',
  locationFloor: '',
  locationArea: '',
  shopCode: ''
})

function handleRegisterDialog() {
  registerDialogVisible.value = true
  Object.assign(registerForm, {
    category: 'other',
    title: '',
    complaintSource: 'customer',
    priority: 'normal',
    description: '',
    complainantName: '',
    complainantPhone: '',
    locationFloor: '',
    locationArea: '',
    shopCode: ''
  })
}

function handleRegisterSubmit() {
  if (!registerForm.title || !registerForm.description) {
    ElMessage.warning('请填写标题和投诉详情')
    return
  }
  const shop = mockShops.find(s => s.code === registerForm.shopCode)
  const code = `CS-${dayjs().format('YYYY-MMDD')}-${String(store.complaints.length + 1).padStart(3, '0')}`
  const newComplaint: Complaint = {
    id: `c_${Date.now()}`,
    code,
    title: registerForm.title,
    category: registerForm.category,
    status: 'registered',
    description: registerForm.description,
    complaintSource: registerForm.complaintSource,
    complainantName: registerForm.complainantName || '匿名',
    complainantPhone: registerForm.complainantPhone,
    complainantType: registerForm.complaintSource === 'tenant' ? 'tenant' : registerForm.complaintSource === 'patrol' || registerForm.complaintSource === 'staff' ? 'staff' : 'customer',
    locationFloor: registerForm.locationFloor || '—',
    locationArea: registerForm.locationArea || '—',
    shopCode: registerForm.shopCode,
    shopName: shop?.name,
    tenantName: shop?.tenantName,
    registeredBy: store.currentUser.name,
    registeredByRole: store.currentUser.role,
    registeredAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    currentHandler: store.currentUser.name,
    currentHandlerRole: store.currentUser.role,
    assignedAt: null,
    slaDeadline: dayjs().add(8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    slaLevel: 'normal',
    responsibilityParty: 'undetermined',
    responsibilityPartyDetail: '新登记待判定',
    keyJudgements: [],
    statusHistory: [
      {
        id: `sh_${Date.now()}`,
        fromStatus: null,
        toStatus: 'registered',
        operator: store.currentUser.name,
        operatorRole: store.currentUser.role,
        remark: '前台登记录入',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    ],
    exceptionNotes: [],
    tenantVisits: [],
    priority: registerForm.priority,
    attachments: [],
    closedAt: null
  }
  store.complaints.unshift(newComplaint)
  store.selectComplaint(newComplaint.id)
  ElMessage.success(`客诉 ${code} 登记成功`)
  registerDialogVisible.value = false
}

onMounted(() => {
  if (filteredComplaints.value.length > 0) {
    store.selectComplaint(filteredComplaints.value[0].id)
  }
})
</script>

<style scoped lang="scss">
.row-overdue td { background: linear-gradient(90deg, #fef0f0 0%, #fff5f5 100%) !important; }
.row-warning td { background: linear-gradient(90deg, #fdf6ec 0%, #fef9f3 100%) !important; }
:deep(.current-row) td { background: #ecf5ff !important; font-weight:500; }
.sla-wrapper { font-size: 12px; }
.sla-level.normal {
  color: #67c23a;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
}
</style>
