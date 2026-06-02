<template>
  <div class="container">
    <div class="page-header">
      <div class="page-title">摊位管理</div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增摊位
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" clearable placeholder="全部" style="width: 140px;">
            <el-option label="营业中" value="active" />
            <el-option label="待出租" value="inactive" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" clearable placeholder="全部" style="width: 140px;">
            <el-option label="标准摊位" value="standard" />
            <el-option label="精品摊位" value="premium" />
            <el-option label="餐饮档口" value="restaurant" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="摊位号/位置" 
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
        <el-table-column prop="stall_code" label="摊位编号" width="100" />
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column prop="area" label="面积(㎡)" width="90" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ getStallTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column label="月租金" width="110">
          <template #default="{ row }">¥{{ formatMoney(row.monthly_rent) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'inactive' ? 'warning' : 'info'">
              {{ getStallStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前摊主" width="120">
          <template #default="{ row }">
            <span v-if="row.tenant_name">
              {{ row.tenant_name }}
              <el-tag v-if="row.is_sublease" size="small" class="sublease-tag" style="margin-left: 4px;">转租</el-tag>
            </span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑摊位' : '新增摊位'" width="500px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="摊位编号" prop="stall_code">
          <el-input v-model="formData.stall_code" placeholder="如：A001" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="formData.location" placeholder="如：A区1号" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="面积(㎡)" prop="area">
              <el-input-number v-model="formData.area" :min="0" :precision="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月租金(元)" prop="monthly_rent">
              <el-input-number v-model="formData.monthly_rent" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="formData.type" style="width: 100%;">
                <el-option label="标准摊位" value="standard" />
                <el-option label="精品摊位" value="premium" />
                <el-option label="餐饮档口" value="restaurant" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" style="width: 100%;">
                <el-option label="营业中" value="active" />
                <el-option label="待出租" value="inactive" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { callApi, formatMoney, getStallTypeText, getStallStatusText } from '../utils/api'

const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  status: '',
  type: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  stall_code: '',
  location: '',
  area: 0,
  monthly_rent: 0,
  type: 'standard',
  status: 'active',
  remark: ''
})

const rules = {
  stall_code: [{ required: true, message: '请输入摊位编号', trigger: 'blur' }],
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }],
  monthly_rent: [{ required: true, message: '请输入月租金', trigger: 'blur' }]
}

async function loadList() {
  try {
    const result = await callApi(window.api.stalls.listWithTenant)
    tableData.value = result
    pagination.total = result.length
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetFilter() {
  filterForm.status = ''
  filterForm.type = ''
  filterForm.keyword = ''
  loadList()
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    stall_code: '',
    location: '',
    area: 0,
    monthly_rent: 0,
    type: 'standard',
    status: 'active',
    remark: ''
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    stall_code: row.stall_code,
    location: row.location,
    area: row.area,
    monthly_rent: row.monthly_rent,
    type: row.type,
    status: row.status,
    remark: row.remark
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await callApi(window.api.stalls.update, editId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await callApi(window.api.stalls.create, formData)
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
    await ElMessageBox.confirm(`确定要删除摊位 ${row.stall_code} 吗？`, '确认删除', {
      type: 'warning'
    })
    await callApi(window.api.stalls.delete, row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadList()
})
</script>
