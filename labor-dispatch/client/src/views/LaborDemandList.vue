<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2>用工需求管理</h2>
          <div>
            <el-button type="primary" @click="showCreateDialog">创建需求</el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <div class="filter-section">
          <el-form :model="filterForm" inline>
            <el-form-item label="状态">
              <el-select v-model="filterForm.status" placeholder="请选择" clearable>
                <el-option label="待处理" value="待处理" />
                <el-option label="处理中" value="处理中" />
                <el-option label="匹配中" value="匹配中" />
                <el-option label="已完成" value="已完成" />
                <el-option label="已取消" value="已取消" />
              </el-select>
            </el-form-item>
            <el-form-item label="单位名称">
              <el-input v-model="filterForm.companyName" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-section">
          <el-table :data="tableData" v-loading="loading" stripe>
            <el-table-column prop="demandNumber" label="需求编号" width="180" />
            <el-table-column prop="companyName" label="用工单位" />
            <el-table-column prop="position" label="岗位" />
            <el-table-column prop="demandCount" label="需求人数" width="100" align="center" />
            <el-table-column prop="salaryRange" label="薪资范围" width="120" />
            <el-table-column prop="workLocation" label="工作地点" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdBy" label="创建人" width="100">
              <template #default="{ row }">
                {{ row.createdBy?.name }}
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
                <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
    >
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="用工单位" prop="companyName">
          <el-input v-model="form.companyName" placeholder="请输入用工单位名称" />
        </el-form-item>
        <el-form-item label="岗位" prop="position">
          <el-input v-model="form.position" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="需求人数" prop="demandCount">
          <el-input-number v-model="form.demandCount" :min="1" />
        </el-form-item>
        <el-form-item label="薪资范围" prop="salaryRange">
          <el-input v-model="form.salaryRange" placeholder="如：10k-15k" />
        </el-form-item>
        <el-form-item label="工作地点" prop="workLocation">
          <el-input v-model="form.workLocation" placeholder="请输入工作地点" />
        </el-form-item>
        <el-form-item label="用工周期" prop="workPeriod">
          <el-input v-model="form.workPeriod" placeholder="如：6个月" />
        </el-form-item>
        <el-form-item label="具体要求" prop="requirements">
          <el-input
            v-model="form.requirements"
            type="textarea"
            :rows="3"
            placeholder="请输入具体要求"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

export default {
  name: 'LaborDemandList',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogTitle = ref('创建用工需求')
    const submitLoading = ref(false)
    const formRef = ref(null)

    const filterForm = reactive({
      status: '',
      companyName: ''
    })

    const dateRange = ref([])

    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    })

    const tableData = ref([])

    const form = reactive({
      companyName: '',
      position: '',
      demandCount: 1,
      salaryRange: '',
      workLocation: '',
      workPeriod: '',
      requirements: ''
    })

    const formRules = {
      companyName: [{ required: true, message: '请输入用工单位', trigger: 'blur' }],
      position: [{ required: true, message: '请输入岗位', trigger: 'blur' }],
      demandCount: [{ required: true, message: '请输入需求人数', trigger: 'blur' }],
      salaryRange: [{ required: true, message: '请输入薪资范围', trigger: 'blur' }],
      workLocation: [{ required: true, message: '请输入工作地点', trigger: 'blur' }]
    }

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
        if (filterForm.companyName) {
          params.companyName = filterForm.companyName
        }
        if (dateRange.value && dateRange.value.length === 2) {
          params.startDate = dateRange.value[0]
          params.endDate = dateRange.value[1]
        }

        const result = await api.laborDemands.list(params)
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
      filterForm.companyName = ''
      dateRange.value = []
      pagination.page = 1
      loadData()
    }

    const showCreateDialog = () => {
      dialogTitle.value = '创建用工需求'
      Object.keys(form).forEach(key => {
        if (key === 'demandCount') {
          form[key] = 1
        } else {
          form[key] = ''
        }
      })
      dialogVisible.value = true
    }

    const handleEdit = (row) => {
      dialogTitle.value = '编辑用工需求'
      Object.keys(form).forEach(key => {
        form[key] = row[key]
      })
      form.id = row.id
      dialogVisible.value = true
    }

    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        submitLoading.value = true

        if (form.id) {
          await api.laborDemands.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await api.laborDemands.create(form)
          ElMessage.success('创建成功')
        }

        dialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }

    const handleView = (row) => {
      router.push(`/labor-demands/${row.id}`)
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
          type: 'warning'
        })

        await api.laborDemands.delete(row.id)
        ElMessage.success('删除成功')
        loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
    }

    const getStatusType = (status) => {
      const types = {
        '待处理': 'info',
        '处理中': 'warning',
        '匹配中': 'primary',
        '已完成': 'success',
        '已取消': 'danger'
      }
      return types[status] || 'info'
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    return {
      loading,
      dialogVisible,
      dialogTitle,
      submitLoading,
      formRef,
      filterForm,
      dateRange,
      pagination,
      tableData,
      form,
      formRules,
      loadData,
      handleSearch,
      handleReset,
      showCreateDialog,
      handleEdit,
      handleSubmit,
      handleView,
      handleDelete,
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
