<template>
  <div class="page-container">
    <div class="workbench-header">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="workbench-title">
            <el-icon style="color:#67c23a;margin-right:8px;"><UserFilled /></el-icon>
            租户回访管理 · 回看工作台
          </div>
          <div class="workbench-subtitle">
            一线处理和管理回看基于同一份数据 · 所有回访记录与客诉登记同源可追溯
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <el-button @click="$router.push('/service/pending')">
            <el-icon><Operation /></el-icon>返回待处理工作台
          </el-button>
        </div>
      </div>
    </div>

    <div style="padding:16px 24px 0;">
      <el-row :gutter="12">
        <el-col :span="5">
          <div class="stat-card" style="border-left:4px solid #409eff;">
            <div class="stat-card-label">回访总数</div>
            <div class="stat-card-value info">{{ allVisits.length }}</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-card" style="border-left:4px solid #e6a23c;">
            <div class="stat-card-label">待回访</div>
            <div class="stat-card-value warning">{{ pendingVisits.length }}</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-card" style="border-left:4px solid #67c23a;">
            <div class="stat-card-label">满意度</div>
            <div class="stat-card-value success">{{ satisfactionRate }}%</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-card" style="border-left:4px solid #f56c6c;">
            <div class="stat-card-label">不满意记录</div>
            <div class="stat-card-value danger">{{ dissatisfiedCount }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card" style="border-left:4px solid #9b59b6;">
            <div class="stat-card-label">有跟进事项</div>
            <div class="stat-card-value" style="color:#9b59b6;">{{ followUpCount }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="workbench-body">
      <div class="workbench-main">
        <div class="section-header">
          <div class="section-title">
            <el-icon><Tickets /></el-icon>
            回访记录列表
            <el-tag size="small" type="info" style="margin-left:8px;">共 {{ filteredVisits.length }} 条</el-tag>
          </div>
          <div>
            <el-button size="small" @click="exportMode = !exportMode">
              <el-icon><Download /></el-icon>{{ exportMode ? '取消勾选' : '批量导出' }}
            </el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-select v-model="filter.result" placeholder="回访结果" clearable style="width:140px;">
            <el-option v-for="(cfg, key) in VISIT_RESULT_MAP" :key="key" :label="cfg.label" :value="key" />
          </el-select>
          <el-select v-model="filter.category" placeholder="关联投诉类别" clearable style="width:150px;">
            <el-option v-for="(label, key) in COMPLAINT_CATEGORY_MAP" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="filter.visitor" placeholder="回访人" clearable style="width:140px;">
            <el-option v-for="s in mockStaff" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="回访日期起"
            end-placeholder="止"
            value-format="YYYY-MM-DD"
            style="width:260px;"
          />
          <el-input
            v-model="filter.keyword"
            placeholder="搜索商铺/租户/反馈内容"
            clearable
            style="width:260px;"
            :prefix-icon="Search"
          />
          <el-button @click="resetFilter">重置</el-button>
        </div>

        <div style="flex:1;overflow:auto;">
          <el-table
            :data="filteredVisits"
            height="100%"
            @row-click="handleRowClick"
            highlight-current-row
            stripe
          >
            <el-table-column v-if="exportMode" type="selection" width="50" />
            <el-table-column label="关联客诉" width="150" fixed="left">
              <template #default="{ row }">
                <div style="font-size:12px;">
                  <div style="font-family:monospace;color:#606266;">{{ getComplaint(row.complaintId)?.code }}</div>
                  <el-tag
                    size="small"
                    :style="{ marginTop: '4px', backgroundColor: categoryBgColor(getComplaint(row.complaintId)?.category), color: categoryColor(getComplaint(row.complaintId)?.category), borderColor: 'transparent' }"
                    effect="plain"
                  >
                    {{ COMPLAINT_CATEGORY_MAP[getComplaint(row.complaintId)?.category || 'other'] }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="回访对象" width="240">
              <template #default="{ row }">
                <div style="line-height:1.5;">
                  <div style="font-weight:500;">{{ row.tenantContact }}</div>
                  <div style="font-size:12px;color:#909399;">
                    {{ row.tenantName }}
                    <span v-if="row.shopCode" style="margin-left:4px;">({{ row.shopCode }})</span>
                  </div>
                  <div v-if="row.tenantPhone" style="font-size:11px;color:#909399;font-family:monospace;">{{ row.tenantPhone }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关联客诉标题" min-width="260" show-overflow-tooltip>
              <template #default="{ row }">
                <span style="color:#303133;">{{ getComplaint(row.complaintId)?.title }}</span>
              </template>
            </el-table-column>
            <el-table-column label="回访结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  effect="dark"
                  :style="{ backgroundColor: VISIT_RESULT_MAP[row.result].color, borderColor: 'transparent' }"
                >
                  {{ VISIT_RESULT_MAP[row.result].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="反馈内容" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.feedback" style="color:#606266;font-size:12px;line-height:1.6;">{{ row.feedback }}</span>
                <span v-else style="color:#c0c4cc;font-size:12px;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="改进项" width="150">
              <template #default="{ row }">
                <div v-if="row.improvementItems.length > 0" style="display:flex;flex-wrap:wrap;gap:3px;">
                  <el-tag
                    v-for="(item, i) in row.improvementItems.slice(0, 2)"
                    :key="i"
                    size="small"
                    effect="plain"
                  >{{ item }}</el-tag>
                  <el-tag v-if="row.improvementItems.length > 2" size="small" effect="plain">+{{ row.improvementItems.length - 2 }}</el-tag>
                </div>
                <span v-else style="color:#c0c4cc;font-size:12px;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="回访人" width="110">
              <template #default="{ row }">
                <div style="font-size:12px;">
                  <div>{{ row.visitor }}</div>
                  <div style="color:#909399;font-size:11px;">{{ row.visitorRole }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="回访时间" width="160">
              <template #default="{ row }">
                <span v-if="row.visitTime" style="font-size:12px;font-family:monospace;color:#606266;">{{ row.visitTime }}</span>
                <el-tag v-else size="small" type="warning" effect="plain">待执行</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="下次跟进" width="120">
              <template #default="{ row }">
                <div v-if="row.nextFollowUp" style="font-size:12px;color:#e6a23c;">
                  <el-icon><Calendar /></el-icon>{{ row.nextFollowUp }}
                </div>
                <span v-else style="color:#c0c4cc;font-size:12px;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click.stop="handleRowClick(row)">
                  查看追溯
                </el-button>
                <el-button
                  v-if="row.result === 'pending'"
                  size="small"
                  type="success"
                  link
                  @click.stop="handleQuickVisit(row)"
                >回访</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="workbench-side">
        <div v-if="selectedVisit" style="display:flex;flex-direction:column;height:100%;">
          <div class="section-header">
            <div class="section-title">
              <el-icon><View /></el-icon>
              回访记录追溯
              <el-tag
                size="small"
                effect="dark"
                :style="{ backgroundColor: VISIT_RESULT_MAP[selectedVisit.result].color, borderColor: 'transparent', marginLeft: '8px' }"
              >{{ VISIT_RESULT_MAP[selectedVisit.result].label }}</el-tag>
            </div>
          </div>
          <div class="section-content">
            <div class="detail-block">
              <div class="detail-block-title">回访信息</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">回访对象</span>
                  <span class="detail-value">{{ selectedVisit.tenantContact }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">联系电话</span>
                  <span class="detail-value" style="font-family:monospace;">{{ selectedVisit.tenantPhone || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">租户名称</span>
                  <span class="detail-value">{{ selectedVisit.tenantName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">商铺编号</span>
                  <span class="detail-value">{{ selectedVisit.shopCode || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">回访人</span>
                  <span class="detail-value">{{ selectedVisit.visitor }}（{{ selectedVisit.visitorRole }}）</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">回访时间</span>
                  <span class="detail-value" style="font-family:monospace;">{{ selectedVisit.visitTime || '待执行' }}</span>
                </div>
              </div>
              <div style="margin-top:10px;">
                <div class="detail-label" style="margin-bottom:4px;">反馈内容</div>
                <div v-if="selectedVisit.feedback" style="background:#f5f7fa;padding:10px 12px;border-radius:6px;font-size:13px;line-height:1.7;color:#303133;">
                  {{ selectedVisit.feedback }}
                </div>
                <div v-else style="color:#c0c4cc;font-size:12px;">暂无反馈</div>
              </div>
              <div v-if="selectedVisit.improvementItems.length > 0" style="margin-top:10px;">
                <div class="detail-label" style="margin-bottom:4px;">改进项 / 后续措施</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  <el-tag v-for="(item, i) in selectedVisit.improvementItems" :key="i" size="default" effect="plain">
                    {{ item }}
                  </el-tag>
                </div>
              </div>
              <div v-if="selectedVisit.nextFollowUp" style="margin-top:10px;padding:10px;background:#fdf6ec;border-radius:6px;border:1px solid #faecd8;">
                <div style="font-size:12px;color:#e6a23c;font-weight:500;">
                  <el-icon><Calendar /></el-icon> 下次跟进日期：{{ selectedVisit.nextFollowUp }}
                </div>
              </div>
            </div>

            <div class="detail-block" v-if="linkedComplaint">
              <div class="detail-block-title">
                关联客诉（数据同源）
                <el-button size="small" text type="primary" style="margin-left:auto;" @click="goPendingDetail">
                  <el-icon><Share /></el-icon>在工作台查看
                </el-button>
              </div>
              <div style="padding:12px;background:#ecf5ff;border:1px solid #d9ecff;border-radius:6px;">
                <div style="font-size:12px;font-family:monospace;color:#409eff;margin-bottom:4px;">{{ linkedComplaint.code }}</div>
                <div style="font-weight:500;color:#1f2d3d;margin-bottom:6px;">{{ linkedComplaint.title }}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                  <el-tag size="small" effect="dark" :style="{ backgroundColor: COMPLAINT_STATUS_MAP[linkedComplaint.status].color, borderColor: 'transparent' }">
                    {{ COMPLAINT_STATUS_MAP[linkedComplaint.status].label }}
                  </el-tag>
                  <el-tag size="small" effect="light">
                    {{ COMPLAINT_CATEGORY_MAP[linkedComplaint.category] }}
                  </el-tag>
                </div>
                <div style="font-size:12px;color:#606266;line-height:1.7;">
                  <div><span style="color:#909399;">投诉来源：</span>{{ COMPLAINT_SOURCE_MAP[linkedComplaint.complaintSource] }}</div>
                  <div><span style="color:#909399;">责任归属：</span>{{ RESPONSIBILITY_PARTY_MAP[linkedComplaint.responsibilityParty] }}</div>
                  <div><span style="color:#909399;">登记人：</span>{{ linkedComplaint.registeredBy }}（{{ linkedComplaint.registeredAt }}）</div>
                  <div><span style="color:#909399;">当前处理：</span>{{ linkedComplaint.currentHandler }}（{{ linkedComplaint.currentHandlerRole }}）</div>
                </div>
              </div>

              <div v-if="linkedComplaint.keyJudgements.length > 0" style="margin-top:12px;">
                <div class="detail-label" style="margin-bottom:6px;font-weight:600;color:#606266;">客诉登记时的关键判断（回访前必读）</div>
                <div v-for="j in linkedComplaint.keyJudgements" :key="j.id" class="judgement-card">
                  <div class="judgement-label">
                    <el-icon><Star /></el-icon>
                    <span>{{ j.type === 'responsibility' ? '责任判定' : j.type === 'sla' ? 'SLA时效' : j.type === 'root_cause' ? '根因分析' : j.type === 'escalation' ? '升级处理' : '关键记录' }}</span>
                    <span style="margin-left:auto;color:#909399;font-weight:400;">
                      {{ j.operator }} · {{ j.createdAt }}
                    </span>
                  </div>
                  <div class="judgement-content">{{ j.content }}</div>
                </div>
              </div>

              <div v-if="linkedComplaint.exceptionNotes.length > 0" style="margin-top:12px;">
                <div class="detail-label" style="margin-bottom:6px;font-weight:600;color:#606266;">异常说明记录</div>
                <div v-for="n in linkedComplaint.exceptionNotes" :key="n.id" style="margin-bottom:8px;padding:10px;border:1px solid #ebeef5;border-radius:4px;background:#fafbfc;">
                  <div style="font-size:12px;font-weight:500;margin-bottom:4px;">
                    <el-tag size="small" type="warning" effect="light" style="margin-right:6px;">
                      {{ n.type === 'attribution_dispute' ? '归属争议' : n.type === 'sla_overdue' ? 'SLA超时' : n.type === 'tenant_refusal' ? '回访异议' : n.type === 'escalation' ? '升级' : '其他' }}
                    </el-tag>
                    <span>{{ n.title }}</span>
                  </div>
                  <div style="font-size:12px;color:#606266;line-height:1.7;">{{ n.content }}</div>
                  <div style="margin-top:4px;font-size:11px;color:#909399;">
                    {{ n.operator }}（{{ n.operatorRole }}） · {{ n.createdAt }}
                  </div>
                </div>
              </div>

              <div style="margin-top:12px;">
                <div class="detail-label" style="margin-bottom:6px;font-weight:600;color:#606266;">关联客诉状态流转</div>
                <div>
                  <div v-for="log in linkedComplaint.statusHistory" :key="log.id" class="timeline-item-custom">
                    <div class="timeline-dot" :style="{ backgroundColor: COMPLAINT_STATUS_MAP[log.toStatus].color }"></div>
                    <div style="font-size:12px;line-height:1.6;">
                      <div style="margin-bottom:2px;">
                        <el-tag size="small" effect="dark" :style="{ backgroundColor: COMPLAINT_STATUS_MAP[log.toStatus].color, borderColor: 'transparent', marginRight: '6px' }">
                          {{ COMPLAINT_STATUS_MAP[log.toStatus].label }}
                        </el-tag>
                      </div>
                      <div style="color:#606266;">{{ log.remark }}</div>
                      <div style="font-size:11px;color:#909399;margin-top:2px;">
                        {{ log.operator }} · {{ log.createdAt }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-side">
          <el-icon :size="56"><View /></el-icon>
          <div style="margin-top:16px;font-size:15px;">选择一条回访记录</div>
          <div style="font-size:12px;margin-top:6px;">查看追溯详情：关联客诉、关键判断及完整状态流转</div>
        </div>
      </div>
    </div>

    <VisitDialog
      v-model:visible="visitDialog.visible"
      :complaint="visitDialog.complaint"
      @submit="handleVisitSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useComplaintStore } from '@/stores/complaint'
import type { TenantVisit, Complaint, ComplaintCategory, VisitResult } from '@/types/complaint'
import {
  COMPLAINT_CATEGORY_MAP,
  COMPLAINT_STATUS_MAP,
  RESPONSIBILITY_PARTY_MAP,
  VISIT_RESULT_MAP,
  COMPLAINT_SOURCE_MAP
} from '@/types/complaint'
import { mockStaff } from '@/mock/complaintData'
import VisitDialog from '@/components/VisitDialog.vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const store = useComplaintStore()

const exportMode = ref(false)

const filter = reactive({
  result: '' as VisitResult | '',
  category: '' as ComplaintCategory | '',
  visitor: '',
  dateRange: [] as string[],
  keyword: ''
})

const allVisits = computed(() => {
  const list: (TenantVisit & { complaintCategory?: ComplaintCategory })[] = []
  store.complaints.forEach(c => {
    c.tenantVisits.forEach(v => {
      list.push({ ...v, complaintCategory: c.category })
    })
  })
  return list.sort((a, b) => {
    const ta = a.visitTime || a.createdAt
    const tb = b.visitTime || b.createdAt
    return dayjs(tb).isAfter(dayjs(ta)) ? 1 : -1
  })
})

const pendingVisits = computed(() => allVisits.value.filter(v => v.result === 'pending'))

const satisfiedRate = computed(() => {
  const done = allVisits.value.filter(v => ['satisfied', 'basically_satisfied', 'dissatisfied'].includes(v.result))
  if (done.length === 0) return 0
  const s = done.filter(v => v.result === 'satisfied' || v.result === 'basically_satisfied').length
  return Math.round(s / done.length * 100)
})

const dissatisfiedCount = computed(() => allVisits.value.filter(v => v.result === 'dissatisfied').length)
const followUpCount = computed(() => allVisits.value.filter(v => v.nextFollowUp).length)

const filteredVisits = computed(() => {
  let list = allVisits.value
  if (filter.result) list = list.filter(v => v.result === filter.result)
  if (filter.category) list = list.filter(v => v.complaintCategory === filter.category)
  if (filter.visitor) list = list.filter(v => v.visitor === filter.visitor)
  if (filter.dateRange && filter.dateRange.length === 2) {
    const [s, e] = filter.dateRange
    const start = dayjs(s).startOf('day')
    const end = dayjs(e).endOf('day')
    list = list.filter(v => {
      const t = dayjs(v.visitTime || v.createdAt)
      return (t.isSame(start) || t.isAfter(start)) && (t.isSame(end) || t.isBefore(end))
    })
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    list = list.filter(v =>
      v.tenantName.toLowerCase().includes(kw) ||
      v.tenantContact.toLowerCase().includes(kw) ||
      (v.shopCode && v.shopCode.toLowerCase().includes(kw)) ||
      (v.feedback && v.feedback.toLowerCase().includes(kw)) ||
      (getComplaint(v.complaintId)?.title || '').toLowerCase().includes(kw)
    )
  }
  return list
})

function resetFilter() {
  filter.result = ''
  filter.category = ''
  filter.visitor = ''
  filter.dateRange = []
  filter.keyword = ''
}

function getComplaint(id: string): Complaint | undefined {
  return store.complaints.find(c => c.id === id)
}

const selectedVisitId = ref<string | null>(null)
const selectedVisit = computed(() => allVisits.value.find(v => v.id === selectedVisitId.value) || null)
const linkedComplaint = computed(() => selectedVisit.value ? getComplaint(selectedVisit.value.complaintId) : null)

function handleRowClick(row: TenantVisit) {
  selectedVisitId.value = row.id
}

function categoryColor(cat?: ComplaintCategory) {
  const map: Record<string, string> = {
    activity_occupation: '#e6a23c',
    repair_timeout: '#f56c6c',
    attribution_unclear: '#909399',
    noise: '#409eff',
    cleanliness: '#67c23a',
    facility: '#9b59b6',
    other: '#909399'
  }
  return map[cat || 'other']
}

function categoryBgColor(cat?: ComplaintCategory) {
  return categoryColor(cat) + '22'
}

const visitDialog = reactive({ visible: false, complaint: null as Complaint | null })

function handleQuickVisit(row: TenantVisit) {
  const c = getComplaint(row.complaintId)
  if (!c) return
  visitDialog.complaint = c
  visitDialog.visible = true
}

function handleVisitSubmit(payload: any) {
  if (!visitDialog.complaint) return
  const c = visitDialog.complaint
  const pending = c.tenantVisits.find(v => v.result === 'pending')
  if (pending) {
    store.submitTenantVisit(
      c.id, pending.id, payload.result, payload.feedback, payload.improvementItems || [], payload.nextFollowUp || null,
      { tenantContact: payload.tenantContact, tenantPhone: payload.tenantPhone }
    )
    ElMessage.success('回访已记录')
    visitDialog.visible = false
  }
}

function goPendingDetail() {
  if (linkedComplaint.value) {
    store.selectComplaint(linkedComplaint.value.id)
    router.push('/service/pending')
  }
}
</script>

<style scoped lang="scss">
:deep(.current-row) td { background: #ecf5ff !important; }
</style>
