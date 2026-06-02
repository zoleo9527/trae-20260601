<template>
  <div v-if="packageData">
    <div class="page-header">
      <span class="page-title">器械包详情 - {{ packageData.package_no }}</span>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">基本信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="包号">{{ packageData.package_no }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ packageData.name }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ typeMap[packageData.type] || packageData.type }}</el-descriptions-item>
            <el-descriptions-item label="器械数量">{{ packageData.instrument_count }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="statusTagType[packageData.status]">{{ statusMap[packageData.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前位置">{{ packageData.current_location }}</el-descriptions-item>
            <el-descriptions-item label="关联批次">{{ packageData.batch_nos || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold;">器械清单</span>
          </template>
          <el-tag v-for="(item, index) in instruments" :key="index" style="margin: 4px;">
            {{ item }}
          </el-tag>
        </el-card>

        <el-card>
          <template #header>
            <span style="font-weight: bold;">追踪记录</span>
          </template>
          <el-steps direction="vertical" :active="trackingRecords.length" finish-status="success">
            <el-step
              v-for="(record, index) in trackingRecords"
              :key="index"
              :title="record.action"
              :description="`${record.operator_name || '系统'} - ${formatTime(record.created_at)}`"
            >
              <template #extra>
                <div style="font-size: 12px; color: #666;">
                  <div v-if="record.department_name">科室: {{ record.department_name }}</div>
                  <div v-if="record.location">位置: {{ record.location }}</div>
                  <div v-if="record.notes">备注: {{ record.notes }}</div>
                </div>
              </template>
            </el-step>
          </el-steps>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;" v-if="exceptions.length > 0">
      <template #header>
        <span style="font-weight: bold; color: #f56c6c;">异常记录</span>
      </template>
      <el-table :data="exceptions" border>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.type === 'missing' ? '缺件' : '污染' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="missing_items" label="缺失物品" v-if="exceptions.some(e => e.missing_items)" />
        <el-table-column prop="reporter_name" label="报告人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'resolved' ? 'success' : 'warning'" size="small">
              {{ row.status === 'resolved' ? '已解决' : row.status === 'processing' ? '处理中' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="报告时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { packageAPI } from '../api'

const route = useRoute()
const packageData = ref(null)
const trackingRecords = ref([])
const exceptions = ref([])

const statusMap = {
  available: '可用',
  recycling: '待回收',
  recycled: '已回收',
  counted: '已清点',
  cleaning: '清洗中',
  cleaned: '已清洗',
  packaged: '已打包',
  sterilizing: '灭菌中',
  sterilized: '已灭菌',
  qualified: '质检合格',
  delivering: '配送中',
  received: '已签收',
  in_use: '使用中'
}

const statusTagType = {
  available: 'info',
  recycling: 'warning',
  recycled: 'info',
  counted: 'success',
  cleaning: '',
  cleaned: 'success',
  packaged: 'info',
  sterilizing: 'primary',
  sterilized: 'success',
  qualified: 'success',
  delivering: 'primary',
  received: 'success',
  in_use: 'warning'
}

const typeMap = {
  surgery: '外科手术',
  obstetrics: '妇产科',
  emergency: '急诊',
  dental: '牙科',
  general: '通用'
}

const instruments = computed(() => {
  if (!packageData.value) return []
  return packageData.value.instruments.split(',').map(i => i.trim())
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadDetail = async () => {
  try {
    const res = await packageAPI.getDetail(route.params.packageNo)
    packageData.value = res.data.package
    trackingRecords.value = res.data.tracking_records.reverse()
    exceptions.value = res.data.exceptions
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

onMounted(() => {
  loadDetail()
})
</script>
