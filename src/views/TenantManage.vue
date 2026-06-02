<template>
  <div class="container">
    <div class="page-header">
      <div class="page-title">摊主管理</div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增摊主
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" clearable placeholder="全部" style="width: 140px;">
            <el-option label="在营" value="active" />
            <el-option label="已退租" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="姓名/电话/摊位号" 
            clearable
            style="width: 200px;"
            @keyup.enter="loadList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" stripe style="width: 100%;">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="business_type" label="经营品类" width="120" />
        <el-table-column label="摊位" width="180">
          <template #default="{ row }">
            <span v-if="row.stall_code">
              {{ row.stall_code }} - {{ row.location }}
              <el-tag v-if="row.is_sublease" size="small" class="sublease-tag" style="margin-left: 4px;">转租</el-tag>
            </span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="月租金" width="100">
          <template #default="{ row }">¥{{ formatMoney(row.monthly_rent) }}</template>
        </el-table-column>
        <el-table-column label="租赁期限" width="220">
          <template #default="{ row }">{{ row.start_date }} 至 {{ row.end_date }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '在营' : '已退租' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="filterForm.status !== 'inactive'" label="转租来源" width="100">
          <template #default="{ row }">
            <span v-if="row.is_sublease">{{ row.original_tenant_name || '-' }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="sendNotice(row)">通知</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 16px; justify-content: flex-end; display: flex;"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadList"
        @current-change="loadList"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑摊主' : '新增摊主'" width="600px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <div class="section-title">基本信息</div>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="formData.id_card" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="家庭住址">
          <el-input v-model="formData.address" />
        </el-form-item>
        <el-form-item label="经营品类" prop="business_type">
          <el-input v-model="formData.business_type" placeholder="如：蔬菜零售、猪肉零售等" />
        </el-form-item>

        <div class="section-title">租赁信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="承租摊位" prop="stall_id">
              <el-select v-model="formData.stall_id" style="width: 100%;" filterable>
                <el-option 
                  v-for="s in stallOptions" 
                  :key="s.id" 
                  :label="`${s.stall_code} - ${s.location} (¥${s.monthly_rent}/月)`"
                  :value="s.id"
                  :disabled="s.tenant_id && s.tenant_id !== formData.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="formData.status" style="width: 100%;">
                <el-option label="在营" value="active" />
                <el-option label="已退租" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="起租日期" prop="start_date">
              <el-date-picker 
                v-model="formData.start_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日期" prop="end_date">
              <el-date-picker 
                v-model="formData.end_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否转租">
          <el-switch v-model="formData.is_sublease" />
        </el-form-item>
        <el-form-item v-if="formData.is_sublease" label="原摊主">
          <el-select v-model="formData.original_tenant_id" style="width: 100%;" filterable>
            <el-option 
              v-for="t in tenantOptions" 
              :key="t.id" 
              :label="t.name"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="noticeDialogVisible" title="发送通知单" width="400px">
      <el-form label-width="80px">
        <el-form-item label="摊主">
          <span>{{ currentTenant?.name }}</span>
        </el-form-item>
        <el-form-item label="通知类型">
          <el-radio-group v-model="noticeType">
            <el-radio value="rent">租金催缴</el-radio>
            <el-radio value="deduction">整改通知</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noticeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateNotice">生成并打印</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialogVisible" title="打印预览" width="900px">
      <div class="print-preview" v-html="noticeHtml" />
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="printNotice">打印</el-button>
        <el-button type="success" @click="exportNotice">导出Excel</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { callApi, formatMoney } from '../utils/api'

const tableData = ref([])
const dialogVisible = ref(false)
const noticeDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const currentTenant = ref(null)
const noticeType = ref('rent')
const noticeHtml = ref('')

const filterForm = reactive({
  status: 'active',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  name: '',
  phone: '',
  id_card: '',
  address: '',
  business_type: '',
  stall_id: null,
  start_date: '',
  end_date: '',
  is_sublease: 0,
  original_tenant_id: null,
  status: 'active',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  business_type: [{ required: true, message: '请输入经营品类', trigger: 'blur' }],
  stall_id: [{ required: true, message: '请选择摊位', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择起租日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择到期日期', trigger: 'change' }]
}

const stallOptions = ref([])
const tenantOptions = ref([])

async function loadStalls() {
  const result = await callApi(window.api.stalls.listWithTenant)
  stallOptions.value = result
}

async function loadTenants() {
  const result = await callApi(window.api.tenants.getActive)
  tenantOptions.value = result
}

async function loadList() {
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const result = await callApi(window.api.tenants.list, params)
    tableData.value = result.list
    pagination.total = result.total
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetFilter() {
  filterForm.status = 'active'
  filterForm.keyword = ''
  pagination.page = 1
  loadList()
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    name: '',
    phone: '',
    id_card: '',
    address: '',
    business_type: '',
    stall_id: null,
    start_date: '',
    end_date: '',
    is_sublease: 0,
    original_tenant_id: null,
    status: 'active',
    remark: ''
  })
  loadStalls()
  loadTenants()
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    phone: row.phone,
    id_card: row.id_card,
    address: row.address,
    business_type: row.business_type,
    stall_id: row.stall_id,
    start_date: row.start_date,
    end_date: row.end_date,
    is_sublease: row.is_sublease,
    original_tenant_id: row.original_tenant_id,
    status: row.status,
    remark: row.remark
  })
  loadStalls()
  loadTenants()
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await callApi(window.api.tenants.update, editId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await callApi(window.api.tenants.create, formData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除摊主 ${row.name} 吗？`, '确认删除', {
      type: 'warning'
    })
    await callApi(window.api.tenants.delete, row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

function sendNotice(row) {
  currentTenant.value = row
  noticeType.value = 'rent'
  noticeDialogVisible.value = true
}

async function generateNotice() {
  try {
    const result = await callApi(
      window.api.reports.generateNotice, 
      currentTenant.value.id, 
      noticeType.value,
      {}
    )
    noticeHtml.value = result.html
    noticeDialogVisible.value = false
    previewDialogVisible.value = true
  } catch (e) {
    ElMessage.error(e.message || '生成通知失败')
  }
}

async function printNotice() {
  try {
    await callApi(window.api.print.html, noticeHtml.value)
    ElMessage.success('已发送打印任务')
  } catch (e) {
    ElMessage.error(e.message || '打印失败')
  }
}

async function exportNotice() {
  try {
    const result = await callApi(window.api.reports.exportToExcel, noticeType.value === 'rent' ? 'arrears' : 'deductions', {})
    ElMessage.success(`已导出到桌面：${result.fileName}`)
  } catch (e) {
    ElMessage.error(e.message || '导出失败')
  }
}

onMounted(() => {
  loadList()
})
</script>
