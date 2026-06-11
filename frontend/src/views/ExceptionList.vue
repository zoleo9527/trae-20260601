<template>
  <div class="exception-list">
    <div class="page-header">
      <h2>异常处理</h2>
      <p class="subtitle">集中处理折扣活动和价格报备中的异常项，确保流程顺畅</p>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card exception-card">
          <div class="stat-icon">
            <el-icon :size="32"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.discount_exception + stats.price_exception }}</div>
            <div class="stat-label">异常总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card discount-card">
          <div class="stat-icon">
            <el-icon :size="32"><Discount /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.discount_exception }}</div>
            <div class="stat-label">活动异常</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card price-card">
          <div class="stat-icon">
            <el-icon :size="32"><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.price_exception }}</div>
            <div class="stat-label">报备异常</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pending-card">
          <div class="stat-icon">
            <el-icon :size="32"><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending_review + stats.reported }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 140px">
            <el-option label="折扣活动" value="discount" />
            <el-option label="价格报备" value="price_report" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="filters.exception_type" placeholder="全部异常" clearable style="width: 160px">
            <el-option label="折扣率过低" value="low_discount" />
            <el-option label="活动周期过长" value="long_period" />
            <el-option label="价格异常" value="price_anomaly" />
            <el-option label="人工标记" value="manual" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="filters.brand" placeholder="品牌名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="warning" @click="triggerTestException">
            <el-icon><WarningFilled /></el-icon>
            触发测试异常
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" class="exception-tabs">
      <el-tab-pane label="折扣活动异常" name="discount">
        <el-table :data="discountExceptions" v-loading="loading" stripe>
          <el-table-column prop="campaign_no" label="活动编号" width="140" />
          <el-table-column prop="title" label="活动名称" min-width="180" />
          <el-table-column prop="brand_name" label="品牌" width="120" />
          <el-table-column prop="store_name" label="门店" width="140" />
          <el-table-column label="折扣信息" width="140">
            <template #default="{ row }">
              <div v-if="row.discount_rate">
                {{ row.discount_rate }}折
                <el-tag v-if="row.discount_rate < 3" type="danger" size="small">超低</el-tag>
              </div>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="活动周期" width="200">
            <template #default="{ row }">
              {{ row.start_date }} 至 {{ row.end_date }}
            </template>
          </el-table-column>
          <el-table-column prop="exception_reason" label="异常原因" min-width="160">
            <template #default="{ row }">
              <el-popover
                placement="top"
                :width="300"
                trigger="hover"
                :content="row.exception_reason"
              >
                <template #reference>
                  <span class="exception-reason">{{ row.exception_reason || '未填写' }}</span>
                </template>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column prop="creator_name" label="创建人" width="100" />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewDiscount(row)">
                查看详情
              </el-button>
              <el-button 
                v-if="isSupervisor || isManager" 
                type="success" 
                size="small" 
                @click="resolveDiscountException(row)"
              >
                解决异常
              </el-button>
              <el-button 
                v-if="isSupervisor || isManager" 
                type="danger" 
                size="small" 
                @click="rejectDiscount(row)"
              >
                退回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="价格报备异常" name="price_report">
        <el-table :data="priceReportExceptions" v-loading="loading" stripe>
          <el-table-column prop="report_no" label="报备编号" width="140" />
          <el-table-column prop="campaign_title" label="所属活动" min-width="160" />
          <el-table-column prop="product_name" label="商品名称" min-width="160" />
          <el-table-column prop="product_code" label="商品编码" width="120" />
          <el-table-column label="价格信息" width="200">
            <template #default="{ row }">
              <div class="price-info">
                <span class="original-price">¥{{ row.original_price }}</span>
                <el-icon><Right /></el-icon>
                <span class="discount-price">¥{{ row.discount_price }}</span>
                <el-tag v-if="row.discount_rate" size="small" :type="row.discount_rate < 3 ? 'danger' : 'info'">
                  {{ row.discount_rate }}折
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="exception_reason" label="异常原因" min-width="160">
            <template #default="{ row }">
              <el-popover
                placement="top"
                :width="300"
                trigger="hover"
                :content="row.exception_reason"
              >
                <template #reference>
                  <span class="exception-reason">{{ row.exception_reason || '未填写' }}</span>
                </template>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column prop="creator_name" label="创建人" width="100" />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewPriceReport(row)">
                查看详情
              </el-button>
              <el-button 
                v-if="isSupervisor || isManager" 
                type="success" 
                size="small" 
                @click="resolvePriceException(row)"
              >
                解决异常
              </el-button>
              <el-button 
                v-if="isSupervisor || isManager" 
                type="danger" 
                size="small" 
                @click="rejectPriceReport(row)"
              >
                退回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="resolveDialogVisible" title="解决异常" width="500px">
      <el-form :model="resolveForm" label-width="100px">
        <el-form-item label="处理说明" required>
          <el-input 
            v-model="resolveForm.comment" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入解决异常的说明..."
          />
        </el-form-item>
        <el-form-item label="调整后状态">
          <el-select v-model="resolveForm.target_status" style="width: 100%">
            <el-option label="退回修改" value="rejected" />
            <el-option label="恢复审核" value="pending_review" v-if="currentType === 'discount'" />
            <el-option label="恢复核实" value="reported" v-if="currentType === 'price_report'" />
            <el-option label="正常通过" value="approved" v-if="currentType === 'discount'" />
            <el-option label="正常核实" value="verified" v-if="currentType === 'price_report'" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResolve">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="退回异常项" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="退回原因" required>
          <el-input 
            v-model="rejectForm.reason" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入退回原因，以便创建人修改..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认退回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testDialogVisible" title="触发测试异常" width="500px">
      <el-alert 
        type="warning" 
        :closable="false" 
        show-icon
        title="此操作将创建一个测试用的异常样例，用于验证异常流处理是否正常工作。"
        style="margin-bottom: 16px"
      />
      <el-form :model="testForm" label-width="100px">
        <el-form-item label="异常类型">
          <el-radio-group v-model="testForm.type">
            <el-radio value="low_discount">折扣率过低（2折）</el-radio>
            <el-radio value="long_period">活动周期过长（90天）</el-radio>
            <el-radio value="price_anomaly">价格异常（折扣价>原价）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmTestException">创建异常样例</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { discountApi, priceReportApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const activeTab = ref('discount')
