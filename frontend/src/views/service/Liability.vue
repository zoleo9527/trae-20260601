<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { 
  ElCard, 
  ElButton, 
  ElTable, 
  ElTableColumn, 
  ElTag, 
  ElDialog, 
  ElForm, 
  ElFormItem, 
  ElInput, 
  ElMessage, 
  ElPagination,
  ElImage,
  ElDescriptions,
  ElDescriptionsItem,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElTimeline,
  ElTimelineItem,
  ElTabs,
  ElTabPane,
  ElEmpty,
  ElDivider
} from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const orders = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const showLiabilityDialog = ref(false)
const showRejectDialog = ref(false)
const selectedOrder = ref<any>(null)
const rejectRecords = ref<any[]>([])

const liabilityForm = ref({
  responsibility_type: '',
  description: ''
})

const rejectForm = ref({
  reason: '',
  description: ''
})

const submitting = ref(false)

const statusMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  'PENDING': { label: '待分配', type: 'info' },
  'ASSIGNED': { label: '已分配', type: 'warning' },
  'IN_PROGRESS': { label: '安装中', type: 'primary' },
  'COMPLETED': { label: '已完成', type: 'success' },
  'REWORK_REQUESTED': { label: '待返工', type: 'danger' },
  'REWORK_IN_PROGRESS': { label: '返工中', type: 'danger' },
  'REWORK_COMPLETED': { label: '返工完成', type: 'warning' },
  'LIABILITY_PENDING': { label: '待责任判定', type: 'danger' },
  'LIABILITY_DONE': { label: '责任已判定', type: 'success' }
}

const responsibilityTypeMap: Record<string, { label: string; color: string }> = {
  'INSTALLER': { label: '安装师傅责任', color: '#f56c6c' },
  'PRODUCT': { label: '产品质量问题', color: '#e6a23c' },
  'CUSTOMER': { label: '客户使用不当', color: '#409eff' },
  'OTHER': { label: '其他原因', color: '#909399' }
}

const liabilityPendingOrders = computed(() => {
  return orders.value.filter(order => order.status === 'LIABILITY_PENDING')
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return liabilityPendingOrders.value.slice(start, end)
})

