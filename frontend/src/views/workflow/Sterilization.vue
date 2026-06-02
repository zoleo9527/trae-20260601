<template>
  <div>
    <div class="page-header">
      <span class="page-title">灭菌管理</span>
      <el-button type="primary" @click="$router.push('/batches')">
        <el-icon><Files /></el-icon> 批次列表
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="10">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">待灭菌器械包</span>
          </template>
          <el-table :data="availablePackages" border size="small" height="400">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="package_no" label="包号" width="160" />
            <el-table-column prop="name" label="名称" show-overflow-tooltip />
          </el-table>
          <div style="margin-top: 16px;">
            <el-button type="primary" @click="addToBatch" :disabled="selectedPackages.length === 0">
              加入批次
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">当前批次</span>
              <el-button size="small" @click="createNewBatch">新建批次</el-button>
            </div>
          </template>
          
          <div v-if="currentBatch" style="margin-bottom: 16px;">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="批次号">{{ currentBatch.batch_no }}</el-descriptions-item>
              <el-descriptions-item label="灭菌器">{{ currentBatch.sterilizer_id }}</el-descriptions-item>
              <el-descriptions-item label="程序">{{ currentBatch.program }}</el-descriptions-item>
              <el-descriptions-item label="参数">{{ currentBatch.temperature }}℃/{{ currentBatch.duration }}分钟</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="currentBatch.status === 'completed' ? 'success' : 'primary'" size="small">
                  {{ currentBatch.status === 'completed' ? '已完成' : '进行中' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="器械包数">{{ batchPackages.length }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-else style="text-align: center; padding: 40px; color: #909399;">
            暂无进行中的批次，请新建批次
          </div>

          <el-table v-if="currentBatch" :data="batchPackages" border size="small">
            <el-table-column prop="package_no" label="包号" width="160" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="instrument_count" label="器械数" width="100" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button 
                  type="danger" 
                  size="small" 
                  link 
                  :disabled="currentBatch.status === 'completed'"
                  @click="removePackage(row)"
                >
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="currentBatch && currentBatch.status !== 'completed'" style="margin-top: 16px;">
            <el-button type="success" @click="completeBatch" :disabled="batchPackages.length === 0">
              完成灭菌
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { packageAPI, batchAPI } from '../../api'

const availablePackages = ref([])
const selectedPackages = ref([])
const currentBatch = ref(null)
const batchPackages = ref([])

const loadAvailable = async () => {
  try {
    const res = await packageAPI.getList()
    availablePackages.value = res.data.filter(p => 
      ['cleaned', 'counted', 'packaged'].includes(p.status)
    )
  } catch (err) {
    console.error(err)
  }
}

const loadActiveBatch = async () => {
  try {
    const res = await batchAPI.getList({ status: 'processing' })
    if (res.data.length > 0) {
      currentBatch.value = res.data[0]
      const detail = await batchAPI.getDetail(currentBatch.value.batch_no)
      batchPackages.value = detail.data.packages
    }
  } catch (err) {
    console.error(err)
  }
}

const createNewBatch = async () => {
  const batchNo = 'BATCH' + Date.now()
  try {
    await batchAPI.create({
      batch_no: batchNo,
      sterilizer_id: 'STE-001',
      program: '高温高压灭菌',
      temperature: 134,
      duration: 18
    })
    ElMessage.success('批次已创建')
    loadActiveBatch()
  } catch (err) {
    ElMessage.error('创建失败')
  }
}

const addToBatch = async () => {
  if (!currentBatch.value) {
    ElMessage.warning('请先创建批次')
    return
  }
  
  try {
    await batchAPI.addPackages(currentBatch.value.batch_no, selectedPackages.value)
    ElMessage.success('已添加到批次')
    selectedPackages.value = []
    loadAvailable()
    loadActiveBatch()
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

const removePackage = async (pkg) => {
  ElMessage.info('请在批次详情页管理')
}

const completeBatch = async () => {
  try {
    await batchAPI.complete(currentBatch.value.batch_no, { bio_indicator_result: 'pass' })
    ElMessage.success('灭菌完成')
    loadActiveBatch()
    loadAvailable()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadAvailable()
  loadActiveBatch()
})
</script>
