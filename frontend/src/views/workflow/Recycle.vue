<template>
  <div>
    <div class="page-header">
      <span class="page-title">回收提交</span>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">提交回收</span>
          </template>
          <el-form :model="form" label-width="100px">
            <el-form-item label="器械包号">
              <el-input v-model="form.package_no" placeholder="扫描或输入包号" />
            </el-form-item>
            <el-form-item label="回收科室">
              <el-select v-model="form.department_id" style="width: 100%;">
                <el-option 
                  v-for="dept in departments" 
                  :key="dept.id" 
                  :label="dept.name" 
                  :value="dept.id" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="回收位置">
              <el-input v-model="form.location" placeholder="例如: 手术室1号间" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.notes" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitRecycle">提交回收</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">今日回收记录</span>
          </template>
          <el-table :data="recentRecords" border size="small">
            <el-table-column prop="package_no" label="包号" width="160" />
            <el-table-column prop="action" label="操作" width="80" />
            <el-table-column prop="location" label="位置" />
            <el-table-column prop="created_at" label="时间" width="160">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
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
import { packageAPI, departmentAPI } from '../../api'

const departments = ref([])
const recentRecords = ref([])

const form = ref({
  package_no: '',
  department_id: null,
  location: '',
  notes: ''
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadDepartments = async () => {
  try {
    const res = await departmentAPI.getList()
    departments.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const loadRecent = async () => {
  try {
    const res = await packageAPI.getList({ status: 'recycled' })
    recentRecords.value = res.data.slice(0, 10).map(p => ({
      package_no: p.package_no,
      action: '回收',
      location: p.current_location,
      created_at: p.updated_at
    }))
  } catch (err) {
    console.error(err)
  }
}

const submitRecycle = async () => {
  if (!form.value.package_no) {
    ElMessage.warning('请输入器械包号')
    return
  }
  
  try {
    await packageAPI.track(form.value.package_no, {
      action: '回收',
      status: 'recycled',
      location: form.value.location || '科室',
      notes: form.value.notes,
      department_id: form.value.department_id
    })
    ElMessage.success('回收提交成功')
    resetForm()
    loadRecent()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '提交失败')
  }
}

const resetForm = () => {
  form.value = {
    package_no: '',
    department_id: null,
    location: '',
    notes: ''
  }
}

onMounted(() => {
  loadDepartments()
  loadRecent()
})
</script>
