<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">待受理报修</span>
          <el-tag type="info" size="large">{{ total }} 条待处理</el-tag>
        </div>
      </template>
      <el-table :data="repairs" stripe border v-loading="loading">
        <el-table-column prop="repair_no" label="单号" width="150" />
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="location" label="位置" width="130" show-overflow-tooltip />
        <el-table-column label="紧急程度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getUrgencyTag(row.urgency).type" size="small">{{ getUrgencyTag(row.urgency).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="场景标签" width="200" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.activity_occupation" type="warning" size="small" class="scene-tag">活动占道</el-tag>
            <el-tag v-if="row.tenant_timeout" type="danger" size="small" class="scene-tag">租户超时</el-tag>
            <el-tag v-if="row.complaint_ambiguous" size="small" class="scene-tag" color="#9B59B6" style="color:#fff;border:none">投诉归属不清</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SLA倒计时" width="120" align="center">
          <template #default="{ row }">
            <template v-if="computeSlaRemaining(row.sla_deadline)">
              <span :class="{ 'sla-overdue': computeSlaRemaining(row.sla_deadline).overdue, 'sla-warning': computeSlaRemaining(row.sla_deadline).warning }">
                {{ computeSlaRemaining(row.sla_deadline).text }}
              </span>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/service/repairs/${row.id}`)">查看</el-button>
            <el-button type="success" link size="small" @click="openAcceptDialog(row)">受理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <el-dialog v-model="acceptDialogVisible" title="确认受理并派单" width="560px">
      <p style="margin-bottom: 8px; color: #909399">受理后系统将自动创建工程派单，无需另外通知工程部</p>
      <el-descriptions :column="1" border size="small" style="margin-top: 12px">
        <el-descriptions-item label="单号">{{ currentRepair?.repair_no }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ currentRepair?.title }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyTag(currentRepair?.urgency).type" size="small">{{ getUrgencyTag(currentRepair?.urgency).label }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-form ref="acceptFormRef" :model="acceptForm" :rules="acceptRules" label-width="100px" style="margin-top: 16px">
        <el-form-item label="派单内容" prop="work_content">
          <el-input v-model="acceptForm.work_content" type="textarea" :rows="3" placeholder="请填写派单工作内容" />
        </el-form-item>
        <el-form-item label="工种" prop="work_type">
          <el-select v-model="acceptForm.work_type" placeholder="请选择工种" style="width: 100%">
            <el-option label="电气" value="电气" />
            <el-option label="水管" value="水管" />
            <el-option label="空调" value="空调" />
            <el-option label="装修" value="装修" />
            <el-option label="综合" value="综合" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派工程师" prop="engineer_id">
          <el-select v-model="acceptForm.engineer_id" placeholder="请选择工程师" style="width: 100%">
            <el-option v-for="e in engineers" :key="e.id" :label="`${e.display_name}（${e.department}）`" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计工时">
          <el-input-number v-model="acceptForm.estimated_hours" :min="0.5" :max="72" :step="0.5" />
          <span style="margin-left: 8px; color: #909399">小时</span>
        </el-form-item>
        <el-form-item label="受理备注">
          <el-input v-model="acceptForm.remark" type="textarea" :rows="2" placeholder="可选填写受理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAccept" :loading="accepting">确认受理并派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../api'
import { getStatusTag, getUrgencyTag, computeSlaRemaining, formatDateTime } from '../../utils/constants'

const repairs = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const acceptDialogVisible = ref(false)
const currentRepair = ref(null)
const accepting = ref(false)
const engineers = ref([])
const acceptFormRef = ref(null)
const acceptForm = ref({
  work_content: '',
  work_type: '',
  engineer_id: null,
  estimated_hours: 4.0,
  remark: '',
})
const acceptRules = {
  work_content: [{ required: true, message: '请填写派单内容', trigger: 'blur' }],
  engineer_id: [{ required: true, message: '请选择工程师', trigger: 'change' }],
}

const fetchEngineers = async () => {
  try {
    const res = await api.get('/users/', { params: { role: 'engineering' } })
    engineers.value = Array.isArray(res) ? res.filter(u => u.role === 'engineering') : []
  } catch {
    engineers.value = []
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await api.get('/repairs/', { params: { status: 'pending', page: page.value, page_size: pageSize.value } })
    repairs.value = res.items || res
    total.value = res.total || repairs.value.length
  } catch {
    repairs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const openAcceptDialog = (row) => {
  currentRepair.value = row
  acceptForm.value = {
    work_content: '',
    work_type: '',
    engineer_id: null,
    estimated_hours: 4.0,
    remark: '',
  }
  acceptDialogVisible.value = true
  fetchEngineers()
}

const handleAccept = async () => {
  const valid = await acceptFormRef.value.validate().catch(() => false)
  if (!valid) return
  accepting.value = true
  try {
    await api.post(`/repairs/${currentRepair.value.id}/accept`, acceptForm.value)
    ElMessage.success('受理成功，工程派单已自动创建')
    acceptDialogVisible.value = false
    fetchList()
  } catch {
  } finally {
    accepting.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.scene-tag {
  margin: 0 2px;
}
.sla-overdue {
  color: #f56c6c;
  font-weight: 700;
}
.sla-warning {
  color: #e6a23c;
  font-weight: 600;
}
</style>
