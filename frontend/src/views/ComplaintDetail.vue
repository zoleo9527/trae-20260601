<template>
  <div v-if="complaint">
    <div class="card">
      <div class="card-title" style="justify-content: space-between;">
        <span>📄 投诉详情 - {{ complaint.complaintNo }}</span>
        <span :class="['status-tag', getStatusClass(complaint.status)]">
          {{ getStatusLabel(complaint.status) }}
        </span>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">投诉类型：</span>
          <span class="detail-value">{{ complaint.type }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">涉及区域：</span>
          <span class="detail-value">{{ complaint.orchardArea }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">游客姓名：</span>
          <span class="detail-value">{{ complaint.visitorName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">联系电话：</span>
          <span class="detail-value">{{ complaint.visitorPhone }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">投诉标题：</span>
          <span class="detail-value">{{ complaint.title }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">投诉描述：</span>
          <span class="detail-value">{{ complaint.description }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">登记人：</span>
          <span class="detail-value">{{ complaint.registerByName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">登记时间：</span>
          <span class="detail-value">{{ complaint.registerTime }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">指派给：</span>
          <span class="detail-value">{{ complaint.assignedToName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">指派时间：</span>
          <span class="detail-value">{{ complaint.assignTime || '-' }}</span>
        </div>
      </div>
    </div>

    <div v-if="complaint.responsibilityUnclear" class="card" style="border:2px solid #f56c6c; background:#fef0f0;">
      <div class="card-title" style="color:#f56c6c;">⚠️ 责任归属待确认</div>
      <div class="detail-item" style="grid-column: span 2;">
        <span class="detail-label">责任说明：</span>
        <span class="detail-value">{{ complaint.responsibilityNote || '未填写' }}</span>
      </div>
      <div style="font-size:12px; color:#f56c6c; margin-top:8px;">
        此标记由登记人标注，将在核实、补偿发放、退回、结案全流程中持续保留。各环节处理人请注意责任划分。
      </div>
    </div>

    <div v-if="complaint.verifyResult || complaint.status !== 'PENDING_VERIFY'" class="card">
      <div class="card-title">🔍 现场核实</div>
      <div class="detail-grid">
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">核实结果：</span>
          <span class="detail-value">{{ complaint.verifyResult || '待核实' }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">核实备注：</span>
          <span class="detail-value">{{ complaint.verifyRemark || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">核实时间：</span>
          <span class="detail-value">{{ complaint.verifyTime || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">是否补偿：</span>
          <span class="detail-value">
            {{ complaint.needCompensation === null ? '-' : (complaint.needCompensation ? '是' : '否') }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="complaint.needCompensation || ['PENDING_COMPENSATION', 'COMPENSATING', 'PENDING_CLOSE', 'COMPLETED'].includes(complaint.status)" class="card">
      <div class="card-title">
        <span>🎁 补偿方案</span>
        <span v-if="complaint.status === 'RETURNED'" class="status-tag status-danger" style="margin-left: auto;">
          已退回：{{ complaint.returnReason }}
        </span>
      </div>
      <div class="detail-grid">
        <div v-if="complaint.responsibilityUnclear" class="detail-item" style="grid-column: span 2; padding:8px 0;">
          <span class="detail-label" style="color:#f56c6c;">⚠️ 责任归属待确认：</span>
          <span class="detail-value" style="color:#f56c6c;">{{ complaint.responsibilityNote || '未填写' }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">补偿方案：</span>
          <span class="detail-value">{{ complaint.compensationPlan || '-' }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">补偿物品：</span>
          <span class="detail-value">
            <span v-if="complaint.compensationItems && complaint.compensationItems.length">
              {{ complaint.compensationItems.map(i => `${i.name} ${i.quantity}${i.unit}`).join('、') }}
            </span>
            <span v-else>-</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">折算金额：</span>
          <span class="detail-value">¥{{ complaint.compensationAmount || 0 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">发放人：</span>
          <span class="detail-value">{{ complaint.compensatorName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">领取人：</span>
          <span class="detail-value">{{ complaint.receiverName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">发放时间：</span>
          <span class="detail-value">{{ complaint.compensateTime || '-' }}</span>
        </div>
      </div>
    </div>

    <div v-if="complaint.returnReason" class="card">
      <div class="card-title">↩️ 退回记录</div>
      <div class="detail-grid">
        <div v-if="complaint.responsibilityUnclear" class="detail-item" style="grid-column: span 2; padding:8px 0;">
          <span class="detail-label" style="color:#f56c6c;">⚠️ 责任归属待确认：</span>
          <span class="detail-value" style="color:#f56c6c;">{{ complaint.responsibilityNote || '未填写' }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">退回原因：</span>
          <span class="detail-value">{{ complaint.returnReason }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">退回说明：</span>
          <span class="detail-value">{{ complaint.returnRemark || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">退回时间：</span>
          <span class="detail-value">{{ complaint.returnTime }}</span>
        </div>
      </div>
    </div>

    <div v-if="complaint.status === 'COMPLETED'" class="card">
      <div class="card-title">✅ 结案记录</div>
      <div class="detail-grid">
        <div v-if="complaint.responsibilityUnclear" class="detail-item" style="grid-column: span 2; padding:8px 0;">
          <span class="detail-label" style="color:#f56c6c;">⚠️ 责任归属待确认：</span>
          <span class="detail-value" style="color:#f56c6c;">{{ complaint.responsibilityNote || '未填写' }}</span>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <span class="detail-label">结案说明：</span>
          <span class="detail-value">{{ complaint.closeRemark || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">结案时间：</span>
          <span class="detail-value">{{ complaint.closeTime }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📝 沟通备注</div>
      <div v-if="complaint.remarkList && complaint.remarkList.length">
        <div v-for="remark in complaint.remarkList" :key="remark.id" class="remark-item">
          <div class="remark-header">
            <span>
              <span class="remark-type">{{ remark.type }}</span>
              <span style="margin-left:8px;">{{ remark.operator }}</span>
            </span>
            <span>{{ remark.time }}</span>
          </div>
          <div class="remark-content">{{ remark.content }}</div>
        </div>
      </div>
      <div v-else class="empty">暂无备注</div>

      <div style="margin-top:16px;">
        <div class="form-group">
          <label class="form-label">补充备注</label>
          <textarea v-model="newRemark" class="form-textarea" placeholder="添加新的备注，所有处理人都能看到..."></textarea>
        </div>
        <button class="btn btn-primary btn-sm" @click="handleAddRemark" :disabled="!newRemark.trim()">
          添加备注
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🔄 状态流转</div>
      <div class="timeline">
        <div v-for="(item, index) in complaint.statusHistory" :key="index" class="timeline-item">
          <div class="timeline-status">{{ getStatusLabel(item.status) }}</div>
          <div class="timeline-meta">{{ item.operator }} · {{ item.time }}</div>
          <div v-if="item.remark" class="timeline-remark">{{ item.remark }}</div>
        </div>
      </div>
    </div>

    <div v-if="showActions" class="card">
      <div class="card-title">⚙️ 操作</div>
      <div class="action-bar">
        <button v-if="canClaim" class="btn btn-primary" @click="handleStartVerify">
          开始核实
        </button>
        <button v-if="canVerify" class="btn btn-primary" @click="showVerifyModal = true">
          提交核实结果
        </button>
        <button v-if="canCompensate" class="btn btn-primary" @click="showCompensateModal = true">
          确认发放
        </button>
        <button v-if="canReturn" class="btn btn-warning" @click="showReturnModal = true">
          退回
        </button>
        <button v-if="canClose" class="btn btn-primary" @click="showCloseModal = true">
          结案
        </button>
        <button class="btn btn-default" @click="$router.back()">返回</button>
      </div>
    </div>

    <div v-if="showVerifyModal" class="modal-mask" @click.self="showVerifyModal = false">
      <div class="modal">
        <div class="modal-title">提交核实结果</div>
        <div class="form-group">
          <label class="form-label required">核实结果</label>
          <textarea v-model="verifyForm.result" class="form-textarea" placeholder="现场核实情况说明"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">处理说明/备注</label>
          <textarea v-model="verifyForm.remark" class="form-textarea" placeholder="已采取的措施、后续安排等"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label required">是否需要补偿</label>
          <div style="display:flex; gap:20px;">
            <label><input type="radio" v-model="verifyForm.needCompensation" :value="true" /> 需要补偿</label>
            <label><input type="radio" v-model="verifyForm.needCompensation" :value="false" /> 无需补偿</label>
          </div>
        </div>
        <div v-if="verifyForm.needCompensation">
          <div class="form-group">
            <label class="form-label required">补偿方案</label>
            <input v-model="verifyForm.compensationPlan" class="form-input" placeholder="如：赠送精品桃2斤" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">物品名称</label>
              <input v-model="verifyForm.itemName" class="form-input" placeholder="如：精品桃" />
            </div>
            <div class="form-group">
              <label class="form-label">数量</label>
              <input v-model.number="verifyForm.itemQty" type="number" class="form-input" placeholder="数量" />
            </div>
            <div class="form-group">
              <label class="form-label">单位</label>
              <input v-model="verifyForm.itemUnit" class="form-input" placeholder="如：斤" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">折算金额(元)</label>
            <input v-model.number="verifyForm.amount" type="number" class="form-input" placeholder="0" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showVerifyModal = false">取消</button>
          <button class="btn btn-primary" @click="handleVerify">提交</button>
        </div>
      </div>
    </div>

    <div v-if="showCompensateModal" class="modal-mask" @click.self="showCompensateModal = false">
      <div class="modal">
        <div class="modal-title">确认补偿发放</div>
        <div class="form-group">
          <label class="form-label required">领取人姓名</label>
          <input v-model="compensateForm.receiverName" class="form-input" placeholder="请输入领取人姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">领取人电话</label>
          <input v-model="compensateForm.receiverPhone" class="form-input" placeholder="可选" />
        </div>
        <div class="form-group">
          <label class="form-label">发放备注</label>
          <textarea v-model="compensateForm.remark" class="form-textarea" placeholder="发放时的补充说明"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showCompensateModal = false">取消</button>
          <button class="btn btn-primary" @click="handleCompensate">确认发放</button>
        </div>
      </div>
    </div>

    <div v-if="showReturnModal" class="modal-mask" @click.self="showReturnModal = false">
      <div class="modal">
        <div class="modal-title">退回</div>
        <div class="form-group">
          <label class="form-label required">退回原因</label>
          <select v-model="returnForm.reason" class="form-select">
            <option value="">请选择退回原因</option>
            <option value="补偿方案不合理">补偿方案不合理</option>
            <option value="物品库存不足">物品库存不足</option>
            <option value="信息不完整">信息不完整</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">退回说明</label>
          <textarea v-model="returnForm.remark" class="form-textarea" placeholder="详细说明退回原因"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showReturnModal = false">取消</button>
          <button class="btn btn-warning" @click="handleReturn">确认退回</button>
        </div>
      </div>
    </div>

    <div v-if="showCloseModal" class="modal-mask" @click.self="showCloseModal = false">
      <div class="modal">
        <div class="modal-title">结案</div>
        <div class="form-group">
          <label class="form-label">结案说明</label>
          <textarea v-model="closeForm.remark" class="form-textarea" placeholder="回访结果、游客反馈等"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showCloseModal = false">取消</button>
          <button class="btn btn-primary" @click="handleClose">确认结案</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="card">
    <div class="empty">加载中...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  getComplaintDetail, verifyComplaint, compensateComplaint,
  returnComplaint, closeComplaint, addRemark, claimComplaint
} from '../api/complaint'
import { STATUS_LABEL } from '../constants'

const route = useRoute()
const complaint = ref(null)

const role = ref(localStorage.getItem('currentRole') || 'CUSTOMER_SERVICE')
const userId = ref(localStorage.getItem('currentUserId') || 'u1')

const showVerifyModal = ref(false)
const showCompensateModal = ref(false)
const showReturnModal = ref(false)
const showCloseModal = ref(false)

const newRemark = ref('')

const verifyForm = ref({
  result: '',
  remark: '',
  needCompensation: null,
  compensationPlan: '',
  itemName: '',
  itemQty: 0,
  itemUnit: '',
  amount: 0
})

const compensateForm = ref({
  receiverName: '',
  receiverPhone: '',
  remark: ''
})

const returnForm = ref({
  reason: '',
  remark: ''
})

const closeForm = ref({
  remark: ''
})

const canClaim = computed(() => {
  if (role.value !== 'PICKING_GUIDE') return false
  return complaint.value?.status === 'PENDING_VERIFY'
})

const canVerify = computed(() => {
  if (role.value !== 'PICKING_GUIDE') return false
  return complaint.value?.status === 'VERIFYING' || complaint.value?.status === 'RETURNED'
})

const canCompensate = computed(() => {
  if (role.value !== 'WAREHOUSE_STAFF') return false
  return complaint.value?.status === 'PENDING_COMPENSATION'
})

const canReturn = computed(() => {
  if (role.value !== 'WAREHOUSE_STAFF') return false
  return complaint.value?.status === 'PENDING_COMPENSATION'
})

const canClose = computed(() => {
  if (role.value !== 'CUSTOMER_SERVICE') return false
  return complaint.value?.status === 'PENDING_CLOSE'
})

const showActions = computed(() => {
  return canClaim.value || canVerify.value || canCompensate.value || canReturn.value || canClose.value
})

function getStatusLabel(status) {
  return STATUS_LABEL[status] || status
}

function getStatusClass(status) {
  const map = {
    PENDING_VERIFY: 'status-pending',
    VERIFYING: 'status-processing',
    PENDING_COMPENSATION: 'status-pending',
    COMPENSATING: 'status-processing',
    PENDING_CLOSE: 'status-pending',
    COMPLETED: 'status-success',
    REJECTED: 'status-danger',
    RETURNED: 'status-danger'
  }
  return map[status] || 'status-pending'
}

async function loadDetail() {
  try {
    const res = await getComplaintDetail(route.params.id)
    if (res.code === 0) {
      complaint.value = res.data
    }
  } catch (e) {
    console.error('加载失败', e)
  }
}

async function handleStartVerify() {
  try {
    const res = await claimComplaint(route.params.id, userId.value)
    if (res.code === 0) {
      complaint.value = res.data
      showVerifyModal.value = true
    }
  } catch (e) {
    console.error('认领失败', e)
    alert('认领失败，请重试')
  }
}

async function handleVerify() {
  if (!verifyForm.value.result) {
    alert('请填写核实结果')
    return
  }
  if (verifyForm.value.needCompensation === null) {
    alert('请选择是否需要补偿')
    return
  }
  if (verifyForm.value.needCompensation && !verifyForm.value.compensationPlan) {
    alert('请填写补偿方案')
    return
  }

  const items = []
  if (verifyForm.value.itemName && verifyForm.value.itemQty) {
    items.push({
      name: verifyForm.value.itemName,
      quantity: verifyForm.value.itemQty,
      unit: verifyForm.value.itemUnit || '份'
    })
  }

  try {
    const res = await verifyComplaint(route.params.id, {
      verifyResult: verifyForm.value.result,
      verifyRemark: verifyForm.value.remark,
      needCompensation: verifyForm.value.needCompensation,
      compensationPlan: verifyForm.value.compensationPlan,
      compensationItems: items,
      compensationAmount: verifyForm.value.amount || 0,
      operatorId: userId.value
    })
    if (res.code === 0) {
      showVerifyModal.value = false
      loadDetail()
    }
  } catch (e) {
    console.error('提交失败', e)
  }
}

async function handleCompensate() {
  if (!compensateForm.value.receiverName) {
    alert('请填写领取人姓名')
    return
  }
  try {
    const res = await compensateComplaint(route.params.id, {
      ...compensateForm.value,
      operatorId: userId.value
    })
    if (res.code === 0) {
      showCompensateModal.value = false
      loadDetail()
    }
  } catch (e) {
    console.error('发放失败', e)
  }
}

async function handleReturn() {
  if (!returnForm.value.reason) {
    alert('请选择退回原因')
    return
  }
  try {
    const res = await returnComplaint(route.params.id, {
      returnReason: returnForm.value.reason,
      returnRemark: returnForm.value.remark,
      operatorId: userId.value
    })
    if (res.code === 0) {
      showReturnModal.value = false
      loadDetail()
    }
  } catch (e) {
    console.error('退回失败', e)
  }
}

async function handleClose() {
  try {
    const res = await closeComplaint(route.params.id, {
      closeRemark: closeForm.value.remark,
      operatorId: userId.value
    })
    if (res.code === 0) {
      showCloseModal.value = false
      loadDetail()
    }
  } catch (e) {
    console.error('结案失败', e)
  }
}

async function handleAddRemark() {
  if (!newRemark.value.trim()) return
  try {
    const res = await addRemark(route.params.id, {
      content: newRemark.value,
      operatorId: userId.value,
      type: '补充'
    })
    if (res.code === 0) {
      newRemark.value = ''
      loadDetail()
    }
  } catch (e) {
    console.error('添加备注失败', e)
  }
}

onMounted(() => {
  loadDetail()
})
</script>
