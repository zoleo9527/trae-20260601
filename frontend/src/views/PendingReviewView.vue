<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { type Allocation } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const list = ref<Allocation[]>([])

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

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-title">✅ 待到柜复核</div>
      <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
    </div>

    <el-card class="card-shadow" v-loading="loading">
      <el-table :data="list" stripe>
        <el-table-column prop="allocation_no" label="调拨单号" width="200" />
        <el-table-column label="调柜" width="240">
          <template #default="{ row }">
            <div>{{ row.from_counter }} → {{ row.to_counter }}</div>
            <div style="font-size: 12px; color: #9ca3af">{{ row.brand }} · {{ row.floor }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="160">
          <template #default="{ row }">
            <div>
              {{ row.goods_name }}
              <el-tag v-if="row.is_modified" type="warning" style="margin-left: 8px">⚠️ 调拨单已被修改</el-tag>
            </div>
            <div style="font-size: 12px; color: #9ca3af">{{ row.goods_code }}</div>
          </template>
        </el-table-column>
        <el-table-column label="期望数量" width="100">
          <template #default="{ row }">{{ row.quantity }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="变更提示" width="240">
          <template #default="{ row }">
            <div v-if="row.is_modified" style="color: #92400e">
              <el-tag type="warning" effect="dark">⚠️ 该调拨单已被修改</el-tag>
              <div style="font-size: 11px; margin-top: 6px; line-height: 1.5">
                修改次数：{{ row.change_logs.length }} 次<br/>
                请先查看变更日志，确认知晓后再进行复核
              </div>
            </div>
            <span v-else style="color: #059669">✓ 无改动</span>
          </template>
        </el-table-column>
        <el-table-column label="发起时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openReview(row)">到柜复核</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!list.length" style="padding: 40px; text-align: center; color: #9ca3af">🎉 暂无待复核的调拨单</div>
    </el-card>

    <el-dialog v-model="reviewDialog" title="到柜复核" width="560px" :close-on-click-modal="false">
      <template v-if="currentItem">
        <el-alert
          v-if="currentItem.is_modified"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
          title="⚠️ 该调拨单在发货后被修改过"
        >
          <div style="font-size: 13px; line-height: 1.8; margin-top: 6px">
            <div v-for="log in currentItem.change_logs" :key="log.id" style="margin-bottom: 4px">
              · {{ log.field_name }}: {{ log.old_value }} → {{ log.new_value }}（原因：{{ log.change_reason }}）
            </div>
            请确认已知晓以上变更内容后再进行复核
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
          <el-form-item v-if="reviewForm.actual_quantity !== currentItem.quantity" label="差异说明" required>
            <el-input v-model="reviewForm.difference_reason" type="textarea" :rows="3" placeholder="请说明数量差异原因，将作为责任认定依据" />
          </el-form-item>
          <el-form-item v-if="currentItem.is_modified" label="变更确认" required>
            <el-checkbox v-model="reviewForm.modification_acknowledged">
              我已确认知晓调拨单的修改内容，同意按修改后内容进行复核
            </el-checkbox>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="reviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">确认复核</el-button>
      </template>
    </el-dialog>
  </div>
</template>
