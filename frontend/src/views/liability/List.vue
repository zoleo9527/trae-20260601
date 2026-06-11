<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">
        ⚠️ 责任不清台账
        <el-tag size="small" type="danger">主管重点关注</el-tag>
      </div>
      <div style="display:flex;gap:10px;">
        <el-select v-model="filter" style="width:180px;" @change="loadData">
          <el-option label="全部责任标记" value="ALL" />
          <el-option label="未录入扣点 (招商责任)" value="LEASE_NO_RULE" />
          <el-option label="扣点异常>50% (督导确认)" value="RATE_ABNORMAL" />
          <el-option label="特殊条款缺失 (双方协商)" value="SPECIAL_CLAUSE_MISSING" />
          <el-option label="日期不一致 (双方)" value="DATE_MISMATCH" />
          <el-option label="人工标记 (督导)" value="MANUAL_MARKED" />
        </el-select>
        <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
      </div>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px;">
      <el-col :span="5" v-for="(n, k) in counts" :key="k">
        <div class="count-card" :class="k">
          <div class="c-label">{{ n.label }}</div>
          <div class="c-value">{{ n.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-table :data="list" v-loading="loading" @row-click="goDetail">
      <el-table-column prop="lease_no" label="租约编号" width="160">
        <template #default="{ row }"><b style="color:#dc2626;">{{ row.lease_no }}</b></template>
      </el-table-column>
      <el-table-column prop="brand_name" label="品牌" width="180" />
      <el-table-column label="租约状态" width="120">
        <template #default="{ row }"><el-status-tag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="责任类型" width="200">
        <template #default="{ row }">
          <el-tag type="danger" effect="dark">⚠️ {{ flagMap[row.liability_flag] || row.liability_flag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="liability_reason" label="标记原因" min-width="240" show-overflow-tooltip />
      <el-table-column label="扣点规则" width="260">
        <template #default="{ row }">
          <div v-if="row.base_rate !== undefined">
            基础 <b>{{ row.base_rate }}%</b> / 活动 <b>{{ row.promotion_rate }}%</b>
            <el-tag v-if="row.promotion_rate > 50" type="danger" size="small" style="margin-left:6px;">异常</el-tag>
          </div>
          <span v-else style="color:#ef4444;">未录入</span>
        </template>
      </el-table-column>
      <el-table-column prop="marker_name" label="标记人" width="100" />
      <el-table-column prop="liability_marked_at" label="标记时间" width="160" />
      <el-table-column prop="submitter_name" label="招商经理" width="100" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <router-link :to="`/leases/${row.lease_id}`">
            <el-button type="primary" link size="small">立即处理</el-button>
          </router-link>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { getLeaseList, getDeductionHistory } from '@/api'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const allList = ref([])
const filter = ref('ALL')

const flagMap = {
  LEASE_NO_RULE: '未录入扣点 (招商责任)',
  RATE_ABNORMAL: '扣点比例异常 >50%',
  SPECIAL_CLAUSE_MISSING: '特殊条款缺失 (双方)',
  DATE_MISMATCH: '生效期与租约不一致',
  MANUAL_MARKED: '人工标记 (督导)',
}

const counts = computed(() => {
  const all = allList.value
  const base = { LEASE_NO_RULE: 0, RATE_ABNORMAL: 0, SPECIAL_CLAUSE_MISSING: 0, DATE_MISMATCH: 0, MANUAL_MARKED: 0 }
  for (const r of all) if (r.liability_flag && base[r.liability_flag] !== undefined) base[r.liability_flag]++
  return {
    TOTAL: { label: '责任不清合计', value: all.length },
    LEASE_NO_RULE: { label: flagMap.LEASE_NO_RULE, value: base.LEASE_NO_RULE },
    RATE_ABNORMAL: { label: flagMap.RATE_ABNORMAL, value: base.RATE_ABNORMAL },
    SPECIAL_CLAUSE_MISSING: { label: flagMap.SPECIAL_CLAUSE_MISSING, value: base.SPECIAL_CLAUSE_MISSING },
    MANUAL_MARKED: { label: flagMap.MANUAL_MARKED, value: base.MANUAL_MARKED },
  }
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getLeaseList({ liability_flag: 1, pageSize: 200 })
    const leases = res.data.list
    const tmp = []
    for (const l of leases) {
      const hist = await getDeductionHistory(l.id)
      const rule = hist.data[0] || {}
      tmp.push({
        lease_id: l.id,
        lease_no: l.lease_no,
        brand_name: l.brand_name,
        status: l.status,
        submitter_name: l.submitter_name,
        liability_flag: rule.liability_flag || 'LEASE_NO_RULE',
        liability_reason: rule.liability_reason || '扣点规则未录入',
        liability_marked_at: rule.liability_marked_at || l.submitted_at,
        marker_name: rule.liability_marker_name,
        base_rate: rule.base_rate,
        promotion_rate: rule.promotion_rate,
      })
    }
    allList.value = tmp
    list.value = filter.value === 'ALL' ? tmp : tmp.filter(x => x.liability_flag === filter.value)
  } finally {
    loading.value = false
  }
}

const goDetail = (row) => router.push(`/leases/${row.lease_id}`)

onMounted(loadData)
</script>

<style scoped>
.count-card {
  border-radius: 10px; padding: 16px; color: #fff;
}
.count-card .c-label { font-size: 12px; opacity: 0.9; }
.count-card .c-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
.count-card.TOTAL { background: linear-gradient(135deg,#dc2626,#b91c1c); }
.count-card.LEASE_NO_RULE { background: linear-gradient(135deg,#ea580c,#c2410c); }
.count-card.RATE_ABNORMAL { background: linear-gradient(135deg,#d97706,#b45309); }
.count-card.SPECIAL_CLAUSE_MISSING { background: linear-gradient(135deg,#7c3aed,#6d28d9); }
.count-card.MANUAL_MARKED { background: linear-gradient(135deg,#0891b2,#0e7490); }
</style>
