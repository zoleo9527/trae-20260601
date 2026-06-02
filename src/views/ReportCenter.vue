<template>
  <div class="container">
    <div class="page-header">
      <div class="page-title">报表中心</div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="欠费查询" name="arrears">
        <div class="filter-bar">
          <el-form :inline="true" :model="arrearsForm">
            <el-form-item label="年份">
              <el-select v-model="arrearsForm.year" clearable style="width: 120px;">
                <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
              </el-select>
            </el-form-item>
            <el-form-item label="月份">
              <el-select v-model="arrearsForm.month" clearable style="width: 120px;">
                <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadArrears">查询</el-button>
              <el-button @click="resetArrearsFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-alert
          v-if="arrearsData.list && arrearsData.list.length > 0"
          :title="`共有 ${arrearsData.list.length} 笔欠费，合计 ¥${formatMoney(arrearsData.totalArrears)}`"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        />

        <div class="table-container">
          <div style="margin-bottom: 12px;">
            <el-button type="success" @click="exportArrears">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
          <el-table :data="arrearsData.list || []" stripe style="width: 100%;">
            <el-table-column label="账期" width="110">
              <template #default="{ row }">{{ row.bill_year }}年{{ row.bill_month }}月</template>
            </el-table-column>
            <el-table-column prop="tenant_name" label="摊主" width="100" />
            <el-table-column prop="phone" label="联系电话" width="130" />
            <el-table-column prop="stall_code" label="摊位" width="90" />
            <el-table-column prop="location" label="位置" width="120" />
            <el-table-column label="应缴总额" width="100">
              <template #default="{ row }">¥{{ formatMoney(row.total_amount) }}</template>
            </el-table-column>
            <el-table-column label="已缴金额" width="100">
              <template #default="{ row }">¥{{ formatMoney(row.paid_amount) }}</template>
            </el-table-column>
            <el-table-column label="欠费金额" width="110">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold;">¥{{ formatMoney(row.arrears_amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <span :class="['status-tag', getRentStatusClass(row.status)]">
                  {{ getRentStatusText(row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="warning" @click="sendRentNotice(row)">
                  发通知单
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="扣分明细" name="deductions">
        <div class="filter-bar">
          <el-form :inline="true" :model="deductionForm">
            <el-form-item label="年份">
              <el-select v-model="deductionForm.year" clearable style="width: 120px;">
                <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
              </el-select>
            </el-form-item>
            <el-form-item label="月份">
              <el-select v-model="deductionForm.month" clearable style="width: 120px;">
                <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadDeductions">查询</el-button>
              <el-button @click="resetDeductionFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-row :gutter="16" style="margin-bottom: 16px;">
          <el-col :span="6">
            <div class="stats-card">
              <div class="label">总扣分数</div>
              <div class="value" style="color: #f56c6c;">{{ deductionData.summary?.total_points || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-card">
              <div class="label">总罚金</div>
              <div class="value" style="color: #e6a23c;">¥{{ formatMoney(deductionData.summary?.total_amount) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-card">
              <div class="label">扣分次数</div>
              <div class="value">{{ deductionData.summary?.total_count || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-card">
              <div class="label">未整改</div>
              <div class="value" style="color: #f56c6c;">{{ deductionData.summary?.unrectified_count || 0 }}</div>
            </div>
          </el-col>
        </el-row>

        <div class="table-container">
          <div style="margin-bottom: 12px;">
            <el-button type="success" @click="exportDeductions">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
          <el-table :data="deductionData.list || []" stripe style="width: 100%;">
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
            <el-table-column prop="recorder" label="记录人" width="90" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  type="warning" 
                  @click="sendDeductionNotice(row)"
                  v-if="!row.is_rectified"
                >
                  发整改单
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="摊主扣分汇总" name="summary">
        <div class="filter-bar">
          <el-form :inline="true" :model="summaryForm">
            <el-form-item label="年份">
              <el-select v-model="summaryForm.year" clearable style="width: 120px;">
                <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
              </el-select>
            </el-form-item>
            <el-form-item label="月份">
              <el-select v-model="summaryForm.month" clearable style="width: 120px;">
                <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadSummary">查询</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-container">
          <div style="margin-bottom: 12px;">
            <el-button type="success" @click="exportSummary">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
          <el-table 
            :data="summaryList" 
            stripe 
            style="width: 100%;" 
            @row-click="handleSummaryRowClick"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="stall_code" label="摊位" width="90" />
            <el-table-column prop="tenant_name" label="摊主" width="100" />
            <el-table-column label="扣分次数" width="100">
              <template #default="{ row }">{{ row.deduction_count || 0 }}</template>
            </el-table-column>
            <el-table-column label="累计扣分" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.total_points >= 20 ? '#f56c6c' : '#303133', fontWeight: 'bold' }">
                  {{ row.total_points || 0 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="累计罚金" width="110">
              <template #default="{ row }">
                <span style="color: #e6a23c;">¥{{ formatMoney(row.total_amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="未整改项" width="100">
              <template #default="{ row }">
                <span v-if="row.unrectified_count > 0" style="color: #f56c6c; font-weight: bold;">
                  {{ row.unrectified_count }}
                </span>
                <span v-else style="color: #67c23a;">0</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  type="primary" 
                  @click.stop="viewUnrectified(row)"
                  v-if="row.unrectified_count > 0"
                >
                  查看明细
                </el-button>
                <el-button 
                  size="small" 
                  type="warning" 
                  @click.stop="sendDeductionNotice({ tenant_id: row.tenant_id, ...row })"
                  v-if="row.unrectified_count > 0"
                >
                  发整改单
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="previewDialogVisible" title="打印预览" width="900px">
      <div class="print-preview" v-html="noticeHtml" />
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="printNotice">打印</el-button>
        <el-button type="success" @click="exportCurrent">导出Excel</el-button>
      </template>
    </el-dialog>

    <el-drawer 
      v-model="unrectifiedDrawerVisible" 
      title="未整改明细" 
      direction="rtl" 
      size="800px"
    >
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div>
            <span style="font-size: 18px; font-weight: bold;">未整改明细</span>
            <span style="margin-left: 12px; color: #909399;">
              {{ currentUnrectifiedTenant?.stall_code }} - {{ currentUnrectifiedTenant?.tenant_name }}
            </span>
          </div>
          <el-button 
            type="warning" 
            size="small" 
            @click="sendDeductionNotice({ tenant_id: currentUnrectifiedTenant?.tenant_id, ...currentUnrectifiedTenant })"
          >
            发整改单
          </el-button>
        </div>
      </template>

      <div style="padding: 16px 0;">
        <el-alert
          v-if="unrectifiedList.length === 0"
          title="该摊主暂无未整改记录"
          type="success"
          :closable="false"
          show-icon
        />
        <el-table :data="unrectifiedList" stripe style="width: 100%;" v-else>
          <el-table-column prop="deduction_date" label="日期" width="120" />
          <el-table-column prop="stall_code" label="摊位" width="90" />
          <el-table-column prop="reason" label="违规原因" min-width="200" />
          <el-table-column label="扣分" width="80">
            <template #default="{ row }">
              <span style="color: #f56c6c; font-weight: bold;">-{{ row.points }}</span>
            </template>
          </el-table-column>
          <el-table-column label="罚金" width="100">
            <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="recorder" label="记录人" width="90" />
          <el-table-column label="整改期限" width="120">
            <template #default="{ row }">
              {{ getDeadline(row.deduction_date) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { callApi, formatMoney, getRentStatusText, getRentStatusClass, getRectifyStatusText, getRectifyStatusClass } from '../utils/api'

const activeTab = ref('arrears')
const currentDate = new Date()
const yearOptions = ref([currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1])

const arrearsForm = reactive({
  year: currentDate.getFullYear(),
  month: currentDate.getMonth() + 1
})

const deductionForm = reactive({
  year: currentDate.getFullYear(),
  month: ''
})

const summaryForm = reactive({
  year: currentDate.getFullYear(),
  month: ''
})

const arrearsData = ref({ list: [], totalArrears: 0 })
const deductionData = ref({ list: [], summary: {} })
const summaryList = ref([])

const previewDialogVisible = ref(false)
const noticeHtml = ref('')
const currentNoticeType = ref('')
const currentNoticeParams = ref({})

const unrectifiedDrawerVisible = ref(false)
const unrectifiedList = ref([])
const currentUnrectifiedTenant = ref(null)

async function loadArrears() {
  try {
    arrearsData.value = await callApi(
      window.api.reports.getArrears,
      arrearsForm.year || null,
      arrearsForm.month || null
    )
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetArrearsFilter() {
  arrearsForm.year = currentDate.getFullYear()
  arrearsForm.month = currentDate.getMonth() + 1
  loadArrears()
}

async function loadDeductions() {
  try {
    deductionData.value = await callApi(
      window.api.reports.getDeductionDetails,
      deductionForm.year || null,
      deductionForm.month || null
    )
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function resetDeductionFilter() {
  deductionForm.year = currentDate.getFullYear()
  deductionForm.month = ''
  loadDeductions()
}

async function loadSummary() {
  try {
    summaryList.value = await callApi(
      window.api.deductions.getSummary,
      summaryForm.year || null,
      summaryForm.month || null
    )
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

async function sendRentNotice(row) {
  try {
    const result = await callApi(
      window.api.reports.generateNotice,
      row.tenant_id,
      'rent',
      {}
    )
    noticeHtml.value = result.html
    currentNoticeType.value = 'rent'
    currentNoticeParams.value = { year: arrearsForm.year, month: arrearsForm.month }
    previewDialogVisible.value = true
  } catch (e) {
    ElMessage.error(e.message || '生成通知失败')
  }
}

async function sendDeductionNotice(row) {
  try {
    const result = await callApi(
      window.api.reports.generateNotice,
      row.tenant_id,
      'deduction',
      {}
    )
    noticeHtml.value = result.html
    currentNoticeType.value = 'deduction'
    currentNoticeParams.value = { year: deductionForm.year, month: deductionForm.month }
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

async function exportArrears() {
  try {
    const result = await callApi(
      window.api.reports.exportToExcel,
      'arrears',
      { year: arrearsForm.year, month: arrearsForm.month }
    )
    ElMessage.success(`已导出到桌面：${result.fileName}（共${result.rowCount}条记录）`)
  } catch (e) {
    ElMessage.error(e.message || '导出失败')
  }
}

async function exportDeductions() {
  try {
    const result = await callApi(
      window.api.reports.exportToExcel,
      'deductions',
      { year: deductionForm.year, month: deductionForm.month }
    )
    ElMessage.success(`已导出到桌面：${result.fileName}（共${result.rowCount}条记录）`)
  } catch (e) {
    ElMessage.error(e.message || '导出失败')
  }
}

async function exportCurrent() {
  if (currentNoticeType.value === 'rent') {
    await exportArrears()
  } else {
    await exportDeductions()
  }
}

async function exportSummary() {
  try {
    const result = await callApi(
      window.api.reports.exportToExcel,
      'deduction_summary',
      { year: summaryForm.year, month: summaryForm.month }
    )
    ElMessage.success(`已导出到桌面：${result.fileName}（共${result.rowCount}条记录）`)
  } catch (e) {
    ElMessage.error(e.message || '导出失败')
  }
}

async function viewUnrectified(row) {
  currentUnrectifiedTenant.value = row
  unrectifiedDrawerVisible.value = true
  try {
    unrectifiedList.value = await callApi(
      window.api.reports.getUnrectifiedByTenant,
      row.tenant_id,
      summaryForm.year || null,
      summaryForm.month || null
    )
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
    unrectifiedList.value = []
  }
}

function handleSummaryRowClick(row) {
  if (row.unrectified_count > 0) {
    viewUnrectified(row)
  }
}

function getDeadline(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

onMounted(() => {
  loadArrears()
})
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
</style>
