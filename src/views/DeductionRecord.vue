<template>
  <div class="container">
    <div class="page-header">
      <div class="page-title">扣分整改</div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增扣分
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="年份">
          <el-select v-model="filterForm.year" clearable style="width: 120px;">
            <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="filterForm.month" clearable style="width: 120px;">
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改状态">
          <el-select v-model="filterForm.is_rectified" clearable placeholder="全部" style="width: 140px;">
            <el-option label="已整改" :value="1" />
            <el-option label="未整改" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="摊主/摊位号/原因" 
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

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6">
        <div class="stats-card">
          <div class="label">总扣分数</div>
          <div class="value" style="color: #f56c6c;">{{ summary.total_points || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stats-card">
          <div class="label">总罚金</div>
          <div class="value" style="color: #e6a23c;">¥{{ formatMoney(summary.total_amount) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stats-card">
          <div class="label">扣分次数</div>
          <div class="value">{{ summary.total_count || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stats-card">
          <div class="label">未整改</div>
          <div class="value" style="color: #f56c6c;">{{ summary.unrectified_count || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <div class="table-container">
      <el-table :data="tableData" stripe style="width: 100%;">
        <el-table-column prop="deduction_date" label="日期" width="110" />
        <el-table-column prop="stall_code" label="摊位" width="90" />
        <el-table-column prop="tenant_name" label="摊主" width="100" />
        <el-table-column prop="reason" label="原因" min-width="200" />
        <el-table-column label="扣分" width="80">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">-{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column label="罚金" width="100">
          <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="整改状态" width="90">
          <template #default="{ row }">
            <span :class="['status-tag', getRectifyStatusClass(row.is_rectified)]">
              {{ getRectifyStatusText(row.is_rectified) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="rectify_date" label="整改日期" width="110" />
        <el-table-column prop="rectify_remark" label="整改说明" min-width="150" />
        <el-table-column prop="recorder" label="记录人" width="90" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="success" 
              @click="openRectifyDialog(row)" 
              v-if="!row.is_rectified"
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑扣分' : '新增扣分'" width="550px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="摊主" prop="tenant_id">
              <el-select v-model="formData.tenant_id" style="width: 100%;" filterable @change="onTenantChange">
                <el-option 
                  v-for="t in tenantOptions" 
                  :key="t.id" 
                  :label="`${t.name} - ${t.stall_code}`"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日期" prop="deduction_date">
              <el-date-picker 
                v-model="formData.deduction_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="扣分原因" prop="reason">
          <el-input 
            v-model="formData.reason" 
            type="textarea" 
            :rows="2" 
            placeholder="请详细描述违规原因"
          />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="扣分数" prop="points">
              <el-input-number 
                v-model="formData.points" 
                :min="1" 
                :max="100" 
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="罚金(元)">
              <el-input-number 
                v-model="formData.amount" 
                :min="0" 
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="记录人" prop="recorder">
              <el-input v-model="formData.recorder" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否整改">
              <el-switch v-model="formData.is_rectified" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12" v-if="formData.is_rectified">
          <el-col :span="12">
            <el-form-item label="整改日期">
              <el-date-picker 
                v-model="formData.rectify_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="整改说明">
              <el-input v-model="formData.rectify_remark" />
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

    <el-dialog v-model="rectifyDialogVisible" title="登记整改" width="450px">
      <el-form :model="rectifyForm" label-width="100px">
        <el-form-item label="摊主">
          <span>{{ currentRecord?.tenant_name }}</span>
        </el-form-item>
        <el-form-item label="扣分日期">
          <span>{{ currentRecord?.deduction_date }}</span>
        </el-form-item>
        <el-form-item label="原因">
          <span>{{ currentRecord?.reason }}</span>
        </el-form-item>
        <el-form-item label="扣分">
          <span style="color: #f56c6c;">{{ currentRecord?.points }}分</span>
        </el-form-item>
        <el-form-item label="罚金">
          <span style="color: #e6a23c;">¥{{ formatMoney(currentRecord?.amount) }}</span>
        </el-form-item>
        <el-form-item label="整改日期">
          <el-date-picker 
            v-model="rectifyForm.rectify_date" 
            type="date" 
            value-format="YYYY-MM-DD"
            style="width: 100%;" 
          />
        </el-form-item>
        <el-form-item label="整改说明">
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
import { callApi, formatMoney, getRectifyStatusText, getRectifyStatusClass } from '../utils/api'

const tableData = ref([])
const summary = ref({})
const dialogVisible = ref(false)
const rectifyDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const currentRecord = ref(null)

const currentDate = new Date()
const yearOptions = ref([currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1])

const filterForm = reactive({
  year: currentDate.getFullYear(),
  month: '',
  is_rectified: undefined,
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  tenant_id: null,
  stall_id: null,
  deduction_date: '',
  reason: '',
  points: 5,
  amount: 100,
  is_rectified: 0,
  rectify_date: '',
  rectify_remark: '',
  recorder: '',
  remark: ''
})

const rectifyForm = reactive({
  rectify_date: '',
  rectify_remark: ''
})

const rules = {
  tenant_id: [{ required: true, message: '请选择摊主', trigger: 'change' }],
  deduction_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入扣分原因', trigger: 'blur' }],
  points: [{ required: true, message: '请输入扣分数', trigger: 'blur' }],
  recorder: [{ required: true, message: '请输入记录人', trigger: 'blur' }]
}

const tenantOptions = ref([])

async function loadTenants() {
  tenantOptions.value = await callApi(window.api.tenants.getActive)
}

async function loadSummary() {
  summary.value = await callApi(
    window.api.deductions.getStats,
    filterForm.year || null,
    filterForm.month || null
  )
}

async function loadList() {
  try {
    const params = {
      year: filterForm.year || undefined,
      month: filterForm.month || undefined,
      is_rectified: filterForm.is_rectified,
      keyword: filterForm.keyword || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const result = await callApi(window.api.deductions.list, params)
    tableData.value = result.list
    pagination.total = result.total
    loadSummary()
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetFilter() {
  filterForm.year = currentDate.getFullYear()
  filterForm.month = ''
  filterForm.is_rectified = undefined
  filterForm.keyword = ''
  pagination.page = 1
  loadList()
}

function onTenantChange(tenantId) {
  const tenant = tenantOptions.value.find(t => t.id === tenantId)
  if (tenant) {
    formData.stall_id = tenant.stall_id
  }
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    tenant_id: null,
    stall_id: null,
    deduction_date: new Date().toISOString().slice(0, 10),
    reason: '',
    points: 5,
    amount: 100,
    is_rectified: 0,
    rectify_date: '',
    rectify_remark: '',
    recorder: '',
    remark: ''
  })
  loadTenants()
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    tenant_id: row.tenant_id,
    stall_id: row.stall_id,
    deduction_date: row.deduction_date,
    reason: row.reason,
    points: row.points,
    amount: row.amount,
    is_rectified: row.is_rectified,
    rectify_date: row.rectify_date,
    rectify_remark: row.rectify_remark,
    recorder: row.recorder,
    remark: row.remark
  })
  loadTenants()
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
      currentRecord.value.id,
      rectifyForm.rectify_date,
      rectifyForm.rectify_remark
    )
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
      await callApi(window.api.deductions.update, editId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await callApi(window.api.deductions.create, formData)
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
    await ElMessageBox.confirm(`确定要删除这条扣分记录吗？`, '确认删除', {
      type: 'warning'
    })
    await callApi(window.api.deductions.delete, row.id)
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
