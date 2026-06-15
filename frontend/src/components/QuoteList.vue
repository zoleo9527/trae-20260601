<template>
  <div class="quote-list">
    <div class="header-bar">
      <h3>报价确认管理</h3>
      <div class="actions">
        <el-select v-model="statusFilter" placeholder="全部状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="待确认" value="待确认" />
          <el-option label="已确认" value="已确认" />
          <el-option label="已驳回" value="已驳回" />
          <el-option label="待补材料" value="待补材料" />
          <el-option label="已完成" value="已完成" />
        </el-select>
      </div>
    </div>
    
    <div class="stats-row">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
    
    <el-table :data="filteredQuotesWithMeasure" border>
      <el-table-column prop="id" label="报价单号" width="100" />
      <el-table-column prop="measure_id" label="量尺单号" width="100" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="phone" label="联系电话" width="120" />
      <el-table-column prop="room_type" label="房型" width="80" />
      <el-table-column prop="unit_price" label="单价(元/米)" width="120" />
      <el-table-column prop="quantity" label="数量(米)" width="100" />
      <el-table-column prop="final_price" label="最终价格" width="120">
        <template #default="scope">
          <span class="price">¥{{ scope.row.final_price }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150" />
      <el-table-column prop="notes" label="备注" min-width="150" />
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button size="small" @click="viewQuote(scope.row)">查看</el-button>
          <el-button size="small" type="success" v-if="canConfirm(scope.row)" @click="confirmQuote(scope.row)">确认报价</el-button>
          <el-button size="small" type="danger" v-if="canReject(scope.row)" @click="openRejectModal(scope.row)">驳回</el-button>
          <el-button size="small" type="warning" v-if="canSupplement(scope.row)" @click="openSupplementModal(scope.row)">补材料</el-button>
          <el-button size="small" type="primary" v-if="canComplete(scope.row)" @click="completeQuote(scope.row)">完成安装</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <QuoteDetail v-if="showDetailModal" :quote="viewingQuote" :measure="viewingMeasure" @close="showDetailModal = false" />
    <RejectModal v-if="showRejectModal" :title="'驳回报价单'" :target-id="rejectTargetId" :type="'quote'" @close="showRejectModal = false" @success="loadQuotes" />
    <SupplementModal v-if="showSupplementModal" :quote="supplementingQuote" @close="showSupplementModal = false" @success="loadQuotes" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import QuoteDetail from './QuoteDetail.vue'
import RejectModal from './RejectModal.vue'
import SupplementModal from './SupplementModal.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

defineEmits(['refresh'])

const quotes = ref([])
const measures = ref([])
const statusFilter = ref('')
const showDetailModal = ref(false)
const showRejectModal = ref(false)
const showSupplementModal = ref(false)
const viewingQuote = ref(null)
const viewingMeasure = ref(null)
const supplementingQuote = ref(null)
const rejectTargetId = ref('')

const filteredQuotesWithMeasure = computed(() => {
  let result = quotes.value.map(quote => {
    const measure = measures.value.find(m => m.id === quote.measure_id)
    return {
      ...quote,
      customer_name: measure?.customer_name || '-',
      phone: measure?.phone || '-',
      room_type: measure?.room_type || '-',
      notes: measure?.notes || quote.notes || '-'
    }
  })
  
  if (statusFilter.value) {
    result = result.filter(q => q.status === statusFilter.value)
  }
  
  return result
})

const stats = computed(() => {
  const total = quotes.value.length
  const pending = quotes.value.filter(q => q.status === '待确认').length
  const confirmed = quotes.value.filter(q => q.status === '已确认').length
  const rejected = quotes.value.filter(q => q.status === '已驳回').length
  const supplement = quotes.value.filter(q => q.status === '待补材料').length
  
  return [
    { label: '总报价', value: total, color: '#667eea' },
    { label: '待确认', value: pending, color: '#f5a623' },
    { label: '已确认', value: confirmed, color: '#27ae60' },
    { label: '已驳回', value: rejected, color: '#e74c3c' },
    { label: '待补材料', value: supplement, color: '#9b59b6' }
  ]
})

const getStatusType = (status) => {
  const types = {
    '待确认': 'warning',
    '已确认': 'success',
    '已驳回': 'danger',
    '待补材料': 'primary',
    '已完成': 'success'
  }
  return types[status] || 'default'
}

const canConfirm = (row) => {
  return (props.user.role === '安装师傅' || props.user.role === '管理员') && 
         row.status === '待确认'
}

const canReject = (row) => {
  return (props.user.role === '安装师傅' || props.user.role === '管理员') && 
         row.status === '待确认'
}

const canSupplement = (row) => {
  return (props.user.role === '量尺师' || props.user.role === '管理员') && 
         row.status === '待确认'
}

const canComplete = (row) => {
  return (props.user.role === '安装师傅' || props.user.role === '管理员') && 
         row.status === '已确认'
}

const loadQuotes = async () => {
  try {
    const [quotesRes, measuresRes] = await Promise.all([
      axios.get('/api/quotes'),
      axios.get('/api/measures')
    ])
    quotes.value = quotesRes.data
    measures.value = measuresRes.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const viewQuote = async (quote) => {
  viewingQuote.value = quote
  viewingMeasure.value = measures.value.find(m => m.id === quote.measure_id)
  showDetailModal.value = true
}

const confirmQuote = async (quote) => {
  try {
    await axios.post(`/api/quotes/${quote.id}/confirm`)
    loadQuotes()
    alert('确认成功')
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const openRejectModal = (quote) => {
  rejectTargetId.value = quote.id
  showRejectModal.value = true
}

const openSupplementModal = (quote) => {
  supplementingQuote.value = quote
  showSupplementModal.value = true
}

const completeQuote = async (quote) => {
  try {
    await axios.post(`/api/quotes/${quote.id}/complete`)
    loadQuotes()
    alert('完成安装')
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

onMounted(() => {
  loadQuotes()
})
</script>

<style scoped>
.quote-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-bar h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-select {
  width: 150px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.price {
  font-weight: bold;
  color: #e74c3c;
  font-size: 16px;
}
</style>
