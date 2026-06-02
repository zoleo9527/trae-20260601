<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const applications = ref<any[]>([])
const residents = ref<any[]>([])
const permissionGroups = ref<any[]>([])
const loading = ref(false)
const currentTab = ref('pending')
const showModal = ref(false)
const showReviewModal = ref(false)
const reviewingItem = ref<any>(null)
const reviewComment = ref('')

const form = ref({
  type: 'new' as 'new' | 'reissue' | 'permission',
  residentId: 0,
  cardId: undefined as number | undefined,
  permissionGroupId: 1,
  reason: '',
  applicant: ''
})

const residentCards = computed(() => {
  if (!form.value.residentId) return []
  return residents.value.find(r => r.id === form.value.residentId)?.cards || []
})

const tabs = [
  { key: 'pending', label: '待审核', badge: 0 },
  { key: 'approved', label: '已通过', badge: 0 },
  { key: 'rejected', label: '已拒绝', badge: 0 },
  { key: 'completed', label: '已完成', badge: 0 },
  { key: '', label: '全部', badge: 0 }
]

const loadData = async () => {
  loading.value = true
  try {
    const [appsData, residentsData, groupsData] = await Promise.all([
      window.api.cardApplication.list(currentTab.value || undefined),
      window.api.resident.list(),
      window.api.permissionGroup.list()
    ])
    applications.value = appsData

    for (const r of residentsData) {
      r.cards = await window.api.accessCard.getByResident(r.id)
    }
    residents.value = residentsData
    permissionGroups.value = groupsData

    const allApps = await window.api.cardApplication.list()
    tabs[0].badge = allApps.filter(a => a.status === 'pending').length
    tabs[1].badge = allApps.filter(a => a.status === 'approved').length
    tabs[2].badge = allApps.filter(a => a.status === 'rejected').length
    tabs[3].badge = allApps.filter(a => a.status === 'completed').length
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const openCreate = () => {
  form.value = {
    type: 'new', residentId: residents.value[0]?.id || 0,
    cardId: undefined, permissionGroupId: permissionGroups.value[0]?.id || 1,
    reason: '', applicant: ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.reason || !form.value.applicant) {
    alert('请填写申请原因和申请人')
    return
  }
  try {
    await window.api.cardApplication.create(form.value)
    showModal.value = false
    loadData()
  } catch (e: any) {
    alert('操作失败：' + e.message)
  }
}

const openReview = (item: any) => {
  reviewingItem.value = item
  reviewComment.value = ''
  showReviewModal.value = true
}

const handleReview = async (approved: boolean) => {
  if (!reviewComment.value) {
    alert('请填写审核意见')
    return
  }
  await window.api.cardApplication.review(
    reviewingItem.value.id, approved, reviewComment.value, '物业管理员'
  )
  showReviewModal.value = false
  loadData()
}

const handleProcess = async (id: number) => {
  if (!confirm('处理后将自动制卡/变更权限，确定继续吗？')) return
  const result = await window.api.cardApplication.process(id)
  alert(result.message)
  loadData()
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = { new: '新办卡', reissue: '补办', permission: '权限变更' }
  return map[type] || type
}

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'badge-pending', approved: 'badge-active',
    rejected: 'badge-lost', completed: 'badge-active'
  }
  return map[status] || ''
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核', approved: '已通过',
    rejected: '已拒绝', completed: '已完成'
  }
  return map[status] || status
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-header">
        <div class="tabs" style="border-bottom: none; margin-bottom: 0;">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab"
            :class="{ active: currentTab === tab.key }"
            @click="currentTab = tab.key; loadData()"
          >
            {{ tab.label }}
            <span v-if="tab.badge > 0" class="tag tag-danger" style="margin-left: 6px;">{{ tab.badge }}</span>
          </button>
        </div>
        <button class="btn btn-primary" @click="openCreate">+ 提交申请</button>
      </div>
      <div class="card-body" style="padding: 0;">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>申请类型</th>
                <th>申请人</th>
                <th>住户</th>
                <th>目标权限组</th>
                <th>申请原因</th>
                <th>状态</th>
                <th>审核人</th>
                <th>审核意见</th>
                <th>申请时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in applications" :key="app.id">
                <td><span class="tag tag-primary">{{ getTypeLabel(app.type) }}</span></td>
                <td>{{ app.applicant }}</td>
                <td>
                  <strong>{{ app.residentName }}</strong>
                  <div class="text-sm text-gray">{{ app.phone }}</div>
                </td>
                <td><span class="tag">{{ app.permissionGroupName }}</span></td>
                <td class="text-sm" style="max-width: 200px;">{{ app.reason }}</td>
                <td><span class="badge" :class="getStatusBadge(app.status)">{{ getStatusLabel(app.status) }}</span></td>
                <td>{{ app.reviewer || '-' }}</td>
                <td class="text-sm text-gray" style="max-width: 180px;">{{ app.reviewComment || '-' }}</td>
                <td class="text-sm text-gray">{{ app.createdAt }}</td>
                <td>
                  <div class="flex gap-2">
                    <button
                      v-if="app.status === 'pending' && props.userRole === 'admin'"
                      class="btn btn-sm btn-primary"
                      @click="openReview(app)"
                    >
                      审核
                    </button>
                    <button
                      v-if="app.status === 'approved'"
                      class="btn btn-sm btn-success"
                      @click="handleProcess(app.id)"
                    >
                      处理
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal" style="width: 550px;">
        <div class="modal-header">
          <h3 class="modal-title">提交申请</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">申请类型</label>
              <select v-model="form.type" class="form-control">
                <option value="new">新办卡</option>
                <option value="reissue">补办卡</option>
                <option value="permission">权限变更</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">申请人</label>
              <input v-model="form.applicant" class="form-control" placeholder="申请人姓名" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">住户</label>
              <select v-model="form.residentId" class="form-control">
                <option v-for="r in residents" :key="r.id" :value="r.id">
                  {{ r.name }} ({{ r.building }}{{ r.unit }}{{ r.room }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">目标权限组</label>
              <select v-model="form.permissionGroupId" class="form-control">
                <option v-for="g in permissionGroups" :key="g.id" :value="g.id">
                  {{ g.name }}
                </option>
              </select>
            </div>
          </div>
          <div v-if="form.type === 'reissue'" class="form-group">
            <label class="form-label">选择要补办的卡（选填）</label>
            <select v-model="form.cardId" class="form-control">
              <option :value="undefined">不指定，自动停用旧卡</option>
              <option v-for="c in residentCards" :key="c.id" :value="c.id">
                {{ c.cardNo }} ({{ getStatusLabel(c.status) }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">申请原因</label>
            <textarea v-model="form.reason" class="form-control" rows="3" placeholder="请详细说明申请原因"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">提交申请</button>
        </div>
      </div>
    </div>

    <div v-if="showReviewModal && reviewingItem" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal" style="width: 550px;">
        <div class="modal-header">
          <h3 class="modal-title">审核申请 #{{ reviewingItem.id }}</h3>
          <button class="modal-close" @click="showReviewModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info mb-4">
            <div>
              <strong>申请信息</strong>
              <p class="text-sm mt-2">
                <strong>{{ reviewingItem.applicant }}</strong> 申请
                <span class="tag tag-primary">{{ getTypeLabel(reviewingItem.type) }}</span>，
                目标权限：<span class="tag">{{ reviewingItem.permissionGroupName }}</span>
              </p>
              <p class="text-sm mt-2"><strong>原因：</strong>{{ reviewingItem.reason }}</p>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label required">审核意见</label>
            <textarea
              v-model="reviewComment"
              class="form-control"
              rows="3"
              placeholder="请填写审核意见，将展示给申请人"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showReviewModal = false">取消</button>
          <button class="btn btn-danger" @click="handleReview(false)">拒绝</button>
          <button class="btn btn-success" @click="handleReview(true)">通过</button>
        </div>
      </div>
    </div>
  </div>
</template>
