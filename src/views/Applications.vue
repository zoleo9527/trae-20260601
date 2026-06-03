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

const openReview = async (item: any) => {
  reviewingItem.value = await window.api.cardApplication.getById(item.id)
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

const getPermissionTagClass = (groupName: string) => {
  if (groupName.includes('VIP')) return 'tag-danger'
  if (groupName.includes('车库')) return 'tag-warning'
  return 'tag-primary'
}

const formatElevators = (elevators: number[] | undefined) => {
  if (!elevators || elevators.length === 0) return '无'
  if (elevators.length >= 20) return `全部楼层（${elevators.length}层）`
  const sorted = [...elevators].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i]
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`)
      start = sorted[i]
      prev = sorted[i]
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`)
  return ranges.join('、') + '层'
}

const getPermissionDiff = (app: any) => {
  if (!app.currentPermissionGroup) return null
  const current = app.currentPermissionGroup
  const targetDoors = app.permissionGroupDoors || []
  const currentDoors = current.doors || []
  const targetElevators = app.permissionGroupElevators || []
  const currentElevators = current.elevators || []
  const targetGarageZones = app.permissionGroupGarageZones || []
  const currentGarageZones = current.garageZones || []
  
  const addedDoors = targetDoors.filter((d: string) => !currentDoors.includes(d))
  const removedDoors = currentDoors.filter((d: string) => !targetDoors.includes(d))
  const addedElevators = targetElevators.filter((e: number) => !currentElevators.includes(e))
  const removedElevators = currentElevators.filter((e: number) => !targetElevators.includes(e))
  const addedGarageZones = targetGarageZones.filter((g: string) => !currentGarageZones.includes(g))
  const removedGarageZones = currentGarageZones.filter((g: string) => !targetGarageZones.includes(g))
  const garageAdded = !current.hasGarage && app.permissionGroupHasGarage
  const garageRemoved = current.hasGarage && !app.permissionGroupHasGarage
  
  return {
    hasChange: addedDoors.length > 0 || removedDoors.length > 0 || addedElevators.length > 0 || removedElevators.length > 0 || addedGarageZones.length > 0 || removedGarageZones.length > 0 || garageAdded || garageRemoved,
    addedDoors, removedDoors, addedElevators, removedElevators,
    addedGarageZones, removedGarageZones, garageAdded, garageRemoved
  }
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
                <th>当前权限</th>
                <th>→</th>
                <th>目标权限</th>
                <th>申请原因</th>
                <th>状态</th>
                <th>审核人</th>
                <th>申请时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in applications" :key="app.id" :class="{ 'row-highlight': app.type === 'permission' || app.permissionGroupName.includes('VIP') || app.permissionGroupName.includes('车库') }">
                <td><span class="tag tag-primary">{{ getTypeLabel(app.type) }}</span></td>
                <td>{{ app.applicant }}</td>
                <td>
                  <strong>{{ app.residentName }}</strong>
                  <div class="text-sm text-gray">{{ app.phone }}</div>
                </td>
                <td>
                  <span v-if="app.currentPermissionGroup" class="tag">{{ app.currentPermissionGroup.name }}</span>
                  <span v-else class="text-gray text-sm">
                    <span v-if="app.type === 'new'">新办卡</span>
                    <span v-else>-</span>
                  </span>
                </td>
                <td class="text-gray">
                  <span v-if="app.type === 'permission' || app.type === 'reissue'" class="text-danger font-bold">→</span>
                </td>
                <td>
                  <span class="tag" :class="getPermissionTagClass(app.permissionGroupName)">
                    {{ app.permissionGroupName }}
                  </span>
                  <span v-if="getPermissionDiff(app)?.addedGarageZones?.length > 0" class="tag tag-warning ml-1" style="font-size: 10px;" title="新增车库区域">
                    +车库
                  </span>
                  <span v-if="getPermissionDiff(app)?.addedElevators?.length > 0" class="tag tag-primary ml-1" style="font-size: 10px;" title="新增电梯楼层">
                    +电梯
                  </span>
                </td>
                <td class="text-sm" style="max-width: 160px;">{{ app.reason }}</td>
                <td><span class="badge" :class="getStatusBadge(app.status)">{{ getStatusLabel(app.status) }}</span></td>
                <td>{{ app.reviewer || '-' }}</td>
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
      <div class="modal" style="width: 650px;">
        <div class="modal-header">
          <h3 class="modal-title">
            审核申请 #{{ reviewingItem.id }}
            <span v-if="reviewingItem.type === 'permission' || reviewingItem.permissionGroupName.includes('VIP')" class="tag tag-danger ml-2">需重点审核</span>
          </h3>
          <button class="modal-close" @click="showReviewModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info mb-4">
            <div>
              <strong>申请信息</strong>
              <p class="text-sm mt-2">
                <strong>{{ reviewingItem.applicant }}</strong> 申请
                <span class="tag tag-primary">{{ getTypeLabel(reviewingItem.type) }}</span>
              </p>
              <p class="text-sm"><strong>原因：</strong>{{ reviewingItem.reason }}</p>
            </div>
          </div>

          <div v-if="reviewingItem.currentPermissionGroup || reviewingItem.type === 'permission' || reviewingItem.type === 'reissue'" class="mb-4">
            <h4 class="mb-3">🔍 权限变更对比</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group" style="background: var(--gray-50); padding: 12px; border-radius: 6px; margin-bottom: 0;">
                <label class="form-label" style="color: var(--gray-600); font-size: 12px;">当前权限</label>
                <div v-if="reviewingItem.currentPermissionGroup">
                  <div class="font-bold mb-2">{{ reviewingItem.currentPermissionGroup.name }}</div>
                  <div class="text-sm text-gray mb-1">门禁点：{{ reviewingItem.currentPermissionGroup.doors?.join('、') || '无' }}</div>
                  <div class="text-sm text-gray mb-1">电梯楼层：{{ formatElevators(reviewingItem.currentPermissionGroup.elevators) }}</div>
                  <div class="text-sm text-gray">车库：{{ reviewingItem.currentPermissionGroup.hasGarage ? reviewingItem.currentPermissionGroup.garageZones?.join('、') : '无' }}</div>
                </div>
                <div v-else class="text-gray">新办卡，无当前权限</div>
              </div>
              <div class="form-group" style="background: #f0fdf4; padding: 12px; border-radius: 6px; margin-bottom: 0; border: 1px solid #86efac;">
                <label class="form-label" style="color: #15803d; font-size: 12px;">目标权限</label>
                <div>
                  <div class="font-bold mb-2">
                    <span class="tag" :class="getPermissionTagClass(reviewingItem.permissionGroupName)">{{ reviewingItem.permissionGroupName }}</span>
                  </div>
                  <div class="text-sm text-gray mb-1">门禁点：{{ reviewingItem.permissionGroupDoors?.join('、') || '无' }}</div>
                  <div class="text-sm text-gray mb-1">电梯楼层：{{ formatElevators(reviewingItem.permissionGroupElevators) }}</div>
                  <div class="text-sm text-gray">车库：{{ reviewingItem.permissionGroupHasGarage ? reviewingItem.permissionGroupGarageZones?.join('、') : '无' }}</div>
                </div>
              </div>
            </div>

            <div v-if="getPermissionDiff(reviewingItem)?.hasChange" class="mt-3 alert" :class="getPermissionDiff(reviewingItem)?.addedGarageZones?.length > 0 || getPermissionDiff(reviewingItem)?.addedElevators?.length > 0 ? 'alert-warning' : 'alert-info'">
              <strong>📋 变更说明</strong>
              <ul class="text-sm mt-2" style="padding-left: 20px;">
                <li v-if="getPermissionDiff(reviewingItem)?.addedDoors?.length > 0" class="text-success">
                  ✅ 新增门禁：{{ getPermissionDiff(reviewingItem).addedDoors.join('、') }}
                </li>
                <li v-if="getPermissionDiff(reviewingItem)?.removedDoors?.length > 0" class="text-danger">
                  ❌ 移除门禁：{{ getPermissionDiff(reviewingItem).removedDoors.join('、') }}
                </li>
                <li v-if="getPermissionDiff(reviewingItem)?.addedElevators?.length > 0" class="text-warning">
                  ⚠️ <strong>新增电梯楼层：{{ getPermissionDiff(reviewingItem).addedElevators.join('、') }}层</strong>
                </li>
                <li v-if="getPermissionDiff(reviewingItem)?.removedElevators?.length > 0" class="text-danger">
                  ❌ 移除电梯楼层：{{ getPermissionDiff(reviewingItem).removedElevators.join('、') }}层
                </li>
                <li v-if="getPermissionDiff(reviewingItem)?.garageAdded" class="text-warning">
                  ⚠️ <strong>新增车库权限{{ getPermissionDiff(reviewingItem).addedGarageZones?.length > 0 ? '：' + getPermissionDiff(reviewingItem).addedGarageZones.join('、') : '' }}</strong>
                </li>
                <li v-if="getPermissionDiff(reviewingItem)?.garageRemoved" class="text-danger">
                  ❌ 移除车库权限
                </li>
                <li v-if="getPermissionDiff(reviewingItem)?.addedGarageZones?.length > 0 && !getPermissionDiff(reviewingItem)?.garageAdded" class="text-warning">
                  ⚠️ <strong>新增车库区域：{{ getPermissionDiff(reviewingItem).addedGarageZones.join('、') }}</strong>
                </li>
                <li v-if="getPermissionDiff(reviewingItem)?.removedGarageZones?.length > 0" class="text-danger">
                  ❌ 移除车库区域：{{ getPermissionDiff(reviewingItem).removedGarageZones.join('、') }}
                </li>
              </ul>
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
