<template>
  <div>
    <div class="page-header">
      <span class="page-title">清洗处理</span>
    </div>

    <el-card>
      <template #header>
        <span style="font-weight: bold;">待清洗器械包</span>
      </template>
      <el-table :data="packages" border stripe>
        <el-table-column prop="package_no" label="包号" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/packages/${row.package_no}`)">
              {{ row.package_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="instrument_count" label="器械数" width="100" />
        <el-table-column prop="current_location" label="来源" width="120" />
        <el-table-column prop="updated_at" label="回收时间" width="180">
          <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'counted' ? 'success' : row.status === 'cleaning' ? 'primary' : 'warning'" size="small">
              {{ { recycled: '待清洗', cleaning: '清洗中', counted: '已清点' }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              :disabled="!['recycled', 'counted'].includes(row.status)"
              @click="startClean(row)"
            >
              开始清洗
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              :disabled="row.status !== 'cleaning'"
              @click="completeClean(row)"
              style="margin-left: 8px;"
            >
              清洗完成
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              :disabled="row.status === 'cleaning' || row.status === 'cleaned'"
              @click="showCount(row)"
              style="margin-left: 8px;"
            >
              清点
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCountDialog" title="器械清点" width="500px">
      <div v-if="currentPackage">
        <el-descriptions :column="1" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="包号">{{ currentPackage.package_no }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ currentPackage.name }}</el-descriptions-item>
          <el-descriptions-item label="应含器械">
            <el-tag v-for="(item, i) in instruments" :key="i" size="small" style="margin: 2px;">{{ item }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-form label-width="100px">
          <el-form-item label="清点结果">
            <el-radio-group v-model="countResult">
              <el-radio value="complete">齐全</el-radio>
              <el-radio value="missing">缺件</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="countResult === 'missing'" label="缺失物品">
            <el-input v-model="missingItems" type="textarea" :rows="2" placeholder="请列出缺失的器械" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="countNotes" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showCountDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCount">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { packageAPI, exceptionAPI } from '../../api'

const packages = ref([])
const showCountDialog = ref(false)
const currentPackage = ref(null)
const countResult = ref('complete')
const missingItems = ref('')
const countNotes = ref('')

const instruments = computed(() => {
  if (!currentPackage.value) return []
  return currentPackage.value.instruments.split(',').map(i => i.trim())
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadPackages = async () => {
  try {
    const res = await packageAPI.getList()
    packages.value = res.data.filter(p => ['recycled', 'cleaning', 'counted'].includes(p.status))
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const startClean = async (pkg) => {
  try {
    await packageAPI.track(pkg.package_no, {
      action: '开始清洗',
      status: 'cleaning',
      location: '清洗中心'
    })
    ElMessage.success('已开始清洗')
    loadPackages()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const completeClean = async (pkg) => {
  try {
    await packageAPI.track(pkg.package_no, {
      action: '清洗完成',
      status: 'cleaned',
      location: '清洗中心'
    })
    ElMessage.success('清洗完成')
    loadPackages()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const showCount = (pkg) => {
  currentPackage.value = pkg
  countResult.value = 'complete'
  missingItems.value = ''
  countNotes.value = ''
  showCountDialog.value = true
}

const submitCount = async () => {
  if (!currentPackage.value) return
  
  try {
    await packageAPI.track(currentPackage.value.package_no, {
      action: '清点',
      status: countResult.value === 'complete' ? 'counted' : 'counted',
      location: '清洗中心',
      notes: countNotes.value + (countResult.value === 'missing' ? ' 缺件: ' + missingItems.value : '')
    })
    
    if (countResult.value === 'missing') {
      await exceptionAPI.create({
        package_no: currentPackage.value.package_no,
        type: 'missing',
        description: '清点时发现缺件',
        missing_items: missingItems.value
      })
      ElMessage.warning('已记录缺件异常')
    } else {
      ElMessage.success('清点完成')
    }
    
    showCountDialog.value = false
    loadPackages()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadPackages()
})
</script>
