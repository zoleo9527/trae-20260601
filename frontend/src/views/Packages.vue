<template>
  <div>
    <div class="page-header">
      <span class="page-title">器械包管理</span>
      <el-button type="primary" @click="showCreate = true">
        <el-icon><Plus /></el-icon> 新建器械包
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-input v-model="filters.packageNo" placeholder="搜索包号" prefix-icon="Search" clearable />
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100%;">
              <el-option label="全部" value="" />
              <el-option v-for="(label, value) in statusMap" :key="value" :label="label" :value="value" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.type" placeholder="类型" clearable style="width: 100%;">
              <el-option label="全部" value="" />
              <el-option label="外科手术" value="surgery" />
              <el-option label="妇产科" value="obstetrics" />
              <el-option label="急诊" value="emergency" />
              <el-option label="牙科" value="dental" />
              <el-option label="通用" value="general" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadPackages">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <el-table :data="packages" border stripe style="width: 100%;">
        <el-table-column prop="package_no" label="包号" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/packages/${row.package_no}`)">
              {{ row.package_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="instrument_count" label="器械数量" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status]" size="small">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_location" label="当前位置" width="120" />
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/packages/${row.package_no}`)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreate" title="新建器械包" width="500px">
      <el-form :model="newPackage" label-width="100px">
        <el-form-item label="包号">
          <el-input v-model="newPackage.package_no" placeholder="例如: PKG20240601009" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="newPackage.name" placeholder="例如: 基础外科手术包" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newPackage.type" style="width: 100%;">
            <el-option label="外科手术" value="surgery" />
            <el-option label="妇产科" value="obstetrics" />
            <el-option label="急诊" value="emergency" />
            <el-option label="牙科" value="dental" />
            <el-option label="通用" value="general" />
          </el-select>
        </el-form-item>
        <el-form-item label="器械清单">
          <el-input v-model="newPackage.instruments" type="textarea" :rows="3" placeholder="用逗号分隔，例如: 手术刀,止血钳,镊子" />
        </el-form-item>
        <el-form-item label="器械数量">
          <el-input-number v-model="newPackage.instrument_count" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="createPackage">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { packageAPI } from '../api'

const packages = ref([])
const showCreate = ref(false)

const filters = ref({
  packageNo: '',
  status: '',
  type: ''
})

const newPackage = ref({
  package_no: '',
  name: '',
  type: 'surgery',
  instruments: '',
  instrument_count: 5
})

const statusMap = {
  available: '可用',
  recycling: '待回收',
  recycled: '已回收',
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

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadPackages = async () => {
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.type) params.type = filters.value.type
    
    const res = await packageAPI.getList(params)
    
    if (filters.value.packageNo) {
      packages.value = res.data.filter(p => 
        p.package_no.toLowerCase().includes(filters.value.packageNo.toLowerCase())
      )
    } else {
      packages.value = res.data
    }
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const resetFilters = () => {
  filters.value = { packageNo: '', status: '', type: '' }
  loadPackages()
}

const createPackage = async () => {
  if (!newPackage.value.package_no || !newPackage.value.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await packageAPI.create(newPackage.value)
    ElMessage.success('创建成功')
    showCreate.value = false
    loadPackages()
    newPackage.value = { package_no: '', name: '', type: 'surgery', instruments: '', instrument_count: 5 }
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '创建失败')
  }
}

onMounted(() => {
  loadPackages()
})
</script>
