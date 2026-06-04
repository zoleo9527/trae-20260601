<template>
  <div class="sidebar-detail" style="display: flex; flex-direction: column; height: 100%; background: #fff;">
    <div class="detail-header" style="padding: 16px 20px; border-bottom: 1px solid #e4e7ed; flex-shrink: 0; background: linear-gradient(to right, #fafafa, #fff);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <h2 style="font-size: 16px; margin: 0;">{{ order.customerName }} · {{ order.projectName }}</h2>
            <span class="status-tag" :class="getStatusClass(order.currentStatus)">
              {{ getStatusLabel(order.currentStatus) }}
            </span>
          </div>
          <div style="font-size: 12px; color: #909399; display: flex; gap: 16px;">
            <span><el-icon style="margin-right: 2px;"><Document /></el-icon>{{ order.id }}</span>
            <span><el-icon style="margin-right: 2px;"><Calendar /></el-icon>创建于 {{ order.createdAt }}</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <el-button v-if="canProcessRefund" size="small" type="danger" @click="$emit('openRefund')">
            <el-icon><EditPen /></el-icon>退款协商
          </el-button>
          <el-button v-if="canCompleteRefund" size="small" type="warning" @click="showCompleteRefund = true">
            <el-icon><Wallet /></el-icon>退款收尾
          </el-button>
          <el-button v-if="canWriteoff" size="small" type="success" @click="$emit('openWriteoff')">
            <el-icon><Select /></el-icon>核销疗程
          </el-button>
          <el-button v-if="canSupplement" size="small" type="warning" @click="$emit('openSupplement')">
            <el-icon><Upload /></el-icon>补录材料
          </el-button>
          <el-button size="small" @click="showAddNote = true">
            <el-icon><ChatDotRound /></el-icon>补充说明
          </el-button>
        </div>
      </div>

      <div v-if="order.currentResponsible" class="responsible-trail" style="margin-top: 12px; padding: 10px 14px; background: #f4f4f5; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <el-icon><User /></el-icon>
            <span style="font-size: 13px;">当前责任人：</span>
            <span class="responsible-badge">{{ order.currentResponsible.name }} ({{ getRoleLabel(order.currentResponsible.role) }})</span>
          </div>
          <template v-if="order.currentResponsible.transferFrom">
            <el-icon color="#67c23a"><ArrowRight /></el-icon>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: #909399;">移交自：</span>
              <span style="font-size: 12px;">{{ order.currentResponsible.transferFrom.name }} ({{ getRoleLabel(order.currentResponsible.transferFrom.role) }})</span>
            </div>
          </template>
        </div>
        <div v-if="order.currentResponsible.transferFrom?.reason" style="margin-top: 6px; font-size: 12px; color: #67c23a;">
          <el-icon style="margin-right: 2px;"><InfoFilled /></el-icon>
          {{ order.currentResponsible.transferFrom.reason }}
        </div>
      </div>
    </div>

    <div class="detail-tabs" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
      <el-tabs v-model="activeTab" type="border-card" style="flex: 1; display: flex; flex-direction: column;">
        <el-tab-pane label="基本信息" name="basic">
          <div class="tab-content" style="padding: 16px 20px; overflow-y: auto; height: calc(100vh - 380px);">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="客户姓名">{{ order.customerName }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ order.phone }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ order.age }}岁</el-descriptions-item>
              <el-descriptions-item label="项目名称">{{ order.projectName }}</el-descriptions-item>
              <el-descriptions-item label="项目总价">¥{{ order.totalAmount.toLocaleString() }}</el-descriptions-item>
              <el-descriptions-item label="已付金额">¥{{ order.paidAmount.toLocaleString() }}</el-descriptions-item>
              <el-descriptions-item label="申请退款">¥{{ order.refundAmount.toLocaleString() }}</el-descriptions-item>
              <el-descriptions-item label="疗程进度">{{ order.treatedCount }}/{{ order.treatmentCount }} 次</el-descriptions-item>
              <el-descriptions-item label="咨询师">{{ order.consultant }}</el-descriptions-item>
              <el-descriptions-item label="主治医生">{{ order.doctor }}</el-descriptions-item>
              <el-descriptions-item label="医生助理">{{ order.doctorAssistant }}</el-descriptions-item>
            </el-descriptions>

            <el-divider content-position="left">咨询记录 <el-tag size="small" type="info" v-if="!permissions.canSeeConsultation">当前角色不可见</el-tag></el-divider>
            <div v-if="permissions.canSeeConsultation && order.consultationRecord" style="background: #fafafa; padding: 12px 16px; border-radius: 6px; border-left: 3px solid #409eff;">
              <p style="font-size: 13px; line-height: 1.7; color: #606266; margin: 0;">{{ order.consultationRecord.content }}</p>
              <div v-if="order.consultationRecord.images?.length" style="margin-top: 8px; display: flex; gap: 8px;">
                <div v-for="img in order.consultationRecord.images" :key="img" style="width: 80px; height: 80px; background: #e4e7ed; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #909399;">
                  <el-icon><Picture /></el-icon>
                </div>
              </div>
            </div>
            <div v-else-if="!permissions.canSeeConsultation" style="padding: 20px; text-align: center; color: #c0c4cc; font-size: 13px;">
              <el-icon :size="32"><Lock /></el-icon>
              <p style="margin-top: 8px;">该模块仅咨询师和客服可见</p>
            </div>

            <el-divider content-position="left">方案报价 <el-tag size="small" type="info" v-if="!permissions.canSeeQuotation">当前角色不可见</el-tag></el-divider>
            <div v-if="permissions.canSeeQuotation && order.quotation">
              <el-table :data="order.quotation.items" size="small" border style="margin-bottom: 12px;">
                <el-table-column prop="name" label="项目" />
                <el-table-column prop="quantity" label="数量" width="80" align="center" />
                <el-table-column prop="amount" label="单价" width="100">
                  <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
                </el-table-column>
                <el-table-column label="小计" width="120">
                  <template #default="{ row }">¥{{ (row.amount * row.quantity).toLocaleString() }}</template>
                </el-table-column>
              </el-table>
              <div style="font-size: 12px; color: #606266; background: #fff7e6; padding: 8px 12px; border-radius: 4px;">
                <el-icon style="margin-right: 4px; color: #e6a23c;"><PriceTag /></el-icon>
                <strong>优惠说明：</strong>{{ order.quotation.discount }}
              </div>
            </div>
            <div v-else-if="!permissions.canSeeQuotation" style="padding: 20px; text-align: center; color: #c0c4cc; font-size: 13px;">
              <el-icon :size="32"><Lock /></el-icon>
              <p style="margin-top: 8px;">该模块仅咨询师和客服可见</p>
            </div>

            <el-divider content-position="left">术后回访 <el-tag size="small" type="info" v-if="!permissions.canSeePostop">当前角色不可见</el-tag></el-divider>
            <div v-if="permissions.canSeePostop && order.postopVisits?.length">
              <div v-for="(visit, idx) in order.postopVisits" :key="idx" class="timeline-node">
                <div style="font-size: 12px; color: #909399; margin-bottom: 2px;">{{ visit.date }}</div>
                <div style="font-size: 13px; color: #606266;">{{ visit.content }}</div>
              </div>
            </div>
            <div v-else-if="permissions.canSeePostop" style="padding: 20px; text-align: center; color: #c0c4cc; font-size: 13px;">
              <el-icon :size="32"><Document /></el-icon>
              <p style="margin-top: 8px;">暂无术后回访记录</p>
            </div>
            <div v-else style="padding: 20px; text-align: center; color: #c0c4cc; font-size: 13px;">
              <el-icon :size="32"><Lock /></el-icon>
              <p style="margin-top: 8px;">该模块仅医助和客服可见</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="退款协商" name="refund">
          <div class="tab-content" style="padding: 16px 20px; overflow-y: auto; height: calc(100vh - 380px);">
            <template v-if="order.refundReason">
              <el-alert type="warning" :closable="false" style="margin-bottom: 16px;">
                <template #title>退款原因</template>
                {{ order.refundReason }}
              </el-alert>

              <div v-if="order.refundNegotiation" style="display: grid; gap: 12px;">
                <div class="negotiation-card" style="background: #fef0f0; border: 1px solid #fbc4c4; border-radius: 8px; padding: 12px 16px;">
                  <div style="font-size: 13px; color: #f56c6c; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                    <el-icon><User /></el-icon>客户诉求
                  </div>
                  <div style="font-size: 13px; color: #606266;">{{ order.refundNegotiation.customerRequest }}</div>
                </div>
                <div class="negotiation-card" style="background: #ecf5ff; border: 1px solid #b3d8ff; border-radius: 8px; padding: 12px 16px;">
                  <div style="font-size: 13px; color: #409eff; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                    <el-icon><OfficeBuilding /></el-icon>院方方案
                  </div>
                  <div style="font-size: 13px; color: #606266;">{{ order.refundNegotiation.hospitalPlan }}</div>
                </div>
                <div v-if="order.refundNegotiation.finalAgreement" class="negotiation-card" style="background: #f0f9eb; border: 1px solid #c2e7b0; border-radius: 8px; padding: 12px 16px;">
                  <div style="font-size: 13px; color: #67c23a; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                    <el-icon><CircleCheck /></el-icon>最终协议
                  </div>
                  <div style="font-size: 13px; color: #606266;">{{ order.refundNegotiation.finalAgreement }}</div>
                </div>
              </div>
            </template>
            <div v-else style="padding: 40px; text-align: center; color: #c0c4cc;">
              <el-icon :size="48"><CircleClose /></el-icon>
              <p style="margin-top: 12px;">该订单暂无退款申请</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作历史" name="history">
          <div class="tab-content" style="padding: 16px 20px; overflow-y: auto; height: calc(100vh - 380px);">
            <div class="history-trail active" style="padding-right: 8px;">
              <div
                v-for="(record, idx) in order.history.slice().reverse()"
                :key="record.id"
                class="history-item"
                style="margin-bottom: 16px; position: relative;"
              >
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <el-tag size="small" :type="getHistoryTagType(record.action)">
                      {{ record.action }}
                    </el-tag>
                    <span style="font-size: 12px; color: #909399;">
                      {{ record.operator }}
                      <el-tag size="small" type="info" effect="plain" style="margin-left: 4px;">{{ getRoleLabel(record.operatorRole) }}</el-tag>
                    </span>
                  </div>
                  <span style="font-size: 11px; color: #c0c4cc;">{{ record.timestamp }}</span>
                </div>
                <div style="font-size: 13px; color: #606266; line-height: 1.6; padding: 8px 12px; background: #fafafa; border-radius: 4px; border-left: 3px solid #409eff;">
                  {{ record.content }}
                </div>
                <div v-if="record.responsible" style="margin-top: 6px; font-size: 11px; color: #67c23a;">
                  <el-icon style="margin-right: 2px;"><User /></el-icon>
                  责任人：{{ record.responsible.name }}（{{ getRoleLabel(record.responsible.role) }}）
                </div>
                <div v-if="record.transferNote" style="margin-top: 4px; font-size: 11px; color: #e6a23c;">
                  <el-icon style="margin-right: 2px;"><SwitchButton /></el-icon>
                  移交说明：{{ record.transferNote }}
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="疗程回看" name="review">
          <div class="tab-content" style="padding: 16px 20px; overflow-y: auto; height: calc(100vh - 380px);">
            <el-steps :active="order.treatedCount" finish-status="success" direction="vertical">
              <el-step
                v-for="(item, idx) in treatmentSteps"
                :key="idx"
                :title="item.title"
                :description="item.description"
                :icon="item.icon"
              >
                <template #icon v-if="item.iconComponent">
                  <el-icon :size="18" :color="item.color"><component :is="item.iconComponent" /></el-icon>
                </template>
              </el-step>
            </el-steps>

            <el-divider content-position="left">核销记录</el-divider>
            <div v-if="writeoffRecords.length > 0">
              <div v-for="(record, idx) in writeoffRecords" :key="idx" style="padding: 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 13px; font-weight: 600; color: #67c23a;">
                    <el-icon style="margin-right: 4px;"><Select /></el-icon>
                    {{ record.action }}
                  </span>
                  <span style="font-size: 11px; color: #909399;">{{ record.timestamp }}</span>
                </div>
                <div style="font-size: 12px; color: #606266;">{{ record.content }}</div>
                <div style="font-size: 11px; color: #909399; margin-top: 4px;">操作人：{{ record.operator }}</div>
              </div>
            </div>
            <div v-else style="padding: 30px; text-align: center; color: #c0c4cc; font-size: 13px;">
              <el-icon :size="32"><Clock /></el-icon>
              <p style="margin-top: 8px;">暂无核销记录</p>
            </div>

            <el-divider v-if="refundRelatedRecords.length > 0" content-position="left">退款协商与补录历史</el-divider>
            <div v-if="refundRelatedRecords.length > 0">
              <div v-for="(record, idx) in refundRelatedRecords" :key="'r-'+idx" style="padding: 10px 14px; background: #fdf6ec; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #e6a23c;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 13px; font-weight: 600; color: #e6a23c;">
                    {{ record.action }}
                  </span>
                  <span style="font-size: 11px; color: #909399;">{{ record.timestamp }}</span>
                </div>
                <div style="font-size: 12px; color: #606266;">{{ record.content }}</div>
                <div style="font-size: 11px; color: #909399; margin-top: 4px;">操作人：{{ record.operator }}</div>
                <div v-if="record.responsible" style="margin-top: 4px; font-size: 11px; color: #67c23a;">
                  <el-icon style="margin-right: 2px;"><User /></el-icon>
                  转交至：{{ record.responsible.name }}（{{ getRoleLabel(record.responsible.role) }}）
                </div>
                <div v-if="record.transferNote" style="margin-top: 3px; font-size: 11px; color: #e6a23c;">
                  <el-icon style="margin-right: 2px;"><SwitchButton /></el-icon>
                  移交说明：{{ record.transferNote }}
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showAddNote" title="补充说明" width="480px">
      <el-form>
        <el-form-item label="说明内容">
          <el-input
            v-model="noteContent"
            type="textarea"
            :rows="4"
            placeholder="请输入需要补充的说明，将永久记录在操作历史中..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddNote = false">取消</el-button>
        <el-button type="primary" @click="handleAddNote" :disabled="!noteContent.trim()">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCompleteRefund" title="退款收尾" width="520px" :close-on-click-modal="false">
      <div v-if="order" style="display: flex; flex-direction: column; gap: 16px;">
        <el-alert type="success" :closable="false" show-icon>
          <template #title>退款同意 · 等待收尾</template>
          退款协商已通过，当前等待确认退款到账后归档。
        </el-alert>

        <div style="padding: 12px 16px; background: #f5f7fa; border-radius: 8px; display: flex; gap: 24px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 12px; color: #909399;">客户</div>
            <div style="font-size: 14px; font-weight: 600;">{{ order.customerName }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #909399;">退款金额</div>
            <div style="font-size: 14px; font-weight: 600; color: #f56c6c;">¥{{ order.refundAmount.toLocaleString() }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #909399;">当前责任人</div>
            <div>
              <span class="responsible-badge">{{ order.currentResponsible?.name }}（{{ getRoleLabel(order.currentResponsible?.role) }}）</span>
            </div>
          </div>
        </div>

        <div v-if="order.refundNegotiation?.finalAgreement" style="padding: 10px 14px; background: #f0f9eb; border-radius: 6px; border-left: 3px solid #67c23a;">
          <div style="font-size: 12px; color: #67c23a; font-weight: 600; margin-bottom: 4px;">
            <el-icon style="margin-right: 4px;"><CircleCheck /></el-icon>最终协议
          </div>
          <div style="font-size: 13px; color: #606266;">{{ order.refundNegotiation.finalAgreement }}</div>
        </div>

        <el-form label-position="top">
          <el-form-item label="退款到账说明（选填）">
            <el-input
              v-model="completeRefundNote"
              type="textarea"
              :rows="2"
              placeholder="如退款到账时间、退款方式、退款流水号等..."
            />
          </el-form-item>
        </el-form>

        <div style="padding: 12px; background: #ecf5ff; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
          <el-icon color="#409eff"><InfoFilled /></el-icon>
          <div style="font-size: 12px; color: #606266;">
            <strong>确认后：</strong>状态变更为「已归档」，责任人清空，所有协商记录与退款信息永久保存。
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCompleteRefund = false">取消</el-button>
        <el-button type="warning" @click="handleCompleteRefund">
          <el-icon style="margin-right: 4px;"><Wallet /></el-icon>确认退款到账并归档
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { store, actions } from '../data/store.js'
import { ORDER_STATUS, ROLES, ACTION_TYPES } from '../data/constants.js'

const props = defineProps({
  order: { type: Object, required: true }
})

const emit = defineEmits(['openRefund', 'openWriteoff', 'openSupplement'])

const activeTab = ref('basic')
const showAddNote = ref(false)
const noteContent = ref('')
const showCompleteRefund = ref(false)
const completeRefundNote = ref('')

watch(() => props.order?.id, () => {
  activeTab.value = 'basic'
})

const permissions = computed(() => store.rolePermissions)

const canProcessRefund = computed(() => {
  if (!permissions.value.canNegotiate) return false
  return [ORDER_STATUS.REFUND_NEGOTIATING.value, ORDER_STATUS.REFUND_SUPPLEMENT.value].includes(props.order.currentStatus)
})

const canWriteoff = computed(() => {
  if (!permissions.value.canWriteoff) return false
  return props.order.currentStatus === ORDER_STATUS.TREATMENT_WRITEOFF.value
})

const canSupplement = computed(() => {
  if (!permissions.value.canSupplement) return false
  return props.order.currentStatus === ORDER_STATUS.REFUND_SUPPLEMENT.value
})

const canCompleteRefund = computed(() => {
  if (!permissions.value.canCompleteRefund) return false
  return props.order.currentStatus === ORDER_STATUS.REFUND_APPROVED.value
})

const getStatusLabel = (status) => ORDER_STATUS[status]?.label || status
const getStatusClass = (status) => ORDER_STATUS[status]?.className || 'status-pending'
const getRoleLabel = (role) => ROLES[role]?.label || role || '客户'

const getHistoryTagType = (action) => {
  if (action.includes('驳回') || action.includes('拒绝')) return 'danger'
  if (action.includes('同意') || action.includes('通过') || action.includes('完成') || action.includes('归档') || action.includes('核销')) return 'success'
  if (action.includes('补录') || action.includes('补充') || action.includes('待')) return 'warning'
  if (action.includes('状态变更') || action.includes('移交')) return 'info'
  return ''
}

const treatmentSteps = computed(() => {
  const steps = []
  for (let i = 0; i < props.order.treatmentCount; i++) {
    const isCompleted = i < props.order.treatedCount
    const isCurrent = i === props.order.treatedCount
    steps.push({
      title: `第 ${i + 1} 次治疗`,
      description: isCompleted ? '已完成' : (isCurrent ? '待执行' : '未开始'),
      iconComponent: isCompleted ? 'CircleCheck' : (isCurrent ? 'Loading' : 'Circle'),
      color: isCompleted ? '#67c23a' : (isCurrent ? '#409eff' : '#c0c4cc')
    })
  }
  if (props.order.currentStatus === ORDER_STATUS.COMPLETED.value) {
    steps.push({
      title: '已归档',
      description: '疗程全部完成，资料已永久存档',
      iconComponent: 'FolderChecked',
      color: '#909399'
    })
  }
  return steps
})

const writeoffRecords = computed(() => {
  return props.order.history.filter(h =>
    h.action === ACTION_TYPES.WRITE_OFF_TREATMENT
  ).reverse()
})

const refundRelatedRecords = computed(() => {
  return props.order.history.filter(h =>
    h.action === ACTION_TYPES.SUBMIT_REFUND ||
    h.action === ACTION_TYPES.NEGOTIATE_REFUND ||
    h.action === ACTION_TYPES.REQUEST_SUPPLEMENT ||
    h.action === ACTION_TYPES.SUBMIT_SUPPLEMENT ||
    h.action === ACTION_TYPES.APPROVE_REFUND ||
    h.action === ACTION_TYPES.REJECT_REFUND ||
    h.action === ACTION_TYPES.COMPLETE_REFUND
  ).reverse()
})

const handleAddNote = () => {
  if (!noteContent.value.trim()) return
  actions.addNote(props.order.id, noteContent.value.trim())
  ElMessage.success('补充说明已添加')
  showAddNote.value = false
  noteContent.value = ''
}

const handleCompleteRefund = () => {
  actions.completeRefund(props.order.id, completeRefundNote.value.trim())
  ElMessage.success('退款已到账确认，订单已归档')
  showCompleteRefund.value = false
  completeRefundNote.value = ''
}
</script>
