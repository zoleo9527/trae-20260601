<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReplacementsStore } from '../stores/replacements'
import { useUserStore } from '../stores/user'
import { useOperationsStore } from '../stores/operations'
import StatusBadge from '../components/StatusBadge.vue'
import FilterBar from '../components/FilterBar.vue'
import DetailDrawer from '../components/DetailDrawer.vue'
import TimeLine from '../components/TimeLine.vue'
import { formatMoney, formatDateTime, formatFileSize } from '../utils/format'
import { cn } from '../lib/utils'
import type { Replacement, ReplacementItem, ReplacementFilters, Attachment } from '../types'
import {
  Plus,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Send,
  Paperclip,
  MessageSquare,
  Trash2,
  X,
  AlertTriangle,
  FileText,
  Bell,
  Upload,
} from 'lucide-vue-next'

const replacementsStore = useReplacementsStore()
const userStore = useUserStore()
const operationsStore = useOperationsStore()

onMounted(() => {
  replacementsStore.initReplacements()
  operationsStore.initLogs()
})

const detailDrawerVisible = ref(false)
const formDrawerVisible = ref(false)
const rejectModalVisible = ref(false)
const selectedReplacement = ref<Replacement | null>(null)
const editingReplacement = ref<Replacement | null>(null)

const confirmAmount = ref(0)
const customerFeedback = ref('')
const confirmRemark = ref('')
const rejectReason = ref('')
const supplementNoteContent = ref('')

const form = ref({
  customerName: '',
  phone: '',
  deviceModel: '',
  faultDescription: '',
  replaceReason: '',
  sceneDescription: '',
  items: [] as ReplacementItem[],
  attachments: [] as Attachment[],
  supplementNoteDraft: '',
})

function resetForm() {
  form.value = {
    customerName: '',
    phone: '',
    deviceModel: '',
    faultDescription: '',
    replaceReason: '',
    sceneDescription: '',
    items: [],
    attachments: [],
    supplementNoteDraft: '',
  }
  editingReplacement.value = null
}

function addFormItem() {
  form.value.items.push({
    partName: '',
    partCode: '',
    quantity: 1,
    unitPrice: 0,
  })
}

function removeFormItem(index: number) {
  form.value.items.splice(index, 1)
}

function handleUploadAttachment() {
  const mockFiles = [
    { name: '现场照片_' + Date.now().toString().slice(-6) + '.jpg', size: 1024 * 1024 * (0.5 + Math.random() * 2) },
    { name: '检测报告_' + Date.now().toString().slice(-6) + '.pdf', size: 1024 * 512 },
    { name: '旧件回收单_' + Date.now().toString().slice(-6) + '.png', size: 1024 * 256 },
    { name: '视频录像_' + Date.now().toString().slice(-6) + '.mp4', size: 1024 * 1024 * 5 },
  ]
  const mock = mockFiles[Math.floor(Math.random() * mockFiles.length)]
  const att: Attachment = {
    id: 'att' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: mock.name,
    url: '/uploads/' + mock.name,
    size: Math.round(mock.size),
    uploadTime: new Date().toISOString(),
    uploaderId: userStore.currentUser?.id || '',
  }
  form.value.attachments.push(att)
}

function removeFormAttachment(index: number) {
  form.value.attachments.splice(index, 1)
}

const formTotalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
})

function getItemSubtotal(item: ReplacementItem): number {
  return item.quantity * item.unitPrice
}

const filteredList = computed(() => replacementsStore.filteredList)

const canShowSubmitEdit = computed(() => {
  if (!selectedReplacement.value) return false
  const status = selectedReplacement.value.status
  return (
    userStore.isTechnician &&
    (status === 'draft' || status === 'rejected')
  )
})

const canShowConfirmReject = computed(() => {
  if (!selectedReplacement.value) return false
  const status = selectedReplacement.value.status
  return (
    userStore.isCustomerService &&
    (status === 'pending_confirm' || status === 'resubmitted')
  )
})

const canShowComplete = computed(() => {
  if (!selectedReplacement.value) return false
  return userStore.isSupervisor && selectedReplacement.value.status === 'confirmed'
})

function handleFiltersUpdate(filters: ReplacementFilters) {
  replacementsStore.setFilters(filters)
}

function handleSearch() {}

function openDetail(r: Replacement) {
  selectedReplacement.value = r
  replacementsStore.selectedId = r.id
  detailDrawerVisible.value = true
}

