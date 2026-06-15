<template>
  <el-dialog title="量尺单详情" :visible="true" width="800px" @close="$emit('close')">
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
        <p>{{ measure.notes || '无' }}</p>
      </div>
      
      <div v-if="measure.rejected_reason" class="reject-section">
        <h4>驳回原因</h4>
        <p class="reject-reason">{{ measure.rejected_reason }}</p>
      </div>
      
      <div v-if="!quote && measure.status === '待报价'" class="quote-section">
        <h4>创建报价</h4>
        <el-form :model="quoteForm" label-width="100px">
          <div class="quote-grid">
            <el-form-item label="单价(元/米)">
              <el-input v-model.number="quoteForm.unit_price" placeholder="请输入单价" />
            </el-form-item>
            <el-form-item label="数量(米)">
              <el-input v-model.number="quoteForm.quantity" placeholder="请输入数量" :disabled="true" />
            </el-form-item>
            <el-form-item label="总价">
              <el-input v-model.number="quoteForm.total_price" :disabled="true" />
            </el-form-item>
            <el-form-item label="折扣">
              <el-input v-model.number="quoteForm.discount" placeholder="0.1表示9折" />
            </el-form-item>
            <el-form-item label="最终价格">
              <el-input v-model.number="quoteForm.final_price" :disabled="true" />
            </el-form-item>
            <el-form-item label="报价备注">
              <el-input v-model="quoteForm.notes" placeholder="请输入备注" />
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
          <div class="info-item"><span class="label">最终价格：</span>{{ quote.final_price }} 元</div>
          <div class="info-item"><span class="label">报价备注：</span>{{ quote.notes || '-' }}</div>
          <div class="info-item"><span class="label">待补材料：</span>{{ quote.supplementary_materials || '-' }}</div>
          <div class="info-item"><span class="label">报价状态：</span><el-tag :type="getQuoteStatusType(quote.status)">{{ quote.status }}</el-tag></div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
      <el-button type="primary" v-if="!quote && measure.status === '待报价'" @click="createQuote">创建报价</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  measure: {
    type: Object,
    required: true
  },
  quote: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])

const quoteForm = reactive({
  unit_price: '',
  quantity: '',
  total_price: '',
  discount: 0,
  final_price: '',
  notes: ''
})

watch(() => props.measure, (newVal) => {
  if (newVal) {
    const quantity = (newVal.window_width * 2 + 0.2).toFixed(2)
    quoteForm.quantity = parseFloat(quantity)
    updateTotalPrice()
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

const handlePriceChange = () => {
  updateTotalPrice()
}

const handleDiscountChange = () => {
  updateTotalPrice()
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
    window.location.reload()
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}
</script>

<style scoped>
.detail-content {
  max-height: 500px;
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
</style>
