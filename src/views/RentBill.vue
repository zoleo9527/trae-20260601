<template>
  <div class="container">
    <div class="page-header">
      <div class="page-title">租金账单</div>
      <div>
        <el-button type="success" @click="generateBatch">
          <el-icon><CirclePlus /></el-icon>
          批量生成月账单
        </el-button>
        <el-button type="primary" style="margin-left: 8px;" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          新增账单
        </el-button>
      </div>
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
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" clearable placeholder="全部" style="width: 120px;">
            <el-option label="已缴清" value="paid" />
            <el-option label="部分缴纳" value="partial" />
            <el-option label="未缴" value="unpaid" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="摊主/摊位号" 
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

    <div class="table-container">
      <el-table :data="tableData" stripe style="width: 100%;">
        <el-table-column label="账期" width="110">
          <template #default="{ row }">{{ row.bill_year }}年{{ row.bill_month }}月</template>
        </el-table-column>
        <el-table-column prop="tenant_name" label="摊主" width="100" />
        <el-table-column prop="stall_code" label="摊位" width="90" />
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column label="基础租金" width="100">
          <template #default="{ row }">¥{{ formatMoney(row.base_rent) }}</template>
        </el-table-column>
        <el-table-column label="附加费" width="90">
          <template #default="{ row }">¥{{ formatMoney(row.extra_fee) }}</template>
        </el-table-column>
        <el-table-column label="优惠减免" width="100">
          <template #default="{ row }">-¥{{ formatMoney(row.discount) }}</template>
        </el-table-column>
        <el-table-column label="应缴总额" width="100">
          <template #default="{ row }">
            <span style="font-weight: 600;">¥{{ formatMoney(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已缴金额" width="100">
          <template #default="{ row }">¥{{ formatMoney(row.paid_amount) }}</template>
        </el-table-column>
        <el-table-column label="欠费" width="100">
          <template #default="{ row }">
            <span v-if="row.total_amount - row.paid_amount > 0" style="color: #f56c6c; font-weight: 600;">
              ¥{{ formatMoney(row.total_amount - row.paid_amount) }}
            </span>
            <span v-else style="color: #67c23a;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-tag', getRentStatusClass(row.status)]">
              {{ getRentStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="paid_date" label="缴费日期" width="110" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="openPayDialog(row)" v-if="row.status !== 'paid'">
              缴费
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账单' : '新增账单'" width="550px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="年份" prop="bill_year">
              <el-select v-model="formData.bill_year" style="width: 100%;">
                <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月份" prop="bill_month">
              <el-select v-model="formData.bill_month" style="width: 100%;">
                <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="基础租金" prop="base_rent">
              <el-input-number v-model="formData.base_rent" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="附加费">
              <el-input-number v-model="formData.extra_fee" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="优惠减免">
              <el-input-number v-model="formData.discount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应缴总额">
              <el-input :value="formData.base_rent + (formData.extra_fee || 0) - (formData.discount || 0)" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="已缴金额">
              <el-input-number v-model="formData.paid_amount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="缴费日期">
              <el-date-picker 
                v-model="formData.paid_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%;">
            <el-option label="未缴" value="unpaid" />
            <el-option label="部分缴纳" value="partial" />
            <el-option label="已缴清" value="paid" />
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

    <el-dialog v-model="payDialogVisible" title="登记缴费" width="400px">
      <el-form :model="payForm" label-width="100px">
        <el-form-item label="摊主">
          <span>{{ currentBill?.tenant_name }}</span>
        </el-form-item>
        <el-form-item label="账期">
          <span>{{ currentBill?.bill_year }}年{{ currentBill?.bill_month }}月</span>
        </el-form-item>
        <el-form-item label="应缴总额">
          <span style="color: #f56c6c; font-weight: 600;">¥{{ formatMoney(currentBill?.total_amount) }}</span>
        </el-form-item>
        <el-form-item label="已缴">
          <span>¥{{ formatMoney(currentBill?.paid_amount) }}</span>
        </el-form-item>
        <el-form-item label="待缴">
          <span style="color: #f56c6c; font-weight: 600;">
            ¥{{ formatMoney((currentBill?.total_amount || 0) - (currentBill?.paid_amount || 0)) }}
          </span>
        </el-form-item>
        <el-form-item label="本次缴费" prop="pay_amount">
          <el-input-number 
            v-model="payForm.pay_amount" 
            :min="0" 
            :max="(currentBill?.total_amount || 0) - (currentBill?.paid_amount || 0)"
            style="width: 100%;" 
          />
        </el-form-item>
        <el-form-item label="缴费日期">
          <el-date-picker 
            v-model="payForm.pay_date" 
            type="date" 
            value-format="YYYY-MM-DD"
            style="width: 100%;" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPay">确认缴费</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="generateDialogVisible" title="批量生成月账单" width="400px">
      <el-form label-width="100px">
        <el-form-item label="年份">
          <el-select v-model="generateYear" style="width: 100%;">
            <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="generateMonth" style="width: 100%;">
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </el-form-item>
      </el-form>
      <div style="color: #909399; font-size: 13px; margin-bottom: 16px;">
        将为所有在营摊主自动生成该月租金账单
      </div>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmGenerate">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CirclePlus } from '@element-plus/icons-vue'
import { callApi, formatMoney, getRentStatusText, getRentStatusClass } from '../utils/api'

const tableData = ref([])
const dialogVisible = ref(false)
const payDialogVisible = ref(false)
const generateDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const currentBill = ref(null)

const currentDate = new Date()
const yearOptions = ref([currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1])
const generateYear = ref(currentDate.getFullYear())
const generateMonth = ref(currentDate.getMonth() + 1)

const filterForm = reactive({
  year: currentDate.getFullYear(),
  month: currentDate.getMonth() + 1,
  status: '',
  keyword: '',
  tenant_id: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  tenant_id: null,
  stall_id: null,
  bill_year: currentDate.getFullYear(),
  bill_month: currentDate.getMonth() + 1,
  base_rent: 0,
  extra_fee: 0,
  discount: 0,
  total_amount: 0,
  paid_amount: 0,
  paid_date: '',
  status: 'unpaid',
  remark: ''
})

const payForm = reactive({
  pay_amount: 0,
  pay_date: ''
})

const rules = {
  bill_year: [{ required: true, message: '请选择年份', trigger: 'change' }],
  bill_month: [{ required: true, message: '请选择月份', trigger: 'change' }],
  tenant_id: [{ required: true, message: '请选择摊主', trigger: 'change' }],
  base_rent: [{ required: true, message: '请输入基础租金', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const tenantOptions = ref([])

async function loadTenants() {
  tenantOptions.value = await callApi(window.api.tenants.getActive)
}

async function loadList() {
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const result = await callApi(window.api.rent.list, params)
    tableData.value = result.list
    pagination.total = result.total
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetFilter() {
  filterForm.year = currentDate.getFullYear()
  filterForm.month = currentDate.getMonth() + 1
  filterForm.status = ''
  filterForm.keyword = ''
  pagination.page = 1
  loadList()
}

function onTenantChange(tenantId) {
  const tenant = tenantOptions.value.find(t => t.id === tenantId)
  if (tenant) {
    formData.stall_id = tenant.stall_id
    formData.base_rent = tenant.monthly_rent
  }
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    tenant_id: null,
    stall_id: null,
    bill_year: currentDate.getFullYear(),
    bill_month: currentDate.getMonth() + 1,
    base_rent: 0,
    extra_fee: 0,
    discount: 0,
    total_amount: 0,
    paid_amount: 0,
    paid_date: '',
    status: 'unpaid',
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
    bill_year: row.bill_year,
    bill_month: row.bill_month,
    base_rent: row.base_rent,
    extra_fee: row.extra_fee,
    discount: row.discount,
    total_amount: row.total_amount,
    paid_amount: row.paid_amount,
    paid_date: row.paid_date,
    status: row.status,
    remark: row.remark
  })
  loadTenants()
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await callApi(window.api.rent.update, editId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await callApi(window.api.rent.create, formData)
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
    await ElMessageBox.confirm(`确定要删除 ${row.bill_year}年${row.bill_month}月 ${row.tenant_name} 的账单吗？`, '确认删除', {
      type: 'warning'
    })
    await callApi(window.api.rent.delete, row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

function openPayDialog(row) {
  currentBill.value = row
  payForm.pay_amount = row.total_amount - row.paid_amount
  payForm.pay_date = new Date().toISOString().slice(0, 10)
  payDialogVisible.value = true
}

async function confirmPay() {
  try {
    await callApi(window.api.rent.markPaid, currentBill.value.id, payForm.pay_amount, payForm.pay_date)
    ElMessage.success('缴费登记成功')
    payDialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

function generateBatch() {
  generateDialogVisible.value = true
}

async function confirmGenerate() {
  try {
    const count = await callApi(window.api.rent.generateBatch, generateYear.value, generateMonth.value)
    ElMessage.success(`已成功生成 ${count} 条账单`)
    generateDialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  }
}

onMounted(() => {
  loadList()
})
</script>
