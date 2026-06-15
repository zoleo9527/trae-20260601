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
  ElUpload, 
  ElMessage, 
  ElPagination,
  ElImage,
  ElDescriptions,
  ElDescriptionsItem,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio
} from 'element-plus'
import type { UploadFile } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const orders = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const showReworkDialog = ref(false)
const selectedOrder = ref<any>(null)
const reworkForm = ref({
  reason: '',
  leak_photos: [] as string[],
  description: ''
})
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)

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

const completedOrders = computed(() => {
  return orders.value.filter(order => order.status === 'COMPLETED')
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return completedOrders.value.slice(start, end)
})

const totalOrders = computed(() => completedOrders.value.length)

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await api.get<any[]>('/orders')
    orders.value = response
    
    if (route.query.orderId) {
      const order = orders.value.find(o => o.id === Number(route.query.orderId))
      if (order && order.status === 'COMPLETED') {
        handleOpenRework(order)
      }
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const handleOpenRework = (order: any) => {
  selectedOrder.value = order
  reworkForm.value = {
    reason: '',
    leak_photos: [],
    description: ''
  }
  fileList.value = []
  showReworkDialog.value = true
}

const handleUploadChange = (file: UploadFile) => {
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      reworkForm.value.leak_photos.push(base64)
    }
    reader.readAsDataURL(file.raw)
  }
}

const handleUploadRemove = (file: UploadFile) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    reworkForm.value.leak_photos.splice(index, 1)
  }
}

const handleBeforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleSubmitRework = async () => {
  if (!reworkForm.value.reason) {
    ElMessage.error('请填写返工原因')
    return
  }
  if (reworkForm.value.leak_photos.length === 0) {
    ElMessage.error('请上传漏水照片')
    return
  }

  uploading.value = true
  try {
    await api.post(`/orders/${selectedOrder.value.id}/rework`, {
      reason: reworkForm.value.reason,
      leak_photos: reworkForm.value.leak_photos,
      description: reworkForm.value.description,
      service_user_id: userStore.user?.id
    })
    ElMessage.success('返工申请提交成功')
    showReworkDialog.value = false
    loadOrders()
  } catch (error) {
    console.error('提交返工申请失败:', error)
    ElMessage.error('提交返工申请失败')
  } finally {
    uploading.value = false
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

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="rework-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>返工申请</span>
          <el-button @click="router.push('/service')">
            返回主页
          </el-button>
        </div>
      </template>

      <div class="tips">
        <el-tag type="warning">提示：选择已完成的订单发起返工申请，需上传漏水照片</el-tag>
      </div>

      <el-table :data="paginatedOrders" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="订单ID" width="80" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="customer_phone" label="客户电话" width="120" />
        <el-table-column prop="product_type" label="产品类型" width="100" />
        <el-table-column prop="product_model" label="产品型号" width="120" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
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
              type="warning" 
              size="small" 
              @click="handleOpenRework(row)"
            >
              发起返工
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

    <el-dialog v-model="showReworkDialog" title="发起返工申请" width="600px">
      <div v-if="selectedOrder" class="order-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单ID">{{ selectedOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ selectedOrder.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="客户电话">{{ selectedOrder.customer_phone }}</el-descriptions-item>
          <el-descriptions-item label="安装师傅">{{ selectedOrder.installer_name }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ selectedOrder.address }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="reworkForm" label-width="100px" class="rework-form">
        <el-form-item label="返工原因" required>
          <el-select v-model="reworkForm.reason" placeholder="请选择返工原因" style="width: 100%">
            <el-option label="漏水问题" value="漏水问题" />
            <el-option label="安装不牢固" value="安装不牢固" />
            <el-option label="位置不当" value="位置不当" />
            <el-option label="产品损坏" value="产品损坏" />
            <el-option label="其他问题" value="其他问题" />
          </el-select>
        </el-form-item>
        <el-form-item label="漏水照片" required>
          <el-upload
            v-model:file-list="fileList"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handleUploadChange"
            :on-remove="handleUploadRemove"
            :before-upload="handleBeforeUpload"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">请上传漏水现场照片，最多5张，每张不超过5MB</div>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input 
            v-model="reworkForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请详细描述问题情况"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showReworkDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRework" :loading="uploading">
          提交申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'

export default {
  components: {
    Plus,
    ElIcon
  }
}
</script>

<style scoped>
.rework-page {
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

.order-info {
  margin-bottom: 20px;
}

.rework-form {
  margin-top: 20px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>