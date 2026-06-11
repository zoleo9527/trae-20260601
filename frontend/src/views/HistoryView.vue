<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api, { type TimelineItem, statusMap, reviewStatusMap } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const timeline = ref<TimelineItem[]>([])
const filterBrand = ref('')
const filterStatus = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.getReviewTimeline({ brand: filterBrand.value || undefined, status: filterStatus.value || undefined })
    if (res.code === 0) timeline.value = res.data.items
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '加载失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (s?: string) => s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '-'

const goDetail = (id: number) => window.location.hash = `#/allocations/${id}`

const stats = computed(() => {
  const list = timeline.value
  return {
    total: list.length,
    modified: list.filter(x => x.is_modified).length,
    disputed: list.filter(x => x.allocation_status === 'disputed' || x.review_status === 'disputed').length,
    pendingReview: list.filter(x => x.review_status === 'pending' && x.allocation_status === 'shipped').length,
  }
})

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-title">📋 历史回看 · 调拨与复核时间线</div>
      <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow">
          <div style="font-size: 13px; color: #6b7280">调拨单总数</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px">{{ stats.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow">
          <div style="font-size: 13px; color: #6b7280">被修改过 ⚠️</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px; color: #f59e0b">{{ stats.modified }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow">
          <div style="font-size: 13px; color: #6b7280">有差异待核实</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px; color: #ef4444">{{ stats.disputed }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="card-shadow">
          <div style="font-size: 13px; color: #6b7280">待到柜复核</div>
          <div style="font-size: 28px; font-weight: 600; margin-top: 6px; color: #3b82f6">{{ stats.pendingReview }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow" style="margin-bottom: 16px">
      <el-form :inline="true">
        <el-form-item label="品牌">
          <el-select v-model="filterBrand" clearable placeholder="全部" style="width: 160px" @change="loadData">
            <el-option label="雅诗兰黛" value="雅诗兰黛" />
            <el-option label="兰蔻" value="兰蔻" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width: 160px" @change="loadData">
            <el-option v-for="(v, k) in statusMap" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" v-loading="loading">
      <el-table :data="timeline" stripe style="width: 100%">
        <el-table-column prop="allocation_no" label="调拨单号" width="180">
          <template #default="{ row }">
            <a style="color: #4f46e5; cursor: pointer" @click="goDetail(row.allocation_id)">
              {{ row.allocation_no }}
            </a>
          </template>
        </el-table-column>
        <el-table-column prop="goods_name" label="商品" min-width="160">
          <template #default="{ row }">
            <div>{{ row.goods_name }}</div>
            <div style="font-size: 12px; color: #9ca3af">{{ row.goods_code }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数量(期望/实收)" width="140">
          <template #default="{ row }">
            <span>{{ row.expected_quantity }}</span>
            <span style="color: #9ca3af; margin: 0 4px">/</span>
            <span :style="{ color: row.actual_quantity != null && row.actual_quantity !== row.expected_quantity ? '#ef4444' : '' }">
              {{ row.actual_quantity ?? '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="调拨状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.allocation_status]?.type || 'info'" size="small">
              {{ statusMap[row.allocation_status]?.label || row.allocation_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="复核状态" width="130">
          <template #default="{ row }">
            <el-tag :type="reviewStatusMap[row.review_status]?.type || 'info'" size="small">
              {{ reviewStatusMap[row.review_status]?.label || row.review_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调拨改动感知" width="180">
          <template #default="{ row }">
            <div v-if="row.is_modified">
              <el-tag type="warning" size="small" effect="dark">
                ⚠️ 已被修改 ({{ row.change_count }}次)
              </el-tag>
              <div style="font-size: 11px; color: #9ca3af; margin-top: 4px">
                修改人：{{ row.modified_by || '-' }}<br/>
                {{ formatDate(row.last_modified_at) }}
              </div>
              <div v-if="row.has_allocation_modified" style="margin-top: 4px">
                <el-tag v-if="row.modification_acknowledged" type="success" size="small">✓ 复核端已确认</el-tag>
                <el-tag v-else type="danger" size="small">! 复核端未确认</el-tag>
              </div>
            </div>
            <span v-else style="color: #9ca3af; font-size: 12px">无改动</span>
          </template>
        </el-table-column>
        <el-table-column label="发起时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="复核时间" width="170">
          <template #default="{ row }">{{ formatDate(row.reviewed_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="goDetail(row.allocation_id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div style="margin-top: 20px; padding: 16px; background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a">
      <div style="font-weight: 600; color: #92400e; margin-bottom: 8px">💡 责任认定说明（避免扯皮）</div>
      <div style="font-size: 13px; color: #78350f; line-height: 1.8">
        1. 商品调拨单从创建起，每一次修改都会记录在「变更日志」中，包含修改人、修改时间、字段新旧值、修改原因<br/>
        2. 调拨单在「楼层主管审批/品牌督导发货」后被改动的，复核端会自动弹出 <b>「该调拨单已被修改，请确认知晓后再复核」</b><br/>
        3. 复核人必须勾选「确认已知晓变更内容」才能完成到柜复核，系统永久记录确认人和确认时间<br/>
        4. 所有历史操作均在「历史备注」和「变更日志」中留痕，不再需要翻旧台账/聊天记录
      </div>
    </div>
  </div>
</template>
