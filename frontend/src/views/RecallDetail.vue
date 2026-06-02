<template>
  <div v-if="recallData">
    <div class="page-header">
      <span class="page-title">召回详情 - {{ recallData.recall_no }}</span>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">召回信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="召回编号">{{ recallData.recall_no }}</el-descriptions-item>
            <el-descriptions-item label="关联批次">
              <el-link type="primary" @click="$router.push(`/batches/${recallData.batch_no}`)">
                {{ recallData.batch_no }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="灭菌器">{{ recallData.sterilizer_id }}</el-descriptions-item>
            <el-descriptions-item label="灭菌程序">{{ recallData.program }}</el-descriptions-item>
            <el-descriptions-item label="召回原因">{{ recallData.reason }}</el-descriptions-item>
            <el-descriptions-item label="发起人">{{ recallData.initiator_name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="recallData.status === 'completed' ? 'success' : 'warning'">
                {{ recallData.status === 'active' ? '进行中' : '已完成' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发起时间">{{ formatTime(recallData.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">召回器械包列表 ({{ items.length }}个)</span>
              <el-progress 
                :percentage="Math.round(recoveredCount / items.length * 100)" 
                :status="recallData.status === 'completed' ? 'success' : ''"
                style="width: 200px;"
              />
            </div>
          </template>
          <el-table :data="items" border stripe>
            <el-table-column type="index" width="50" />
            <el-table-column prop="package_no" label="包号" width="180">
              <template #default="{ row }">
                <el-link type="primary" @click="$router.push(`/packages/${row.package_no}`)">
                  {{ row.package_no }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="package_name" label="名称" />
            <el-table-column prop="department_name" label="所在科室" width="120">
              <template #default="{ row }">{{ row.department_name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="召回状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'recovered' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'recovered' ? '已追回' : '待追回' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="列入时间" width="160">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column prop="recovered_at" label="追回时间" width="160">
              <template #default="{ row }">{{ row.recovered_at ? formatTime(row.recovered_at) : '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status !== 'recovered' && recallData.status !== 'completed'"
                  type="success" 
                  size="small" 
                  @click="recoverItem(row)"
                >
                  确认追回
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span style="font-weight: bold; color: #f56c6c;">
              <el-icon><Warning /></el-icon> 风险提示
            </span>
          </template>
          <el-alert
            title="批次反查"
            type="warning"
            :closable="false"
            style="margin-bottom: 12px;"
          >
            <template #default>
              本批次共涉及 {{ items.length }} 个器械包，请确保所有相关科室都收到召回通知并配合追回。
              可通过批次号 {{ recallData.batch_no }} 反查所有相关器械包的流向。
            </template>
          </el-alert>
          <div v-for="(dept, deptName) in groupedByDept" :key="deptName" style="margin-bottom: 8px;">
            <el-tag type="warning">{{ deptName || '未定位' }}</el-tag>
            <span style="margin-left: 8px;">{{ dept.length }} 个器械包</span>
            <span style="color: #909399; margin-left: 12px;">
              (已追回: {{ dept.filter(i => i.status === 'recovered').length }})
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { recallAPI } from '../api'

const route = useRoute()
const recallData = ref(null)
const items = ref([])

const recoveredCount = computed(() => {
  return items.value.filter(i => i.status === 'recovered').length
})

const groupedByDept = computed(() => {
  const groups = {}
  items.value.forEach(item => {
    const dept = item.department_name || '未定位'
    if (!groups[dept]) groups[dept] = []
    groups[dept].push(item)
  })
  return groups
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadDetail = async () => {
  try {
    const res = await recallAPI.getDetail(route.params.recallNo)
    recallData.value = res.data.recall
    items.value = res.data.items
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const recoverItem = async (item) => {
  try {
    await recallAPI.recoverItem(route.params.recallNo, item.package_id)
    ElMessage.success('已确认追回')
    loadDetail()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadDetail()
})
</script>
