<template>
  <div class="card">
    <div class="card-title">📁 投诉列表</div>
    
    <div class="filter-bar">
      <div class="form-group">
        <label class="form-label">投诉类型</label>
        <select v-model="filters.type" class="form-select" @change="loadData">
          <option value="">全部</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">状态</label>
        <select v-model="filters.status" class="form-select" @change="loadData">
          <option value="">全部</option>
          <option v-for="(label, key) in statusList" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">关键词</label>
        <input 
          v-model="filters.keyword" 
          class="form-input" 
          placeholder="编号/标题/游客姓名"
          @keyup.enter="loadData"
        />
      </div>
      <button class="btn btn-primary" @click="loadData" style="align-self:flex-end;">搜索</button>
    </div>

    <ComplaintTable :complaints="complaints" @view="goDetail" />
    
    <div style="margin-top:12px; text-align:right; color:#909399; font-size:12px;">
      共 {{ total }} 条记录
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getComplaintList, getComplaintTypes, getStatusList } from '../api/complaint'
import ComplaintTable from '../components/ComplaintTable.vue'

const router = useRouter()
const complaints = ref([])
const total = ref(0)
const types = ref([])
const statusList = ref({})

const filters = ref({
  type: '',
  status: '',
  keyword: ''
})

async function loadData() {
  try {
    const res = await getComplaintList(filters.value)
    if (res.code === 0) {
      complaints.value = res.data
      total.value = res.total
    }
  } catch (e) {
    console.error('加载失败', e)
  }
}

async function loadMeta() {
  try {
    const [typesRes, statusRes] = await Promise.all([
      getComplaintTypes(),
      getStatusList()
    ])
    if (typesRes.code === 0) types.value = typesRes.data
    if (statusRes.code === 0) statusList.value = statusRes.data
  } catch (e) {
    console.error('加载元数据失败', e)
    types.value = ['服务态度', '采摘体验', '果品质量', '环境卫生', '收费问题', '安全问题', '其他']
  }
}

function goDetail(id) {
  router.push(`/complaint/${id}`)
}

onMounted(() => {
  loadMeta()
  loadData()
})
</script>
