<template>
  <div class="container">
    <div class="page-header">
      <div class="page-title">卫生检查</div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        录入检查
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="整改状态">
          <el-select v-model="filterForm.is_rectified" clearable placeholder="全部" style="width: 140px;">
            <el-option label="已整改" :value="1" />
            <el-option label="未整改" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px;"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="摊主/摊位号/问题" 
            clearable
            style="width: 180px;"
            @keyup.enter="loadList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-alert
      v-if="unrectifiedList.length > 0"
      :title="`有 ${unrectifiedList.length} 条检查不合格且未整改，请跟进处理`"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;"
    />

    <div class="table-container">
      <el-table :data="tableData" stripe style="width: 100%;">
        <el-table-column prop="check_date" label="检查日期" width="110" />
        <el-table-column prop="stall_code" label="摊位" width="90" />
        <el-table-column prop="tenant_name" label="摊主" width="100" />
        <el-table-column prop="checker" label="检查人" width="90" />
        <el-table-column label="得分" width="90">
          <template #default="{ row }">
            <span :style="{ color: row.score < 60 ? '#f56c6c' : row.score < 80 ? '#e6a23c' : '#67c23a', fontWeight: 'bold' }">
              {{ row.score }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="issues" label="存在问题" min-width="200" />
        <el-table-column label="整改状态" width="90">
          <template #default="{ row }">
            <span v-if="row.score >= 80" style="color: #909399;">-</span>
            <span v-else :class="['status-tag', getRectifyStatusClass(row.is_rectified)]">
              {{ getRectifyStatusText(row.is_rectified) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="rectify_date" label="整改日期" width="110" />
        <el-table-column prop="rectify_remark" label="整改说明" min-width="150" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="success" 
              @click="openRectifyDialog(row)" 
              v-if="row.score < 80 && !row.is_rectified"
            >
              整改
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑检查' : '录入检查'" width="550px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="摊位" prop="stall_id">
              <el-select v-model="formData.stall_id" style="width: 100%;" filterable @change="onStallChange">
                <el-option 
                  v-for="s in stallOptions" 
                  :key="s.id" 
                  :label="`${s.stall_code} - ${s.tenant_name || '无摊主'}`"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检查日期" prop="check_date">
              <el-date-picker 
                v-model="formData.check_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="检查人" prop="checker">
              <el-input v-model="formData.checker" placeholder="如：刘管理员" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="得分" prop="score">
              <el-input-number 
                v-model="formData.score" 
                :min="0" 
                :max="100" 
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="存在问题">
          <el-input 
            v-model="formData.issues" 
            type="textarea" 
            :rows="3" 
            placeholder="请详细描述存在的卫生问题"
          />
        </el-form-item>
        <el-row :gutter="12" v-if="formData.score < 80">
          <el-col :span="12">
            <el-form-item label="是否整改">
              <el-switch v-model="formData.is_rectified" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="整改日期" v-if="formData.is_rectified">
              <el-date-picker 
                v-model="formData.rectify_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="整改说明" v-if="formData.is_rectified">
          <el-input v-model="formData.rectify_remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div v-if="formData.score < 60" style="color: #f56c6c; margin-bottom: 16px; font-size: 13px;">
        ⚠️ 得分低于60分，系统将自动生成扣分记录
      </div>
      <div v-else-if="formData.score < 80" style="color: #e6a23c; margin-bottom: 16px; font-size: 13px;">
        ⚠️ 得分低于80分，需整改并将生成扣分记录
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rectifyDialogVisible" title="登记整改" width="450px">
      <el-form :model="rectifyForm" label-width="100px">
        <el-form-item label="摊主">
          <span>{{ currentRecord?.tenant_name }}</span>
        </el-form-item>
        <el-form-item label="摊位">
          <span>{{ currentRecord?.stall_code }}</span>
        </el-form-item>
        <el-form-item label="检查日期">
          <span>{{ currentRecord?.check_date }}</span>
        </el-form-item>
        <el-form-item label="原得分">
          <span style="color: #f56c6c; font-weight: bold;">{{ currentRecord?.score }}分</span>
        </el-form-item>
        <el-form-item label="存在问题">
          <span>{{ currentRecord?.issues }}</span>
        </el-form-item>
        <el-form-item label="整改日期" prop="rectify_date">
          <el-date-picker 
            v-model="rectifyForm.rectify_date" 
            type="date" 
            value-format="YYYY-MM-DD"
            style="width: 100%;" 
          />
        </el-form-item>
        <el-form-item label="整改说明" prop="rectify_remark">
          <el-input v-model="rectifyForm.rectify_remark" type="textarea" :rows="3" placeholder="请说明整改情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rectifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRectify">确认整改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { callApi, getRectifyStatusText, getRectifyStatusClass } from '../utils/api'

const tableData = ref([])
const unrectifiedList = ref([])
const dialogVisible = ref(false)
const rectifyDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const currentRecord = ref(null)

const filterForm = reactive({
  is_rectified: undefined,
  dateRange: [],
  keyword: '',
  start_date: '',
  end_date: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  stall_id: null,
  tenant_id: null,
  check_date: '',
  checker: '',
  score: 100,
  issues: '',
  is_rectified: 0,
  rectify_date: '',
  rectify_remark: '',
  remark: ''
})

const rectifyForm = reactive({
  rectify_date: '',
  rectify_remark: ''
})

const rules = {
  stall_id: [{ required: true, message: '请选择摊位', trigger: 'change' }],
  check_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  checker: [{ required: true, message: '请输入检查人', trigger: 'blur' }],
  score: [{ required: true, message: '请输入得分', trigger: 'blur' }]
}

const stallOptions = ref([])

async function loadStalls() {
  stallOptions.value = await callApi(window.api.stalls.listWithTenant)
}

async function loadUnrectified() {
  unrectifiedList.value = await callApi(window.api.hygiene.getUnrectified)
}

async function loadList() {
  try {
    const params = {
      is_rectified: filterForm.is_rectified,
      start_date: filterForm.dateRange?.[0] || undefined,
      end_date: filterForm.dateRange?.[1] || undefined,
      keyword: filterForm.keyword || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const result = await callApi(window.api.hygiene.list, params)
    tableData.value = result.list
    pagination.total = result.total
    loadUnrectified()
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetFilter() {
  filterForm.is_rectified = undefined
  filterForm.dateRange = []
  filterForm.keyword = ''
  pagination.page = 1
  loadList()
}

function onStallChange(stallId) {
  const stall = stallOptions.value.find(s => s.id === stallId)
  if (stall) {
    formData.tenant_id = stall.tenant_id
  }
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    stall_id: null,
    tenant_id: null,
    check_date: new Date().toISOString().slice(0, 10),
    checker: '',
    score: 100,
    issues: '',
    is_rectified: 0,
    rectify_date: '',
    rectify_remark: '',
    remark: ''
  })
  loadStalls()
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    stall_id: row.stall_id,
    tenant_id: row.tenant_id,
    check_date: row.check_date,
    checker: row.checker,
    score: row.score,
    issues: row.issues,
    is_rectified: row.is_rectified,
    rectify_date: row.rectify_date,
    rectify_remark: row.rectify_remark,
    remark: row.remark
  })
  loadStalls()
  dialogVisible.value = true
}

function openRectifyDialog(row) {
  currentRecord.value = row
  rectifyForm.rectify_date = new Date().toISOString().slice(0, 10)
  rectifyForm.rectify_remark = ''
  rectifyDialogVisible.value = true
}

async function confirmRectify() {
  try {
    await callApi(
      window.api.deductions.markRectified,
      null,
      rectifyForm.rectify_date,
      rectifyForm.rectify_remark
    )
    const deduction = await callApi(window.api.deductions.list, {
      tenant_id: currentRecord.value.tenant_id,
      start_date: currentRecord.value.check_date,
      end_date: currentRecord.value.check_date
    })
    if (deduction.list && deduction.list.length > 0) {
      await callApi(
        window.api.deductions.markRectified,
        deduction.list[0].id,
        rectifyForm.rectify_date,
        rectifyForm.rectify_remark
      )
    }
    ElMessage.success('整改已登记')
    rectifyDialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleSubmit() {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await callApi(window.api.hygiene.update, editId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await callApi(window.api.hygiene.create, formData)
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
    await ElMessageBox.confirm(`确定要删除这条检查记录吗？`, '确认删除', {
      type: 'warning'
    })
    await callApi(window.api.hygiene.delete, row.id)
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
