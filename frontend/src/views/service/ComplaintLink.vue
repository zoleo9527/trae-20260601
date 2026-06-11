<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">投诉归属关联</span>
          <el-tag type="info" size="large">{{ total }} 条待关联</el-tag>
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
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">{{ getStatusTag(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投诉关联编号" width="180">
          <template #default="{ row }">
            <span v-if="row.complaint_ref && row.complaint_ref.trim()">{{ row.complaint_ref }}</span>
            <el-tag v-else type="danger" size="small">未关联</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openLinkDialog(row)">关联</el-button>
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

    <el-dialog v-model="linkDialogVisible" title="设置投诉关联" width="440px">
      <el-form label-width="110px">
        <el-form-item label="报修单号">
          <el-input :model-value="currentRepair?.repair_no" disabled />
        </el-form-item>
        <el-form-item label="投诉关联编号">
          <el-input v-model="complaintRef" placeholder="请输入投诉关联编号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveLink" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../api'
import { getStatusTag, getUrgencyTag, formatDateTime } from '../../utils/constants'

const repairs = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const linkDialogVisible = ref(false)
const currentRepair = ref(null)
const complaintRef = ref('')
const saving = ref(false)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await api.get('/repairs/', { params: { complaint_ambiguous: true, page: page.value, page_size: pageSize.value } })
    repairs.value = res.items || res
    total.value = res.total || repairs.value.length
  } catch {
    repairs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const openLinkDialog = (row) => {
  currentRepair.value = row
  complaintRef.value = row.complaint_ref || ''
  linkDialogVisible.value = true
}

const handleSaveLink = async () => {
  if (!complaintRef.value.trim()) {
    ElMessage.warning('请输入投诉关联编号')
    return
  }
  saving.value = true
  try {
    await api.put(`/repairs/${currentRepair.value.id}/complaint-ref`, { complaint_ref: complaintRef.value })
    ElMessage.success('关联成功')
    linkDialogVisible.value = false
    fetchList()
  } catch {
  } finally {
    saving.value = false
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
</style>