function openCreateForm() {
  resetForm()
  addFormItem()
  formDrawerVisible.value = true
}

function openEditForm(r: Replacement) {
  editingReplacement.value = r
  form.value = {
    customerName: r.customerName,
    phone: r.phone,
    deviceModel: r.deviceModel,
    faultDescription: r.faultDescription,
    replaceReason: r.replaceReason || '',
    sceneDescription: r.sceneDescription || '',
    items: JSON.parse(JSON.stringify(r.items || [])),
    attachments: JSON.parse(JSON.stringify(r.attachments || [])),
    supplementNoteDraft: '',
  }
  formDrawerVisible.value = true
}

function handleSaveDraft() {
  const payload = {
    customerName: form.value.customerName,
    phone: form.value.phone,
    deviceModel: form.value.deviceModel,
    faultDescription: form.value.faultDescription,
    replaceReason: form.value.replaceReason,
    sceneDescription: form.value.sceneDescription,
    items: form.value.items,
    attachments: form.value.attachments,
    estimatedAmount: formTotalAmount.value,
  }

  if (editingReplacement.value) {
    const updated = replacementsStore.updateReplacement(editingReplacement.value.id, payload)
    if (updated && form.value.supplementNoteDraft.trim()) {
      replacementsStore.addSupplementNote(editingReplacement.value.id, form.value.supplementNoteDraft.trim())
    }
  } else {
    const notes = form.value.supplementNoteDraft.trim() ? [form.value.supplementNoteDraft.trim()] : []
    replacementsStore.createReplacement({
      ...payload,
      supplementNotes: notes,
    })
  }
  formDrawerVisible.value = false
  resetForm()
}

function handleSubmitForm() {
  const payload = {
    customerName: form.value.customerName,
    phone: form.value.phone,
    deviceModel: form.value.deviceModel,
    faultDescription: form.value.faultDescription,
    replaceReason: form.value.replaceReason,
    sceneDescription: form.value.sceneDescription,
    items: form.value.items,
    attachments: form.value.attachments,
    estimatedAmount: formTotalAmount.value,
  }

  if (editingReplacement.value) {
    replacementsStore.updateReplacement(editingReplacement.value.id, payload)
    if (form.value.supplementNoteDraft.trim()) {
      replacementsStore.addSupplementNote(editingReplacement.value.id, form.value.supplementNoteDraft.trim())
    }
    if (editingReplacement.value.status === 'rejected') {
      replacementsStore.resubmitReplacement(editingReplacement.value.id)
    } else {
      replacementsStore.submitReplacement(editingReplacement.value.id)
    }
  } else {
    const notes = form.value.supplementNoteDraft.trim() ? [form.value.supplementNoteDraft.trim()] : []
    const newR = replacementsStore.createReplacement({
      ...payload,
      supplementNotes: notes,
    })
    replacementsStore.submitReplacement(newR.id)
  }
  formDrawerVisible.value = false
  resetForm()
}

function handleSubmit(r: Replacement) {
  if (r.status === 'rejected') {
    replacementsStore.resubmitReplacement(r.id)
  } else {
    replacementsStore.submitReplacement(r.id)
  }
}

function handleEdit(r: Replacement) {
  openEditForm(r)
  detailDrawerVisible.value = false
}

function openRejectModal() {
  rejectReason.value = ''
  rejectModalVisible.value = true
}

function handleConfirmCost() {
  if (!selectedReplacement.value) return
  if (!confirmAmount.value || confirmAmount.value <= 0) {
    alert('请输入有效的确认金额')
    return
  }
  replacementsStore.confirmCost(
    selectedReplacement.value.id,
    confirmAmount.value,
    customerFeedback.value || undefined,
    confirmRemark.value || undefined
  )
  confirmAmount.value = 0
  customerFeedback.value = ''
  confirmRemark.value = ''
}

function handleReject() {
  if (!selectedReplacement.value) return
  if (!rejectReason.value.trim()) {
    alert('请输入退回原因')
    return
  }
  replacementsStore.rejectReplacement(selectedReplacement.value.id, rejectReason.value)
  rejectModalVisible.value = false
  rejectReason.value = ''
}

function handleComplete() {
  if (!selectedReplacement.value) return
  replacementsStore.closeReplacement(selectedReplacement.value.id)
}

