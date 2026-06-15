<template>
  <div class="order-detail">
    <div class="header">
      <el-button @click="goBack">返回</el-button>
      <h2>工单详情 - {{ order?.order_no }}</h2>
      <el-tag :type="getRoleTagType(userRole)">{{ getRoleText(userRole) }}</el-tag>
    </div>

    <div v-if="userRole === 'frontdesk'" class="role-hint">
      <el-alert title="前台提示" type="info" show-icon>
        您只能查看工单信息，如需处理请联系维修师或店长。
      </el-alert>
    </div>

    <div v-if="userRole === 'technician'" class="role-hint">
      <el-alert title="维修师提示" type="info" show-icon>
        您可以添加维修记录和领用备件，完成后请点击【完成维修】。
      </el-alert>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <el-card title="工单信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户姓名">{{ order?.customer_name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ order?.phone }}</el-descriptions-item>
            <el-descriptions-item label="设备型号">{{ order?.device_model }}</el-descriptions-item>
            <el-descriptions-item label="设备序列号">{{ order?.device_serial || '-' }}</el-descriptions-item>
            <el-descriptions-item label="问题描述">{{ order?.problem_description }}</el-descriptions-item>
            <el-descriptions-item label="优先级">{{ order?.priority === 'urgent' ? '加急' : '普通' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(order?.status)">{{ getStatusText(order?.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(order?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ order?.created_by }}</el-descriptions-item>
            <el-descriptions-item label="维修师">{{ order?.assigned_to || '待分配' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card title="领用备件">
          <div v-if="issues.length === 0" class="empty">暂无领用记录</div>
          <el-table v-else :data="issues" border>
            <el-table-column prop="spare_part.part_name" label="备件名称" />
            <el-table-column prop="quantity" label="数量" />
            <el-table-column prop="issued_by" label="领用人" />
            <el-table-column prop="issued_at" label="领用时间" />
            <el-table-column prop="returned" label="是否归还">
              <template #default="scope">
                <el-tag :type="scope.row.returned ? 'success' : 'warning'">
                  {{ scope.row.returned ? '已归还' : '未归还' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <template v-if="userRole === 'technician' && !scope.row.returned">
                  <el-button @click="returnPart(scope.row)" type="text">归还</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
          <template v-if="userRole === 'technician'">
            <el-button @click="showIssueDialog = true" type="primary" style="margin-top: 10px">领用备件</el-button>
          </template>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card title="维修时间线">
          <div class="timeline">
            <div v-for="(record, index) in repairRecords" :key="record.id" class="timeline-item">
              <div class="timeline-dot" :class="getRecordDotClass(index)"></div>
              <div class="timeline-content">
                <div class="timeline-time">{{ formatTime(record.created_at) }}</div>
                <div class="timeline-status" :class="getStatusTagType(record.status)">
                  {{ getStatusText(record.status) }}
                </div>
                <div class="timeline-desc">{{ record.description }}</div>
                <div class="timeline-technician">{{ record.technician }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <template v-if="userRole === 'manager'">
          <el-card title="派工操作">
            <el-form :model="assignForm" label-width="80px">
              <el-form-item label="分配维修师">
                <el-select v-model="assignForm.technician" placeholder="请选择维修师">
                  <el-option label="维修师" value="technician" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="assignOrder">分配工单</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </template>

        <template v-if="userRole === 'technician' || userRole === 'manager'">
          <el-card title="添加维修记录">
            <el-form :model="recordForm">
              <el-form-item label="状态">
                <el-select v-model="recordForm.status">
                  <el-option label="待处理" value="pending" />
                  <el-option label="维修中" value="processing" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已取消" value="cancelled" />
                </el-select>
              </el-form-item>
              <el-form-item label="描述">
                <el-textarea v-model="recordForm.description" rows="3" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addRecord">添加记录</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </template>

        <template v-if="userRole === 'technician' && order?.status === 'processing' && order?.assigned_to === user.username">
          <el-card>
            <el-button type="success" @click="finishRepair" style="width: 100%">完成维修</el-button>
          </el-card>
        </template>
      </div>
    </div>

    <el-dialog title="领用备件" v-model="showIssueDialog" width="500px">
      <el-form :model="issueForm">
        <el-form-item label="备件" prop="part_id">
          <el-select v-model="issueForm.part_id">
            <el-option v-for="part in parts" :key="part.id" :label="`${part.part_name} (库存: ${part.stock})`" :value="part.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="issueForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="issueForm.reason" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showIssueDialog = false">取消</el-button>
        <el-button type="primary" @click="issuePart">确定领用</el-button>
      </template>
    </el-dialog>

    <el-dialog title="归还备件" v-model="showReturnDialog" width="400px">
      <el-form :model="returnForm">
        <el-form-item label="原因" prop="reason">
          <el-input v-model="returnForm.reason" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReturn">确定归还</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { repairs, spareParts } from '../api'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const issues = ref([])
const repairRecords = ref([])
const parts = ref([])

const showIssueDialog = ref(false)
const showReturnDialog = ref(false)
const currentIssue = ref(null)

const user = JSON.parse(localStorage.getItem('user') || '{}')
const userRole = computed(() => user.role || 'admin')

const issueForm = reactive({
  part_id: '',
  quantity: 1,
  reason: '',
  issued_by: user.username
})

const returnForm = reactive({
  reason: '',
  returned_by: user.username
})

const recordForm = reactive({
  status: '',
  description: '',
  technician: user.username
})

const assignForm = reactive({
  technician: ''
})

const getStatusTagType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '维修中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getRoleTagType = (role) => {
  const types = {
    admin: 'info',
    frontdesk: 'primary',
    technician: 'success',
    manager: 'warning'
  }
  return types[role] || 'info'
}

const getRoleText = (role) => {
  const texts = {
    admin: '管理员',
    frontdesk: '前台',
    technician: '维修师',
    manager: '店长'
  }
  return texts[role] || role
}

const getRecordDotClass = (index) => {
  if (index === 0) return 'latest'
  return ''
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const loadOrder = async () => {
  const res = await repairs.getOrder(route.params.id)
  order.value = res.data
}

const loadIssues = async () => {
  const res = await spareParts.getOrderIssues(route.params.id)
  issues.value = res.data
  issues.value.forEach(issue => {
    const part = parts.value.find(p => p.id === issue.part_id)
    issue.spare_part = part || { part_name: '未知备件' }
  })
}

const loadRecords = async () => {
  const res = await repairs.getRecords(route.params.id)
  repairRecords.value = res.data.reverse()
}

const loadParts = async () => {
  const res = await spareParts.getParts()
  parts.value = res.data
}

const goBack = () => {
  router.push('/repair-orders')
}

const addRecord = async () => {
  if (!recordForm.status || !recordForm.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  await repairs.createRecord(route.params.id, recordForm)
  recordForm.status = ''
  recordForm.description = ''
  loadRecords()
  loadOrder()
}

const issuePart = async () => {
  if (!issueForm.part_id || issueForm.quantity <= 0) {
    ElMessage.warning('请选择备件并填写数量')
    return
  }
  await spareParts.issuePart(route.params.id, issueForm)
  showIssueDialog.value = false
  issueForm.part_id = ''
  issueForm.quantity = 1
  issueForm.reason = ''
  loadIssues()
  loadRecords()
  loadParts()
}

const returnPart = (issue) => {
  currentIssue.value = issue
  showReturnDialog.value = true
}

const confirmReturn = async () => {
  await spareParts.returnPart(currentIssue.value.id, returnForm)
  showReturnDialog.value = false
  returnForm.reason = ''
  loadIssues()
  loadRecords()
  loadParts()
}

const assignOrder = async () => {
  if (!assignForm.technician) {
    ElMessage.warning('请选择维修师')
    return
  }
  
  await repairs.updateOrder(route.params.id, {
    status: 'processing',
    assigned_to: assignForm.technician
  })
  
  await repairs.createRecord(route.params.id, {
    status: 'processing',
    description: `分配给 ${assignForm.technician}`,
    technician: user.username
  })
  
  ElMessage.success('工单已分配')
  assignForm.technician = ''
  loadOrder()
  loadRecords()
}

const finishRepair = async () => {
  await repairs.updateOrder(route.params.id, {
    status: 'completed'
  })
  
  await repairs.createRecord(route.params.id, {
    status: 'completed',
    description: '维修完成',
    technician: user.username
  })
  
  ElMessage.success('维修完成')
  loadOrder()
  loadRecords()
}

onMounted(async () => {
  await loadOrder()
  await loadParts()
  await loadIssues()
  await loadRecords()
})
</script>

<style scoped>
.order-detail {
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.role-hint {
  margin-bottom: 20px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #eee;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-dot {
  position: absolute;
  left: -17px;
  top: 5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ddd;
}

.timeline-dot.latest {
  background: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}

.timeline-content {
  padding-left: 15px;
}

.timeline-time {
  font-size: 12px;
  color: #999;
}

.timeline-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin: 5px 0;
}

.timeline-desc {
  margin: 5px 0;
}

.timeline-technician {
  font-size: 12px;
  color: #999;
}
</style>
