<template>
  <div class="page-container">
    <div class="warning-highlight" v-if="viewingsWithoutFeedback.length > 0">
      <div class="alert-header">
        <el-icon size="18" color="#e6a23c"><ChatDotRound /></el-icon>
        <strong>看房反馈散落提醒</strong>
        <span style="margin-left: 8px; font-size: 13px; color: #909399">
          共 {{ viewingsWithoutFeedback.length }} 条看房记录尚未填写反馈
        </span>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">看房记录与反馈</div>
      <div class="filter-bar">
        <el-select v-model="filterProperty" placeholder="筛选房源" clearable style="width: 200px">
          <el-option
            v-for="p in properties"
            :key="p.id"
            :label="`${p.building} ${p.floor}层${p.unit}`"
            :value="p.id"
          />
        </el-select>
        <el-select v-model="filterFeedback" placeholder="筛选反馈" clearable style="width: 140px">
          <el-option label="已填写反馈" value="true" />
          <el-option label="未填写反馈" value="false" />
        </el-select>
        <el-select v-model="filterSatisfaction" placeholder="筛选满意度" clearable style="width: 140px">
          <el-option label="满意" value="satisfied" />
          <el-option label="一般" value="neutral" />
          <el-option label="不满意" value="unsatisfied" />
        </el-select>
        <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
      </div>

      <el-table :data="filteredViewings" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="客户信息" width="200">
          <template #default="{ row }">
            <div class="viewer-name">
              <el-icon color="#409eff"><User /></el-icon>
              <strong>{{ row.viewerName }}</strong>
            </div>
            <div class="viewer-company">{{ row.viewerCompany }}</div>
            <div class="viewer-contact">{{ row.viewerContact }}</div>
          </template>
        </el-table-column>
        <el-table-column label="房源" width="200">
          <template #default="{ row }">
            <span v-if="propertyMap[row.propertyId]">
              {{ propertyMap[row.propertyId].building }} {{ propertyMap[row.propertyId].floor }}层{{ propertyMap[row.propertyId].unit }}
            </span>
            <span v-else>{{ row.propertyId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="consultantName" label="负责顾问" width="100" />
        <el-table-column label="看房时间" width="180">
          <template #default="{ row }">{{ formatTime(row.viewDate) }}</template>
        </el-table-column>
        <el-table-column label="反馈状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.feedback" type="success" size="small">已反馈</el-tag>
            <el-tag v-else type="warning" size="small">待反馈</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="满意度" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.feedback?.satisfaction === 'satisfied'" type="success" size="small">满意</el-tag>
            <el-tag v-else-if="row.feedback?.satisfaction === 'neutral'" type="warning" size="small">一般</el-tag>
            <el-tag v-else-if="row.feedback?.satisfaction === 'unsatisfied'" type="danger" size="small">不满意</el-tag>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="反馈内容" min-width="220">
          <template #default="{ row }">
            <div v-if="row.feedback">
              <p style="margin: 0; color: #606266">{{ row.feedback.notes }}</p>
              <p v-if="row.feedback.followUpAction" style="margin: 4px 0 0; color: #e6a23c; font-size: 12px">
                跟进：{{ row.feedback.followUpAction }}
              </p>
              <p style="margin: 4px 0 0; color: #909399; font-size: 12px">
                提交于 {{ formatTime(row.feedback.submittedAt) }}
              </p>
            </div>
            <span v-else style="color: #c0c4cc">暂无反馈</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.feedback && authStore.userRole === 'consultant'"
              size="small"
              type="primary"
              link
              @click="openFeedback(row)"
            >
              补反馈
            </el-button>
            <el-button
              v-else-if="row.feedback && authStore.userRole === 'consultant'"
              size="small"
              type="primary"
              link
              @click="openFeedback(row)"
            >
              查看/编辑
            </el-button>
            <el-button
              v-else
              size="small"
              type="info"
              link
              @click="openFeedback(row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="section-card">
      <div class="section-title">房源带看汇总</div>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :lg="6" v-for="p in properties" :key="p.id">
          <el-card class="summary-card" shadow="hover" v-if="propertySummary[p.id]">
            <div class="summary-title">
              <el-icon color="#409eff"><OfficeBuilding /></el-icon>
              <span>{{ p.building }} {{ p.floor }}层{{ p.unit }}</span>
            </div>
            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-value">{{ propertySummary[p.id].totalViewings }}</div>
                <div class="stat-label">总带看</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" style="color: #67c23a">{{ propertySummary[p.id].satisfiedCount }}</div>
                <div class="stat-label">满意</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" style="color: #f56c6c">{{ propertySummary[p.id].unsatisfiedCount }}</div>
                <div class="stat-label">不满意</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" style="color: #e6a23c">{{ propertySummary[p.id].neutralCount }}</div>
                <div class="stat-label">一般</div>
              </div>
            </div>
            <div v-if="propertySummary[p.id].latestFeedback" class="latest-feedback">
              <div class="feedback-label">最新反馈：</div>
              <div class="feedback-content">{{ propertySummary[p.id].latestFeedback.notes }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="feedbackDialogVisible" :title="feedbackForm.id ? '查看/编辑反馈' : '补充反馈'" width="500px">
      <el-form :model="feedbackForm" :rules="feedbackRules" ref="feedbackFormRef" label-width="100px">
        <el-form-item label="满意度" prop="satisfaction">
          <el-radio-group v-model="feedbackForm.satisfaction" :disabled="authStore.userRole !== 'consultant'">
            <el-radio value="satisfied">满意</el-radio>
            <el-radio value="neutral">一般</el-radio>
            <el-radio value="unsatisfied">不满意</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="反馈内容" prop="notes">
          <el-input
            v-model="feedbackForm.notes"
            type="textarea"
            :rows="4"
            placeholder="请详细描述客户反馈"
            :disabled="authStore.userRole !== 'consultant'"
          />
        </el-form-item>
        <el-form-item label="跟进措施">
          <el-input
            v-model="feedbackForm.followUpAction"
            type="textarea"
            :rows="2"
            placeholder="后续跟进计划（选填）"
            :disabled="authStore.userRole !== 'consultant'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feedbackDialogVisible = false">关闭</el-button>
        <el-button
          v-if="authStore.userRole === 'consultant'"
          type="primary"
          :loading="submitting"
          @click="submitFeedback"
        >
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, User, OfficeBuilding, ChatDotRound } from '@element-plus/icons-vue'
import { viewingApi, propertyApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const viewings = ref([])
const properties = ref([])
const propertyMap = ref({})
const propertySummary = ref({})
const filterProperty = ref('')
const filterFeedback = ref('')
const filterSatisfaction = ref('')

const feedbackDialogVisible = ref(false)
const feedbackFormRef = ref(null)
const feedbackForm = ref({
  id: '',
  satisfaction: 'satisfied',
  notes: '',
  followUpAction: ''
})

const feedbackRules = {
  satisfaction: [{ required: true, message: '请选择满意度', trigger: 'change' }],
  notes: [{ required: true, message: '请填写反馈内容', trigger: 'blur' }]
}

const viewingsWithoutFeedback = computed(() => {
  return viewings.value.filter(v => !v.feedback)
})

const filteredViewings = computed(() => {
  let result = [...viewings.value]
  if (filterProperty.value) {
    result = result.filter(v => v.propertyId === filterProperty.value)
  }
  if (filterFeedback.value) {
    const hasFeedback = filterFeedback.value === 'true'
    result = result.filter(v => hasFeedback ? !!v.feedback : !v.feedback)
  }
  if (filterSatisfaction.value) {
    result = result.filter(v => v.feedback?.satisfaction === filterSatisfaction.value)
  }
  return result.sort((a, b) => new Date(b.viewDate) - new Date(a.viewDate))
})

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

async function loadData() {
  loading.value = true
  try {
    const [viewData, propData] = await Promise.all([
      viewingApi.findAll(),
      propertyApi.findAll()
    ])
    viewings.value = viewData
    properties.value = propData
    propData.forEach(p => { propertyMap.value[p.id] = p })

    for (const p of propData) {
      try {
        const summary = await viewingApi.getPropertySummary(p.id)
        propertySummary.value[p.id] = summary
      } catch (e) {}
    }

    if (route.query.propertyId) {
      filterProperty.value = route.query.propertyId
    }
    if (route.query.id) {
      const target = viewData.find(v => v.id === route.query.id)
      if (target) setTimeout(() => openFeedback(target), 300)
    }
  } finally {
    loading.value = false
  }
}

function openFeedback(row) {
  feedbackForm.value.id = row.id
  if (row.feedback) {
    feedbackForm.value.satisfaction = row.feedback.satisfaction
    feedbackForm.value.notes = row.feedback.notes
    feedbackForm.value.followUpAction = row.feedback.followUpAction || ''
  } else {
    feedbackForm.value.satisfaction = 'satisfied'
    feedbackForm.value.notes = ''
    feedbackForm.value.followUpAction = ''
  }
  feedbackDialogVisible.value = true
}

async function submitFeedback() {
  if (!feedbackFormRef.value) return
  await feedbackFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await viewingApi.addFeedback(feedbackForm.value.id, {
        satisfaction: feedbackForm.value.satisfaction,
        notes: feedbackForm.value.notes,
        followUpAction: feedbackForm.value.followUpAction
      })
      ElMessage.success('反馈提交成功')
      feedbackDialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadData)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.viewer-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.viewer-company {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  padding-left: 26px;
}

.viewer-contact {
  font-size: 12px;
  color: #909399;
  padding-left: 26px;
}

.alert-header {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.summary-card {
  margin-bottom: 20px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 16px;
  font-size: 14px;
  color: #303133;
}

.summary-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.latest-feedback {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
}

.feedback-label {
  color: #909399;
  margin-bottom: 4px;
}

.feedback-content {
  color: #606266;
  line-height: 1.5;
}
</style>
