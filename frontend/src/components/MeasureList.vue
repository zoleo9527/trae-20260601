<template>
  <div class="measure-list">
    <div class="header-bar">
      <h3>业务接力</h3>
      <div class="actions">
        <el-button type="primary" @click="showAddModal = true" v-if="canAdd">
          <el-icon><Plus /></el-icon>
          新增量尺
        </el-button>
        <el-select v-model="statusFilter" placeholder="全部状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="待报价" value="待报价" />
          <el-option label="已报价" value="已报价" />
          <el-option label="已驳回" value="已驳回" />
          <el-option label="待补材料" value="待补材料" />
          <el-option label="已确认" value="已确认" />
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
    
    <el-table :data="filteredMeasures" border>
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="phone" label="联系电话" width="120" />
      <el-table-column prop="address" label="地址" min-width="150" />
      <el-table-column prop="room_type" label="房型" width="80" />
      <el-table-column prop="curtain_type" label="窗帘类型" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <div class="status-cell">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            <el-tag v-if="scope.row.is_urgent" type="danger" size="small" class="urgent-tag">
              <el-icon><Bell /></el-icon>
              已催{{ scope.row.urgent_count }}次
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150" />
      <el-table-column prop="notes" label="备注" min-width="150" />
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button size="small" @click="viewMeasure(scope.row)">查看</el-button>
          <el-button size="small" type="primary" v-if="canEdit(scope.row)" @click="editMeasure(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" v-if="canReject(scope.row)" @click="openRejectModal(scope.row)">驳回</el-button>
          <el-button size="small" type="success" v-if="canResubmit(scope.row)" @click="resubmitMeasure(scope.row)">重新提交</el-button>
          <el-button size="small" type="warning" @click="urgentMeasure(scope.row)" v-if="canUrgent(scope.row)">
            <el-icon><Bell /></el-icon>
            {{ scope.row.is_urgent ? '再次催单' : '催单' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <MeasureModal v-if="showAddModal || showEditModal" :measure="editingMeasure" :is-edit="showEditModal" @close="closeModal" @success="loadMeasures" />
    <MeasureDetail v-if="showDetailModal" :measure="viewingMeasure" :quote="viewingQuote" :user="props.user" @close="showDetailModal = false" @success="loadMeasures" />
    <RejectModal v-if="showRejectModal" :title="'驳回量尺单'" :target-id="rejectTargetId" :type="'measure'" @close="showRejectModal = false" @success="loadMeasures" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import axios from 'axios'
import MeasureModal from './MeasureModal.vue'
import MeasureDetail from './MeasureDetail.vue'
import RejectModal from './RejectModal.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const measures = ref([])
const statusFilter = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showRejectModal = ref(false)
const editingMeasure = ref(null)
const viewingMeasure = ref(null)
const viewingQuote = ref(null)
const rejectTargetId = ref('')

const canAdd = computed(() => props.user.role === '导购' || props.user.role === '管理员')

const filteredMeasures = computed(() => {
  if (!statusFilter.value) return measures.value
  return measures.value.filter(m => m.status === statusFilter.value)
})

const stats = computed(() => {
  const total = measures.value.length
  const pending = measures.value.filter(m => m.status === '待报价').length
  const quoted = measures.value.filter(m => m.status === '已报价').length
  const rejected = measures.value.filter(m => m.status === '已驳回').length
  const supplement = measures.value.filter(m => m.status === '待补材料').length
  
  return [
    { label: '总量尺', value: total, color: '#667eea' },
    { label: '待报价', value: pending, color: '#f5a623' },
    { label: '已报价', value: quoted, color: '#3498db' },
    { label: '已驳回', value: rejected, color: '#e74c3c' },
    { label: '待补材料', value: supplement, color: '#9b59b6' }
  ]
})

const getStatusType = (status) => {
  const types = {
    '待报价': 'warning',
    '已报价': 'info',
    '已驳回': 'danger',
    '待补材料': 'primary',
    '已确认': 'success',
    '已完成': 'success'
  }
  return types[status] || 'default'
}

const canEdit = (row) => {
  return (props.user.role === '导购' || props.user.role === '管理员') && 
         (row.status === '待报价' || row.status === '已驳回')
}

const canReject = (row) => {
  return (props.user.role === '量尺师' || props.user.role === '管理员') && 
         row.status === '待报价'
}

const canResubmit = (row) => {
  return (props.user.role === '导购' || props.user.role === '管理员') && 
         row.status === '已驳回'
}

const canQuote = (row) => {
  return (props.user.role === '量尺师' || props.user.role === '管理员') && 
         row.status === '待报价'
}

const canUrgent = (row) => {
  return (props.user.role === '导购' || props.user.role === '管理员') && 
         (row.status === '待报价' || row.status === '已报价' || row.status === '待确认' || row.status === '待补材料')
}

const loadMeasures = async () => {
  try {
    const response = await axios.get('/api/measures')
    measures.value = response.data
  } catch (error) {
    console.error('加载量尺单失败:', error)
  }
}

const viewMeasure = async (measure) => {
  viewingMeasure.value = measure
  try {
    const response = await axios.get(`/api/measures/${measure.id}/quote`)
    viewingQuote.value = response.data
  } catch (error) {
    viewingQuote.value = null
  }
  showDetailModal.value = true
}

const editMeasure = (measure) => {
  editingMeasure.value = { ...measure }
  showEditModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingMeasure.value = null
}

const openRejectModal = (measure) => {
  rejectTargetId.value = measure.id
  showRejectModal.value = true
}

const resubmitMeasure = async (measure) => {
  try {
    await axios.post(`/api/measures/${measure.id}/resubmit`)
    loadMeasures()
    alert('重新提交成功')
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const createQuote = (measure) => {
  viewingMeasure.value = measure
  showDetailModal.value = true
}

const urgentMeasure = async (measure) => {
  try {
    await axios.post(`/api/measures/${measure.id}/urgent`)
    loadMeasures()
    alert('催单成功')
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const handleDetailSuccess = () => {
  loadMeasures()
  emit('refresh')
}

onMounted(() => {
  loadMeasures()
})
</script>

<style scoped>
.measure-list {
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

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.urgent-tag {
  margin-top: 4px;
}
</style>
