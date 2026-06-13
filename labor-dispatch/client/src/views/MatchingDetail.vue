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
              <el-button type="warning" @click="showExceptionDrawer('退回')">退回</el-button>
              <el-button @click="showExceptionDrawer('补录')">补录</el-button>
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
              <span>用工需求最新状态</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="状态">
                <el-tag :type="getLaborDemandStatusType(detail?.laborDemand?.status)">
                  {{ detail?.laborDemand?.status || '-' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最新操作">
                <span v-if="detail?.laborDemand?.statusHistories?.[0]">
                  {{ detail.laborDemand.statusHistories[0].operator?.name }} -
                  {{ detail.laborDemand.statusHistories[0].actionType }}
                </span>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card style="margin-bottom: 20px">
            <template #header>
              <span>候选人最新状态</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="状态">
                <el-tag :type="getCandidateStatusType(detail?.candidate?.status)">
                  {{ detail?.candidate?.status || '-' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最新操作">
                <span v-if="detail?.candidate?.statusHistories?.[0]">
                  {{ detail.candidate.statusHistories[0].operator?.name }} -
                  {{ detail.candidate.statusHistories[0].actionType }}
                </span>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="状态历史详情" name="histories">
              <el-card>
                <template #header>
                  <span>匹配记录状态历史</span>
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

              <el-card style="margin-top: 20px">
                <template #header>
                  <span>用工需求状态历史</span>
                </template>

                <el-timeline>
                  <el-timeline-item
                    v-for="history in detail?.laborDemand?.statusHistories || []"
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

              <el-card style="margin-top: 20px">
                <template #header>
                  <span>候选人状态历史</span>
                </template>

                <el-timeline>
                  <el-timeline-item
                    v-for="history in detail?.candidate?.statusHistories || []"
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

    <el-drawer v-model="exceptionDrawerVisible" :title="exceptionTitle" size="500px">
      <el-form :model="exceptionForm" label-width="100px">
        <el-form-item label="异常类型">
          <el-tag :type="exceptionForm.type === '退回' ? 'danger' : 'warning'">
            {{ exceptionForm.type }}
          </el-tag>
        </el-form-item>
        <el-form-item label="匹配信息">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="用工单位">
              {{ detail?.laborDemand?.companyName }}
            </el-descriptions-item>
            <el-descriptions-item label="岗位">
              {{ detail?.laborDemand?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="候选人">
              {{ detail?.candidate?.name }}
            </el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item :label="exceptionForm.type + '原因'" prop="reason">
          <el-input
            v-model="exceptionForm.reason"
            type="textarea"
            :rows="4"
            :placeholder="`请输入${exceptionForm.type}原因`"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="exceptionForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="上传附件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="5"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
          >
            <el-button>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持jpg、png、pdf、doc等格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <div style="text-align: right">
          <el-button @click="exceptionDrawerVisible = false">取消</el-button>
          <el-button type="primary" @click="handleExceptionSubmit" :loading="submitLoading">
            确定{{ exceptionForm.type }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="reviewDialogVisible" title="复核" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="匹配信息">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="用工单位">
              {{ detail?.laborDemand?.companyName }}
            </el-descriptions-item>
            <el-descriptions-item label="岗位">
              {{ detail?.laborDemand?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="候选人">
              {{ detail?.candidate?.name }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag>{{ detail?.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-form-item>
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
    const exceptionDrawerVisible = ref(false)
    const reviewDialogVisible = ref(false)
    const uploadDialogVisible = ref(false)

    const confirmForm = reactive({
      matchResult: '同意',
      interviewDate: '',
      entryDate: '',
      remark: ''
    })

    const exceptionForm = reactive({
      type: '退回',
      reason: '',
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

    const showExceptionDrawer = (type) => {
      exceptionForm.type = type
      exceptionForm.reason = ''
      exceptionForm.remark = ''
      exceptionDrawerVisible.value = true
    }

    const handleExceptionSubmit = async () => {
      try {
        if (!exceptionForm.reason) {
          ElMessage.warning(`请输入${exceptionForm.type}原因`)
          return
        }
        submitLoading.value = true

        const data = {
          remark: exceptionForm.remark
        }

        if (exceptionForm.type === '退回') {
          data.returnReason = exceptionForm.reason
          await api.matchings.return(route.params.id, data)
        } else {
          data.supplementReason = exceptionForm.reason
          await api.matchings.supplement(route.params.id, data)
        }

        ElMessage.success(`${exceptionForm.type}成功`)
        exceptionDrawerVisible.value = false
        loadDetail()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || `${exceptionForm.type}失败`)
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
        '已处理': 'success',
        '待处理': 'warning',
        '已确认': 'success'
      }
      return types[status] || 'info'
    }

    const getLaborDemandStatusType = (status) => {
      const types = {
        '待处理': 'info',
        '处理中': 'warning',
        '匹配中': 'primary',
        '已完成': 'success',
        '已取消': 'danger'
      }
      return types[status] || 'info'
    }

    const getCandidateStatusType = (status) => {
      const types = {
        '待匹配': 'info',
        '匹配中': 'warning',
        '已推荐': 'primary',
        '已入职': 'success',
        '已离职': 'danger'
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
        '确认': 'success',
        '批量确认': 'success',
        '批量退回': 'danger'
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
      exceptionDrawerVisible,
      reviewDialogVisible,
      uploadDialogVisible,
      confirmForm,
      exceptionForm,
      reviewForm,
      uploadForm,
      loadDetail,
      showConfirmDialog,
      handleConfirmSubmit,
      showExceptionDrawer,
      handleExceptionSubmit,
      showReviewDialog,
      handleReviewSubmit,
      showUploadDialog,
      handleUpload,
      handleDeleteAttachment,
      getStatusType,
      getLaborDemandStatusType,
      getCandidateStatusType,
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
