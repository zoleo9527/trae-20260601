<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api, { type Allocation, statusMap, reviewStatusMap } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const list = ref<Allocation[]>([])
const activeTab = ref('all')

const filteredList = computed(() => {
  if (activeTab.value === 'all') return list.value
  if (activeTab.value === 'pending') return list.value.filter(x => x.status === 'shipped')
  if (activeTab.value === 'disputed') return list.value.filter(x => x.status === 'disputed')
  if (activeTab.value === 'modified') return list.value.filter(x => x.is_modified && x.status === 'shipped')
  return list.value
})

const stats = computed(() => ({
  total: list.value.length,
  pending: list.value.filter(x => x.status === 'shipped').length,
  disputed: list.value.filter(x => x.status === 'disputed').length,
  modified: list.value.filter(x => x.is_modified && x.status === 'shipped').length,
}))

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.listPendingReviews()
    if (res.code === 0) list.value = res.data.items
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '加载失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (s?: string) => s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '-'

const reviewDialog = ref(false)
const currentItem = ref<Allocation | null>(null)
const reviewForm = ref({ actual_quantity: 0, difference_reason: '', modification_acknowledged: false })

const openReview = (item: Allocation) => {
  currentItem.value = item
  reviewForm.value = {
    actual_quantity: item.quantity,
    difference_reason: '',
    modification_acknowledged: false
  }
  reviewDialog.value = true
}

const goDetail = (id: number) => window.location.hash = `#/allocations/${id}`

const submitReview = async () => {
  if (currentItem.value?.is_modified && !reviewForm.value.modification_acknowledged) {
    ElMessage.warning('该调拨单已被修改，请先勾选「确认已知晓变更内容」')
    return
  }
  if (reviewForm.value.actual_quantity !== currentItem.value?.quantity && !reviewForm.value.difference_reason) {
    ElMessage.warning('数量不一致时请填写差异说明')
    return
  }
  try {
    const res = await api.createReview({
      allocation_id: currentItem.value!.id,
      actual_quantity: reviewForm.value.actual_quantity,
      difference_reason: reviewForm.value.difference_reason || null,
      modification_acknowledged: reviewForm.value.modification_acknowledged
    }, 2)
    if (res.code === 0) {
      ElMessage.success('到柜复核完成')
      reviewDialog.value = false
      loadData()
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '复核失败')
  }
}

