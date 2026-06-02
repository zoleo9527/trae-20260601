<template>
  <div class="container">
    <div class="page-header">
      <div class="page-title">水电记录</div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        录入读数
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="类型">
          <el-select v-model="filterForm.utility_type" clearable placeholder="全部" style="width: 120px;">
            <el-option label="水费" value="water" />
            <el-option label="电费" value="electric" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常">
          <el-select v-model="filterForm.is_abnormal" clearable placeholder="全部" style="width: 120px;">
            <el-option label="仅异常" :value="1" />
            <el-option label="仅正常" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="YYYY-MM-DD"
            style="width: 280px;"
          />
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

    <el-alert
      v-if="abnormalList.length > 0"
      :title="`检测到 ${abnormalList.length} 条水电用量异常记录，请核实处理`"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;"
    />

    <div class="table-container">
      <el-table :data="tableData" stripe style="width: 100%;">
        <el-table-column prop="record_date" label="记录日期" width="110" />
        <el-table-column prop="stall_code" label="摊位" width="90" />
        <el-table-column prop="tenant_name" label="摊主" width="100" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.utility_type === 'water' ? 'info' : 'warning'" size="small">
              {{ getUtilityTypeText(row.utility_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上次读数" width="100">
          <template #default="{ row }">{{ row.last_reading }}</template>
        </el-table-column>
        <el-table-column label="本次读数" width="100">
          <template #default="{ row }">{{ row.current_reading }}</template>
        </el-table-column>
        <el-table-column label="用量" width="90">
          <template #default="{ row }">
            <span :class="{ 'status-abnormal': row.is_abnormal }">{{ row.usage }}</span>
            <span v-if="row.utility_type === 'water'">吨</span>
            <span v-else>度</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="90">
          <template #default="{ row }">¥{{ row.unit_price }}/{{ row.utility_type === 'water' ? '吨' : '度' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_abnormal" type="danger" size="small">异常</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column label="操作" width="150" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑记录' : '录入读数'" width="550px">
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
            <el-form-item label="类型" prop="utility_type">
              <el-select v-model="formData.utility_type" style="width: 100%;" @change="onTypeChange">
                <el-option label="水费" value="water" />
                <el-option label="电费" value="electric" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="记录日期" prop="record_date">
              <el-date-picker 
                v-model="formData.record_date" 
                type="date" 
                value-format="YYYY-MM-DD"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价(元)">
              <el-input-number 
                v-model="formData.unit_price" 
                :min="0" 
                :precision="2"
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="上次读数">
              <el-input :value="formData.last_reading" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="本次读数" prop="current_reading">
              <el-input-number 
                v-model="formData.current_reading" 
                :min="formData.last_reading" 
                style="width: 100%;" 
                @change="calculateUsage"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="用量">
              <el-input :value="formData.usage" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额(元)">
              <el-input :value="'¥' + formatMoney(formData.amount)" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div v-if="formData.usage > 0 && isAbnormalUsage()" 
           style="color: #f56c6c; margin-bottom: 16px; font-size: 13px;">
        ⚠️ 用量超过阈值，系统将标记为异常记录
      </div>
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
import { callApi, formatMoney, getUtilityTypeText } from '../utils/api'

const tableData = ref([])
const abnormalList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  utility_type: '',
  is_abnormal: undefined,
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
  utility_type: 'electric',
  record_date: '',
  last_reading: 0,
  current_reading: 0,
  usage: 0,
  unit_price: 1.2,
  amount: 0,
  remark: ''
})

const rules = {
  stall_id: [{ required: true, message: '请选择摊位', trigger: 'change' }],
  utility_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  record_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  current_reading: [{ required: true, message: '请输入本次读数', trigger: 'blur' }]
}

const stallOptions = ref([])
const lastReading = ref(null)

async function loadStalls() {
  stallOptions.value = await callApi(window.api.stalls.listWithTenant)
}

async function loadAbnormal() {
  abnormalList.value = await callApi(window.api.utilities.getAbnormal)
}

async function loadList() {
  try {
    const params = {
      utility_type: filterForm.utility_type || undefined,
      is_abnormal: filterForm.is_abnormal,
      start_date: filterForm.dateRange?.[0] || undefined,
      end_date: filterForm.dateRange?.[1] || undefined,
      keyword: filterForm.keyword || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const result = await callApi(window.api.utilities.list, params)
    tableData.value = result.list
    pagination.total = result.total
    loadAbnormal()
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetFilter() {
  filterForm.utility_type = ''
  filterForm.is_abnormal = undefined
  filterForm.dateRange = []
  filterForm.keyword = ''
  pagination.page = 1
  loadList()
}

async function onStallChange(stallId) {
  const stall = stallOptions.value.find(s => s.id === stallId)
  if (stall) {
    formData.tenant_id = stall.tenant_id
  }
  if (formData.utility_type) {
    await loadLastReading()
  }
}

async function onTypeChange() {
  formData.unit_price = formData.utility_type === 'water' ? 5.5 : 1.2
  if (formData.stall_id) {
    await loadLastReading()
  }
  calculateUsage()
}

async function loadLastReading() {
  lastReading.value = await callApi(
    window.api.utilities.getLastReading, 
    formData.stall_id, 
    formData.utility_type
  )
  formData.last_reading = lastReading.value?.current_reading || 0
  formData.current_reading = formData.last_reading
  calculateUsage()
}

function calculateUsage() {
  formData.usage = Math.max(0, formData.current_reading - formData.last_reading)
  formData.amount = formData.usage * formData.unit_price
}

function isAbnormalUsage() {
  if (formData.utility_type === 'electric' && formData.usage > 500) return true
  if (formData.utility_type === 'water' && formData.usage > 50) return true
  return false
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    stall_id: null,
    tenant_id: null,
    utility_type: 'electric',
    record_date: new Date().toISOString().slice(0, 10),
    last_reading: 0,
    current_reading: 0,
    usage: 0,
    unit_price: 1.2,
    amount: 0,
    remark: ''
  })
  lastReading.value = null
  loadStalls()
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    stall_id: row.stall_id,
    tenant_id: row.tenant_id,
    utility_type: row.utility_type,
    record_date: row.record_date,
    last_reading: row.last_reading,
    current_reading: row.current_reading,
    usage: row.usage,
    unit_price: row.unit_price,
    amount: row.amount,
    remark: row.remark
  })
  loadStalls()
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await callApi(window.api.utilities.update, editId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await callApi(window.api.utilities.create, formData)
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
    await ElMessageBox.confirm(`确定要删除这条记录吗？`, '确认删除', {
      type: 'warning'
    })
    await callApi(window.api.utilities.delete, row.id)
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
