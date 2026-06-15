<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { ElCard, ElButton, ElTag, ElTimeline, ElTimelineItem, ElDescriptions, ElDescriptionsItem, ElTable, ElTableColumn, ElImage, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElMessage, ElEmpty, ElRow, ElCol, ElDivider, ElTabs, ElTabPane } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orderId = computed(() => Number(route.params.id))
const order = ref<any>(null)
const parts = ref<any[]>([])
const photos = ref<any[]>([])
const reworkRecords = ref<any[]>([])
const liabilityRecords = ref<any[]>([])
const rejectionRecords = ref<any[]>([])
const progressRecords = ref<any[]>([])
const supervisorQuestions = ref<any[]>([])

const loading = ref(false)
const showQuestionDialog = ref(false)
const questionForm = ref({
  question: ''
})

const statusMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' | 'primary' }> = {
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

const liabilityMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  'INSTALLER': { label: '师傅责任', type: 'danger' },
  'PRODUCT': { label: '产品问题', type: 'warning' },
  'CUSTOMER': { label: '客户原因', type: 'info' },
  'OTHER': { label: '其他', type: '' }
}

const isDispatcher = computed(() => userStore.user?.role === 'DISPATCHER')

const loadOrderDetail = async () => {
  loading.value = true
  try {
    const orderResponse = await api.get<any>(`/orders/${orderId.value}`)
    order.value = orderResponse
    
    const partsResponse = await api.get<any[]>(`/parts?order_id=${orderId.value}`)
    parts.value = partsResponse
    
    const photosResponse = await api.get<any[]>(`/photos?order_id=${orderId.value}`)
    photos.value = photosResponse
    
    const reworkResponse = await api.get<any[]>(`/rework-records?order_id=${orderId.value}`)
    reworkRecords.value = reworkResponse
    
    const liabilityResponse = await api.get<any[]>(`/liability-records?order_id=${orderId.value}`)
    liabilityRecords.value = liabilityResponse
    
    const rejectionResponse = await api.get<any[]>(`/rejection-records?order_id=${orderId.value}`)
    rejectionRecords.value = rejectionResponse
    
    const progressResponse = await api.get<any[]>(`/progress-records?order_id=${orderId.value}`)
    progressRecords.value = progressResponse
    
    const questionsResponse = await api.get<any[]>(`/supervisor-questions?order_id=${orderId.value}`)
    supervisorQuestions.value = questionsResponse
  } catch (error) {
    console.error('加载订单详情失败:', error)
    ElMessage.error('加载订单详情失败')
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}

const handleAskQuestion = async () => {
  if (!questionForm.value.question.trim()) {
    ElMessage.error('请输入追问内容')
    return
  }
  
  try {
    await api.post('/supervisor-questions', {
      order_id: orderId.value,
      question: questionForm.value.question,
      asker_id: userStore.user?.id,
      asker_name: userStore.user?.user?.name || userStore.user?.name,
      created_at: new Date().toISOString()
    })
    ElMessage.success('追问已发送')
    showQuestionDialog.value = false
    questionForm.value.question = ''
    loadOrderDetail()
  } catch (error) {
    console.error('发送追问失败:', error)
    ElMessage.error('发送追问失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getPhotoType = (type: string) => {
  const typeMap: Record<string, string> = {
    'BEFORE': '安装前',
    'DURING': '安装中',
    'AFTER': '安装后',
    'PROBLEM': '问题照片',
    'REWORK': '返工照片'
  }
  return typeMap[type] || type
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<template>
  <div class="order-detail-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="handleBack" icon="ArrowLeft">返回</el-button>
            <span class="title">订单详情 #{{ orderId }}</span>
            <el-tag v-if="order" :type="statusMap[order.status]?.type" size="large">
              {{ statusMap[order.status]?.label }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-button v-if="isDispatcher" type="primary" @click="showQuestionDialog = true">
              主管追问
            </el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!order && !loading" description="订单不存在" />

      <template v-else-if="order">
        <el-tabs>
          <el-tab-pane label="基本信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单ID">{{ order.id }}</el-descriptions-item>
              <el-descriptions-item label="订单状态">
                <el-tag :type="statusMap[order.status]?.type">
                  {{ statusMap[order.status]?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="客户姓名">{{ order.customer_name }}</el-descriptions-item>
              <el-descriptions-item label="客户电话">{{ order.customer_phone }}</el-descriptions-item>
              <el-descriptions-item label="产品类型">{{ order.product_type }}</el-descriptions-item>
              <el-descriptions-item label="产品型号">{{ order.product_model }}</el-descriptions-item>
              <el-descriptions-item label="安装地址" :span="2">{{ order.address }}</el-descriptions-item>
              <el-descriptions-item label="预约时间">{{ formatDate(order.scheduled_time) }}</el-descriptions-item>
              <el-descriptions-item label="实际开始时间">{{ formatDate(order.actual_start_time) }}</el-descriptions-item>
              <el-descriptions-item label="完成时间">{{ formatDate(order.completion_time) }}</el-descriptions-item>
              <el-descriptions-item label="安装师傅">{{ order.installer_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="责任判定">
                <el-tag v-if="order.liability_result" :type="liabilityMap[order.liability_result]?.type">
                  {{ liabilityMap[order.liability_result]?.label }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ order.notes || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="配件清单">
            <el-table :data="parts" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="配件名称" />
              <el-table-column prop="model" label="型号" />
              <el-table-column prop="quantity" label="数量" width="100" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'USED' ? 'success' : 'info'">
                    {{ row.status === 'USED' ? '已使用' : '未使用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="parts.length === 0" description="暂无配件记录" />
          </el-tab-pane>

          <el-tab-pane label="安装照片">
            <div class="photo-grid">
              <div v-for="photo in photos" :key="photo.id" class="photo-item">
                <el-image
                  :src="photo.url || 'https://via.placeholder.com/200x150'"
                  :preview-src-list="photos.map(p => p.url || 'https://via.placeholder.com/800x600')"
                  fit="cover"
                  class="photo-image"
                />
                <div class="photo-info">
                  <el-tag size="small">{{ getPhotoType(photo.type) }}</el-tag>
                  <span class="photo-time">{{ formatDate(photo.created_at) }}</span>
                </div>
                <div v-if="photo.description" class="photo-desc">{{ photo.description }}</div>
              </div>
            </div>
            <el-empty v-if="photos.length === 0" description="暂无照片记录" />
          </el-tab-pane>

          <el-tab-pane label="返工记录">
            <el-table :data="reworkRecords" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="reason" label="返工原因" />
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'">
                    {{ row.status === 'COMPLETED' ? '已完成' : '进行中' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="160">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column prop="completed_at" label="完成时间" width="160">
                <template #default="{ row }">
                  {{ formatDate(row.completed_at) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="reworkRecords.length === 0" description="暂无返工记录" />
          </el-tab-pane>

          <el-tab-pane label="责任判定">
            <el-table :data="liabilityRecords" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="result" label="判定结果" width="120">
                <template #default="{ row }">
                  <el-tag :type="liabilityMap[row.result]?.type">
                    {{ liabilityMap[row.result]?.label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="判定原因" />
              <el-table-column prop="judger_name" label="判定人" width="100" />
              <el-table-column prop="created_at" label="判定时间" width="160">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="liabilityRecords.length === 0" description="暂无责任判定记录" />
          </el-tab-pane>

          <el-tab-pane label="驳回历史">
            <el-timeline v-if="rejectionRecords.length > 0">
              <el-timeline-item
                v-for="record in rejectionRecords"
                :key="record.id"
                :timestamp="formatDate(record.created_at)"
                placement="top"
                :type="record.status === 'RESOLVED' ? 'success' : 'danger'"
              >
                <el-card>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <el-tag :type="record.status === 'RESOLVED' ? 'success' : 'danger'">
                        {{ record.status === 'RESOLVED' ? '已解决' : '待处理' }}
                      </el-tag>
                      <span class="rejector">驳回人: {{ record.rejector_name }}</span>
                    </div>
                    <div class="timeline-body">
                      <p><strong>驳回原因:</strong> {{ record.reason }}</p>
                      <p v-if="record.description"><strong>详细说明:</strong> {{ record.description }}</p>
                      <p v-if="record.resolved_at"><strong>解决时间:</strong> {{ formatDate(record.resolved_at) }}</p>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无驳回记录" />
          </el-tab-pane>

          <el-tab-pane label="进度追踪">
            <el-timeline v-if="progressRecords.length > 0">
              <el-timeline-item
                v-for="record in progressRecords"
                :key="record.id"
                :timestamp="formatDate(record.created_at)"
                placement="top"
                :type="record.status === 'COMPLETED' ? 'success' : 'primary'"
              >
                <el-card>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <el-tag>{{ record.status }}</el-tag>
                    </div>
                    <div class="timeline-body">
                      <p><strong>{{ record.title }}</strong></p>
                      <p v-if="record.description">{{ record.description }}</p>
                      <p v-if="record.operator_name"><strong>操作人:</strong> {{ record.operator_name }}</p>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无进度记录" />
          </el-tab-pane>

          <el-tab-pane label="主管追问">
            <div v-if="supervisorQuestions.length > 0" class="question-list">
              <el-card v-for="question in supervisorQuestions" :key="question.id" class="question-card">
                <div class="question-header">
                  <span class="asker">{{ question.asker_name }}</span>
                  <span class="time">{{ formatDate(question.created_at) }}</span>
                </div>
                <div class="question-content">{{ question.question }}</div>
                <div v-if="question.answer" class="question-answer">
                  <el-divider />
                  <div class="answer-header">
                    <span class="answerer">{{ question.answerer_name }}</span>
                    <span class="time">{{ formatDate(question.answered_at) }}</span>
                  </div>
                  <div class="answer-content">{{ question.answer }}</div>
                </div>
              </el-card>
            </div>
            <el-empty v-else description="暂无追问记录" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-card>

    <el-dialog v-model="showQuestionDialog" title="主管追问" width="500px">
      <el-form :model="questionForm" label-width="80px">
        <el-form-item label="追问内容">
          <el-input
            v-model="questionForm.question"
            type="textarea"
            :rows="4"
            placeholder="请输入追问内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuestionDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAskQuestion">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.order-detail-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.photo-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.photo-image {
  width: 100%;
  height: 150px;
}

.photo-info {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f7fa;
}

.photo-time {
  font-size: 12px;
  color: #909399;
}

.photo-desc {
  padding: 0 10px 10px;
  font-size: 12px;
  color: #606266;
}

.timeline-content {
  padding: 10px 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rejector {
  font-size: 14px;
  color: #606266;
}

.timeline-body p {
  margin: 5px 0;
  font-size: 14px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.question-card {
  margin-bottom: 0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.asker {
  font-weight: bold;
  color: #409eff;
}

.time {
  font-size: 12px;
  color: #909399;
}

.question-content {
  font-size: 14px;
  line-height: 1.6;
}

.question-answer {
  margin-top: 10px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.answerer {
  font-weight: bold;
  color: #67c23a;
}

.answer-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}
</style>