function handleAddSupplementNote() {
  if (!selectedReplacement.value) return
  if (!supplementNoteContent.value.trim()) return
  replacementsStore.addSupplementNote(selectedReplacement.value.id, supplementNoteContent.value)
  supplementNoteContent.value = ''
}

const operationLogs = computed(() => {
  if (!selectedReplacement.value) return []
  return operationsStore.getByReplacementId(selectedReplacement.value.id)
})

const currentOwner = computed(() => {
  if (!selectedReplacement.value) return '-'
  const s = selectedReplacement.value.status
  if (s === 'draft' || s === 'rejected') return selectedReplacement.value.technicianName
  if (s === 'pending_confirm' || s === 'resubmitted') return '客服人员'
  if (s === 'confirmed') return '主管'
  if (s === 'completed' || s === 'closed') return '-'
  return '-'
})

function getFirstPartName(r: Replacement): string {
  return r.items && r.items.length > 0 ? r.items[0].partName : '-'
}

function getLatestRejectReason(r: Replacement): string {
  if (r.rejectRecords.length === 0) return ''
  return r.rejectRecords[r.rejectRecords.length - 1].reason
}

function getCurrentOwner(r: Replacement): string {
  const s = r.status
  if (s === 'draft' || s === 'rejected') return r.technicianName
  if (s === 'pending_confirm' || s === 'resubmitted') return '客服人员'
  if (s === 'confirmed') return '主管'
  return '-'
}

