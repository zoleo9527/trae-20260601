<template>
  <div>
    <div class="page-header">
      <span class="page-title">使用反馈</span>
    </div>

    <el-row :gutter="20">
      <el-col :span="10">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">已签收器械包</span>
          </template>
          <el-table :data="packages" border stripe size="small" height="500">
            <el-table-column prop="package_no" label="包号" width="160">
              <template #default="{ row }">
                <el-link type="primary" @click="$router.push(`/packages/${row.package_no}`)">
                  {{ row.package_no }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" show-overflow-tooltip />
            <el-table-column prop="current_location" label="位置" width="100" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="selectPackage(row)">
                  使用/反馈
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">
              {{ selectedPkg ? `反馈 - ${selectedPkg.package_no}` : '请选择器械包' }}
            </span>
          </template>
          
          <div v-if="selectedPkg">
            <el-descriptions :column="2" border size="small" style="margin-bottom: 20px;">
              <el-descriptions-item label="包号">{{ selectedPkg.package_no }}</el-descriptions-item>
              <el-descriptions-item label="名称">{{ selectedPkg.name }}</el-descriptions-item>
              <el-descriptions-item label="器械数量">{{ selectedPkg.instrument_count }}</el-descriptions-item>
              <el-descriptions-item label="当前位置">{{ selectedPkg.current_location }}</el-descriptions-item>
            </el-descriptions>

            <el-form label-width="120px">
              <el-form-item label="操作类型">
                <el-radio-group v-model="feedbackType">
                  <el-radio value="use">开始使用</el-radio>
                  <el-radio value="feedback">使用反馈</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <template v-if="feedbackType === 'use'">
                <el-form-item label="使用位置">
                  <el-input v-model="useLocation" placeholder="例如: 手术室3号间" />
                </el-form-item>
                <el-form-item label="备注">
                  <el-input v-model="useNotes" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="startUse">确认开始使用</el-button>
                </el-form-item>
              </template>

              <template v-if="feedbackType === 'feedback'">
                <el-form-item label="使用情况">
                  <el-radio-group v-model="useResult">
                    <el-radio value="normal">正常</el-radio>
                    <el-radio value="missing">缺件</el-radio>
                    <el-radio value="contamination">污染</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item v-if="useResult === 'missing'" label="缺失物品">
                  <el-input v-model="missingItems" type="textarea" :rows="2" placeholder="请列出缺失的器械" />
                </el-form-item>
                <el-form-item label="反馈描述">
                  <el-input v-model="feedbackDesc" type="textarea" :rows="3" placeholder="请详细描述使用情况" />
                </el-form-item>
                <el-form-item>
                  <el-button type="success" @click="submitFeedback">提交反馈并回收</el-button>
                </el-form-item>
              </template>
            </el-form>
          </div>
          
          <div v-else style="text-align: center; padding: 60px; color: #909399;">
            <el-icon size="48"><Document /></el-icon>
            <div style="margin-top: 12px;">请从左侧选择一个器械包进行操作</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { packageAPI, exceptionAPI } from '../../api'

const packages = ref([])
const selectedPkg = ref(null)
const feedbackType = ref('use')
const useLocation = ref('')
const useNotes = ref('')
const useResult = ref('normal')
const missingItems = ref('')
const feedbackDesc = ref('')

const loadPackages = async () => {
  try {
    const res = await packageAPI.getList()
    packages.value = res.data.filter(p => ['received', 'in_use'].includes(p.status))
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const selectPackage = (pkg) => {
  selectedPkg.value = pkg
  feedbackType.value = pkg.status === 'in_use' ? 'feedback' : 'use'
  useLocation.value = ''
  useNotes.value = ''
  useResult.value = 'normal'
  missingItems.value = ''
  feedbackDesc.value = ''
}

const startUse = async () => {
  try {
    await packageAPI.track(selectedPkg.value.package_no, {
      action: '使用',
      status: 'in_use',
      location: useLocation.value || selectedPkg.value.current_location,
      notes: useNotes.value
    })
    ElMessage.success('已开始使用')
    loadPackages()
    selectedPkg.value = null
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const submitFeedback = async () => {
  try {
    await packageAPI.track(selectedPkg.value.package_no, {
      action: '使用完成',
      status: 'recycling',
      location: '待回收',
      notes: feedbackDesc.value
    })
    
    if (useResult.value !== 'normal') {
      await exceptionAPI.create({
        package_no: selectedPkg.value.package_no,
        type: useResult.value,
        description: feedbackDesc.value || '使用时发现问题',
        missing_items: useResult.value === 'missing' ? missingItems.value : null
      })
      ElMessage.warning('已记录异常')
    } else {
      ElMessage.success('反馈已提交')
    }
    
    loadPackages()
    selectedPkg.value = null
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

onMounted(() => {
  loadPackages()
})
</script>