const totalOrders = computed(() => liabilityPendingOrders.value.length)

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await api.get<any[]>('/orders')
    orders.value = response
    
    if (route.query.orderId) {
      const order = orders.value.find(o => o.id === Number(route.query.orderId))
      if (order && order.status === 'LIABILITY_PENDING') {
        handleOpenLiability(order)
      }
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const loadRejectRecords = async (orderId: number) => {
  try {
    const response = await api.get<any[]>(`/orders/${orderId}/reject-records`)
    rejectRecords.value = response || []
  } catch (error) {
    console.error('加载驳回记录失败:', error)
    rejectRecords.value = []
  }
}

const handleOpenLiability = async (order: any) => {
  selectedOrder.value = order
  liabilityForm.value = {
    responsibility_type: '',
    description: ''
  }
  await loadRejectRecords(order.id)
  showLiabilityDialog.value = true
}

const handleOpenReject = () => {
  rejectForm.value = {
    reason: '',
    description: ''
  }
  showRejectDialog.value = true
}

const handleSubmitLiability = async () => {
  if (!liabilityForm.value.responsibility_type) {
    ElMessage.error('请选择责任类型')
    return
  }

  submitting.value = true
  try {
    await api.post(`/orders/${selectedOrder.value.id}/liability`, {
      responsibility_type: liabilityForm.value.responsibility_type,
      description: liabilityForm.value.description,
      service_user_id: userStore.user?.id
    })
    ElMessage.success('责任判定提交成功')
    showLiabilityDialog.value = false
    loadOrders()
  } catch (error) {
    console.error('提交责任判定失败:', error)
    ElMessage.error('提交责任判定失败')
  } finally {
    submitting.value = false
  }
}

const handleSubmitReject = async () => {
  if (!rejectForm.value.reason) {
    ElMessage.error('请填写驳回原因')
    return
  }

  submitting.value = true
  try {
    await api.post(`/orders/${selectedOrder.value.id}/reject`, {
      reason: rejectForm.value.reason,
      description: rejectForm.value.description,
      service_user_id: userStore.user?.id
    })
    ElMessage.success('驳回补录提交成功，订单已返回返工状态')
    showRejectDialog.value = false
    showLiabilityDialog.value = false
    loadOrders()
  } catch (error) {
    console.error('提交驳回补录失败:', error)
    ElMessage.error('提交驳回补录失败')
  } finally {
    submitting.value = false
  }
}

const handleViewDetail = (order: any) => {
  router.push(`/history/order/${order.id}`)
}

const getStatusLabel = (status: string) => {
  return statusMap[status]?.label || status
}

const getStatusType = (status: string) => {
  return statusMap[status]?.type || 'info'
}

const getResponsibilityLabel = (type: string) => {
  return responsibilityTypeMap[type]?.label || type
}

const getResponsibilityColor = (type: string) => {
  return responsibilityTypeMap[type]?.color || '#909399'
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="liability-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>责任判定</span>
          <el-button @click="router.push('/service')">
            返回主页
          </el-button>
        </div>
      </template>

      <div class="tips">
        <el-tag type="warning">提示：对返工完成的订单进行责任判定，如需补充信息可驳回补录</el-tag>
      </div>

      <el-table :data="paginatedOrders" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="订单ID" width="80" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="customer_phone" label="客户电话" width="120" />
        <el-table-column prop="product_type" label="产品类型" width="100" />
        <el-table-column prop="product_model" label="产品型号" width="120" />
        <el-table-column prop="address" label="地址" min-width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="installer_name" label="安装师傅" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleOpenLiability(row)"
            >
              责任判定
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalOrders"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showLiabilityDialog" title="责任判定" width="800px">
      <div v-if="selectedOrder">
        <el-tabs>
          <el-tab-pane label="订单信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单ID">{{ selectedOrder.id }}</el-descriptions-item>
              <el-descriptions-item label="客户姓名">{{ selectedOrder.customer_name }}</el-descriptions-item>
              <el-descriptions-item label="客户电话">{{ selectedOrder.customer_phone }}</el-descriptions-item>
              <el-descriptions-item label="安装师傅">{{ selectedOrder.installer_name }}</el-descriptions-item>
              <el-descriptions-item label="地址" :span="2">{{ selectedOrder.address }}</el-descriptions-item>
              <el-descriptions-item label="产品类型">{{ selectedOrder.product_type }}</el-descriptions-item>
              <el-descriptions-item label="产品型号">{{ selectedOrder.product_model }}</el-descriptions-item>
            </el-descriptions>

            <el-divider content-position="left">返工信息</el-divider>

            <el-descriptions :column="2" border v-if="selectedOrder.rework_info">
              <el-descriptions-item label="返工原因">{{ selectedOrder.rework_info?.reason }}</el-descriptions-item>
              <el-descriptions-item label="返工师傅">{{ selectedOrder.rework_info?.installer_name }}</el-descriptions-item>
              <el-descriptions-item label="返工描述" :span="2">{{ selectedOrder.rework_info?.description }}</el-descriptions-item>
              <el-descriptions-item label="漏水照片" :span="2">
                <div class="photo-list" v-if="selectedOrder.rework_info?.leak_photos?.length">
                  <el-image 
                    v-for="(photo, index) in selectedOrder.rework_info.leak_photos" 
                    :key="index"
                    :src="photo"
                    :preview-src-list="selectedOrder.rework_info.leak_photos"
                    fit="cover"
                    class="photo-item"
                  />
                </div>
                <span v-else>无</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="驳回记录">
            <div v-if="rejectRecords.length === 0">
              <el-empty description="暂无驳回记录" />
            </div>
            <el-timeline v-else>
              <el-timeline-item 
                v-for="record in rejectRecords" 
                :key="record.id"
                :timestamp="formatDate(record.created_at)"
                placement="top"
                type="warning"
              >
                <el-card>
                  <div class="reject-record">
                    <div class="reject-reason">
                      <el-tag type="warning">驳回原因：{{ record.reason }}</el-tag>
                    </div>
                    <div class="reject-description" v-if="record.description">
                      <span>详细说明：{{ record.description }}</span>
                    </div>
                    <div class="reject-operator">
                      <span>操作人：{{ record.operator_name }}</span>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>

        <el-divider content-position="left">责任判定</el-divider>

        <el-form :model="liabilityForm" label-width="100px" class="liability-form">
          <el-form-item label="责任类型" required>
            <el-radio-group v-model="liabilityForm.responsibility_type">
              <el-radio value="INSTALLER">安装师傅责任</el-radio>
              <el-radio value="PRODUCT">产品质量问题</el-radio>
              <el-radio value="CUSTOMER">客户使用不当</el-radio>
              <el-radio value="OTHER">其他原因</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="判定说明">
            <el-input 
              v-model="liabilityForm.description" 
              type="textarea" 
              :rows="4"
              placeholder="请输入责任判定说明"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div class="left-actions">
            <el-button type="warning" @click="handleOpenReject">
              驳回补录
            </el-button>
          </div>
          <div class="right-actions">
            <el-button @click="showLiabilityDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSubmitLiability" :loading="submitting">
              提交判定
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showRejectDialog" title="驳回补录" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="驳回原因" required>
          <el-select v-model="rejectForm.reason" placeholder="请选择驳回原因" style="width: 100%">
            <el-option label="照片不清晰" value="照片不清晰" />
            <el-option label="问题描述不完整" value="问题描述不完整" />
            <el-option label="需要补充现场信息" value="需要补充现场信息" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input 
            v-model="rejectForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请输入详细说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="warning" @click="handleSubmitReject" :loading="submitting">
          确认驳回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.liability-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.liability-form {
  margin-top: 20px;
}

.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-item {
  width: 100px;
  height: 100px;
  border-radius: 4px;
}

.reject-record {
  padding: 10px 0;
}

.reject-reason {
  margin-bottom: 10px;
}

.reject-description {
  margin-bottom: 10px;
  color: #666;
}

.reject-operator {
  font-size: 12px;
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.left-actions {
  display: flex;
  gap: 10px;
}

.right-actions {
  display: flex;
  gap: 10px;
}
</style>