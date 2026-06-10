<template>
  <div>
    <div class="stat-cards">
      <div class="stat-card primary">
        <div class="stat-label">待处理</div>
        <div class="stat-value">{{ todoCount }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">处理中</div>
        <div class="stat-value">{{ processingCount }}</div>
      </div>
      <div class="stat-card info">
        <div class="stat-label">已完成（今日）</div>
        <div class="stat-value">{{ doneCount }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📋 我的待办</div>
      
      <div v-if="role === 'CUSTOMER_SERVICE'">
        <h3 style="margin-bottom:12px; color:#606266; font-size:14px;">待结案</h3>
        <ComplaintTable :complaints="pendingCloseList" show-actions @view="goDetail" />
      </div>

      <div v-if="role === 'PICKING_GUIDE'">
        <h3 style="margin-bottom:12px; color:#606266; font-size:14px;">待核实</h3>
        <ComplaintTable :complaints="pendingVerifyList" show-actions @view="goDetail" @claim="handleClaim" />
        
        <h3 style="margin:20px 0 12px; color:#606266; font-size:14px;">被退回</h3>
        <ComplaintTable :complaints="returnedList" show-actions @view="goDetail" />
      </div>

      <div v-if="role === 'WAREHOUSE_STAFF'">
        <h3 style="margin-bottom:12px; color:#606266; font-size:14px;">待发放补偿</h3>
        <ComplaintTable :complaints="pendingCompensationList" show-actions @view="goDetail" />
      </div>
    </div>

    <div class="card">
      <div class="card-title">📁 我参与的</div>
      <ComplaintTable :complaints="allRelatedList" @view="goDetail" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getComplaintList, claimComplaint } from '../api/complaint'
import ComplaintTable from '../components/ComplaintTable.vue'

const router = useRouter()
const complaints = ref([])
const role = ref(localStorage.getItem('currentRole') || 'CUSTOMER_SERVICE')
const fallbackUserId = {
  CUSTOMER_SERVICE: 'u1',
  PICKING_GUIDE: 'u2',
  WAREHOUSE_STAFF: 'u4'
}
const savedUid = localStorage.getItem('currentUserId')
const userId = ref(savedUid && savedUid.length ? savedUid : fallbackUserId[role.value] || 'u1')

const pendingVerifyList = computed(() => 
  complaints.value.filter(c => c.status === 'PENDING_VERIFY' || c.status === 'VERIFYING')
)

const returnedList = computed(() => 
  complaints.value.filter(c => c.status === 'RETURNED')
)

const pendingCompensationList = computed(() => 
  complaints.value.filter(c => c.status === 'PENDING_COMPENSATION')
)

const pendingCloseList = computed(() => 
  complaints.value.filter(c => c.status === 'PENDING_CLOSE')
)

const todoCount = computed(() => {
  if (role.value === 'CUSTOMER_SERVICE') return pendingCloseList.value.length
  if (role.value === 'PICKING_GUIDE') return pendingVerifyList.value.length + returnedList.value.length
  if (role.value === 'WAREHOUSE_STAFF') return pendingCompensationList.value.length
  return 0
})

const processingCount = computed(() => {
  return complaints.value.filter(c => 
    ['VERIFYING', 'COMPENSATING', 'PENDING_CLOSE'].includes(c.status)
  ).length
})

const doneCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return complaints.value.filter(c => 
    c.status === 'COMPLETED' && c.closeTime?.startsWith(today)
  ).length
})

const allRelatedList = computed(() => complaints.value)

async function loadData() {
  try {
    const res = await getComplaintList({ role: role.value, userId: userId.value })
    if (res.code === 0) {
      complaints.value = res.data
    }
  } catch (e) {
    console.error('加载失败', e)
  }
}

function goDetail(id) {
  router.push(`/complaint/${id}`)
}

async function handleClaim(id) {
  try {
    const res = await claimComplaint(id, userId.value)
    if (res.code === 0) {
      loadData()
    }
  } catch (e) {
    console.error('认领失败', e)
  }
}

onMounted(() => {
  loadData()
})
</script>
