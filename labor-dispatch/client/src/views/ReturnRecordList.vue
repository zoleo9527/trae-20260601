<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2>退回/补录/复核记录</h2>
          <div>
            <el-tag type="warning">待处理：{{ pendingCount }}</el-tag>
            <el-tag type="success">已处理：{{ processedCount }}</el-tag>
            <el-tag type="primary">已确认：{{ confirmedCount }}</el-tag>
          </div>
        </div>
      </el-header>

      <el-main>
        <div class="filter-section">
          <el-form :model="filterForm" inline>
            <el-form-item label="类型">
              <el-select v-model="filterForm.returnType" placeholder="请选择" clearable>
                <el-option label="退回" value="退回" />
                <el-option label="补录" value="补录" />
                <el-option label="复核" value="复核" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filterForm.status" placeholder="请选择" clearable>
                <el-option label="待处理" value="待处理" />
                <el-option label="已处理" value="已处理" />
                <el-option label="已确认" value="已确认" />
              </el-select>
            </el-form-item>
            <el-form-item label="实体类型">
              <el-select v-model="filterForm.entityType" placeholder="请选择" clearable>
                <el-option label="用工需求" value="LaborDemand" />
                <el-option label="候选人" value="Candidate" />
                <el-option label="匹配记录" value="MatchingRecord" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-section">
          <el-table :data="tableData" v-loading="loading" stripe>
            <el-table-column prop="returnType" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeColor(row.returnType)">{{ row.returnType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="entityType" label="实体类型" width="120">
              <template #default="{ row }">
                {{ getEntityTypeName(row.entityType) }}
              </template>
            </el-table-column>
            <el-table-column label="关联信息">
              <template #default="{ row }">
                <span v-if="row.matchingRecord">
                  <el-link type="primary" @click="goToMatching(row.matchingRecord.id)">
                    {{ row.matchingRecord.laborDemand?.companyName || '-' }} - 
                    {{ row.matchingRecord.candidate?.name || '-' }}
                  </el-link>
                </span>
                <span v-else-if="row.laborDemand">
                  <el-link type="primary" @click="goToLaborDemand(row.laborDemand.id)">
                    {{ row.laborDemand.companyName }} - {{ row.laborDemand.position }}
                  </el-link>
                </span>
                <span v-else-if="row.candidate">
                  <el-link type="primary" @click="goToCandidate(row.candidate.id)">
                    {{ row.candidate.name }} - {{ row.candidate.phone }}
                  </el-link>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="returnReason" label="原因" />
            <el-table-column prop="operator.name" label="操作人" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusColor(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handleRemark" label="处理说明">
              <template #default="{ row }">
                {{ row.handleRemark || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleView(row)">查看</el-button>
                <el-button
                  v-if="row.status === '待处理'"
                  type="success"
                  link
                  @click="handleProcess(row)"
                >
                  一线处理
                </el-button>
                <el-button
                  v-if="row.status === '已处理' && userRole === '管理'"
                  type="warning"
                  link
                  @click="handleReview(row)"
                >
                  复核
                </el-button>
                <el-button
                  v-if="row.status === '已处理' && userRole !== '管理'"
                  type="info"
                  link
                  @click="handleRehandle(row)"
                >
                  重新处理
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

    <el-drawer v-model="processDrawerVisible" title="一线处理" size="600px">
      <el-form :model="processForm" label-width="120px">
        <el-form-item label="异常类型">
          <el-tag :type="getTypeColor(currentRecord?.returnType)">
            {{ currentRecord?.returnType }}
          </el-tag>
        </el-form-item>
        <el-form-item label="原因">
          {{ currentRecord?.returnReason }}
        </el-form-item>
        <el-form-item label="关联匹配">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="用工单位">
              {{ currentRecord?.matchingRecord?.laborDemand?.companyName }}
            </el-descriptions-item>
            <el-descriptions-item label="岗位">
              {{ currentRecord?.matchingRecord?.laborDemand?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="候选人">
              {{ currentRecord?.matchingRecord?.candidate?.name }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag>{{ currentRecord?.matchingRecord?.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-radio-group v-model="processForm.handleResult">
            <el-radio label="继续处理">继续处理（状态改为已处理）</el-radio>
            <el-radio label="重新匹配">重新匹配（状态改为待确认）</el-radio>
            <el-radio label="取消匹配">取消匹配（状态改为已取消）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="processForm.handleRemark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理说明"
          />
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
          <el-button @click="processDrawerVisible = false">取消</el-button>
          <el-button type="primary" @click="handleProcessSubmit" :loading="submitLoading">
            确定处理
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="reviewDialogVisible" title="管理复核" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="异常类型">
          <el-tag :type="getTypeColor(currentRecord?.returnType)">
            {{ currentRecord?.returnType }}
          </el-tag>
        </el-form-item>
        <el-form-item label="一线处理">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="处理人">
              {{ currentRecord?.handledBy?.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="处理时间">
              {{ formatTime(currentRecord?.handledAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="处理说明">
              {{ currentRecord?.handleRemark }}
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
          确定复核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="详情" width="700px">
      <el-descriptions v-if="currentRecord" :column="2" border>
        <el-descriptions-item label="类型">
          <el-tag :type="getTypeColor(currentRecord.returnType)">{{ currentRecord.returnType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusColor(currentRecord.status)">{{ currentRecord.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="实体类型">
          {{ getEntityTypeName(currentRecord.entityType) }}
        </el-descriptions-item>
        <el-descriptions-item label="原因" :span="2">
          {{ currentRecord.returnReason }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentRecord.operator?.name }}
          <el-tag size="small" style="margin-left: 5px">{{ currentRecord.operator?.role }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(currentRecord.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRecord.handleRemark" label="处理说明" :span="2">
          {{ currentRecord.handleRemark }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRecord.handledAt" label="处理时间">
          {{ formatTime(currentRecord.handledAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRecord.matchingRecord" label="关联匹配" :span="2">
          <el-button
            type="primary"
            link
            @click="goToMatching(currentRecord.matchingRecord.id); viewDialogVisible = false"
          >
            查看匹配记录
          </el-button>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'ReturnRecordList',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const submitLoading = ref(false)
    const processDrawerVisible = ref(false)
    const reviewDialogVisible = ref(false)
    const viewDialogVisible = ref(false)
    const currentRecord = ref(null)
    const userRole = ref('')
    const uploadRef = ref(null)
    const isRehandle = ref(false)

    const pendingCount = ref(0)
    const processedCount = ref(0)
    const confirmedCount = ref(0)

    const filterForm = reactive({
      returnType: '',
      status: '',
      entityType: ''
    })

    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    })

    const tableData = ref([])

    const processForm = reactive({
      handleResult: '继续处理',
      handleRemark: ''
    })

    const reviewForm = reactive({
      reviewResult: '通过',
      remark: ''
    })

    onMounted(() => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        userRole.value = user.role
      }
      loadRouteParams()
      loadData()
      loadCounts()
    })

    const loadRouteParams = () => {
      if (route.query.status) {
        filterForm.status = route.query.status
      }
      if (route.query.returnType) {
        filterForm.returnType = route.query.returnType
      }
      if (route.query.id) {
        openRecordById(route.query.id)
      }
    }

    const openRecordById = async (id) => {
      try {
        currentRecord.value = await api.returnRecords.getById(id)
        if (currentRecord.value.status === '待处理') {
          isRehandle.value = false
          processForm.handleResult = '继续处理'
          processForm.handleRemark = ''
          processDrawerVisible.value = true
        } else if (currentRecord.value.status === '已处理' && userRole.value === '管理') {
          reviewForm.reviewResult = '通过'
          reviewForm.remark = ''
          reviewDialogVisible.value = true
        } else if (currentRecord.value.status === '已处理' && userRole.value !== '管理') {
          isRehandle.value = true
          processForm.handleResult = '继续处理'
          processForm.handleRemark = ''
          processDrawerVisible.value = true
        } else {
          viewDialogVisible.value = true
        }
      } catch (error) {
        ElMessage.error('加载记录失败')
      }
    }

    const handleRouteChange = () => {
      loadRouteParams()
      loadData()
      loadCounts()
    }

    const unwatch = watch(
      () => route.query,
      handleRouteChange,
      { deep: true }
    )

    onUnmounted(() => {
      unwatch()
    })

    const loadData = async () => {
      try {
        loading.value = true
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize
        }

        if (filterForm.returnType) {
          params.returnType = filterForm.returnType
        }
        if (filterForm.status) {
          params.status = filterForm.status
        }
        if (filterForm.entityType) {
          params.entityType = filterForm.entityType
        }

        const result = await api.returnRecords.list(params)
        tableData.value = result.data
        pagination.total = result.total
      } catch (error) {
        ElMessage.error('加载数据失败')
      } finally {
        loading.value = false
      }
    }

    const loadCounts = async () => {
      try {
        const [pending, processed, confirmed] = await Promise.all([
          api.returnRecords.list({ status: '待处理', pageSize: 1 }),
          api.returnRecords.list({ status: '已处理', pageSize: 1 }),
          api.returnRecords.list({ status: '已确认', pageSize: 1 })
        ])
        pendingCount.value = pending.total
        processedCount.value = processed.total
        confirmedCount.value = confirmed.total
      } catch (error) {
        console.error('加载统计失败')
      }
    }

    const handleSearch = () => {
      pagination.page = 1
      loadData()
    }

    const handleReset = () => {
      filterForm.returnType = ''
      filterForm.status = ''
      filterForm.entityType = ''
      pagination.page = 1
      loadData()
    }

    const handleView = async (row) => {
      try {
        currentRecord.value = await api.returnRecords.getById(row.id)
        viewDialogVisible.value = true
      } catch (error) {
        ElMessage.error('加载详情失败')
      }
    }

    const handleProcess = async (row) => {
      try {
        currentRecord.value = await api.returnRecords.getById(row.id)
        processForm.handleResult = '继续处理'
        processForm.handleRemark = ''
        isRehandle.value = false
        processDrawerVisible.value = true
      } catch (error) {
        ElMessage.error('加载详情失败')
      }
    }

    const handleProcessSubmit = async () => {
      try {
        submitLoading.value = true
        if (isRehandle.value) {
          await api.returnRecords.rehandle(currentRecord.value.id, processForm)
          ElMessage.success('重新处理成功')
        } else {
          await api.returnRecords.handle(currentRecord.value.id, processForm)
          ElMessage.success('处理成功，等待管理复核')
        }
        processDrawerVisible.value = false
        isRehandle.value = false
        loadData()
        loadCounts()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '处理失败')
      } finally {
        submitLoading.value = false
      }
    }

    const handleRehandle = async (row) => {
      try {
        currentRecord.value = await api.returnRecords.getById(row.id)
        processForm.handleResult = '继续处理'
        processForm.handleRemark = ''
        processDrawerVisible.value = true
        isRehandle.value = true
      } catch (error) {
        ElMessage.error('加载详情失败')
      }
    }

    const handleReview = (row) => {
      currentRecord.value = row
      reviewForm.reviewResult = '通过'
      reviewForm.remark = ''
      reviewDialogVisible.value = true
    }

    const handleReviewSubmit = async () => {
      try {
        submitLoading.value = true
        if (currentRecord.value.matchingRecord?.id) {
          await api.matchings.review(currentRecord.value.matchingRecord.id, {
            reviewResult: reviewForm.reviewResult,
            remark: reviewForm.remark
          })
        }
        ElMessage.success('复核成功')
        reviewDialogVisible.value = false
        loadData()
        loadCounts()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '复核失败')
      } finally {
        submitLoading.value = false
      }
    }

    const goToMatching = (id) => {
      router.push(`/matchings/${id}`)
    }

    const goToLaborDemand = (id) => {
      router.push(`/labor-demands/${id}`)
    }

    const goToCandidate = (id) => {
      router.push(`/candidates/${id}`)
    }

    const getTypeColor = (type) => {
      const colors = {
        '退回': 'danger',
        '补录': 'warning',
        '复核': 'primary'
      }
      return colors[type] || 'info'
    }

    const getStatusColor = (status) => {
      const colors = {
        '待处理': 'warning',
        '已处理': 'success',
        '已确认': 'primary'
      }
      return colors[status] || 'info'
    }

    const getEntityTypeName = (type) => {
      const names = {
        'LaborDemand': '用工需求',
        'Candidate': '候选人',
        'MatchingRecord': '匹配记录'
      }
      return names[type] || type
    }

    const formatTime = (time) => {
      if (!time) return '-'
      return new Date(time).toLocaleString('zh-CN')
    }

    return {
      loading,
      submitLoading,
      processDrawerVisible,
      reviewDialogVisible,
      viewDialogVisible,
      currentRecord,
      userRole,
      uploadRef,
      pendingCount,
      processedCount,
      confirmedCount,
      filterForm,
      pagination,
      tableData,
      processForm,
      reviewForm,
      loadData,
      loadCounts,
      handleSearch,
      handleReset,
      handleView,
      handleProcess,
      handleProcessSubmit,
      handleRehandle,
      handleReview,
      handleReviewSubmit,
      goToMatching,
      goToLaborDemand,
      goToCandidate,
      getTypeColor,
      getStatusColor,
      getEntityTypeName,
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
</style>