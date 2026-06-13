<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <div>
            <el-button @click="$router.push('/candidates')">返回列表</el-button>
            <span style="margin-left: 20px">候选人详情</span>
          </div>
          <div>
            <el-button type="primary" @click="handleEdit">编辑</el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <div v-loading="loading">
          <el-card v-if="detail" style="margin-bottom: 20px">
            <template #header>
              <span>基本信息</span>
              <el-tag :type="getStatusType(detail.status)" style="float: right">
                {{ detail.status }}
              </el-tag>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="候选人编号">{{ detail.candidateNumber }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
              <el-descriptions-item label="电话">{{ detail.phone }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ detail.email || '无' }}</el-descriptions-item>
              <el-descriptions-item label="技能">{{ detail.skills }}</el-descriptions-item>
              <el-descriptions-item label="工作经验">{{ detail.experience }}</el-descriptions-item>
              <el-descriptions-item label="学历">{{ detail.education || '无' }}</el-descriptions-item>
              <el-descriptions-item label="期望薪资">{{ detail.expectedSalary || '无' }}</el-descriptions-item>
              <el-descriptions-item label="创建人">
                {{ detail.createdBy?.name }} ({{ detail.createdBy?.role }})
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatTime(detail.createdAt) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="匹配记录" name="matchings">
              <el-card>
                <template #header>
                  <span>匹配记录</span>
                </template>

                <el-table :data="detail?.matchingRecords || []" stripe>
                  <el-table-column prop="laborDemand.companyName" label="用工单位" />
                  <el-table-column prop="laborDemand.position" label="岗位" />
                  <el-table-column prop="matchType" label="匹配类型">
                    <template #default="{ row }">
                      <el-tag size="small">{{ row.matchType }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态">
                    <template #default="{ row }">
                      <el-tag :type="getMatchingStatusType(row.status)">{{ row.status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="创建时间">
                    <template #default="{ row }">
                      {{ formatTime(row.createdAt) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="primary" link @click="$router.push(`/matchings/${row.id}`)">
                        查看
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-tab-pane>

            <el-tab-pane label="状态历史" name="histories">
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
                        <el-tag size="small" type="primary">{{ history.actionType }}</el-tag>
                        <span style="margin-left: 10px">
                          {{ history.previousStatus || '无' }} → {{ history.newStatus }}
                        </span>
                      </p>
                      <p style="margin-top: 5px; color: #666">
                        操作人：{{ history.operator?.name }} ({{ history.operator?.role }})
                      </p>
                      <p v-if="history.remark" style="margin-top: 5px; color: #999">
                        {{ history.remark }}
                      </p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </el-card>
            </el-tab-pane>

            <el-tab-pane label="退回/补录/复核" name="returns">
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
  name: 'CandidateDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const detail = ref(null)
    const activeTab = ref('matchings')
    const uploadDialogVisible = ref(false)
    const submitLoading = ref(false)
    const uploadRef = ref(null)

    const uploadForm = reactive({
      attachmentType: '其他'
    })

    onMounted(() => {
      loadDetail()
    })

    const loadDetail = async () => {
      try {
        loading.value = true
        detail.value = await api.candidates.getById(route.params.id)
      } catch (error) {
        ElMessage.error('加载详情失败')
      } finally {
        loading.value = false
      }
    }

    const handleEdit = () => {
      router.push(`/candidates/${route.params.id}/edit`)
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
        formData.append('entityType', 'Candidate')
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
        '待匹配': 'info',
        '匹配中': 'warning',
        '已推荐': 'primary',
        '已入职': 'success',
        '已离职': 'danger'
      }
      return types[status] || 'info'
    }

    const getMatchingStatusType = (status) => {
      const types = {
        '待确认': 'warning',
        '面试中': 'primary',
        '已入职': 'success',
        '已拒绝': 'danger',
        '已取消': 'info'
      }
      return types[status] || 'info'
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

    return {
      loading,
      detail,
      activeTab,
      uploadDialogVisible,
      submitLoading,
      uploadRef,
      uploadForm,
      loadDetail,
      handleEdit,
      showUploadDialog,
      handleUpload,
      handleDeleteAttachment,
      getStatusType,
      getMatchingStatusType,
      getReturnTypeColor,
      getReturnStatusColor,
      formatTime
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
