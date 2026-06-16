<template>
  <el-dialog :title="dialogTitle" :visible="true" width="900px" @close="$emit('close')">
    <div class="detail-content">
      <div class="info-section">
        <h4>客户信息</h4>
        <div class="info-grid">
          <div class="info-item"><span class="label">客户姓名：</span>{{ measure.customer_name }}</div>
          <div class="info-item"><span class="label">联系电话：</span>{{ measure.phone }}</div>
          <div class="info-item"><span class="label">地址：</span>{{ measure.address }}</div>
          <div class="info-item"><span class="label">房型：</span>{{ measure.room_type }}</div>
        </div>
      </div>
      
      <div class="info-section">
        <h4>量尺信息</h4>
        <div class="info-grid">
          <div class="info-item"><span class="label">窗户宽度：</span>{{ measure.window_width }} 米</div>
          <div class="info-item"><span class="label">窗户高度：</span>{{ measure.window_height }} 米</div>
          <div class="info-item"><span class="label">窗帘类型：</span>{{ measure.curtain_type }}</div>
          <div class="info-item"><span class="label">面料：</span>{{ measure.fabric || '-' }}</div>
          <div class="info-item"><span class="label">颜色：</span>{{ measure.color || '-' }}</div>
          <div class="info-item"><span class="label">配件：</span>{{ measure.accessories || '-' }}</div>
        </div>
      </div>
      
      <div class="info-section">
        <h4>备注信息</h4>
        <p class="notes-content">{{ measure.notes || '无' }}</p>
      </div>
      
      <div v-if="measure.rejected_reason" class="reject-section">
        <h4>驳回原因</h4>
        <p class="reject-reason">{{ measure.rejected_reason }}</p>
      </div>
      
      <div v-if="measure.is_urgent" class="urgent-section">
        <h4>催单记录</h4>
        <p class="urgent-info">已催单 <span class="urgent-count">{{ measure.urgent_count }}</span> 次</p>
        <p class="urgent-time" v-if="measure.last_urgent_time">最后催单时间：{{ formatDateTime(measure.last_urgent_time) }}</p>
      </div>
      
      <div v-if="!quote && measure.status === '待报价'" class="quote-section">
        <h4>创建报价</h4>
        <el-form :model="quoteForm" label-width="100px">
          <div class="quote-grid">
            <el-form-item label="单价(元/米)">
              <el-input v-model.number="quoteForm.unit_price" placeholder="请输入单价" @input="updateTotalPrice" />
            </el-form-item>
            <el-form-item label="数量(米)">
              <el-input v-model.number="quoteForm.quantity" placeholder="请输入数量" :disabled="true" />
            </el-form-item>
            <el-form-item label="总价">
              <el-input v-model.number="quoteForm.total_price" :disabled="true" />
            </el-form-item>
            <el-form-item label="折扣">
              <el-input v-model.number="quoteForm.discount" placeholder="0.1表示9折" @input="updateTotalPrice" />
            </el-form-item>
            <el-form-item label="最终价格">
              <el-input v-model.number="quoteForm.final_price" :disabled="true" />
            </el-form-item>
            <el-form-item label="报价备注">
              <el-textarea v-model="quoteForm.notes" placeholder="请输入备注" rows="2" />
            </el-form-item>
          </div>
        </el-form>
      </div>
      
      <div v-if="quote" class="quote-detail">
        <h4>报价详情</h4>
        <div class="info-grid">
          <div class="info-item"><span class="label">报价单号：</span>{{ quote.id }}</div>
          <div class="info-item"><span class="label">单价：</span>{{ quote.unit_price }} 元/米</div>
          <div class="info-item"><span class="label">数量：</span>{{ quote.quantity }} 米</div>
          <div class="info-item"><span class="label">总价：</span>{{ quote.total_price }} 元</div>
          <div class="info-item"><span class="label">折扣：</span>{{ quote.discount || 0 }}</div>
          <div class="info-item"><span class="label">最终价格：</span><span class="price">¥{{ quote.final_price }}</span></div>
          <div class="info-item"><span class="label">报价备注：</span>{{ quote.notes || '-' }}</div>
          <div class="info-item"><span class="label">待补材料：</span>{{ quote.supplementary_materials || '-' }}</div>
          <div class="info-item"><span class="label">报价状态：</span><el-tag :type="getQuoteStatusType(quote.status)">{{ quote.status }}</el-tag></div>
        </div>
        
        <div v-if="quote.rejected_reason" class="reject-section" style="margin-top: 15px;">
          <h4>驳回原因</h4>
          <p class="reject-reason">{{ quote.rejected_reason }}</p>
        </div>
        
        <div v-if="canEditQuote && quote.status === '待确认'" class="edit-quote-section">
          <h4>修改报价</h4>
          <el-form :model="editQuoteForm" label-width="100px">
            <div class="quote-grid">
              <el-form-item label="单价(元/米)">
                <el-input v-model.number="editQuoteForm.unit_price" placeholder="请输入单价" @input="updateEditTotalPrice" />
              </el-form-item>
              <el-form-item label="折扣">
                <el-input v-model.number="editQuoteForm.discount" placeholder="0.1表示9折" @input="updateEditTotalPrice" />
              </el-form-item>
              <el-form-item label="最终价格">
                <el-input v-model.number="editQuoteForm.final_price" :disabled="true" />
              </el-form-item>
              <el-form-item label="报价备注">
                <el-textarea v-model="editQuoteForm.notes" placeholder="请输入备注" rows="2" />
              </el-form-item>
            </div>
          </el-form>
        </div>
        
        <div v-if="showSupplementForm" class="supplement-section">
          <h4>补充材料</h4>
          <el-form :model="supplementForm" label-width="100px">
            <el-form-item label="待补材料">
              <el-textarea v-model="supplementForm.materials" placeholder="请输入需要补充的材料" rows="2" />
            </el-form-item>
            <el-form-item label="额外费用(元)">
              <el-input v-model.number="supplementForm.additional_cost" placeholder="材料额外费用" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
      
      <el-button type="primary" v-if="canCreateQuote && !quote && measure.status === '待报价'" @click="createQuote">创建报价</el-button>
      
      <el-button type="success" v-if="canConfirmQuote && quote && quote.status === '待确认'" @click="confirmQuote">确认报价</el-button>
      
      <el-button type="danger" v-if="canRejectQuote && quote && quote.status === '待确认'" @click="openRejectModal">驳回报价</el-button>
      
      <el-button type="primary" v-if="canEditQuote && quote && quote.status === '待确认'" @click="updateQuote">保存修改</el-button>
      
      <el-button type="warning" v-if="canSupplement && quote && quote.status === '待确认'" @click="showSupplementForm = !showSupplementForm">
        {{ showSupplementForm ? '取消补料' : '补材料' }}
      </el-button>
      
      <el-button type="primary" v-if="showSupplementForm" @click="submitSupplement">确认补料</el-button>
      
      <el-button type="success" v-if="canCompleteSupplement && quote && quote.status === '待补材料'" @click="completeSupplement">完成补料</el-button>
      
      <el-button type="success" v-if="canComplete && quote && quote.status === '已确认'" @click="completeInstall">完成安装</el-button>
      
      <el-button type="primary" v-if="canResubmit && quote && quote.status === '已驳回'" @click="resubmitQuote">重新提交</el-button>
    </template>
  </el-dialog>
  
  <RejectModal v-if="showRejectModal" :title="'驳回报价单'" :target-id="rejectTargetId" :type="'quote'" @close="showRejectModal = false" @success="handleRejectSuccess" />
