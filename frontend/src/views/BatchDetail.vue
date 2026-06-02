<template>
  <div v-if="batchData">
    <div class="page-header">
      <span class="page-title">批次详情 - {{ batchData.batch_no }}</span>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span style="font-weight: bold;">批次信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="批次号">{{ batchData.batch_no }}</el-descriptions-item>
            <el-descriptions-item label="灭菌器">{{ batchData.sterilizer_id }}</el-descriptions-item>
            <el-descriptions-item label="灭菌程序">{{ batchData.program }}</el-descriptions-item>
            <el-descriptions-item label="参数">{{ batchData.temperature }}℃ / {{ batchData.duration }}分钟</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="batchData.status === 'completed' ? 'success' : 'primary'">
                {{ batchData.status === 'completed' ? '已完成' : '处理中' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="生物指示">
              <el-tag v-if="batchData.bio_indicator_result" :type="batchData.bio_indicator_result === 'pass' ? 'success' : 'danger'">
                {{ batchData.bio_indicator_result === 'pass' ? '合格' : '不合格' }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="操作员">{{ batchData.operator_name }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatTime(batchData.start_time) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ batchData.end_time ? formatTime(batchData.end_time) : '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">本批次器械包 ({{ packages.length }}个)</span>
              <div>
                <el-button 
                  v-if="batchData.status !== 'completed'" 
                  size="small" 
                  @click="showAddPackage = true"
                >
                  添加器械包
                </el-button>
                <el-button 
                  v-if="batchData.status !== 'completed'" 
                  type="success" 
                  size="small" 
                  @click="showComplete = true"
                  style="margin-left: 8px;"
                >
                  完成灭菌
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="showRecall = true"
                  style="margin-left: 8px;"
                >
                  发起召回
                </el-button>
              </div>
            </div>
          </template>
          <el-table :data="packages" border size="small">
            <el-table-column prop="package_no" label="包号" width="160">
              <template #default="{ row }">
                <el-link type="primary" @click="$router.push(`/packages/${row.package_no}`)">
                  {{ row.package_no }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">{{ typeMap[row.type] }}</template>
            </el-table-column>
            <el-table-column prop="instrument_count" label="器械数" width="80" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="statusTagType[row.status]">
                  {{ statusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 20px;" v-if="recalls.length > 0">
          <template #header>
            <span style="font-weight: bold; color: #f56c6c;">关联召回任务</span>
          </template>
          <el-table :data="recalls" border size="small">
            <el-table-column prop="recall_no" label="召回编号" width="180">
              <template #default="{ row }">
                <el-link type="danger" @click="$router.push(`/recalls/${row.recall_no}`)">
                  {{ row.recall_no }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="召回原因" />
            <el-table-column prop="initiator_name" label="发起人" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'active' ? '进行中' : '已完成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="发起时间" width="180">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddPackage" title="添加器械包到批次" width="600px">
      <el-select
        v-model="selectedPackages"
        multiple
        filterable
        placeholder="选择要添加的器械包"
        style="width: 100%;"
      >
        <el-option
          v-for="pkg in availablePackages"
          :key="pkg.id"
          :label="`${pkg.package_no} - ${pkg.name}`"
          :value="pkg.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="showAddPackage = false">取消</el-button>
        <el-button type="primary" @click="addPackages">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showComplete" title="完成灭菌" width="400px">
      <el-form label-width="100px">
        <el-form-item label="生物指示结果">
          <el-radio-group v-model="bioResult">
            <el-radio value="pass">合格</el-radio>
            <el-radio value="fail">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showComplete = false">取消</el-button>
        <el-button type="primary" @click="completeBatch">确认完成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRecall" title="发起召回" width="500px">
      <el-form label-width="100px">
        <el-form-item label="召回原因">
          <el-input v-model="recallReason" type="textarea" :rows="3" placeholder="请描述召回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecall = false">取消</el-button>
        <el-button type="danger" @click="createRecall">确认召回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { batchAPI, packageAPI, recallAPI } from '../api'

const route = useRoute()
const router = useRouter()
const batchData = ref(null)
const packages = ref([])
const recalls = ref([])
const availablePackages = ref([])
const selectedPackages = ref([])
const showAddPackage = ref(false)
const showComplete = ref(false)
const showRecall = ref(false)
const bioResult = ref('pass')
const recallReason = ref('')

const statusMap = {
  available: '可用',
  recycled: '已回收',
  cleaned: '已清洗',
  sterilized: '已灭菌',
  delivering: '配送中'
}

const statusTagType = {
  available: 'info',
  recycled: 'info',
  cleaned: 'success',
  sterilized: 'success',
  delivering: 'primary'
}

const typeMap = {
  surgery: '外科',
  obstetrics: '妇产科',
  emergency: '急诊',
  dental: '牙科',
  general: '通用'
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadDetail = async () => {
  try {
    const res = await batchAPI.getDetail(route.params.batchNo)
    batchData.value = res.data.batch
    packages.value = res.data.packages
    recalls.value = res.data.recalls
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

const loadAvailablePackages = async () => {
  try {
    const res = await packageAPI.getList({ status: 'cleaned' })
    const currentIds = packages.value.map(p => p.id)
    availablePackages.value = res.data.filter(p => !currentIds.includes(p.id))
  } catch (err) {
    console.error(err)
  }
}

const addPackages = async () => {
  if (selectedPackages.value.length === 0) {
    ElMessage.warning('请选择器械包')
    return
  }
  
  try {
    await batchAPI.addPackages(route.params.batchNo, selectedPackages.value)
    ElMessage.success('添加成功')
    showAddPackage.value = false
    selectedPackages.value = []
    loadDetail()
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

const completeBatch = async () => {
  try {
    await batchAPI.complete(route.params.batchNo, { bio_indicator_result: bioResult.value })
    ElMessage.success('灭菌完成')
    showComplete.value = false
    loadDetail()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const createRecall = async () => {
  if (!recallReason.value) {
    ElMessage.warning('请填写召回原因')
    return
  }
  
  try {
    const res = await recallAPI.create({
      batch_no: route.params.batchNo,
      reason: recallReason.value
    })
    ElMessage.success('召回已发起')
    showRecall.value = false
    recallReason.value = ''
    router.push(`/recalls/${res.data.recall_no}`)
  } catch (err) {
    ElMessage.error('发起失败')
  }
}

onMounted(() => {
  loadDetail()
})
</script>
