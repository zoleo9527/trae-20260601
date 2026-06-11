<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">💰 扣点规则管理 <el-tag size="small" type="info">版本化管理 & 回看</el-tag></div>
    </div>

    <el-table :data="list" v-loading="loading">
      <el-table-column prop="lease_no" label="租约编号" width="160">
        <template #default="{ row }">
          <router-link :to="`/leases/${row.lease_id}`" style="color:#4338ca;font-weight:600;">{{ row.lease_no }}</router-link>
        </template>
      </el-table-column>
      <el-table-column prop="brand_name" label="品牌" width="180" />
      <el-table-column label="最新版本" width="100">
        <template #default="{ row }"><b>v{{ row.version }}</b></template>
      </el-table-column>
      <el-table-column label="基础扣点%" prop="base_rate" width="120">
        <template #default="{ row }"><span style="font-weight:600;">{{ row.base_rate }}%</span></template>
      </el-table-column>
      <el-table-column label="活动扣点%" prop="promotion_rate" width="120">
        <template #default="{ row }"><span style="font-weight:600;">{{ row.promotion_rate }}%</span></template>
      </el-table-column>
      <el-table-column label="生效期" width="220">
        <template #default="{ row }">{{ row.effective_start || '-' }} ~ {{ row.effective_end || '-' }}</template>
      </el-table-column>
      <el-table-column label="规则状态" width="120">
        <template #default="{ row }"><el-status-tag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="⚠️ 责任标记" width="200">
        <template #default="{ row }">
          <el-tag v-if="row.liability_flag" type="danger" effect="dark" size="small">
            {{ row.liability_desc }}
          </el-tag>
          <span v-else style="color:#10b981;">✓ 无</span>
        </template>
      </el-table-column>
      <el-table-column prop="creator_name" label="录入人" width="100" />
      <el-table-column prop="confirmer_name" label="确认人" width="100" />
      <el-table-column prop="confirmed_at" label="确认时间" width="160" />
      <el-table-column label="版本回看" width="120" fixed="right">
        <template #default="{ row }">
          <el-select v-model="viewMap[row.lease_id]" size="small" placeholder="选版本" style="width:100%;" @change="(v)=>viewVersion(row.lease_id,v)">
            <el-option v-for="v in row.versions" :key="v" :label="'v'+v" :value="v" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="versionDialog" :title="`版本回看 - v${curVersion}`" width="700px">
      <el-descriptions v-if="versionDetail" :column="2" border size="small">
        <el-descriptions-item label="租约">{{ versionDetail.lease_no }} - {{ versionDetail.brand_name }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-status-tag :status="versionDetail.status" /></el-descriptions-item>
        <el-descriptions-item label="基础扣点率"><b style="color:#4338ca;">{{ versionDetail.base_rate }}%</b></el-descriptions-item>
        <el-descriptions-item label="活动扣点率"><b style="color:#4338ca;">{{ versionDetail.promotion_rate }}%</b></el-descriptions-item>
        <el-descriptions-item label="录入人">{{ versionDetail.creator_name }} / 确认人 {{ versionDetail.confirmer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="确认时间">{{ versionDetail.confirmed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="责任标记">
          <el-tag v-if="versionDetail.liability_flag" type="danger" size="small">{{ versionDetail.liability_desc }}</el-tag>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="标记时间">{{ versionDetail.liability_marked_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="特殊条款" :span="2">
          <div style="white-space:pre-wrap;">{{ versionDetail.special_clause || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getLeaseList, getDeductionVersion } from '@/api'

const list = ref([])
const loading = ref(false)
const viewMap = reactive({})
const versionDialog = ref(false)
const versionDetail = ref(null)
const curVersion = ref(1)

const loadData = async () => {
  loading.value = true
  try {
    const res = await getLeaseList({ pageSize: 100 })
    const tmp = []
    for (const l of res.data.list) {
      const { getDeductionHistory } = await import('@/api')
      const hist = await getDeductionHistory(l.id)
      for (const r of hist.data) {
        tmp.push({
          ...r,
          lease_no: l.lease_no,
          brand_name: l.brand_name,
          versions: hist.data.map(h => h.version),
        })
      }
    }
    list.value = tmp
  } finally {
    loading.value = false
  }
}

const viewVersion = async (leaseId, v) => {
  curVersion.value = v
  const res = await getDeductionVersion(leaseId, v)
  const lease = list.value.find(x => x.lease_id === leaseId)
  versionDetail.value = { ...res.data, lease_no: lease?.lease_no, brand_name: lease?.brand_name }
  versionDialog.value = true
}

onMounted(loadData)
</script>
