<template>
  <el-drawer
    v-model="visible"
    title="房源详情"
    direction="rtl"
    size="900px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" v-if="property" class="property-detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="房源编号">
          {{ property.property_no }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <status-tag type="property" :status="property.status" />
        </el-descriptions-item>
        <el-descriptions-item label="所在楼宇">{{ property.building }}</el-descriptions-item>
        <el-descriptions-item label="楼层房间">{{ property.floor }} {{ property.room_no }}</el-descriptions-item>
        <el-descriptions-item label="面积">{{ property.area }} ㎡</el-descriptions-item>
        <el-descriptions-item label="户型">{{ property.layout || '-' }}</el-descriptions-item>
        <el-descriptions-item label="装修">{{ property.decoration || '-' }}</el-descriptions-item>
        <el-descriptions-item label="日租金">￥{{ property.daily_rent || '-' }}/㎡</el-descriptions-item>
        <el-descriptions-item label="月租金">￥{{ property.monthly_rent?.toLocaleString() || '-' }}</el-descriptions-item>
        <el-descriptions-item label="责任人">
          {{ property.handler_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="空置原因" :span="2">
          {{ property.vacancy_reason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="空置日期">
          {{ property.vacancy_date ? formatDate(property.vacancy_date) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="预计可租日期">
          {{ property.expected_available_date ? formatDate(property.expected_available_date) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">
          <div style="white-space: pre-wrap; line-height: 1.8">
            {{ property.remarks || '暂无' }}
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div class="action-bar">
        <el-button type="primary" @click="openVacancyDialog">
          <el-icon><Edit /></el-icon>
          空置处理
        </el-button>
        <el-button @click="openViewingDialog">
          <el-icon><CalendarPlus /></el-icon>
          安排带看
        </el-button>
        <el-button @click="openExceptionDrawer">
          <el-icon><Warning /></el-icon>
          上报异常
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="操作追溯" name="timeline">
          <timeline-panel
            :target-type="'property'"
            :target-id="property.id"
            style="height: 400px; background: #f5f7fa; border-radius: 8px"
          />
        </el-tab-pane>
        <el-tab-pane label="附件管理" name="attachment">
          <attachment-panel
            :property-id="property.id"
            style="height: 400px; background: white; border: 1px solid #e4e7ed; border-radius: 8px"
          />
        </el-tab-pane>
        <el-tab-pane label="带看记录" name="viewings">
          <div class="viewings-list" v-loading="viewingsLoading">
            <el-empty v-if="!viewingsLoading && viewings.length === 0" description="暂无带看记录" />
            <div v-else>
              <div
                v-for="v in viewings"
                :key="v.id"
                class="viewing-item"
              >
                <div class="viewing-header">
                  <span class="customer">{{ v.customer_name }}</span>
                  <status-tag type="viewing" :status="v.status" size="small" />
                </div>
                <div class="viewing-meta">
                  <span><el-icon><Calendar /></el-icon> {{ formatDateTime(v.viewing_date) }}</span>
                  <span v-if="v.intention_level">
                    意向：{{ v.intention_level === 'high' ? '高' : v.intention_level === 'medium' ? '中' : '低' }}
                  </span>
                </div>
                <div v-if="v.remarks" class="viewing-remarks">{{ v.remarks }}</div>
                <div v-if="v.feedback" class="viewing-feedback">
                  <strong>客户反馈：</strong>{{ v.feedback }}
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="异常记录" name="exceptions">
          <div class="exceptions-list" v-loading="exceptionsLoading">
            <el-empty v-if="!exceptionsLoading && exceptions.length === 0" description="暂无异常记录" />
            <div v-else>
              <div
                v-for="e in exceptions"
                :key="e.id"
                class="exception-item"
              >
                <div class="exception-header">
                  <span class="title">{{ e.title }}</span>
                  <status-tag type="exception" :status="e.status" size="small" />
                </div>
                <div class="exception-meta">
                  <el-tag size="small" :type="e.severity === 'high' ? 'danger' : e.severity === 'normal' ? 'warning' : 'info'">
                    {{ e.severity === 'high' ? '高' : e.severity === 'normal' ? '中' : '低' }}
                  </el-tag>
                  <span>{{ e.exception_type }}</span>
                  <span>{{ formatDateTime(e.created_at) }}</span>
                </div>
                <div class="exception-desc">{{ e.description }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <vacancy-dialog
      v-model="vacancyDialogVisible"
      :property="property"
      @success="handleVacancySuccess"
    />
    <viewing-dialog
      v-model="viewingDialogVisible"
      :default-property-id="property?.id"
      @success="handleViewingSuccess"
    />
    <exception-drawer
      v-model="exceptionDrawerVisible"
      :property-id="property?.id"
      @success="handleExceptionSuccess"
    />
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { Edit, CalendarPlus, Warning, Calendar } from '@element-plus/icons-vue'
import StatusTag from './StatusTag.vue'
import TimelinePanel from './TimelinePanel.vue'
import AttachmentPanel from './AttachmentPanel.vue'
import VacancyDialog from './VacancyDialog.vue'
import ViewingDialog from './ViewingDialog.vue'
import ExceptionDrawer from './ExceptionDrawer.vue'
import { propertyApi, viewingApi, exceptionApi } from '@/utils/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  propertyId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const loading = ref(false)
const viewingsLoading = ref(false)
const exceptionsLoading = ref(false)
const property = ref(null)
const viewings = ref([])
const exceptions = ref([])
const activeTab = ref('timeline')

const vacancyDialogVisible = ref(false)
const viewingDialogVisible = ref(false)
const exceptionDrawerVisible = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function loadDetail() {
  if (!props.propertyId) return
  loading.value = true
  try {
    property.value = await propertyApi.getDetail(props.propertyId)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadViewings() {
  if (!props.propertyId) return
  viewingsLoading.value = true
  try {
    const data = await viewingApi.getList({ property_id: props.propertyId, page_size: 100 })
    viewings.value = data.items || []
  } catch (e) {
    console.error(e)
  } finally {
    viewingsLoading.value = false
  }
}

async function loadExceptions() {
  if (!props.propertyId) return
  exceptionsLoading.value = true
  try {
    const data = await exceptionApi.getList({ property_id: props.propertyId, page_size: 100 })
    exceptions.value = data.items || []
  } catch (e) {
    console.error(e)
  } finally {
    exceptionsLoading.value = false
  }
}

function openVacancyDialog() {
  vacancyDialogVisible.value = true
}

function openViewingDialog() {
  viewingDialogVisible.value = true
}

function openExceptionDrawer() {
  exceptionDrawerVisible.value = true
}

function handleVacancySuccess() {
  loadDetail()
  emit('updated')
}

function handleViewingSuccess() {
  loadViewings()
  emit('updated')
}

function handleExceptionSuccess() {
  loadExceptions()
  emit('updated')
}

watch(() => props.propertyId, (val) => {
  if (val && visible.value) {
    loadDetail()
    loadViewings()
    loadExceptions()
  }
})

watch(() => visible.value, (val) => {
  if (val && props.propertyId) {
    loadDetail()
    loadViewings()
    loadExceptions()
    activeTab.value = 'timeline'
  }
})

watch(() => activeTab.value, (val) => {
  if (val === 'viewings') loadViewings()
  if (val === 'exceptions') loadExceptions()
})
</script>

<style scoped>
.property-detail {
  padding: 0 4px;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-tabs {
  margin-top: 16px;
}

.viewings-list,
.exceptions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.viewing-item,
.exception-item {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.viewing-header,
.exception-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.viewing-header .customer,
.exception-header .title {
  font-weight: 600;
  color: #303133;
}

.viewing-meta,
.exception-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.viewing-meta span,
.exception-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.viewing-remarks,
.exception-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.viewing-feedback {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
  font-size: 13px;
  color: #e6a23c;
  line-height: 1.6;
}
</style>
