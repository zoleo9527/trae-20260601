<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <div>
            <el-button @click="$router.push('/matchings')">返回列表</el-button>
            <span style="margin-left: 20px">匹配记录详情</span>
          </div>
          <div>
            <template v-if="detail?.status === '待确认'">
              <el-button type="success" @click="showConfirmDialog">确认</el-button>
              <el-button type="warning" @click="showReturnDialog">退回</el-button>
              <el-button @click="showSupplementDialog">补录</el-button>
            </template>
            <el-button
              v-if="detail?.status === '已处理' && userRole === '管理'"
              type="primary"
              @click="showReviewDialog"
            >
              复核
            </el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <div v-loading="loading">
          <el-card v-if="detail" style="margin-bottom: 20px">
            <template #header>
              <span>匹配信息</span>
              <el-tag :type="getStatusType(detail.status)" style="float: right">
                {{ detail.status }}
              </el-tag>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="匹配类型">
                <el-tag size="small">{{ detail.matchType }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="匹配结果">
                {{ detail.matchResult || '待确认' }}
              </el-descriptions-item>
              <el-descriptions-item label="用工单位" :span="2">
                <el-link type="primary" @click="$router.push(`/labor-demands/${detail.laborDemand?.id}`)">
                  {{ detail.laborDemand?.demandNumber }} - {{ detail.laborDemand?.companyName }} - {{ detail.laborDemand?.position }}
                </el-link>
              </el-descriptions-item>
              <el-descriptions-item label="候选人" :span="2">
                <el-link type="primary" @click="$router.push(`/candidates/${detail.candidate?.id}`)">
                  {{ detail.candidate?.name }} - {{ detail.candidate?.phone }}
                </el-link>
                <span style="margin-left: 10px; color: #999">
                  技能：{{ detail.candidate?.skills }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="匹配说明" :span="2">
                {{ detail.matchReason || '无' }}
              </el-descriptions-item>
              <el-descriptions-item label="面试日期">
                {{ detail.interviewDate ? formatDate(detail.interviewDate) : '未安排' }}
              </el-descriptions-item>
              <el-descriptions-item label="入职日期">
                {{ detail.entryDate ? formatDate(detail.entryDate) : '未入职' }}
              </el-descriptions-item>
              <el-descriptions-item label="创建人">
                {{ detail.createdBy?.name }} ({{ detail.createdBy?.role }})
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatTime(detail.createdAt) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card style="margin-bottom: 20px">
            <template #header>
              <span>状态流转（完整追溯链）</span>
            </template>

            <el-steps :active="detail?.statusHistories?.length" align-center>
              <el-step
                v-for="(history, index) in detail?.statusHistories"
                :key="history.id"
                :title="history.newStatus"
                :description="`${history.operator?.name} - ${formatTime(history.createdAt)}`"
              />
            </el-steps>
          </el-card>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="状态历史详情" name="histories">
              <el-card>
                <template #header>
                  <span>状态历史（可追溯）</span>
                </template>

                <el-timeline>
                  <el-timeline-item
                    v-for="history in detail?.statusHistories || []"
                    :key="history.id"
                    :timestamp="formatTime(history.createdAt)"
                    placement="top"
                  >
                    <el-card>
                      <p>
                        <el-tag size="small" :type="getActionType(history.actionType)">
                          {{ history.actionType }}
                        </el-tag>
                        <span style="margin-left: 10px">
                          {{ history.previousStatus || '无' }} → {{ history.newStatus }}
                        </span>
                      </p>
                      <p style="margin-top: 5px; color: #666">
                        操作人：{{ history.operator?.name }}
                        <el-tag size="small" style="margin-left: 5px">
                          {{ history.operator?.role }}
                        </el-tag>
                      </p>
                      <p v-if="history.remark" style="margin-top: 5px; color: #999">
                        {{ history.remark }}
                      </p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </el-card>
            </el-tab-pane>

            <el-tab-pane label="退回/补录/复核记录" name="returns">
              <el-card>
                <template #header>
                  <span>异常处理记录</span>
                </template>

                <el-table :data="detail?.returnRecords || []" stripe>
                  <el-table-column prop="returnType" label="类型">
                    <template #default="{ row }">
                      <el-tag :type="getReturnTypeColor(row.returnType)">{{ row.returnType }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="returnReason" label="原因" />
                  <el-table-column prop="operator.name" label="操作人" />
                  <el-table-column prop="status" label="状态">
                    <template #default="{ row }">
                      <el-tag :type="getReturnStatusColor(row.status)">{{ row.status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="handleRemark" label="处理说明">
                    <template #default="{ row }">
                      {{ row.handleRemark || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="时间">
                    <template #default="{ row }">
                      {{ formatTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-tab-pane>

            <el-tab-pane label="附件" name="attachments">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>附件（旧台账、现场记录、沟通截图）</span>
                    <el-button type="primary" size="small" @click="showUploadDialog">
                      上传附件
                    </el-button>
                  </div>
                </template>

                <el-table :data="detail?.attachments || []" stripe>
                  <el-table-column prop="attachmentType" label="类型">
                    <template #default="{ row }">
                      <el-tag size="small">{{ row.attachmentType }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="fileName" label="文件名" />
                  <el-table-column prop="uploadedBy.name" label="上传人" />
                  <el-table-column prop="createdAt" label="上传时间">
                    <template #default="{ row }">
                      {{ formatTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="danger" link @click="handleDeleteAttachment(row)">
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="confirmDialogVisible" title="确认匹配结果" width="500px">
      <el-form :model="confirmForm" label-width="100px">
        <el-form-item label="匹配结果">
          <el-radio-group v-model="confirmForm.matchResult">
            <el-radio label="同意">同意</el-radio>
            <el-radio label="拒绝">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="confirmForm.matchResult === '同意'" label="面试日期">
          <el-date-picker
            v-model="confirmForm.interviewDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item v-if="confirmForm.matchResult === '同意'" label="入职日期">
          <el-date-picker
            v-model="confirmForm.entryDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="confirmForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="退回" width="500px">
      <el-form :model="returnForm" label-width="100px">
        <el-form-item label="退回原因">
          <el-input
            v-model="returnForm.returnReason"
            type="textarea"
            :rows="3"
            placeholder="请输入退回原因"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="returnForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReturnSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="supplementDialogVisible" title="补录" width="500px">
      <el-form :model="supplementForm" label-width="100px">
        <el-form-item label="补录原因">
          <el-input
            v-model="supplementForm.supplementReason"
            type="textarea"
            :rows="3"
            placeholder="请输入补录原因"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="supplementForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="supplementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSupplementSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="复核" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="复核结果">
          <el-radio-group v-model="reviewForm.reviewResult">
            <el-radio label="通过">通过</el-radio>
            <el-radio label="不通过">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reviewForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReviewSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传附件" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="附件类型">
          <el-select v-model="uploadForm.attachmentType" placeholder="请选择">
            <el-option label="旧台账" value="旧台账" />
            <el-option label="现场记录" value="现场记录" />
            <el-option label="沟通截图" value="沟通截图" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
          >
            <el-button>选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="submitLoading">
          上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'MatchingDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const submitLoading = ref(false)
    const detail = ref(null)
    const activeTab = ref('histories')
    const userRole = ref('')
    const uploadRef = ref(null)

    const confirmDialogVisible = ref(false)
    const returnDialogVisible = ref(false)
    const supplementDialogVisible = ref(false)
    const reviewDialogVisible = ref(false)
    const uploadDialogVisible = ref(false)

    const confirmForm = reactive({
      matchResult: '同意',
      interviewDate: '',
      entryDate: '',
      remark: ''
    })

    const returnForm = reactive({
      returnReason: '',
      remark: ''
    })

    const supplementForm = reactive({
      supplementReason: '',
      remark: ''
    })

    const reviewForm = reactive({
      reviewResult: '通过',
      remark: ''
    })

    const uploadForm = reactive({
      attachmentType: '其他'
    })

    onMounted(() => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        userRole.value = user.role
      }
      loadDetail()
    })

    const loadDetail = async () => {
      try {
        loading.value = true
        detail.value = await api.matchings.getById(route.params.id)
      } catch (error) {
        ElMessage.error('加载详情失败')
      } finally {
        loading.value = false
      }
    }

    const showConfirmDialog = () => {
      Object.keys(confirmForm).forEach(key => {
        confirmForm[key] = ''
      })
      confirmForm.matchResult = '同意'
      confirmDialogVisible.value = true
    }

    const handleConfirmSubmit = async () => {
      try {
        submitLoading.value = true
        await api.matchings.confirm(route.params.id, confirmForm)
        ElMessage.success('确认成功')
        confirmDialogVisible.value = false
        loadDetail()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '确认失败')
      } finally {
        submitLoading.value = false
      }
    }

    const showReturnDialog = () => {
      Object.keys(returnForm).forEach(key => {
        returnForm[key] = ''
      })
      returnDialogVisible.value = true
    }

    const handleReturnSubmit = async () => {
      try {
        if (!returnForm.returnReason) {
          ElMessage.warning('请输入退回原因')
          return
        }
        submitLoading.value = true
        await api.matchings.return(route.params.id, returnForm)
        ElMessage.success('退回成功')
        returnDialogVisible.value = false
        loadDetail()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '退回失败')
      } finally {
        submitLoading.value = false
      }
    }

    const showSupplementDialog = () => {
      Object.keys(supplementForm).forEach(key => {
        supplementForm[key] = ''
      })
      supplementDialogVisible.value = true
    }

    const handleSupplementSubmit = async () => {
      try {
        if (!supplementForm.supplementReason) {
          ElMessage.warning('请输入补录原因')
          return
        }
        submitLoading.value = true
        await api.matchings.supplement(route.params.id, supplementForm)
        ElMessage.success('补录成功')
        supplementDialogVisible.value = false
        loadDetail()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '补录失败')
      } finally {
        submitLoading.value = false
      }
    }

    const showReviewDialog = () => {
      Object.keys(reviewForm).forEach(key => {
        reviewForm[key] = ''
      })
      reviewForm.reviewResult = '通过'
      reviewDialogVisible.value = true
    }

    const handleReviewSubmit = async () => {
      try {
        submitLoading.value = true
        await api.matchings.review(route.params.id, reviewForm)
        ElMessage.success('复核成功')
        reviewDialogVisible.value = false
        loadDetail()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '复核失败')
      } finally {
        submitLoading.value = false
      }
    }

    const showUploadDialog = () => {
      uploadDialogVisible.value = true
    }

    const handleUpload = async () => {
      try {
        submitLoading.value = true
        const file = uploadRef.value.uploadFiles[0]?.raw
        if (!file) {
          ElMessage.warning('请选择文件')
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('entityType', 'MatchingRecord')
        formData.append('entityId', route.params.id)
        formData.append('attachmentType', uploadForm.attachmentType)

        await api.attachments.create(formData)
        ElMessage.success('上传成功')
        uploadDialogVisible.value = false
        uploadRef.value.clearFiles()
        loadDetail()
      } catch (error) {
        ElMessage.error('上传失败')
      } finally {
        submitLoading.value = false
      }
    }

    const handleDeleteAttachment = async (row) => {
      try {
        await api.attachments.delete(row.id)
        ElMessage.success('删除成功')
        loadDetail()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    }

    const getStatusType = (status) => {
      const types = {
        '待确认': 'warning',
        '面试中': 'primary',
        '已入职': 'success',
        '已拒绝': 'danger',
        '已取消': 'info',
        '已处理': 'info',
        '已确认': 'success'
      }
      return types[status] || 'info'
    }

    const getActionType = (actionType) => {
      const types = {
        '创建': 'primary',
        '更新': 'info',
        '状态更新': 'warning',
        '退回': 'danger',
        '补录': 'warning',
        '复核': 'primary',
        '确认': 'success'
      }
      return types[actionType] || 'info'
    }

    const getReturnTypeColor = (type) => {
      const colors = {
        '退回': 'danger',
        '补录': 'warning',
        '复核': 'primary'
      }
      return colors[type] || 'info'
    }

    const getReturnStatusColor = (status) => {
      const colors = {
        '待处理': 'warning',
        '已处理': 'success',
        '已确认': 'primary'
      }
      return colors[status] || 'info'
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-CN')
    }

    return {
      loading,
      submitLoading,
      detail,
      activeTab,
      userRole,
      uploadRef,
      confirmDialogVisible,
      returnDialogVisible,
      supplementDialogVisible,
      reviewDialogVisible,
      uploadDialogVisible,
      confirmForm,
      returnForm,
      supplementForm,
      reviewForm,
      uploadForm,
      loadDetail,
      showConfirmDialog,
      handleConfirmSubmit,
      showReturnDialog,
      handleReturnSubmit,
      showSupplementDialog,
      handleSupplementSubmit,
      showReviewDialog,
      handleReviewSubmit,
      showUploadDialog,
      handleUpload,
      handleDeleteAttachment,
      getStatusType,
      getActionType,
      getReturnTypeColor,
      getReturnStatusColor,
      formatTime,
      formatDate
    }
  }
}
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
