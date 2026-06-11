<template>
  <div style="display:flex;flex-direction:column;height:100%;">
    <div class="section-header">
      <div class="section-title">
        <el-icon><Document /></el-icon>
        客诉详情
        <el-tag
          size="small"
          effect="dark"
          :style="{ backgroundColor: COMPLAINT_STATUS_MAP[complaint.status].color, borderColor: 'transparent', marginLeft: '6px' }"
        >{{ COMPLAINT_STATUS_MAP[complaint.status].label }}</el-tag>
        <span style="font-size:12px;color:#909399;margin-left:8px;font-family:monospace;">{{ complaint.code }}</span>
      </div>
      <el-button size="small" text @click="$emit('open-close')" v-if="complaint.status === 'completed'">
        <el-icon><Select /></el-icon>结案
      </el-button>
    </div>

    <div class="section-content">
      <div v-if="complaint.slaLevel !== 'normal' && complaint.status !== 'closed'" style="margin-bottom:16px;">
        <div v-if="complaint.slaLevel === 'overdue'" class="sla-overdue" style="display:flex;align-items:center;justify-content:space-between;">
          <span>
            <el-icon style="margin-right:6px;"><WarningFilled /></el-icon>
            已超时 · SLA截止 {{ complaint.slaDeadline }} · 超时 {{ overdueHours }}
          </span>
          <el-button size="small" type="danger" plain @click="addOverdueNote">
            <el-icon><Warning /></el-icon>记录异常
          </el-button>
        </div>
        <div v-else class="sla-warning" style="display:flex;align-items:center;justify-content:space-between;">
          <span>
            <el-icon style="margin-right:6px;"><Clock /></el-icon>
            即将超时 · 剩余 {{ remainingHours }}
          </span>
          <span style="font-size:11px;color:#e6a23c;">截止：{{ complaint.slaDeadline }}</span>
        </div>
      </div>

      <div class="detail-block">
        <div class="detail-block-title">基本信息</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">投诉类别</span>
            <span class="detail-value">
              <el-tag size="small" :type="categoryTagType" effect="light">
                {{ COMPLAINT_CATEGORY_MAP[complaint.category] }}
              </el-tag>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">优先级</span>
            <span class="detail-value">
              <span :style="{ color: PRIORITY_MAP[complaint.priority].color, fontWeight: 500 }">
                {{ PRIORITY_MAP[complaint.priority].label }}
              </span>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">投诉来源</span>
            <span class="detail-value">{{ COMPLAINT_SOURCE_MAP[complaint.complaintSource] }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">当前处理人</span>
            <span class="detail-value">
              {{ complaint.currentHandler }}
              <span style="color:#909399;font-size:11px;">({{ complaint.currentHandlerRole }})</span>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">投诉人</span>
            <span class="detail-value">
              {{ complaint.complainantName }}
              <span v-if="complaint.complainantPhone" style="color:#909399;font-family:monospace;font-size:11px;">{{ complaint.complainantPhone }}</span>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">位置</span>
            <span class="detail-value">{{ complaint.locationFloor }} {{ complaint.locationArea }}</span>
          </div>
          <div class="detail-item" v-if="complaint.shopName">
            <span class="detail-label">关联商铺</span>
            <span class="detail-value">{{ complaint.shopName }} <span style="color:#909399;">({{ complaint.shopCode }})</span></span>
          </div>
          <div class="detail-item" v-if="complaint.tenantName">
            <span class="detail-label">关联租户</span>
            <span class="detail-value">{{ complaint.tenantName }}</span>
          </div>
          <div class="detail-item" v-if="complaint.repairType">
            <span class="detail-label">报修类型</span>
            <span class="detail-value">{{ complaint.repairType }}</span>
          </div>
          <div class="detail-item" v-if="complaint.repairTimeoutHours">
            <span class="detail-label">已超时时长</span>
            <span class="detail-value" style="color:#f56c6c;font-weight:500;">{{ complaint.repairTimeoutHours }} 小时</span>
          </div>
          <div class="detail-item" v-if="complaint.activityName">
            <span class="detail-label">活动名称</span>
            <span class="detail-value">{{ complaint.activityName }}</span>
          </div>
          <div class="detail-item" v-if="complaint.activityOrganizer">
            <span class="detail-label">活动承办方</span>
            <span class="detail-value">{{ complaint.activityOrganizer }}</span>
          </div>
        </div>
        <div style="margin-top:10px;">
          <div class="detail-label" style="margin-bottom:4px;">投诉详情</div>
          <div style="background:#f5f7fa;padding:10px 12px;border-radius:6px;font-size:13px;line-height:1.7;color:#303133;">
            {{ complaint.description }}
          </div>
        </div>
      </div>

      <div class="detail-block">
        <div class="detail-block-title">
          责任归属
          <el-button size="small" text @click="$emit('open-judge')" style="margin-left:auto;">
            <el-icon><EditPen /></el-icon>{{ complaint.responsibilityParty === 'undetermined' ? '去判定' : '变更' }}
          </el-button>
        </div>
        <div :style="complaint.responsibilityParty === 'undetermined' ? { background: '#fdf6ec', border: '1px dashed #e6a23c', borderRadius: '6px', padding: '12px' } : {}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div>
              <span v-if="complaint.responsibilityParty === 'undetermined'" style="color:#e6a23c;font-weight:600;">
                <el-icon style="margin-right:4px;"><QuestionFilled /></el-icon>待判定
              </span>
              <span v-else style="font-weight:600;color:#1f2d3d;">
                {{ RESPONSIBILITY_PARTY_MAP[complaint.responsibilityParty] }}
              </span>
            </div>
            <el-button size="small" text type="primary" @click="$emit('open-assign')">
              <el-icon><Promotion /></el-icon>重新派单
            </el-button>
          </div>
          <div style="font-size:12px;color:#606266;line-height:1.6;">
            {{ complaint.responsibilityPartyDetail }}
          </div>
        </div>
      </div>

      <div class="detail-block" v-if="complaint.keyJudgements.length > 0">
        <div class="detail-block-title">关键判断（供回访参考）</div>
        <div v-for="j in complaint.keyJudgements" :key="j.id" class="judgement-card">
          <div class="judgement-label">
            <el-icon v-if="j.type === 'responsibility'"><CollectionTag /></el-icon>
            <el-icon v-else-if="j.type === 'sla'"><AlarmClock /></el-icon>
            <el-icon v-else-if="j.type === 'root_cause'"><Search /></el-icon>
            <el-icon v-else-if="j.type === 'escalation'"><Top /></el-icon>
            <el-icon v-else><ChatDotRound /></el-icon>
            <span>{{ JUDGE_TYPE_LABEL[j.type] }}</span>
            <span style="margin-left:auto;color:#909399;font-weight:400;">
              {{ j.operator }}（{{ j.operatorRole }}） · {{ j.createdAt }}
            </span>
          </div>
          <div class="judgement-content">{{ j.content }}</div>
        </div>
      </div>

      <div class="detail-block" v-if="complaint.exceptionNotes.length > 0">
        <div class="detail-block-title">
          异常说明
          <el-tag size="small" type="warning" style="margin-left:8px;">可追溯</el-tag>
        </div>
        <div v-for="n in complaint.exceptionNotes" :key="n.id" style="margin-bottom:12px;padding:12px;border-radius:6px;border:1px solid #ebeef5;background:#fafbfc;">
          <div style="display:flex;align-items:center;margin-bottom:8px;">
            <el-tag size="small" :type="noteTagType(n.type)" effect="light">
              {{ NOTE_TYPE_LABEL[n.type] }}
            </el-tag>
            <span style="font-weight:500;margin-left:8px;">{{ n.title }}</span>
            <span style="margin-left:auto;font-size:11px;color:#909399;">
              {{ n.operator }} · {{ n.createdAt }}
            </span>
          </div>
          <div style="font-size:12px;color:#606266;line-height:1.7;">{{ n.content }}</div>
        </div>
      </div>

      <div class="detail-block" v-if="complaint.tenantVisits.length > 0">
        <div class="detail-block-title">
          租户/顾客回访
          <el-button size="small" text type="success" style="margin-left:auto;" @click="$emit('open-visit')">
            <el-icon><Phone /></el-icon>
            {{ complaint.tenantVisits.some(v => v.result === 'pending') ? '去回访' : '再次回访' }}
          </el-button>
        </div>
        <div v-for="v in complaint.tenantVisits" :key="v.id" style="margin-bottom:14px;padding:12px;border-radius:6px;border:1px solid #ebeef5;">
          <div style="display:flex;align-items:center;margin-bottom:10px;gap:10px;flex-wrap:wrap;">
            <el-tag
              size="small"
              effect="dark"
              :style="{ backgroundColor: VISIT_RESULT_MAP[v.result].color, borderColor: 'transparent' }"
            >
              {{ VISIT_RESULT_MAP[v.result].label }}
            </el-tag>
            <span style="font-size:13px;font-weight:500;">{{ v.tenantContact }}</span>
            <span v-if="v.tenantPhone" style="font-size:12px;color:#909399;font-family:monospace;">{{ v.tenantPhone }}</span>
            <span v-if="v.shopCode" style="font-size:12px;color:#909399;">{{ v.shopCode }}</span>
            <span style="margin-left:auto;font-size:11px;color:#909399;">
              {{ v.visitTime || '待执行' }}
            </span>
          </div>
          <div v-if="v.feedback" style="background:#f5f7fa;padding:8px 10px;border-radius:4px;font-size:12px;color:#606266;line-height:1.7;margin-bottom:8px;">
            {{ v.feedback }}
          </div>
          <div v-if="v.improvementItems.length > 0" style="margin-bottom:6px;">
            <span style="font-size:11px;color:#909399;">改进项：</span>
            <el-tag
              v-for="(item, idx) in v.improvementItems"
              :key="idx"
              size="small"
              style="margin-right:4px;margin-top:2px;"
              effect="plain"
            >
              {{ item }}
            </el-tag>
          </div>
          <div v-if="v.nextFollowUp" style="font-size:11px;color:#e6a23c;">
            <el-icon><Calendar /></el-icon>下次跟进：{{ v.nextFollowUp }}
          </div>
          <div style="margin-top:6px;font-size:11px;color:#909399;">
            回访人：{{ v.visitor }}（{{ v.visitorRole }}）
          </div>
        </div>
      </div>

      <div class="detail-block">
        <div class="detail-block-title">状态流转 · 时间线（可追溯）</div>
        <div>
          <div v-for="log in complaint.statusHistory" :key="log.id" class="timeline-item-custom">
            <div class="timeline-dot" :style="{ backgroundColor: COMPLAINT_STATUS_MAP[log.toStatus].color }"></div>
            <div style="font-size:13px;line-height:1.6;">
              <div style="margin-bottom:2px;">
                <el-tag
                  size="small"
                  effect="dark"
                  :style="{ backgroundColor: COMPLAINT_STATUS_MAP[log.toStatus].color, borderColor: 'transparent', marginRight: '8px' }"
                >{{ COMPLAINT_STATUS_MAP[log.toStatus].label }}</el-tag>
                <span v-if="log.fromStatus" style="font-size:11px;color:#909399;">
                  ← {{ COMPLAINT_STATUS_MAP[log.fromStatus].label }}
                </span>
              </div>
              <div style="color:#606266;">{{ log.remark }}</div>
              <div style="margin-top:2px;font-size:11px;color:#909399;">
                {{ log.operator }}（{{ log.operatorRole }}） · {{ log.createdAt }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-block" v-if="complaint.attachments && complaint.attachments.length > 0">
        <div class="detail-block-title">附件</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <el-tag v-for="(f, i) in complaint.attachments" :key="i" size="small" effect="plain" type="info">
            <el-icon style="margin-right:4px;"><Paperclip /></el-icon>{{ f }}
          </el-tag>
        </div>
      </div>

      <div v-if="complaint.closedAt" style="margin-top:16px;padding:14px;border-radius:6px;background:#f0f9ff;border:1px solid #d9ecff;">
        <div style="font-size:13px;font-weight:600;color:#409eff;margin-bottom:6px;">
          <el-icon><CircleCheckFilled /></el-icon> 已结案
        </div>
        <div style="font-size:12px;color:#606266;line-height:1.7;">{{ complaint.closingRemark }}</div>
        <div style="margin-top:6px;font-size:11px;color:#909399;">
          结案人：{{ complaint.closedBy }} · {{ complaint.closedAt }}
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <template v-if="complaint.status === 'registered' || complaint.status === 'judging'">
        <el-button type="warning" @click="$emit('open-judge')">
          <el-icon><CollectionTag /></el-icon>判定责任
        </el-button>
      </template>
      <template v-if="complaint.status === 'judging' || complaint.status === 'assigned'">
        <el-button @click="$emit('open-assign')">
          <el-icon><Promotion /></el-icon>派单
        </el-button>
      </template>
      <template v-if="complaint.status === 'assigned' || complaint.status === 'processing'">
        <el-button type="primary" @click="$emit('open-complete')">
          <el-icon><CircleCheck /></el-icon>完成处理
        </el-button>
      </template>
      <template v-if="complaint.status !== 'closed'">
        <el-button type="success" @click="$emit('open-visit')">
          <el-icon><Phone /></el-icon>租户回访
        </el-button>
      </template>
      <template v-if="complaint.status === 'completed'">
        <el-button @click="$emit('open-close')">
          <el-icon><Select /></el-icon>结案
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import type { Complaint, ComplaintCategory } from '@/types/complaint'
import {
  COMPLAINT_CATEGORY_MAP,
  COMPLAINT_STATUS_MAP,
  RESPONSIBILITY_PARTY_MAP,
  VISIT_RESULT_MAP,
  PRIORITY_MAP,
  COMPLAINT_SOURCE_MAP
} from '@/types/complaint'
import { useComplaintStore } from '@/stores/complaint'

const props = defineProps<{ complaint: Complaint }>()
defineEmits(['open-judge', 'open-visit', 'open-complete', 'open-close', 'open-assign'])

const store = useComplaintStore()

const JUDGE_TYPE_LABEL: Record<string, string> = {
  responsibility: '责任判定',
  sla: 'SLA时效',
  root_cause: '根因分析',
  escalation: '升级处理',
  other: '关键记录'
}

const NOTE_TYPE_LABEL: Record<string, string> = {
  attribution_dispute: '归属争议',
  sla_overdue: 'SLA超时',
  tenant_refusal: '回访异议',
  escalation: '升级记录',
  other: '其他'
}

function noteTagType(t: string) {
  const map: Record<string, any> = {
    attribution_dispute: '',
    sla_overdue: 'danger',
    tenant_refusal: 'warning',
    escalation: 'warning',
    other: 'info'
  }
  return map[t] || 'info'
}

const categoryTagType = computed(() => {
  const c: ComplaintCategory = props.complaint.category
  const map: Record<string, any> = {
    activity_occupation: 'warning',
    repair_timeout: 'danger',
    attribution_unclear: '',
    noise: 'info',
    cleanliness: 'success',
    facility: '',
    other: 'info'
  }
  return map[c] || 'info'
})

const overdueHours = computed(() => {
  const diff = dayjs().diff(dayjs(props.complaint.slaDeadline), 'minute')
  if (diff < 60) return `${diff} 分钟`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}小时${m}分`
})

const remainingHours = computed(() => {
  const diff = dayjs(props.complaint.slaDeadline).diff(dayjs(), 'minute')
  if (diff < 60) return `${diff} 分钟`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}小时${m}分`
})

function addOverdueNote() {
  store.addExceptionNote(
    props.complaint.id,
    'sla_overdue',
    '处理超时补充记录',
    `责任人 ${props.complaint.currentHandler}（${props.complaint.currentHandlerRole}）处理超时，已触发SLA监控，请关注。`
  )
  ElMessage.success('超时异常已记录')
}
</script>