watch(
  () => replacementsStore.selectedId,
  (id) => {
    if (id) {
      const r = replacementsStore.getById(id)
      if (r) {
        selectedReplacement.value = r
        detailDrawerVisible.value = true
      }
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="space-y-4 p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">备件更换处理</h1>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white text-xs font-medium border border-blue-900 hover:bg-blue-800 transition-colors"
            @click="openCreateForm"
          >
            <Plus :size="14" />
            新建更换申请
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-xs font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            @click="replacementsStore.exportToCSV()"
          >
            <Download :size="14" />
            导出
          </button>
        </div>
      </div>

      <FilterBar
        :filters="replacementsStore.filters"
        placeholder="搜索记录编号/客户/设备"
        @update:filters="handleFiltersUpdate"
        @search="handleSearch"
      />

      <div class="bg-white border border-gray-200">
        <div class="overflow-x-auto">
          <table class="w-full" style="font-size: 12px; line-height: 1.4;">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-3 py-2 text-left font-medium text-gray-600">记录编号</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">客户名称</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">设备型号</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">首项备件</th>
                <th class="px-3 py-2 text-right font-medium text-gray-600">数量</th>
                <th class="px-3 py-2 text-right font-medium text-gray-600">预估金额</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">状态</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">技术员</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">提交时间</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">当前责任人</th>
                <th class="px-3 py-2 text-left font-medium text-gray-600">最新退回原因</th>
                <th class="px-3 py-2 text-center font-medium text-gray-600">补充</th>
                <th class="px-3 py-2 text-center font-medium text-gray-600">附件</th>
                <th class="px-3 py-2 text-center font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in filteredList"
                :key="r.id"
                :class="cn(
                  'border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer',
                  replacementsStore.isDisputeProne(r) ? 'border-l-[3px] border-l-orange-500' : ''
                )"
                @click="openDetail(r)"
              >
                <td class="px-3 py-1.5 font-mono text-gray-900 whitespace-nowrap">{{ r.orderNo }}</td>
                <td class="px-3 py-1.5 text-gray-700 truncate max-w-[120px]">{{ r.customerName }}</td>
                <td class="px-3 py-1.5 text-gray-700 whitespace-nowrap">{{ r.deviceModel }}</td>
                <td class="px-3 py-1.5 text-gray-700 truncate max-w-[100px]">{{ getFirstPartName(r) }}</td>
                <td class="px-3 py-1.5 text-right text-gray-700">
                  {{ r.items?.reduce((s, i) => s + i.quantity, 0) || 0 }}
                </td>
                <td class="px-3 py-1.5 text-right font-medium text-gray-900 whitespace-nowrap">
                  {{ formatMoney(r.estimatedAmount) }}
                </td>
                <td class="px-3 py-1.5">
                  <StatusBadge :status="r.status" />
                </td>
                <td class="px-3 py-1.5 text-gray-700 whitespace-nowrap">{{ r.technicianName }}</td>
                <td class="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                  {{ formatDateTime(r.submittedAt || r.createdAt) }}
                </td>
                <td class="px-3 py-1.5 text-gray-700 whitespace-nowrap">{{ getCurrentOwner(r) }}</td>
                <td class="px-3 py-1.5 text-red-600 truncate max-w-[140px]" :class="{ 'text-gray-400': !getLatestRejectReason(r) }">
                  {{ getLatestRejectReason(r) || '-' }}
                </td>
                <td class="px-3 py-1.5 text-center">
                  <span v-if="r.supplementNotes && r.supplementNotes.length > 0" class="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-[11px] font-medium rounded-sm">
                    {{ r.supplementNotes.length }}
                  </span>
                  <span v-else class="text-gray-300">-</span>
                </td>
                <td class="px-3 py-1.5 text-center">
                  <span v-if="r.attachments && r.attachments.length > 0" class="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 text-[11px] font-medium rounded-sm">
                    {{ r.attachments.length }}
                  </span>
                  <span v-else class="text-gray-300">-</span>
                </td>
                <td class="px-3 py-1.5" @click.stop>
                  <div class="flex items-center gap-1">
                    <button
                      v-if="
                        userStore.isTechnician &&
                        (r.status === 'draft' || r.status === 'rejected')
                      "
                      type="button"
                      class="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
                      @click="handleSubmit(r)"
                    >
                      <Send :size="11" />
                      提交
                    </button>
                    <button
                      v-if="
                        userStore.isTechnician &&
                        (r.status === 'draft' || r.status === 'rejected')
                      "
                      type="button"
                      class="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                      @click="handleEdit(r)"
                    >
                      <Edit :size="11" />
                      编辑
                    </button>
                    <button
                      v-if="
                        userStore.isCustomerService &&
                        (r.status === 'pending_confirm' || r.status === 'resubmitted')
                      "
                      type="button"
                      class="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
                      @click="openDetail(r)"
                    >
                      <CheckCircle :size="11" />
                      确认
                    </button>
                    <button
                      v-if="
                        userStore.isCustomerService &&
                        (r.status === 'pending_confirm' || r.status === 'resubmitted')
                      "
                      type="button"
                      class="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 transition-colors"
                      @click="openRejectModal(); selectedReplacement = r"
                    >
                      <XCircle :size="11" />
                      退回
                    </button>
                    <button
                      v-if="userStore.isSupervisor && r.status === 'confirmed'"
                      type="button"
                      class="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
                      @click="replacementsStore.closeReplacement(r.id)"
                    >
                      <CheckCircle :size="11" />
                      标记完成
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                      @click="openDetail(r)"
                    >
                      <Eye :size="11" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredList.length === 0">
                <td colspan="14" class="px-4 py-16 text-center text-gray-500 text-sm">
                  暂无备件更换记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <DetailDrawer
      :visible="detailDrawerVisible"
      :title="selectedReplacement ? `备件更换详情 - ${selectedReplacement.orderNo}` : '备件更换详情'"
      @close="detailDrawerVisible = false"
    >
      <div v-if="selectedReplacement" class="space-y-5">
        <div class="space-y-3">
          <div class="flex items-center gap-2 border-b border-gray-200 pb-2">
            <h3 class="text-sm font-semibold text-gray-900">基本信息</h3>
            <span
              v-if="replacementsStore.isDisputeProne(selectedReplacement)"
              class="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[11px] font-medium border border-orange-400"
            >
              <AlertTriangle :size="11" />
              责任风险
            </span>
          </div>
          <div
            v-if="replacementsStore.isDisputeProne(selectedReplacement)"
            class="p-2 bg-orange-50 border border-orange-300 text-xs space-y-1"
          >
            <div
              v-for="reason in replacementsStore.getRiskReasons(selectedReplacement)"
              :key="reason"
              class="flex items-center gap-1.5 text-orange-700"
            >
              <AlertTriangle :size="11" class="shrink-0" />
              {{ reason }}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <span class="text-gray-500">记录编号：</span>
              <span class="text-gray-900 font-mono">{{ selectedReplacement.orderNo }}</span>
            </div>
            <div>
              <span class="text-gray-500">客户名称：</span>
              <span class="text-gray-900">{{ selectedReplacement.customerName }}</span>
            </div>
            <div>
              <span class="text-gray-500">设备型号：</span>
              <span class="text-gray-900">{{ selectedReplacement.deviceModel }}</span>
            </div>
            <div>
              <span class="text-gray-500">联系电话：</span>
              <span class="text-gray-900">{{ selectedReplacement.phone || '-' }}</span>
            </div>
            <div>
              <span class="text-gray-500">技术员：</span>
              <span class="text-gray-900">{{ selectedReplacement.technicianName }}</span>
            </div>
            <div>
              <span class="text-gray-500">当前责任人：</span>
              <span class="text-gray-900">{{ currentOwner }}</span>
            </div>
            <div>
              <span class="text-gray-500">创建时间：</span>
              <span class="text-gray-900">{{ formatDateTime(selectedReplacement.createdAt) }}</span>
            </div>
            <div>
              <span class="text-gray-500">提交时间：</span>
              <span class="text-gray-900">{{ formatDateTime(selectedReplacement.submittedAt || '') }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-gray-500">故障描述：</span>
              <span class="text-gray-900">{{ selectedReplacement.faultDescription || '-' }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-gray-500">更换原因：</span>
              <span class="text-gray-900">{{ selectedReplacement.replaceReason || '-' }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-gray-500">现场情况：</span>
              <span class="text-gray-900">{{ selectedReplacement.sceneDescription || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">备件明细</h3>
          <div class="border border-gray-200">
            <div class="overflow-x-auto">
              <table class="w-full" style="font-size: 12px;">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-3 py-2 text-left font-medium text-gray-600">备件名</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-600">型号</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-600">数量</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-600">单价</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-600">小计</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, i) in selectedReplacement.items"
                    :key="i"
                    class="border-b border-gray-100"
                  >
                    <td class="px-3 py-1.5 text-gray-700">{{ item.partName }}</td>
                    <td class="px-3 py-1.5 text-gray-700">{{ item.partCode }}</td>
                    <td class="px-3 py-1.5 text-right text-gray-700">{{ item.quantity }}</td>
                    <td class="px-3 py-1.5 text-right text-gray-700">{{ formatMoney(item.unitPrice) }}</td>
                    <td class="px-3 py-1.5 text-right font-medium text-gray-900">
                      {{ formatMoney(item.quantity * item.unitPrice) }}
                    </td>
                  </tr>
                  <tr class="bg-gray-50">
                    <td colspan="4" class="px-3 py-1.5 text-right font-medium text-gray-700">
                      预估金额合计：
                    </td>
                    <td class="px-3 py-1.5 text-right font-semibold text-blue-900">
                      {{ formatMoney(selectedReplacement.estimatedAmount) }}
                    </td>
                  </tr>
                  <tr v-if="selectedReplacement.confirmedAmount" class="bg-green-50">
                    <td colspan="4" class="px-3 py-1.5 text-right font-medium text-green-700">
                      确认金额：
                    </td>
                    <td class="px-3 py-1.5 text-right font-semibold text-green-700">
                      {{ formatMoney(selectedReplacement.confirmedAmount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">费用确认记录</h3>
          <div
            v-if="userStore.isCustomerService && (selectedReplacement.status === 'pending_confirm' || selectedReplacement.status === 'resubmitted')"
            class="p-3 bg-gray-50 border border-gray-200 text-xs space-y-3"
          >
            <div class="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label class="block text-gray-600 mb-1">确认金额</label>
                <input
                  v-model.number="confirmAmount"
                  type="number"
                  :placeholder="`预估 ${formatMoney(selectedReplacement.estimatedAmount)}`"
                  class="w-full px-3 py-1.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-gray-600 mb-1">客户反馈</label>
                <input
                  v-model="customerFeedback"
                  type="text"
                  placeholder="客户反馈意见"
                  class="w-full px-3 py-1.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-gray-600 mb-1">备注</label>
              <textarea
                v-model="confirmRemark"
                rows="2"
                placeholder="确认备注"
                class="w-full px-3 py-1.5 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
              ></textarea>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1 px-4 py-1.5 bg-green-700 text-white font-medium hover:bg-green-600 transition-colors"
                @click="handleConfirmCost"
              >
                <CheckCircle :size="12" />
                确认费用
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 px-4 py-1.5 bg-red-700 text-white font-medium hover:bg-red-600 transition-colors"
                @click="openRejectModal"
              >
                <XCircle :size="12" />
                退回
              </button>
            </div>
          </div>

          <div v-if="selectedReplacement.costConfirmations.length > 0" class="space-y-2">
            <div
              v-for="cc in selectedReplacement.costConfirmations"
              :key="cc.id"
              class="p-2.5 bg-green-50 border border-green-200 text-xs space-y-1"
            >
              <div class="flex items-center gap-3 text-gray-600">
                <span class="font-medium text-gray-900">{{ cc.confirmerName }}</span>
                <span class="text-[11px] px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-300">{{ cc.role === 'customer_service' ? '客服' : cc.role === 'supervisor' ? '主管' : '技术员' }}</span>
                <span>{{ formatDateTime(cc.confirmTime) }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span>
                  <span class="text-gray-500">确认金额：</span>
                  <span class="text-green-700 font-semibold">{{ formatMoney(cc.confirmedAmount) }}</span>
                </span>
                <span v-if="cc.comment">
                  <span class="text-gray-500">备注：</span>
                  <span class="text-gray-700">{{ cc.comment }}</span>
                </span>
              </div>
            </div>
          </div>
          <div v-if="selectedReplacement.costConfirmations.length === 0 && !(userStore.isCustomerService && (selectedReplacement.status === 'pending_confirm' || selectedReplacement.status === 'resubmitted'))" class="text-xs text-gray-400 py-2">
            暂无费用确认记录
          </div>

          <div
            v-if="userStore.isSupervisor && selectedReplacement.status === 'confirmed'"
            class="p-3 bg-blue-50 border border-blue-200 text-xs"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors"
              @click="handleComplete"
            >
              <CheckCircle :size="12" />
              标记完成
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">退回记录</h3>
          <div v-if="selectedReplacement.rejectRecords.length > 0" class="space-y-2">
            <div
              v-for="rr in selectedReplacement.rejectRecords"
              :key="rr.id"
              class="p-2.5 bg-red-50 border border-red-200 text-xs space-y-1"
            >
              <div class="flex items-center gap-3 text-gray-600">
                <span class="font-medium text-gray-900">{{ rr.rejecterName }}</span>
                <span class="text-[11px] px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-300">{{ rr.role === 'customer_service' ? '客服' : rr.role === 'supervisor' ? '主管' : '技术员' }}</span>
                <span>{{ formatDateTime(rr.rejectTime) }}</span>
              </div>
              <div class="text-red-700">
                <XCircle :size="11" class="inline mr-1" />
                {{ rr.reason }}
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-400 py-2">
            暂无退回记录
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">补充备注</h3>
          <div class="flex items-start gap-2">
            <textarea
              v-model="supplementNoteContent"
              rows="2"
              placeholder="添加补充备注..."
              class="flex-1 px-3 py-1.5 border border-gray-300 bg-white text-gray-900 text-xs focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
            <button
              type="button"
              class="px-3 py-1.5 bg-blue-900 text-white text-xs font-medium hover:bg-blue-800 transition-colors whitespace-nowrap"
              @click="handleAddSupplementNote"
            >
              添加
            </button>
          </div>
          <div v-if="selectedReplacement.supplementNotes && selectedReplacement.supplementNotes.length > 0" class="space-y-1.5">
            <div
              v-for="(note, i) in selectedReplacement.supplementNotes"
              :key="i"
              class="p-2 bg-gray-50 border border-gray-200 text-xs"
            >
              <div class="flex items-center gap-2 text-gray-500 mb-0.5">
                <span class="font-medium text-gray-700">{{ selectedReplacement.technicianName }}</span>
                <span class="text-gray-300">·</span>
                <span>{{ formatDateTime(selectedReplacement.updatedAt) }}</span>
              </div>
              <div class="text-gray-700">{{ note }}</div>
            </div>
          </div>
          <div v-if="!selectedReplacement.supplementNotes || selectedReplacement.supplementNotes.length === 0" class="text-xs text-gray-400 py-2">
            暂无补充备注
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">附件</h3>
          <div v-if="selectedReplacement.attachments && selectedReplacement.attachments.length > 0" class="space-y-1.5">
            <div
              v-for="att in selectedReplacement.attachments"
              :key="att.id"
              class="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 text-xs"
            >
              <FileText :size="12" class="text-gray-400 shrink-0" />
              <span class="text-gray-900 truncate">{{ att.name }}</span>
              <span class="text-gray-400 shrink-0">{{ formatFileSize(att.size) }}</span>
              <span class="text-gray-400 shrink-0 ml-auto">{{ formatDateTime(att.uploadTime) }}</span>
            </div>
          </div>
          <div v-if="!selectedReplacement.attachments || selectedReplacement.attachments.length === 0" class="text-xs text-gray-400 py-2">
            暂无附件
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs hover:bg-gray-50 transition-colors"
          >
            <Upload :size="12" />
            上传附件
          </button>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">外部通知</h3>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-gray-400 bg-gray-50 text-gray-600 text-xs hover:bg-gray-100 transition-colors"
          >
            <Bell :size="12" />
            发送短信通知客户（占位）
          </button>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">操作时间线</h3>
          <TimeLine :logs="operationLogs" />
        </div>

        <div v-if="canShowSubmitEdit" class="flex items-center gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-900 text-white text-xs font-medium hover:bg-blue-800 transition-colors"
            @click="handleSubmit(selectedReplacement!)"
          >
            <Send :size="12" />
            提交
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-gray-700 text-xs font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            @click="handleEdit(selectedReplacement!)"
          >
            <Edit :size="12" />
            编辑
          </button>
        </div>
      </div>
    </DetailDrawer>

    <DetailDrawer
      :visible="formDrawerVisible"
      :title="editingReplacement ? '编辑更换申请' : '新建更换申请'"
      @close="formDrawerVisible = false; resetForm()"
    >
      <div class="space-y-5 text-xs">
        <div class="grid grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <label class="block text-gray-600 mb-1.5 font-medium">客户名称</label>
            <input
              v-model="form.customerName"
              type="text"
              placeholder="请输入客户名称"
              class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-gray-600 mb-1.5 font-medium">联系电话</label>
            <input
              v-model="form.phone"
              type="text"
              placeholder="请输入联系电话"
              class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-gray-600 mb-1.5 font-medium">电梯编号</label>
            <input
              v-model="form.deviceModel"
              type="text"
              placeholder="请输入电梯编号"
              class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-gray-600 mb-1.5 font-medium">设备型号</label>
            <input
              v-model="form.deviceModel"
              type="text"
              placeholder="请输入设备型号"
              class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-gray-600 mb-1.5 font-medium">故障描述</label>
          <textarea
            v-model="form.faultDescription"
            rows="2"
            placeholder="请描述故障情况"
            class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-gray-600 font-medium">备件明细</label>
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
              @click="addFormItem"
            >
              <Plus :size="11" />
              添加行
            </button>
          </div>
          <div class="border border-gray-200 overflow-hidden">
            <table class="w-full" style="font-size: 12px;">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="px-2.5 py-2 text-left font-medium text-gray-600">备件名</th>
                  <th class="px-2.5 py-2 text-left font-medium text-gray-600">型号</th>
                  <th class="px-2.5 py-2 text-right font-medium text-gray-600 w-20">数量</th>
                  <th class="px-2.5 py-2 text-right font-medium text-gray-600 w-28">单价</th>
                  <th class="px-2.5 py-2 text-right font-medium text-gray-600 w-28">小计</th>
                  <th class="px-2.5 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in form.items"
                  :key="index"
                  class="border-b border-gray-100 last:border-0"
                >
                  <td class="px-2.5 py-1.5">
                    <input
                      v-model="item.partName"
                      type="text"
                      placeholder="备件名"
                      class="w-full px-2 py-1 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td class="px-2.5 py-1.5">
                    <input
                      v-model="item.partCode"
                      type="text"
                      placeholder="型号"
                      class="w-full px-2 py-1 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td class="px-2.5 py-1.5">
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="w-full px-2 py-1 border border-gray-200 bg-white text-gray-900 text-right focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td class="px-2.5 py-1.5">
                    <input
                      v-model.number="item.unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full px-2 py-1 border border-gray-200 bg-white text-gray-900 text-right focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td class="px-2.5 py-1.5 text-right font-medium text-gray-900">
                    {{ formatMoney(getItemSubtotal(item)) }}
                  </td>
                  <td class="px-2.5 py-1.5 text-center">
                    <button
                      v-if="form.items.length > 1"
                      type="button"
                      class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      @click="removeFormItem(index)"
                    >
                      <Trash2 :size="12" />
                    </button>
                  </td>
                </tr>
                <tr class="bg-gray-50 border-t border-gray-200">
                  <td colspan="4" class="px-2.5 py-2 text-right font-medium text-gray-700">
                    总额：
                  </td>
                  <td class="px-2.5 py-2 text-right font-bold text-blue-900">
                    {{ formatMoney(formTotalAmount) }}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <label class="block text-gray-600 mb-1.5 font-medium">更换原因</label>
          <textarea
            v-model="form.replaceReason"
            rows="2"
            placeholder="请说明更换原因"
            class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-gray-600 mb-1.5 font-medium">现场情况描述</label>
          <textarea
            v-model="form.sceneDescription"
            rows="2"
            placeholder="请描述现场情况"
            class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
          ></textarea>
        </div>

        <div v-if="editingReplacement && editingReplacement.status === 'rejected'" class="p-2.5 bg-red-50 border border-red-300 text-xs space-y-1">
          <div class="font-semibold text-red-800 flex items-center gap-1">
            <AlertTriangle :size="12" />
            申请被退回，请根据以下原因修改后重新提交：
          </div>
          <div v-for="rr in editingReplacement.rejectRecords" :key="rr.id" class="text-red-700 pl-4">
            <span class="text-red-500">{{ rr.rejecterName }}（{{ rr.role === 'customer_service' ? '客服' : rr.role === 'supervisor' ? '主管' : '技术员' }}） · {{ formatDateTime(rr.rejectTime) }}：</span>
            {{ rr.reason }}
          </div>
        </div>

        <div>
          <label class="block text-gray-600 mb-1.5 font-medium">附件上传</label>
          <div v-if="form.attachments.length > 0" class="mb-2 space-y-1">
            <div
              v-for="(att, index) in form.attachments"
              :key="att.id"
              class="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 text-[11px]"
            >
              <FileText :size="11" class="text-gray-400 shrink-0" />
              <span class="text-gray-800 truncate">{{ att.name }}</span>
              <span class="text-gray-400 shrink-0">{{ formatFileSize(att.size) }}</span>
              <span class="text-gray-400 shrink-0 ml-auto">{{ formatDateTime(att.uploadTime) }}</span>
              <button
                type="button"
                class="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                @click.stop="removeFormAttachment(index)"
                title="删除附件"
              >
                <X :size="11" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              @click="handleUploadAttachment"
            >
              <Upload :size="12" />
              上传附件
            </button>
            <span class="text-[11px] text-gray-400">支持现场照片、检测报告、旧件回收单等（模拟上传）</span>
          </div>
        </div>

        <div>
          <label class="block text-gray-600 mb-1.5 font-medium">补充备注</label>
          <div v-if="editingReplacement && editingReplacement.supplementNotes && editingReplacement.supplementNotes.length > 0" class="mb-2 space-y-1">
            <div
              v-for="(note, i) in editingReplacement.supplementNotes"
              :key="i"
              class="p-1.5 bg-blue-50 border border-blue-200 text-[11px] text-blue-800"
            >
              {{ note }}
            </div>
          </div>
          <textarea
            v-model="form.supplementNoteDraft"
            rows="2"
            placeholder="添加补充备注（保存或提交时写入记录，可用于说明修改内容或补充信息）"
            class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
          ></textarea>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-gray-200">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-5 py-2 bg-gray-100 text-gray-700 font-medium border border-gray-300 hover:bg-gray-200 transition-colors"
            @click="handleSaveDraft"
          >
            保存草稿
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors"
            @click="handleSubmitForm"
          >
            <Send :size="12" />
            提交
          </button>
        </div>
      </div>
    </DetailDrawer>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="rejectModalVisible" class="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            class="absolute inset-0 bg-black/50"
            @click="rejectModalVisible = false"
          ></div>
          <div class="relative bg-white border border-gray-200 shadow-xl w-[420px]">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 class="text-sm font-semibold text-gray-900">退回申请</h3>
              <button
                type="button"
                class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                @click="rejectModalVisible = false"
              >
                <X :size="16" />
              </button>
            </div>
            <div class="p-4 space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1.5">退回原因</label>
                <textarea
                  v-model="rejectReason"
                  rows="4"
                  placeholder="请输入退回原因..."
                  class="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-blue-500 resize-none"
                ></textarea>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="px-4 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  @click="rejectModalVisible = false"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="px-4 py-1.5 text-sm bg-red-700 text-white hover:bg-red-600 transition-colors"
                  @click="handleReject"
                >
                  确认退回
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