const getReviewOfAllocation = (item: Allocation) => {
  return item.reviews && item.reviews.length > 0 ? item.reviews[0] : null
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-title">✅ 到柜复核工作台</div>
      <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow" style="cursor: pointer" @click="activeTab = 'all'">
          <div style="font-size: 13px; color: #6b7280">全部待处理</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px">{{ stats.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow" style="cursor: pointer" @click="activeTab = 'pending'">
          <div style="font-size: 13px; color: #6b7280">待初次复核</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px; color: #3b82f6">{{ stats.pending }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow" style="cursor: pointer" @click="activeTab = 'modified'">
          <div style="font-size: 13px; color: #6b7280">被改动待确认</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px; color: #f59e0b">{{ stats.modified }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow" style="cursor: pointer" @click="activeTab = 'disputed'">
          <div style="font-size: 13px; color: #6b7280">差异待核实</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px; color: #ef4444">{{ stats.disputed }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow" v-loading="loading">
      <el-tabs v-model="activeTab" style="margin-bottom: -16px">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待初次复核" name="pending" />
        <el-tab-pane label="被改动待确认" name="modified" />
        <el-tab-pane label="差异待核实" name="disputed" />
      </el-tabs>

      <el-table :data="filteredList" stripe style="width: 100%">
        <el-table-column prop="allocation_no" label="调拨单号" width="190">
          <template #default="{ row }">
            <a style="color: #4f46e5; cursor: pointer" @click="goDetail(row.id)">{{ row.allocation_no }}</a>
          </template>
        </el-table-column>
        <el-table-column label="调柜" width="220">
          <template #default="{ row }">
            <div>{{ row.from_counter }} → {{ row.to_counter }}</div>
            <div style="font-size: 12px; color: #9ca3af">{{ row.brand }} · {{ row.floor }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="150">
          <template #default="{ row }">
            <div>{{ row.goods_name }}</div>
            <div style="font-size: 12px; color: #9ca3af">{{ row.goods_code }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数量(期望/实收)" width="130">
          <template #default="{ row }">
            <div>{{ row.quantity }}{{ row.unit }}</div>
            <div v-if="getReviewOfAllocation(row)" style="font-size: 12px">
              实收:
              <span :style="{ color: getReviewOfAllocation(row)!.actual_quantity !== row.quantity ? '#ef4444' : '#059669' }">
                {{ getReviewOfAllocation(row)!.actual_quantity }}{{ row.unit }}
              </span>
            </div>
            <div v-else style="font-size: 12px; color: #9ca3af">实收: 待复核</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
            <el-tag v-if="row.is_modified && row.status === 'shipped'" type="warning" size="small" style="margin-top: 4px">
              被改动
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="责任场景说明" min-width="260">
          <template #default="{ row }">
            <div v-if="row.status === 'disputed'" style="font-size: 12px; color: #991b1b; background: #fef2f2; padding: 6px 8px; border-radius: 4px">
              <b>⚠️ 差异待核实</b><br/>
              {{ getReviewOfAllocation(row)?.difference_reason || '数量有差异' }}
            </div>
            <div v-else-if="row.is_modified && row.status === 'shipped'" style="font-size: 12px; color: #92400e; background: #fffbeb; padding: 6px 8px; border-radius: 4px">
              <b>⚠️ 被修改待确认</b><br/>
              变更 {{ row.change_logs.length }} 次，复核前需确认已知晓
            </div>
            <div v-else style="font-size: 12px; color: #065f46; background: #ecfdf5; padding: 6px 8px; border-radius: 4px">
              <b>✓ 正常待复核</b><br/>
              无改动，可直接执行到柜复核
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发起时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'shipped'" size="small" type="primary" @click="openReview(row)">到柜复核</el-button>
            <el-button v-else-if="row.status === 'disputed'" size="small" type="danger" @click="goDetail(row.id)">查看差异</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!filteredList.length" style="padding: 40px; text-align: center; color: #9ca3af">📭 暂无数据</div>
    </el-card>

    <el-dialog v-model="reviewDialog" title="到柜复核" width="580px" :close-on-click-modal="false">
      <template v-if="currentItem">
        <el-alert
          v-if="currentItem.is_modified"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
          title="⚠️ 【责任场景A】该调拨单在发货后被修改过"
        >
          <div style="font-size: 13px; line-height: 1.8; margin-top: 6px">
            <div v-for="log in currentItem.change_logs" :key="log.id" style="margin-bottom: 4px">
              · <b>{{ log.field_name }}</b>: {{ log.old_value }} → {{ log.new_value }}
              <span style="color: #6b7280">（原因：{{ log.change_reason }}）</span>
            </div>
            <div style="margin-top: 8px; font-weight: 500">请确认已知晓以上变更内容后再进行复核，确认后责任由复核人承担。</div>
          </div>
        </el-alert>

        <el-descriptions :column="2" size="small" border style="margin-bottom: 16px">
          <el-descriptions-item label="调拨单号">{{ currentItem.allocation_no }}</el-descriptions-item>
          <el-descriptions-item label="商品">{{ currentItem.goods_name }}</el-descriptions-item>
          <el-descriptions-item label="调柜">{{ currentItem.from_counter }}→{{ currentItem.to_counter }}</el-descriptions-item>
          <el-descriptions-item label="期望数量">{{ currentItem.quantity }}{{ currentItem.unit }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="reviewForm" label-width="120px">
          <el-form-item label="实收数量" required>
            <el-input-number v-model="reviewForm.actual_quantity" :min="0" />
            <span style="margin-left: 8px">{{ currentItem.unit }}</span>
          </el-form-item>
          <el-form-item v-if="reviewForm.actual_quantity !== currentItem.quantity" label="差异原因" required>
            <el-input v-model="reviewForm.difference_reason" type="textarea" :rows="3" placeholder="请详细说明数量差异原因（如：外箱破损、发货方少装、途中丢失等），将作为责任认定依据" />
            <div style="font-size: 12px; color: #991b1b; margin-top: 4px">
              ⚠️ 数量不一致时必须填写差异原因，系统将自动标记为「差异待核实」状态
            </div>
          </el-form-item>
          <el-form-item v-if="currentItem.is_modified" label="变更确认" required>
            <el-checkbox v-model="reviewForm.modification_acknowledged">
              我已确认知晓调拨单的全部修改内容，同意按修改后数量进行复核
            </el-checkbox>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="reviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">确认提交复核</el-button>
      </template>
    </el-dialog>
  </div>
</template>
