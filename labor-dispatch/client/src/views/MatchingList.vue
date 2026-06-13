<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2>匹配记录管理</h2>
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
          <el-table :data="tableData" v-loading="loading" stripe>
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
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250" fixed="right">
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
                  @click="handleReturn(row)"
                >
                  退回
                </el-button>
                <el-button
                  v-if="row.status === '待确认'"
                  type="info"
                  link
                  @click="handleSupplement(row)"
                >
                  补录
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

    <el-dialog v-model="returnDialogVisible" title="退回" width="500px">
      <el-form :model="returnForm" label-width="100px">
        <el-form-item label="退回原因" prop="returnReason">
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
        <el-form-item label="补录原因" prop="supplementReason">
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
    const confirmDialogVisible = ref(false)
    const returnDialogVisible = ref(false)
    const supplementDialogVisible = ref(false)

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

    let currentRecordId = null

    onMounted(() => {
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

    const handleView = (row) => {
      router.push(`/matchings/${row.id}`)
    }

    const handleConfirm = (row) => {
      currentRecordId = row.id
      Object.keys(confirmForm).forEach(key => {
        confirmForm[key] = ''
      })
      confirmForm.matchResult = '同意'
      confirmDialogVisible.value = true
    }

    const handleConfirmSubmit = async () => {
      try {
        submitLoading.value = true
        await api.matchings.confirm(currentRecordId, confirmForm)
        ElMessage.success('确认成功')
        confirmDialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '确认失败')
      } finally {
        submitLoading.value = false
      }
    }

    const handleReturn = (row) => {
      currentRecordId = row.id
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
        await api.matchings.return(currentRecordId, returnForm)
        ElMessage.success('退回成功')
        returnDialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '退回失败')
      } finally {
        submitLoading.value = false
      }
    }

    const handleSupplement = (row) => {
      currentRecordId = row.id
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
        await api.matchings.supplement(currentRecordId, supplementForm)
        ElMessage.success('补录成功')
        supplementDialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '补录失败')
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
        '已取消': 'info'
      }
      return types[status] || 'info'
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    return {
      loading,
      submitLoading,
      confirmDialogVisible,
      returnDialogVisible,
      supplementDialogVisible,
      filterForm,
      pagination,
      tableData,
      confirmForm,
      returnForm,
      supplementForm,
      loadData,
      handleSearch,
      handleReset,
      handleView,
      handleConfirm,
      handleConfirmSubmit,
      handleReturn,
      handleReturnSubmit,
      handleSupplement,
      handleSupplementSubmit,
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
</style>
