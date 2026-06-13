<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2>匹配记录管理</h2>
          <div>
            <el-button type="primary" @click="showBatchConfirmDialog">
              批量确认
            </el-button>
            <el-button type="warning" @click="showBatchReturnDialog">
              批量退回
            </el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <div class="filter-section">
          <el-form :model="filterForm" inline>
            <el-form-item label="状态">
              <el-select v-model="filterForm.status" placeholder="请选择" clearable>
                <el-option label="待确认" value="待确认" />
                <el-option label="面试中" value="面试中" />
                <el-option label="已入职" value="已入职" />
                <el-option label="已拒绝" value="已拒绝" />
                <el-option label="已取消" value="已取消" />
                <el-option label="已处理" value="已处理" />
                <el-option label="待处理" value="待处理" />
              </el-select>
            </el-form-item>
            <el-form-item label="匹配类型">
              <el-select v-model="filterForm.matchType" placeholder="请选择" clearable>
                <el-option label="首次推荐" value="首次推荐" />
                <el-option label="退回重配" value="退回重配" />
                <el-option label="补录" value="补录" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-section">
          <el-table
            :data="tableData"
            v-loading="loading"
            stripe
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="laborDemand.demandNumber" label="需求编号" width="180" />
            <el-table-column prop="laborDemand.companyName" label="用工单位" />
            <el-table-column prop="laborDemand.position" label="岗位" />
            <el-table-column prop="candidate.name" label="候选人" />
            <el-table-column prop="candidate.phone" label="电话" width="130" />
            <el-table-column prop="matchType" label="匹配类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.matchType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="matchResult" label="结果" width="80">
              <template #default="{ row }">
                <span v-if="row.matchResult">{{ row.matchResult }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="异常" width="80">
              <template #default="{ row }">
                <el-badge v-if="row._count?.returnRecords > 0" :value="row._count.returnRecords" class="badge">
                  <el-icon><Warning /></el-icon>
                </el-badge>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleView(row)">查看</el-button>
                <el-button
                  v-if="row.status === '待确认'"
                  type="success"
                  link
                  @click="handleConfirm(row)"
                >
                  确认
                </el-button>
                <el-button
                  v-if="row.status === '待确认'"
                  type="warning"
                  link
                  @click="handleException(row, '退回')"
                >
                  退回
                </el-button>
                <el-button
                  v-if="row.status === '待确认'"
                  type="info"
                  link
                  @click="handleException(row, '补录')"
                >
                  补录
                </el-button>
                <el-button
                  v-if="row.status === '已处理' && userRole === '管理'"
                  type="danger"
                  link
                  @click="handleReview(row)"
                >
                  复核
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-section">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadData"
              @current-change="loadData"
            />
          </div>
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
              {{ currentRecord?.laborDemand?.companyName }}
            </el-descriptions-item>
            <el-descriptions-item label="岗位">
              {{ currentRecord?.laborDemand?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="候选人">
              {{ currentRecord?.candidate?.name }}
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
              {{ currentRecord?.laborDemand?.companyName }}
            </el-descriptions-item>
            <el-descriptions-item label="岗位">
              {{ currentRecord?.laborDemand?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="候选人">
              {{ currentRecord?.candidate?.name }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag>{{ currentRecord?.status }}</el-tag>
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

    <el-dialog v-model="batchConfirmDialogVisible" title="批量确认" width="600px">
      <el-alert
        :title="`已选择 ${selectedRows.length} 条待确认的匹配记录`"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-form :model="batchConfirmForm" label-width="100px">
        <el-form-item label="批量结果">
          <el-radio-group v-model="batchConfirmForm.matchResult">
            <el-radio label="同意">统一同意</el-radio>
            <el-radio label="拒绝">统一拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchConfirmForm.matchResult === '同意'" label="面试日期">
          <el-date-picker
            v-model="batchConfirmForm.interviewDate"
            type="date"
            placeholder="选择日期（可选）"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item v-if="batchConfirmForm.matchResult === '同意'" label="入职日期">
          <el-date-picker
            v-model="batchConfirmForm.entryDate"
            type="date"
            placeholder="选择日期（可选）"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchConfirmForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchConfirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchConfirm" :loading="submitLoading">
          确定批量确认
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchReturnDialogVisible" title="批量退回" width="500px">
      <el-alert
        :title="`已选择 ${selectedRows.length} 条非待确认状态的匹配记录`"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-form :model="batchReturnForm" label-width="100px">
        <el-form-item label="退回原因" prop="returnReason">
          <el-input
            v-model="batchReturnForm.returnReason"
            type="textarea"
            :rows="4"
            placeholder="请输入统一的退回原因"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchReturnForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchReturnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchReturn" :loading="submitLoading">
          确定批量退回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'MatchingList',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const submitLoading = ref(false)
    const userRole = ref('')
    const uploadRef = ref(null)

    const confirmDialogVisible = ref(false)
    const exceptionDrawerVisible = ref(false)
    const reviewDialogVisible = ref(false)
    const batchConfirmDialogVisible = ref(false)
    const batchReturnDialogVisible = ref(false)

    const filterForm = reactive({
      status: '',
      matchType: ''
    })

    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    })

    const tableData = ref([])
    const selectedRows = ref([])
    const currentRecord = ref(null)

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

    const batchConfirmForm = reactive({
      matchResult: '同意',
      interviewDate: '',
      entryDate: '',
      remark: ''
    })

    const batchReturnForm = reactive({
      returnReason: '',
      remark: ''
    })

    onMounted(() => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        userRole.value = user.role
      }
      loadData()
    })

    const loadData = async () => {
      try {
        loading.value = true
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize
        }

        if (filterForm.status) {
          params.status = filterForm.status
        }
        if (filterForm.matchType) {
          params.matchType = filterForm.matchType
        }

        const result = await api.matchings.list(params)
        tableData.value = result.data
        pagination.total = result.total
      } catch (error) {
        ElMessage.error('加载数据失败')
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      pagination.page = 1
      loadData()
    }

    const handleReset = () => {
      filterForm.status = ''
      filterForm.matchType = ''
      pagination.page = 1
      loadData()
    }

    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }

    const handleView = (row) => {
      router.push(`/matchings/${row.id}`)
    }

    const handleConfirm = (row) => {
      currentRecord.value = row
      Object.keys(confirmForm).forEach(key => {
        confirmForm[key] = ''
      })
      confirmForm.matchResult = '同意'
      confirmDialogVisible.value = true
    }

    const handleConfirmSubmit = async () => {
      try {
        submitLoading.value = true
        await api.matchings.confirm(currentRecord.value.id, confirmForm)
        ElMessage.success('确认成功')
        confirmDialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '确认失败')
      } finally {
        submitLoading.value = false
      }
    }

    const handleException = (row, type) => {
      currentRecord.value = row
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
          await api.matchings.return(currentRecord.value.id, data)
        } else {
          data.supplementReason = exceptionForm.reason
          await api.matchings.supplement(currentRecord.value.id, data)
        }

        ElMessage.success(`${exceptionForm.type}成功`)
        exceptionDrawerVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || `${exceptionForm.type}失败`)
      } finally {
        submitLoading.value = false
      }
    }

    const handleReview = (row) => {
      currentRecord.value = row
      Object.keys(reviewForm).forEach(key => {
        reviewForm[key] = ''
      })
      reviewForm.reviewResult = '通过'
      reviewDialogVisible.value = true
    }

    const handleReviewSubmit = async () => {
      try {
        submitLoading.value = true
        await api.matchings.review(currentRecord.value.id, reviewForm)
        ElMessage.success('复核成功')
        reviewDialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '复核失败')
      } finally {
        submitLoading.value = false
      }
    }

    const showBatchConfirmDialog = () => {
      const pendingRows = selectedRows.value.filter(row => row.status === '待确认')
      if (pendingRows.length === 0) {
        ElMessage.warning('请选择待确认状态的记录')
        return
      }
      Object.keys(batchConfirmForm).forEach(key => {
        batchConfirmForm[key] = ''
      })
      batchConfirmForm.matchResult = '同意'
      batchConfirmDialogVisible.value = true
    }

    const handleBatchConfirm = async () => {
      try {
        submitLoading.value = true
        const ids = selectedRows.value.filter(row => row.status === '待确认').map(row => row.id)
        await api.matchings.batchConfirm({
          ids,
          ...batchConfirmForm
        })
        ElMessage.success('批量确认成功')
        batchConfirmDialogVisible.value = false
        selectedRows.value = []
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '批量确认失败')
      } finally {
        submitLoading.value = false
      }
    }

    const showBatchReturnDialog = () => {
      const nonPendingRows = selectedRows.value.filter(row => row.status !== '待确认')
      if (nonPendingRows.length === 0) {
        ElMessage.warning('请选择非待确认状态的记录')
        return
      }
      Object.keys(batchReturnForm).forEach(key => {
        batchReturnForm[key] = ''
      })
      batchReturnDialogVisible.value = true
    }

    const handleBatchReturn = async () => {
      try {
        if (!batchReturnForm.returnReason) {
          ElMessage.warning('请输入退回原因')
          return
        }
        submitLoading.value = true
        const ids = selectedRows.value.filter(row => row.status !== '待确认').map(row => row.id)
        await api.matchings.batchReturn({
          ids,
          ...batchReturnForm
        })
        ElMessage.success('批量退回成功')
        batchReturnDialogVisible.value = false
        selectedRows.value = []
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '批量退回失败')
      } finally {
        submitLoading.value = false
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
        '待处理': 'warning'
      }
      return types[status] || 'info'
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    return {
      loading,
      submitLoading,
      userRole,
      uploadRef,
      confirmDialogVisible,
      exceptionDrawerVisible,
      reviewDialogVisible,
      batchConfirmDialogVisible,
      batchReturnDialogVisible,
      exceptionTitle: '异常处理',
      filterForm,
      pagination,
      tableData,
      selectedRows,
      currentRecord,
      confirmForm,
      exceptionForm,
      reviewForm,
      batchConfirmForm,
      batchReturnForm,
      loadData,
      handleSearch,
      handleReset,
      handleSelectionChange,
      handleView,
      handleConfirm,
      handleConfirmSubmit,
      handleException,
      handleExceptionSubmit,
      handleReview,
      handleReviewSubmit,
      showBatchConfirmDialog,
      handleBatchConfirm,
      showBatchReturnDialog,
      handleBatchReturn,
      getStatusType,
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

.header-content h2 {
  margin: 0;
}

.badge {
  margin-top: 5px;
}
</style>
