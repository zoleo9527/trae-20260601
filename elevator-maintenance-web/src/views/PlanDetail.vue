<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <el-button :icon="ArrowLeft" link @click="goBack">
          返回列表
        </el-button>
        <h2 class="page-title" style="display: inline-block; margin-left: 12px;">
          维保计划详情
        </h2>
      </div>
      <el-tag :type="getPlanStatusType(plan?.status)" size="large">
        {{ getPlanStatusLabel(plan?.status) }}
      </el-tag>
    </div>

    <div v-loading="loading" class="detail-card">
      <div class="detail-section">
        <div class="detail-section-title">基本信息</div>
        <el-row :gutter="24">
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">计划编号：</span>
              <span class="info-value">{{ plan?.planNo || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">计划类型：</span>
              <span class="info-value">{{ plan?.content ? (plan.content.length > 10 ? plan.content.slice(0, 10) + '...' : plan.content) : '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">计划日期：</span>
              <span class="info-value">{{ formatDate(plan?.planTime) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">电梯编号：</span>
              <span class="info-value">{{ plan?.elevatorNo || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="16">
            <div class="info-row">
              <span class="info-label">电梯位置：</span>
              <span class="info-value">{{ plan?.address || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">负责技师：</span>
              <span class="info-value">{{ plan?.technicianName || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">创建人：</span>
              <span class="info-value">{{ plan?.dispatcherName || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">创建时间：</span>
              <span class="info-value">{{ formatDateTime(plan?.createTime) }}</span>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="info-row">
              <span class="info-label">维保内容：</span>
              <span class="info-value">{{ plan?.content || '-' }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="detail-section" v-if="checkInRecords && checkInRecords.length > 0">
        <div class="detail-section-title">签到记录</div>
        <el-table :data="checkInRecords" border size="small">
          <el-table-column prop="id" label="签到ID" width="100" />
          <el-table-column label="现场照片" width="100">
            <template #default="{ row }">
              <div v-if="row.photoData" class="photo-thumbnail">
                <img :src="row.photoData" alt="签到照片" @click="previewImage(row.photoData)" />
              </div>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getCheckinStatusType(row.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN')" size="small">
                {{ getCheckinStatusLabel(row.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="checkInTime" label="签到时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.checkInTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="checkOutTime" label="签退时间" width="160">
            <template #default="{ row }">
              {{ row.checkOutTime ? formatDateTime(row.checkOutTime) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="locationRemark" label="签到位置" min-width="200" />
          <el-table-column label="工作内容摘要" min-width="200">
            <template #default="{ row }">
              <span v-if="row.workContent">
                {{ row.workContent.length > 30 ? row.workContent.slice(0, 30) + '...' : row.workContent }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="工作结果" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.workResult" :type="getWorkResultType(row.workResult)" size="small">
                {{ getWorkResultLabel(row.workResult) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewCheckInDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">处理历史</div>
        <div v-if="notes && notes.length > 0">
          <div v-for="note in notes" :key="note.id" class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-action">{{ getActionLabel(note.action) }}</span>
                <span class="timeline-time">{{ formatDateTime(note.createTime) }}</span>
              </div>
              <div class="timeline-user">
                {{ note.operatorName || '系统' }}
              </div>
              <div v-if="note.content" class="timeline-note">
                {{ note.content }}
              </div>
              <div v-if="note.photos && note.photos.length > 0" class="photo-grid">
                <div v-for="(photo, index) in note.photos" :key="index" class="photo-item">
                  <img :src="photo" alt="photo" @click="previewImage(photo)" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无处理记录" />
      </div>

      <div class="action-bar">
        <el-button
          v-if="canDispatch"
          type="primary"
          :icon="User"
          @click="openDispatchDialog"
        >
          派单
        </el-button>
        <el-button
          v-if="canCheckIn"
          type="success"
          :icon="Location"
          @click="openCheckInDialog"
        >
          签到
        </el-button>
        <el-button
          v-if="canCheckOut"
          type="warning"
          :icon="SwitchButton"
          @click="openCheckOutDialog"
        >
          签退
        </el-button>
        <el-button
          v-if="canReview"
          type="success"
          :icon="Check"
          @click="openReviewDialog"
        >
          审核
        </el-button>
        <el-button
          :icon="EditPen"
          @click="openNoteDialog"
        >
          添加备注
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="dispatchDialogVisible"
      title="派单"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="dispatchForm" :rules="dispatchRules" ref="dispatchFormRef">
        <el-form-item label="技师" prop="technicianId">
          <el-select
            v-model="dispatchForm.technicianId"
            placeholder="请选择技师"
            style="width: 100%"
          >
            <el-option
              v-for="tech in technicians"
              :key="tech.id"
              :label="tech.name"
              :value="tech.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="dispatchForm.note"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleDispatch">
          确认派单
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="checkInDialogVisible"
      title="签到"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="checkInForm" ref="checkInFormRef">
        <el-form-item label="地理位置">
          <div v-if="checkInForm.location" class="checkin-location">
            <div class="checkin-location-label">当前位置</div>
            <div class="checkin-location-value">{{ checkInForm.location }}</div>
            <div v-if="checkInForm.latitude && checkInForm.longitude" class="checkin-location-value">
              经纬度: {{ checkInForm.latitude }}, {{ checkInForm.longitude }}
            </div>
          </div>
          <div v-else>
            <el-button type="primary" :loading="locating" :icon="Location" @click="getLocation">
              获取位置
            </el-button>
            <span style="margin-left: 12px; color: #909399;">
              {{ locationMessage }}
            </span>
          </div>
        </el-form-item>
        <el-form-item label="现场照片">
          <div class="photo-grid" v-if="checkInForm.photos.length > 0">
            <div v-for="(photo, index) in checkInForm.photos" :key="index" class="photo-item">
              <img :src="photo" alt="photo" />
              <el-button
                class="photo-delete"
                type="danger"
                icon="Close"
                circle
                size="small"
                @click="removePhoto(index, 'checkIn')"
              />
            </div>
          </div>
          <el-button
            :icon="Camera"
            @click="takePhoto('checkIn')"
            style="margin-top: 12px;"
          >
            拍照（模拟）
          </el-button>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="checkInForm.note"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkInDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          :disabled="!checkInForm.location"
          @click="handleCheckIn"
        >
          确认签到
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="checkOutDialogVisible"
      title="签退"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="checkOutForm" :rules="checkOutRules" ref="checkOutFormRef">
        <el-form-item label="工作内容" prop="workContent">
          <el-input
            v-model="checkOutForm.workContent"
            type="textarea"
            :rows="4"
            placeholder="请详细描述本次维保工作内容"
          />
        </el-form-item>
        <el-form-item label="工作结果" prop="workResult">
          <el-radio-group v-model="checkOutForm.workResult">
            <el-radio
              v-for="result in workResultList"
              :key="result.value"
              :value="result.value"
            >
              <el-tag :type="result.type">{{ result.label }}</el-tag>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="问题描述" v-if="checkOutForm.workResult !== 'NORMAL'">
          <el-input
            v-model="checkOutForm.problemDescription"
            type="textarea"
            :rows="3"
            placeholder="请描述发现的问题"
          />
        </el-form-item>
        <el-form-item label="处理方案" v-if="checkOutForm.workResult !== 'NORMAL'">
          <el-input
            v-model="checkOutForm.solution"
            type="textarea"
            :rows="3"
            placeholder="请描述处理方案"
          />
        </el-form-item>
        <el-form-item label="现场照片">
          <div class="photo-grid" v-if="checkOutForm.photos.length > 0">
            <div v-for="(photo, index) in checkOutForm.photos" :key="index" class="photo-item">
              <img :src="photo" alt="photo" />
              <el-button
                class="photo-delete"
                type="danger"
                icon="Close"
                circle
                size="small"
                @click="removePhoto(index, 'checkOut')"
              />
            </div>
          </div>
          <el-button
            :icon="Camera"
            @click="takePhoto('checkOut')"
            style="margin-top: 12px;"
          >
            拍照（模拟）
          </el-button>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="checkOutForm.note"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkOutDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCheckOut">
          确认签退
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewDialogVisible"
      title="审核"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef">
        <el-form-item label="审核结果" prop="result">
          <el-radio-group v-model="reviewForm.result">
            <el-radio value="APPROVE">
              <el-tag type="success">通过</el-tag>
            </el-radio>
            <el-radio value="REJECT">
              <el-tag type="danger">驳回</el-tag>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="comment">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button
          :type="reviewForm.result === 'APPROVE' ? 'success' : 'danger'"
          :loading="submitLoading"
          @click="handleReview"
        >
          确认审核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="noteDialogVisible"
      title="添加备注"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="noteForm" :rules="noteRules" ref="noteFormRef">
        <el-form-item label="备注内容" prop="content">
          <el-input
            v-model="noteForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入备注内容"
          />
        </el-form-item>
        <el-form-item label="照片">
          <div class="photo-grid" v-if="noteForm.photos.length > 0">
            <div v-for="(photo, index) in noteForm.photos" :key="index" class="photo-item">
              <img :src="photo" alt="photo" />
              <el-button
                class="photo-delete"
                type="danger"
                icon="Close"
                circle
                size="small"
                @click="removePhoto(index, 'note')"
              />
            </div>
          </div>
          <el-button
            :icon="Camera"
            @click="takePhoto('note')"
            style="margin-top: 12px;"
          >
            拍照（模拟）
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleAddNote">
          提交备注
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  User,
  Location,
  SwitchButton,
  Check,
  EditPen,
  Camera
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getPlanById,
  getPlanNotes,
  dispatchPlan,
  reviewPlan,
  addPlanNote
} from '@/api/plan'
import { getCheckInRecords, checkIn, checkOut, getActiveCheckIn } from '@/api/checkin'
import { getUsersByRole } from '@/api/user'
import { useUserStore } from '@/store/user'
import {
  PLAN_STATUS,
  CHECKIN_STATUS,
  WORK_RESULT,
  USER_ROLE,
  getPlanStatusLabel,
  getPlanStatusType,
  getCheckinStatusLabel,
  getCheckinStatusType,
  getWorkResultLabel,
  getWorkResultType,
  getActionLabel
} from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const planId = computed(() => route.params.id)

const loading = ref(false)
const submitLoading = ref(false)
const locating = ref(false)
const locationMessage = ref('')

const plan = ref(null)
const notes = ref([])
const checkInRecords = ref([])
const activeCheckIn = ref(null)
const technicians = ref([])

const dispatchDialogVisible = ref(false)
const checkInDialogVisible = ref(false)
const checkOutDialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const noteDialogVisible = ref(false)

const dispatchFormRef = ref()
const checkInFormRef = ref()
const checkOutFormRef = ref()
const reviewFormRef = ref()
const noteFormRef = ref()

const dispatchForm = reactive({
  technicianId: null,
  note: ''
})

const checkInForm = reactive({
  location: '',
  latitude: null,
  longitude: null,
  photos: [],
  note: ''
})

const checkOutForm = reactive({
  workContent: '',
  workResult: 'NORMAL',
  problemDescription: '',
  solution: '',
  photos: [],
  note: ''
})

const reviewForm = reactive({
  result: 'APPROVE',
  comment: ''
})

const noteForm = reactive({
  content: '',
  photos: []
})

const dispatchRules = {
  technicianId: [{ required: true, message: '请选择技师', trigger: 'change' }]
}

const checkOutRules = {
  workContent: [{ required: true, message: '请输入工作内容', trigger: 'blur' }],
  workResult: [{ required: true, message: '请选择工作结果', trigger: 'change' }]
}

const reviewRules = {
  result: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  comment: [{ required: true, message: '请输入审核意见', trigger: 'blur' }]
}

const noteRules = {
  content: [{ required: true, message: '请输入备注内容', trigger: 'blur' }]
}

const workResultList = computed(() => Object.values(WORK_RESULT))

const canDispatch = computed(() => {
  return plan.value?.status === PLAN_STATUS.PENDING.value &&
    userStore.hasRole([USER_ROLE.CUSTOMER_SERVICE.value, USER_ROLE.SUPERVISOR.value])
})

const canCheckIn = computed(() => {
  return plan.value?.status === PLAN_STATUS.DISPATCHED.value &&
    userStore.hasRole(USER_ROLE.TECHNICIAN.value) &&
    plan.value?.technicianId === userStore.user?.id &&
    !activeCheckIn.value
})

const canCheckOut = computed(() => {
  return plan.value?.status === PLAN_STATUS.IN_PROGRESS.value &&
    userStore.hasRole(USER_ROLE.TECHNICIAN.value) &&
    plan.value?.technicianId === userStore.user?.id &&
    activeCheckIn.value && !activeCheckIn.value.checkOutTime
})

const canReview = computed(() => {
  return plan.value?.status === PLAN_STATUS.FOR_REVIEW.value &&
    userStore.hasRole(USER_ROLE.SUPERVISOR.value)
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const [planRes, notesRes, checkInRes, allCheckInRes] = await Promise.all([
      getPlanById(planId.value),
      getPlanNotes(planId.value),
      getActiveCheckIn(planId.value).catch(() => null),
      getCheckInRecords({ planId: planId.value }).catch(() => [])
    ])
    plan.value = planRes
    notes.value = notesRes || []
    activeCheckIn.value = checkInRes || null
    checkInRecords.value = allCheckInRes || []

    if (notes.value && notes.value.length > 0) {
      notes.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    }

    if (checkInRecords.value && checkInRecords.value.length > 0) {
      checkInRecords.value.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    }
  } catch (e) {
    console.error('Load plan detail error:', e)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadTechnicians = async () => {
  try {
    const res = await getUsersByRole(USER_ROLE.TECHNICIAN.value)
    technicians.value = res || []
  } catch (e) {
    console.error('Load technicians error:', e)
  }
}

const goBack = () => {
  router.push('/plans')
}

const viewCheckInDetail = (row) => {
  router.push({ path: `/checkins/${row.id}`, query: { planId: planId.value } })
}

const previewImage = (url) => {
  window.open(url, '_blank')
}

const getLocation = () => {
  locating.value = true
  locationMessage.value = '正在获取位置...'

  if (!navigator.geolocation) {
    locationMessage.value = '浏览器不支持定位，使用模拟位置'
    useMockLocation()
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      checkInForm.latitude = position.coords.latitude.toFixed(6)
      checkInForm.longitude = position.coords.longitude.toFixed(6)
      checkInForm.location = `经度: ${checkInForm.longitude}, 纬度: ${checkInForm.latitude}`
      locationMessage.value = '位置获取成功'
      locating.value = false
    },
    (error) => {
      console.warn('Geolocation error:', error)
      locationMessage.value = '定位失败，使用模拟位置'
      useMockLocation()
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  )
}

const useMockLocation = () => {
  const mockLat = (39.9042 + Math.random() * 0.01).toFixed(6)
  const mockLng = (116.4074 + Math.random() * 0.01).toFixed(6)
  checkInForm.latitude = mockLat
  checkInForm.longitude = mockLng
  checkInForm.location = `模拟位置 - 经度: ${mockLng}, 纬度: ${mockLat}`
  locating.value = false
}

const takePhoto = (type) => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#2c3e50"/>
      <rect x="20" y="20" width="360" height="260" fill="#34495e" rx="8"/>
      <circle cx="200" cy="150" r="60" fill="#1a252f"/>
      <circle cx="200" cy="150" r="50" fill="#2c3e50"/>
      <circle cx="200" cy="150" r="8" fill="#3498db"/>
      <text x="200" y="230" text-anchor="middle" fill="#ecf0f1" font-size="14" font-family="monospace">
        ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
      </text>
      <text x="200" y="260" text-anchor="middle" fill="#95a5a6" font-size="12" font-family="monospace">
        PHOTO_${timestamp}
      </text>
    </svg>
  `
  const base64 = 'data:image/svg+xml;base64,' + btoa(svg)

  if (type === 'checkIn') {
    checkInForm.photos.push(base64)
  } else if (type === 'checkOut') {
    checkOutForm.photos.push(base64)
  } else if (type === 'note') {
    noteForm.photos.push(base64)
  }
}

const removePhoto = (index, type) => {
  if (type === 'checkIn') {
    checkInForm.photos.splice(index, 1)
  } else if (type === 'checkOut') {
    checkOutForm.photos.splice(index, 1)
  } else if (type === 'note') {
    noteForm.photos.splice(index, 1)
  }
}

const openDispatchDialog = async () => {
  dispatchForm.technicianId = null
  dispatchForm.note = ''
  await loadTechnicians()
  dispatchDialogVisible.value = true
}

const openCheckInDialog = () => {
  checkInForm.location = ''
  checkInForm.latitude = null
  checkInForm.longitude = null
  checkInForm.photos = []
  checkInForm.note = ''
  locationMessage.value = ''
  checkInDialogVisible.value = true
}

const openCheckOutDialog = () => {
  checkOutForm.workContent = ''
  checkOutForm.workResult = 'NORMAL'
  checkOutForm.problemDescription = ''
  checkOutForm.solution = ''
  checkOutForm.photos = []
  checkOutForm.note = ''
  checkOutDialogVisible.value = true
}

const openReviewDialog = () => {
  reviewForm.result = 'APPROVE'
  reviewForm.comment = ''
  reviewDialogVisible.value = true
}

const openNoteDialog = () => {
  noteForm.content = ''
  noteForm.photos = []
  noteDialogVisible.value = true
}

const handleDispatch = async () => {
  if (!dispatchFormRef.value) return

  try {
    await dispatchFormRef.value.validate()
    submitLoading.value = true

    await dispatchPlan({
      planId: planId.value,
      technicianId: dispatchForm.technicianId,
      dispatcherId: userStore.user.id,
      remark: dispatchForm.note
    })

    ElMessage.success('派单成功')
    dispatchDialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error('Dispatch error:', e)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleCheckIn = async () => {
  try {
    submitLoading.value = true

    await checkIn({
      planId: planId.value,
      technicianId: userStore.user.id,
      latitude: checkInForm.latitude,
      longitude: checkInForm.longitude,
      locationRemark: checkInForm.location,
      photoData: checkInForm.photos && checkInForm.photos.length > 0 ? checkInForm.photos[0] : null
    })

    ElMessage.success('签到成功')
    checkInDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error('Check in error:', e)
  } finally {
    submitLoading.value = false
  }
}

const handleCheckOut = async () => {
  if (!checkOutFormRef.value || !activeCheckIn.value) return

  try {
    await checkOutFormRef.value.validate()
    submitLoading.value = true

    await checkOut({
      recordId: activeCheckIn.value.id,
      workContent: checkOutForm.workContent,
      workResult: checkOutForm.workResult,
      problemDesc: checkOutForm.problemDescription,
      solution: checkOutForm.solution,
      remark: checkOutForm.note
    })

    ElMessage.success('签退成功')
    checkOutDialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error('Check out error:', e)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleReview = async () => {
  if (!reviewFormRef.value) return

  try {
    await reviewFormRef.value.validate()
    submitLoading.value = true

    await reviewPlan({
      planId: planId.value,
      supervisorId: userStore.user.id,
      reviewRemark: reviewForm.comment,
      status: reviewForm.result === 'APPROVE' ? 'COMPLETED' : 'REJECTED'
    })

    ElMessage.success('审核成功')
    reviewDialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error('Review error:', e)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleAddNote = async () => {
  if (!noteFormRef.value) return

  try {
    await noteFormRef.value.validate()
    submitLoading.value = true

    await addPlanNote({
      planId: planId.value,
      operatorId: userStore.user.id,
      content: noteForm.content,
      action: 'NOTE'
    })

    ElMessage.success('备注添加成功')
    noteDialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error('Add note error:', e)
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.photo-item {
  position: relative;
}

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 0;
}

.photo-thumbnail {
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
}

.photo-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text-muted {
  color: #909399;
}
</style>