const discountExceptions = ref([])
const priceReportExceptions = ref([])

const stats = reactive({
  discount_exception: 0,
  price_exception: 0,
  pending_review: 0,
  reported: 0
})

const filters = reactive({
  type: '',
  exception_type: '',
  brand: ''
})

const isSupervisor = computed(() => userStore.isOperationSupervisor)
const isManager = computed(() => userStore.isInvestmentManager)

const resolveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const testDialogVisible = ref(false)
const currentItem = ref(null)
const currentType = ref('')

const resolveForm = reactive({
  comment: '',
  target_status: ''
})

const rejectForm = reactive({
  reason: ''
})

const testForm = reactive({
  type: 'low_discount'
})

async function loadStatistics() {
  try {
    const [dRes, pRes] = await Promise.all([
      discountApi.getStatistics(),
      priceReportApi.getStatistics()
    ])
    stats.discount_exception = dRes.exception || 0
    stats.price_exception = pRes.exception || 0
    stats.pending_review = dRes.pending_review || 0
    stats.reported = pRes.reported || 0
  } catch (e) {
    console.error('Load statistics error:', e)
  }
}

async function loadDiscountExceptions() {
  try {
    const params = { status: 'exception' }
    if (filters.brand) params.brand_name = filters.brand
    const res = await discountApi.getList(params)
    discountExceptions.value = res.items || res
  } catch (e) {
    ElMessage.error('加载折扣活动异常失败')
  }
}

async function loadPriceReportExceptions() {
  try {
    const params = { status: 'exception' }
    if (filters.brand) params.brand_name = filters.brand
    const res = await priceReportApi.getList(params)
    priceReportExceptions.value = res.items || res
  } catch (e) {
    ElMessage.error('加载价格报备异常失败')
  }
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      loadStatistics(),
      loadDiscountExceptions(),
      loadPriceReportExceptions()
    ])
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.type = ''
  filters.exception_type = ''
  filters.brand = ''
  loadData()
}

function viewDiscount(row) {
  router.push(`/discount/${row.id}`)
}

function viewPriceReport(row) {
  router.push(`/price-report/${row.id}`)
}

function resolveDiscountException(row) {
  currentItem.value = row
  currentType.value = 'discount'
  resolveForm.comment = ''
  resolveForm.target_status = 'pending_review'
  resolveDialogVisible.value = true
}

function resolvePriceException(row) {
  currentItem.value = row
  currentType.value = 'price_report'
  resolveForm.comment = ''
  resolveForm.target_status = 'reported'
  resolveDialogVisible.value = true
}

