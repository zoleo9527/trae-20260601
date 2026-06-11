<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">📋 待办列表 <el-tag size="small" type="warning">主管追问进度第一现场</el-tag></div>
      <div class="filters">
        <el-radio-group v-model="tabType" @change="loadData">
          <el-radio-button v-if="userStore.canConfirm" label="TO_ME">待我处理</el-radio-button>
          <el-radio-button v-if="userStore.isMerchandise" label="MY_ACTION">需我跟进</el-radio-button>
          <el-radio-button label="HAS_LIABILITY">⚠️ 责任不清</el-radio-button>
          <el-radio-button label="ALL">全部流转中</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-card v-if="tabType === 'TO_ME' && userStore.canConfirm">
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0 16px;">
        <el-avatar :size="44" style="background:#f59e0b;">👀</el-avatar>
        <div>
          <div style="font-weight:600;font-size:15px;">营运督导 待办提示</div>
          <div style="color:#6b7280;font-size:13px;">以下租约已由招商经理提交，等待你确认扣点规则 → 清除责任标记 → 确认租约生效</div>
        </div>
      </div>
    </el-card>

    <el-table :data="list" v-loading="loading" size="default" style="margin-top:16px;" @row-click="goDetail">
      <el-table-column prop="lease_no" label="租约编号" width="160">
        <template #default="{ row }">
          <b style="color:#4338ca;">{{ row.lease_no }}</b>
        </template>
      </el-table-column>
      <el-table-column prop="brand_name" label="品牌名称" width="180" />
      <el-table-column prop="store_code" label="铺位" width="100" />
      <el-table-column label="租期" min-width="200">
        <template #default="{ row }">
          {{ row.start_date }} ～ {{ row.end_date }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="150">
        <template #default="{ row }"><el-status-tag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="责任不清标记" width="200">
        <template #default="{ row }">
          <el-tag v-if="row.liability_flag" type="danger" effect="dark" size="small">
            ⚠️ {{ row.liability_desc }}
          </el-tag>
          <span v-else style="color:#10b981;">✅ 无</span>
        </template>
      </el-table-column>
      <el-table-column label="当前负责方" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.status==='DRAFT'" size="small">招商经理</el-tag>
          <el-tag v-else-if="row.status==='PENDING'" type="warning" size="small">营运督导</el-tag>
          <el-tag v-else-if="row.status==='REJECTED'" type="danger" size="small">招商经理(修改)</el-tag>
          <el-tag v-else type="success" size="small">已完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submitter_name" label="招商经理" width="100" />
      <el-table-column prop="submitted_at" label="提交时间" width="160" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <router-link :to="`/leases/${row.id}`">
            <el-button type="primary" size="small">进入处理</el-button>
          </router-link>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getLeaseList, getMyLeaseList, getMyPending } from '@/api'

const userStore = useUserStore()
const router = useRouter()

const tabType = ref(userStore.canConfirm ? 'TO_ME' : (userStore.isMerchandise ? 'MY_ACTION' : 'ALL'))
const loading = ref(false)
const list = ref([])

const loadData = async () => {
  loading.value = true
  try {
    let res
    if (tabType.value === 'TO_ME') {
      res = await getLeaseList({ status: 'PENDING', pageSize: 100 })
    } else if (tabType.value === 'MY_ACTION') {
      res = await getMyLeaseList({ pageSize: 100 })
    } else if (tabType.value === 'HAS_LIABILITY') {
      res = await getLeaseList({ liability_flag: 1, pageSize: 100 })
    } else {
      res = await getLeaseList({ pageSize: 100 })
    }
    list.value = res.data.list
  } finally {
    loading.value = false
  }
}

const goDetail = (row) => router.push(`/leases/${row.id}`)

onMounted(loadData)
</script>
