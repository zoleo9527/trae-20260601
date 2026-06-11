<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">📄 品牌租约管理</div>
      <div style="display:flex;gap:10px;">
        <el-select v-model="filters.status" placeholder="状态" clearable style="width:140px" @change="loadData">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="待确认" value="PENDING" />
          <el-option label="已生效" value="ACTIVE" />
          <el-option label="已驳回" value="REJECTED" />
        </el-select>
        <el-switch v-model="filters.liability" active-text="仅看责任不清" @change="loadData" />
        <el-input v-model="filters.keyword" placeholder="搜索品牌/编号/铺位" clearable style="width:240px" @keyup.enter="loadData" @clear="loadData">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button v-if="userStore.isMerchandise" type="primary" :icon="Plus" @click="$router.push('/leases/create')">新建租约</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading">
      <el-table-column prop="lease_no" label="租约编号" width="160">
        <template #default="{ row }"><b style="color:#4338ca;">{{ row.lease_no }}</b></template>
      </el-table-column>
      <el-table-column prop="brand_name" label="品牌" width="180" />
      <el-table-column prop="store_code" label="铺位" width="100" />
      <el-table-column prop="floor" label="楼层" width="80" />
      <el-table-column prop="area" label="面积(㎡)" width="100" />
      <el-table-column label="租期" min-width="200">
        <template #default="{ row }">{{ row.start_date }} ～ {{ row.end_date }}</template>
      </el-table-column>
      <el-table-column label="状态" width="130">
        <template #default="{ row }"><el-status-tag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="扣点规则" width="140">
        <template #default="{ row }">
          <el-tag v-if="row.deduction_status==='CONFIRMED'" type="success" size="small">已确认</el-tag>
          <el-tag v-else-if="row.deduction_status" size="small">{{ row.deduction_status }}</el-tag>
          <span v-else style="color:#ef4444;font-size:12px;">未录入</span>
        </template>
      </el-table-column>
      <el-table-column label="责任标记" width="150">
        <template #default="{ row }">
          <el-tag v-if="row.liability_flag" type="danger" effect="dark" size="small">⚠️ {{ row.liability_desc }}</el-tag>
          <span v-else style="color:#10b981;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="submitter_name" label="招商经理" width="100" />
      <el-table-column prop="submitted_at" label="提交时间" width="160" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <router-link :to="`/leases/${row.id}`">
            <el-button type="primary" link size="small">详情</el-button>
          </router-link>
          <router-link v-if="canEdit(row)" :to="`/leases/${row.id}/edit`">
            <el-button link size="small">编辑</el-button>
          </router-link>
        </template>
      </el-table-column>
    </el-table>

    <div style="display:flex;justify-content:center;margin-top:20px;">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="total, prev, pager, next" @current-change="loadData" />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getLeaseList } from '@/api'

const userStore = useUserStore()
const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(15)
const filters = reactive({ status: '', keyword: '', liability: false })

const canEdit = (row) => userStore.isMerchandise && row.submitter_id === userStore.userInfo.id && ['DRAFT', 'REJECTED'].includes(row.status)

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      liability_flag: filters.liability ? 1 : undefined,
    }
    const res = await getLeaseList(params)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