async function confirmResolve() {
  if (!resolveForm.comment) {
    ElMessage.warning('请输入处理说明')
    return
  }
  try {
    if (currentType.value === 'discount') {
      if (resolveForm.target_status === 'rejected') {
        await discountApi.reject(currentItem.value.id, { reason: resolveForm.comment })
      } else if (resolveForm.target_status === 'approved') {
        await discountApi.approve(currentItem.value.id, { comment: resolveForm.comment })
      } else {
        await discountApi.resolveException(currentItem.value.id, { 
          comment: resolveForm.comment,
          target_status: resolveForm.target_status
        })
      }
    } else {
      if (resolveForm.target_status === 'rejected') {
        await priceReportApi.reject(currentItem.value.id, { reason: resolveForm.comment })
      } else if (resolveForm.target_status === 'verified') {
        await priceReportApi.verify(currentItem.value.id, { comment: resolveForm.comment })
      } else {
        await priceReportApi.resolveException(currentItem.value.id, { 
          comment: resolveForm.comment,
          target_status: resolveForm.target_status
        })
      }
    }
    ElMessage.success('异常处理成功')
    resolveDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('处理失败：' + (e.response?.data?.message || e.message))
  }
}

function rejectDiscount(row) {
  currentItem.value = row
  currentType.value = 'discount'
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

function rejectPriceReport(row) {
  currentItem.value = row
  currentType.value = 'price_report'
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

async function confirmReject() {
  if (!rejectForm.reason) {
    ElMessage.warning('请输入退回原因')
    return
  }
  try {
    if (currentType.value === 'discount') {
      await discountApi.reject(currentItem.value.id, { reason: rejectForm.reason })
    } else {
      await priceReportApi.reject(currentItem.value.id, { reason: rejectForm.reason })
    }
    ElMessage.success('退回成功')
    rejectDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('退回失败：' + (e.response?.data?.message || e.message))
  }
}

function triggerTestException() {
  testDialogVisible.value = true
}

async function confirmTestException() {
  try {
    const today = new Date()
    const endDate = new Date(today)
    
    let campaignData = {
      title: '【测试异常】' + testForm.type,
      brand_name: '测试品牌',
      store_name: '测试门店',
      discount_type: 'direct_discount',
      description: '这是一个用于测试异常流的样例数据，请在测试完成后删除。不少于十个字的描述'
    }

    if (testForm.type === 'low_discount') {
      campaignData.discount_rate = 0.2
      campaignData.start_date = today.toISOString().split('T')[0]
      endDate.setDate(today.getDate() + 7)
      campaignData.end_date = endDate.toISOString().split('T')[0]
    } else if (testForm.type === 'long_period') {
      campaignData.discount_rate = 0.8
      campaignData.start_date = today.toISOString().split('T')[0]
      endDate.setDate(today.getDate() + 90)
      campaignData.end_date = endDate.toISOString().split('T')[0]
    } else if (testForm.type === 'price_anomaly') {
      campaignData.discount_rate = 0.8
      campaignData.start_date = today.toISOString().split('T')[0]
      endDate.setDate(today.getDate() + 7)
      campaignData.end_date = endDate.toISOString().split('T')[0]
    }

    const campaignRes = await discountApi.create(campaignData)
    const campaignId = campaignRes.id

    if (testForm.type === 'price_anomaly') {
      const reportRes = await priceReportApi.create({
        campaign_id: campaignId,
        product_name: '测试异常商品',
        product_code: 'TEST-001',
        original_price: 100,
        discount_price: 150
      })
      await priceReportApi.submit(reportRes.id, { confirm_exception: true })
    }

    await discountApi.submit(campaignId, { confirm_exception: true })

    if (testForm.type === 'price_anomaly') {
      const reports = await priceReportApi.getList({ campaign_id: campaignId, status: 'reported' })
      if (reports.items && reports.items.length > 0) {
        await priceReportApi.raiseException(reports.items[0].id, {
          reason: '测试异常：折扣价（150）高于原价（100），数据录入异常'
        })
      }
    } else {
      await discountApi.raiseException(campaignId, {
        reason: testForm.type === 'low_discount'
          ? '测试异常：折扣率2折低于3折下限'
          : '测试异常：活动周期90天超过60天上限'
      })
    }

    ElMessage.success('测试异常样例已创建，请查看异常列表')
    testDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('创建失败：' + (e.response?.data?.error || e.response?.data?.message || e.message))
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.exception-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  border: none;
  border-radius: 8px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exception-card .stat-icon {
  background: linear-gradient(135deg, #fef0f0, #fde2e2);
  color: #f56c6c;
}

.discount-card .stat-icon {
  background: linear-gradient(135deg, #ecf5ff, #d9ecff);
  color: #409eff;
}

.price-card .stat-icon {
  background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
  color: #67c23a;
}

.pending-card .stat-icon {
  background: linear-gradient(135deg, #fdf6ec, #faecd8);
  color: #e6a23c;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.filter-card {
  margin-bottom: 16px;
}

.exception-tabs {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.original-price {
  text-decoration: line-through;
  color: #909399;
}

.discount-price {
  color: #f56c6c;
  font-weight: 600;
}

.exception-reason {
  color: #f56c6c;
  cursor: pointer;
}

.text-muted {
  color: #c0c4cc;
}
</style>
