<template>
  <div>
    <div class="page-header">
      <span class="page-title">配送签收</span>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">待配送器械包</span>
          </template>
          <el-table 
            :data="toDeliver" 
            border 
            stripe 
            size="small"
            ref="tableRef"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="package_no" label="包号" width="160">
              <template #default="{ row }">
                <el-link type="primary" @click="$router.push(`/packages/${row.package_no}`)">
                  {{ row.package_no }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" show-overflow-tooltip />
            <el-table-column prop="instrument_count" label="器械数" width="80" />
          </el-table>
          <div style="margin-top: 16px;">
            <el-form :inline="true">
              <el-form-item label="配送科室">
                <el-select v-model="targetDept" placeholder="选择科室" style="width: 200px;">
                  <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="startDelivery" :disabled="selectedItems.length === 0 || !targetDept">
                  开始配送
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">配送中 / 待签收</span>
          </template>
          <el-table :data="delivering" border stripe size="small">
            <el-table-column prop="package_no" label="包号" width="160" />
            <el-table-column prop="name" label="名称" show-overflow-tooltip />
            <el-table-column prop="current_location" label="当前位置" width="120" />
            <el-table-column prop="updated_at" label="更新时间" width="160">
              <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="success" size="small" @click="confirmReceive(row)">
                  签收
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { packageAPI, departmentAPI, batchAPI } from '../../api'

const tableRef = ref(null)
const toDeliver = ref([])
const delivering = ref([])
const departments = ref([])
const selectedItems = ref([])
const targetDept = ref(null)

const handleSelectionChange = (selection) => {
  selectedItems.value = selection
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadPackages = async () => {
  try {
    const res = await packageAPI.getList()
    toDeliver.value = res.data.filter(p => p.status === 'sterilized' || p.status === 'qualified')
    delivering.value = res.data.filter(p => p.status === 'delivering')
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const loadDepartments = async () => {
  try {
    const res = await departmentAPI.getList()
    departments.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const startDelivery = async () => {
  const dept = departments.value.find(d => d.id === targetDept.value)
  
  for (const pkg of selectedItems.value) {
    const pkgDetail = await packageAPI.getDetail(pkg.package_no)
    const batchNos = pkgDetail.data.package.batch_nos?.split(',')[0]?.trim()
    let batchId = null
    if (batchNos) {
      const batches = await batchAPI.getList()
      const batch = batches.data.find(b => b.batch_no === batchNos)
      batchId = batch?.id
    }
    
    await packageAPI.track(pkg.package_no, {
      action: '配送',
      status: 'delivering',
      location: '运输中 - ' + dept.name,
      department_id: targetDept.value,
      batch_id: batchId
    })
  }
  
  ElMessage.success('配送已开始')
  selectedItems.value = []
  loadPackages()
}

const confirmReceive = async (pkg) => {
  try {
    const pkgDetail = await packageAPI.getDetail(pkg.package_no)
    const batchNos = pkgDetail.data.package.batch_nos?.split(',')[0]?.trim()
    let batchId = null
    if (batchNos) {
      const batches = await batchAPI.getList()
      const batch = batches.data.find(b => b.batch_no === batchNos)
      batchId = batch?.id
    }
    
    await packageAPI.track(pkg.package_no, {
      action: '签收',
      status: 'received',
      location: pkg.current_location?.replace('运输中 - ', '') || '科室',
      batch_id: batchId
    })
    ElMessage.success('已签收')
    loadPackages()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadPackages()
  loadDepartments()
})
</script>