</template>

<script setup>
import { reactive, watch, ref, computed } from 'vue'
import axios from 'axios'
import RejectModal from './RejectModal.vue'

const props = defineProps({
  measure: {
    type: Object,
    required: true
  },
  quote: {
    type: Object,
    default: null
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

const quoteForm = reactive({
  unit_price: '',
  quantity: '',
  total_price: '',
  discount: 0,
  final_price: '',
  notes: ''
})

const editQuoteForm = reactive({
  unit_price: '',
  quantity: '',
  total_price: '',
  discount: 0,
  final_price: '',
  notes: ''
})

const supplementForm = reactive({
  materials: '',
  additional_cost: 0
})

const showRejectModal = ref(false)
const showSupplementForm = ref(false)
const rejectTargetId = ref('')

const dialogTitle = computed(() => {
  return `量尺单详情 - ${props.measure.customer_name}`
})

const canCreateQuote = computed(() => {
  return props.user && (props.user.role === '量尺师' || props.user.role === '管理员')
})

const canConfirmQuote = computed(() => {
  return props.user && (props.user.role === '安装师傅' || props.user.role === '管理员')
})

const canRejectQuote = computed(() => {
  return props.user && (props.user.role === '安装师傅' || props.user.role === '管理员')
})

const canEditQuote = computed(() => {
  return props.user && (props.user.role === '量尺师' || props.user.role === '管理员')
})

const canSupplement = computed(() => {
  return props.user && (props.user.role === '量尺师' || props.user.role === '管理员')
})

const canCompleteSupplement = computed(() => {
  return props.user && (props.user.role === '量尺师' || props.user.role === '管理员')
})

const canComplete = computed(() => {
  return props.user && (props.user.role === '安装师傅' || props.user.role === '管理员')
})

const canResubmit = computed(() => {
  return props.user && (props.user.role === '量尺师' || props.user.role === '管理员')
})

watch(() => props.measure, (newVal) => {
  if (newVal) {
    const quantity = (newVal.window_width * 2 + 0.2).toFixed(2)
    quoteForm.quantity = parseFloat(quantity)
    updateTotalPrice()
  }
}, { immediate: true })

watch(() => props.quote, (newVal) => {
  if (newVal) {
    editQuoteForm.unit_price = newVal.unit_price
    editQuoteForm.quantity = newVal.quantity
    editQuoteForm.total_price = newVal.total_price
    editQuoteForm.discount = newVal.discount || 0
    editQuoteForm.final_price = newVal.final_price
    editQuoteForm.notes = newVal.notes || ''
  }
}, { immediate: true })

const updateTotalPrice = () => {
  if (quoteForm.unit_price && quoteForm.quantity) {
    const total = quoteForm.unit_price * quoteForm.quantity
    quoteForm.total_price = parseFloat(total.toFixed(2))
    
    const discount = quoteForm.discount || 0
    quoteForm.final_price = parseFloat((total * (1 - discount)).toFixed(2))
  }
}

const updateEditTotalPrice = () => {
  if (editQuoteForm.unit_price && editQuoteForm.quantity) {
    const total = editQuoteForm.unit_price * editQuoteForm.quantity
    editQuoteForm.total_price = parseFloat(total.toFixed(2))
    
    const discount = editQuoteForm.discount || 0
    editQuoteForm.final_price = parseFloat((total * (1 - discount)).toFixed(2))
  }
}

const getQuoteStatusType = (status) => {
  const types = {
    '待确认': 'warning',
    '已确认': 'success',
    '已驳回': 'danger',
    '待补材料': 'primary',
    '已完成': 'success'
  }
  return types[status] || 'default'
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const createQuote = async () => {
  if (!quoteForm.unit_price) {
    alert('请输入单价')
    return
  }
  
  try {
    await axios.post('/api/quotes', {
      measure_id: props.measure.id,
      unit_price: quoteForm.unit_price,
      quantity: quoteForm.quantity,
      total_price: quoteForm.total_price,
      discount: quoteForm.discount,
      final_price: quoteForm.final_price,
      notes: quoteForm.notes
    })
    alert('报价创建成功')
    emit('success')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const confirmQuote = async () => {
  try {
    await axios.post(`/api/quotes/${props.quote.id}/confirm`)
    alert('确认报价成功')
    emit('success')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const openRejectModal = () => {
  rejectTargetId.value = props.quote.id
  showRejectModal.value = true
}

const handleRejectSuccess = () => {
  showRejectModal.value = false
  emit('success')
  window.location.reload()
}

const updateQuote = async () => {
  if (!editQuoteForm.unit_price) {
    alert('请输入单价')
    return
  }
  
  try {
    await axios.put(`/api/quotes/${props.quote.id}`, {
      measure_id: props.measure.id,
      unit_price: editQuoteForm.unit_price,
      quantity: editQuoteForm.quantity,
      total_price: editQuoteForm.total_price,
      discount: editQuoteForm.discount,
      final_price: editQuoteForm.final_price,
      notes: editQuoteForm.notes
    })
    alert('报价修改成功')
    emit('success')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const submitSupplement = async () => {
  if (!supplementForm.materials.trim()) {
    alert('请输入待补材料')
    return
  }
  
  try {
    await axios.post(`/api/quotes/${props.quote.id}/supplement`, {
      materials: supplementForm.materials,
      additional_cost: supplementForm.additional_cost || 0
    })
    alert('补充材料成功')
    showSupplementForm.value = false
    supplementForm.materials = ''
    supplementForm.additional_cost = 0
    emit('success')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const completeSupplement = async () => {
  try {
    await axios.post(`/api/quotes/${props.quote.id}/complete_supplement`)
    alert('完成补料成功')
    emit('success')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const completeInstall = async () => {
  try {
    await axios.post(`/api/quotes/${props.quote.id}/complete`)
    alert('完成安装成功')
    emit('success')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const resubmitQuote = async () => {
  try {
    await axios.post(`/api/quotes/${props.quote.id}/resubmit`)
    alert('重新提交成功，等待安装师傅确认')
    emit('success')
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}
</script>

<style scoped>
.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.info-section:last-child {
  border-bottom: none;
}

.info-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.info-item {
  font-size: 14px;
  color: #666;
}

.info-item .label {
  color: #999;
}

.info-item .price {
  font-weight: bold;
  color: #e74c3c;
  font-size: 16px;
}

.notes-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
}

.reject-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #fff5f5;
  border-radius: 8px;
}

.reject-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #e74c3c;
  margin-bottom: 10px;
}

.reject-reason {
  font-size: 14px;
  color: #e74c3c;
}

.urgent-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #fffbe6;
  border-radius: 8px;
}

.urgent-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #faad14;
  margin-bottom: 10px;
}

.urgent-info {
  font-size: 14px;
  color: #d48806;
}

.urgent-count {
  font-weight: bold;
  color: #e74c3c;
}

.urgent-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.quote-section {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quote-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.quote-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.quote-detail {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quote-detail h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.edit-quote-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

.supplement-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}
</style>