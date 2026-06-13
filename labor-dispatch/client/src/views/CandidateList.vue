<template>
  <div class="page-wrapper">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2>候选人管理</h2>
          <div>
            <el-button type="primary" @click="showCreateDialog">创建候选人</el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <div class="filter-section">
          <el-form :model="filterForm" inline>
            <el-form-item label="状态">
              <el-select v-model="filterForm.status" placeholder="请选择" clearable>
                <el-option label="待匹配" value="待匹配" />
                <el-option label="匹配中" value="匹配中" />
                <el-option label="已推荐" value="已推荐" />
                <el-option label="已入职" value="已入职" />
                <el-option label="已离职" value="已离职" />
              </el-select>
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="filterForm.name" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="技能">
              <el-input v-model="filterForm.skills" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-section">
          <el-table :data="tableData" v-loading="loading" stripe>
            <el-table-column prop="candidateNumber" label="候选人编号" width="180" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="phone" label="电话" width="130" />
            <el-table-column prop="skills" label="技能" />
            <el-table-column prop="experience" label="工作经验" width="100" />
            <el-table-column prop="education" label="学历" width="80" />
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
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="技能" prop="skills">
          <el-input v-model="form.skills" placeholder="请输入技能，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="工作经验" prop="experience">
          <el-input v-model="form.experience" placeholder="如：3年" />
        </el-form-item>
        <el-form-item label="学历" prop="education">
          <el-input v-model="form.education" placeholder="如：本科" />
        </el-form-item>
        <el-form-item label="期望薪资" prop="expectedSalary">
          <el-input v-model="form.expectedSalary" placeholder="如：15k" />
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
  name: 'CandidateList',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogTitle = ref('创建候选人')
    const submitLoading = ref(false)
    const formRef = ref(null)

    const filterForm = reactive({
      status: '',
      name: '',
      skills: ''
    })

    const pagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    })

    const tableData = ref([])

    const form = reactive({
      name: '',
      phone: '',
      email: '',
      skills: '',
      experience: '',
      education: '',
      expectedSalary: ''
    })

    const formRules = {
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
      skills: [{ required: true, message: '请输入技能', trigger: 'blur' }]
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
        if (filterForm.name) {
          params.name = filterForm.name
        }
        if (filterForm.skills) {
          params.skills = filterForm.skills
        }

        const result = await api.candidates.list(params)
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
      filterForm.name = ''
      filterForm.skills = ''
      pagination.page = 1
      loadData()
    }

    const showCreateDialog = () => {
      dialogTitle.value = '创建候选人'
      Object.keys(form).forEach(key => {
        form[key] = ''
      })
      dialogVisible.value = true
    }

    const handleEdit = (row) => {
      dialogTitle.value = '编辑候选人'
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
          await api.candidates.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await api.candidates.create(form)
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
      router.push(`/candidates/${row.id}`)
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
          type: 'warning'
        })

        await api.candidates.delete(row.id)
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
        '待匹配': 'info',
        '匹配中': 'warning',
        '已推荐': 'primary',
        '已入职': 'success',
        '已离职': 'danger'
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
