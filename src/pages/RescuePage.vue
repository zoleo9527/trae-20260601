<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useRoleStore } from '@/stores/role'
import { Plus, Trash2, Search, Paperclip, FileText, Camera, Video, AlertTriangle, ShieldAlert } from 'lucide-vue-next'

const { get, post, patch } = useApi()
const roleStore = useRoleStore()

const isSafetyPatrol = computed(() => roleStore.currentRole === 'safety_patrol')

interface AttachmentPlaceholder {
  id: string
  name: string
  type: string
  isPlaceholder?: boolean
}

interface RescueRecord {
  id: string
  patrolId: string
  patrolName?: string
  date: string
  location: string
  description: string
  patientName: string
  severity: 'minor' | 'moderate' | 'severe'
  attachments: AttachmentPlaceholder[]
  createdAt?: string
}

const records = ref<RescueRecord[]>([])
const activeTab = ref<'create' | 'history'>('create')
const toast = ref('')

const form = ref({
  date: new Date().toISOString().slice(0, 10),
  location: '',
  description: '',
  patientName: '',
  severity: 'minor' as 'minor' | 'moderate' | 'severe',
  patrolId: '',
})

const attachments = ref<{ id: string; fileName: string; fileType: 'photo' | 'video' | 'report'; size: string; isPlaceholder: boolean }[]>([])

const filterDate = ref('')
const filterSeverity = ref('')

const editingRecordId = ref<string | null>(null)
const editAttachments = ref<{ id: string; fileName: string; fileType: 'photo' | 'video' | 'report'; size: string; isPlaceholder: boolean }[]>([])
const showEditModal = ref(false)

const canSubmit = computed(() => {
  return form.value.location && form.value.description && form.value.patientName && attachments.value.length > 0
})

const filteredRecords = computed(() => {
  return records.value.filter(r => {
    if (filterDate.value && r.date !== filterDate.value) return false
    if (filterSeverity.value && r.severity !== filterSeverity.value) return false
    return true
  })
})

const severityLabels: Record<string, { label: string; color: string }> = {
  minor: { label: '轻微', color: 'bg-green-100 text-green-700' },
  moderate: { label: '中等', color: 'bg-orange-100 text-orange-700' },
  severe: { label: '严重', color: 'bg-red-100 text-red-700' },
}

const fileTypeIcons: Record<string, typeof Camera> = {
  photo: Camera,
  video: Video,
  report: FileText,
}

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

function addAttachment() {
  const id = Date.now().toString()
  attachments.value.push({
    id,
    fileName: '',
    fileType: 'photo',
    size: '',
    isPlaceholder: true,
  })
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
}

async function submitRescue() {
  if (!canSubmit.value) return
  try {
    await post('/rescue', {
      ...form.value,
      attachments: attachments.value,
    })
    showToast('救援记录创建成功')
    form.value = { date: new Date().toISOString().slice(0, 10), location: '', description: '', patientName: '', severity: 'minor', patrolId: '' }
    attachments.value = []
    activeTab.value = 'history'
    await fetchRecords()
  } catch (e: any) {
    showToast(e.message || '创建失败')
  }
}

async function fetchRecords() {
  const params = new URLSearchParams()
  if (filterDate.value) params.set('date', filterDate.value)
  if (filterSeverity.value) params.set('severity', filterSeverity.value)
  try {
    const res = await get<{ success: boolean; data: RescueRecord[] }>(`/rescue?${params}`)
    records.value = res.data || []
  } catch {
    records.value = []
  }
}

function openEditModal(record: RescueRecord) {
  editingRecordId.value = record.id
  editAttachments.value = record.attachments.map(a => ({
    id: a.id,
    fileName: a.name || '',
    fileType: (a.type === 'image/jpeg' || a.type === 'photo' ? 'photo' : a.type === 'video' ? 'video' : 'report') as 'photo' | 'video' | 'report',
    size: '',
    isPlaceholder: a.isPlaceholder ?? true,
  }))
  showEditModal.value = true
}

function addEditAttachment() {
  const id = Date.now().toString()
  editAttachments.value.push({
    id,
    fileName: '',
    fileType: 'photo',
    size: '',
    isPlaceholder: true,
  })
}

function removeEditAttachment(index: number) {
  editAttachments.value.splice(index, 1)
}

async function saveAttachments() {
  if (!editingRecordId.value) return
  try {
    await patch(`/rescue/${editingRecordId.value}/attachments`, {
      attachments: editAttachments.value,
    })
    showToast('附件补全成功')
    showEditModal.value = false
    editingRecordId.value = null
    await fetchRecords()
  } catch (e: any) {
    showToast(e.message || '附件更新失败')
  }
}

function getAttachmentName(att: AttachmentPlaceholder) {
  return att.name || '未命名'
}

function getAttachmentIcon(att: AttachmentPlaceholder) {
  const t = att.type || 'other'
  if (t.includes('image') || t.includes('photo')) return Camera
  if (t.includes('video')) return Video
  return FileText
}

function hasNoAttachments(record: RescueRecord) {
  return !record.attachments || record.attachments.length === 0
}

function allPlaceholders(record: RescueRecord) {
  return record.attachments.length > 0 && record.attachments.every(a => a.isPlaceholder)
}

onMounted(fetchRecords)
</script>

<template>
  <div class="space-y-4">
    <div v-if="toast" class="fixed top-4 right-4 z-50 bg-sky-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {{ toast }}
    </div>

    <div class="flex items-center gap-3">
      <h2 class="text-xl font-bold text-slate-800">救援记录</h2>
      <span v-if="isSafetyPatrol" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">
        <ShieldAlert class="w-3 h-3" />安全巡逻员
      </span>
    </div>

    <div v-if="!isSafetyPatrol" class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
      <AlertTriangle class="w-4 h-4 flex-shrink-0" />
      <span>您当前角色为「{{ roleStore.roleName }}」，仅可查看救援记录。创建和编辑功能需切换为安全巡逻员角色。</span>
    </div>

    <div class="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
      <button
        v-for="tab in ([['create', '创建记录'], ['history', '历史记录']] as const)"
        :key="tab[0]"
        @click="activeTab = tab[0]; tab[0] === 'history' && fetchRecords()"
        :class="['px-4 py-2 text-sm rounded-md font-medium transition-colors', activeTab === tab[0] ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-800']"
      >
        {{ tab[1] }}
      </button>
    </div>

    <div v-if="activeTab === 'create'" class="space-y-4">
      <div v-if="!isSafetyPatrol" class="card p-6 text-center">
        <ShieldAlert class="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p class="text-slate-500">您没有权限创建救援记录</p>
        <p class="text-xs text-slate-400 mt-1">请切换至安全巡逻员角色</p>
      </div>

      <template v-else>
        <div class="card p-6 space-y-4">
          <h3 class="text-base font-semibold">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">日期</label>
              <input type="date" v-model="form.date" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">伤情等级</label>
              <select v-model="form.severity" class="input-field">
                <option value="minor">轻微</option>
                <option value="moderate">中等</option>
                <option value="severe">严重</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">地点</label>
            <input v-model="form.location" class="input-field" placeholder="请输入事故地点" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">伤者姓名</label>
            <input v-model="form.patientName" class="input-field" placeholder="请输入伤者姓名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">伤情描述</label>
            <textarea v-model="form.description" class="input-field" rows="3" placeholder="请描述伤情" />
          </div>
        </div>

        <div class="card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Paperclip class="w-4 h-4 text-slate-500" />
              <h3 class="text-base font-semibold">附件占位</h3>
              <span class="text-xs text-red-500">* 至少1个附件</span>
            </div>
            <button @click="addAttachment" class="btn-secondary text-sm flex items-center gap-1">
              <Plus class="w-4 h-4" />添加附件
            </button>
          </div>

          <div v-if="attachments.length === 0" class="border-2 border-dashed border-slate-200 rounded-lg py-8 text-center">
            <Paperclip class="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p class="text-sm text-slate-400">请添加至少1个附件占位</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="(att, index) in attachments" :key="att.id" class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div class="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">文件名</label>
                  <input v-model="att.fileName" class="input-field text-xs" placeholder="文件名" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">类型</label>
                  <select v-model="att.fileType" class="input-field text-xs">
                    <option value="photo">照片</option>
                    <option value="video">视频</option>
                    <option value="report">报告</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">大小</label>
                  <input v-model="att.size" class="input-field text-xs" placeholder="如 2.5MB" />
                </div>
              </div>
              <button @click="removeAttachment(index)" class="mt-5 p-1 text-red-400 hover:text-red-600">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <p class="text-xs text-slate-400 italic">附件仅作占位标记，实际文件上传为模拟功能</p>

          <div class="pt-2">
            <button @click="submitRescue" :disabled="!canSubmit" class="btn-primary w-full">
              提交救援记录
            </button>
            <p v-if="attachments.length === 0" class="text-xs text-red-500 mt-2 text-center">
              救援记录必须附带证据，请添加至少1个附件占位
            </p>
          </div>
        </div>
      </template>
    </div>

    <div v-if="activeTab === 'history'" class="space-y-4">
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">日期</label>
          <input type="date" v-model="filterDate" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">伤情等级</label>
          <select v-model="filterSeverity" class="input-field">
            <option value="">全部</option>
            <option value="minor">轻微</option>
            <option value="moderate">中等</option>
            <option value="severe">严重</option>
          </select>
        </div>
        <button @click="fetchRecords" class="btn-primary flex items-center gap-1">
          <Search class="w-4 h-4" />查询
        </button>
      </div>

      <div class="space-y-3">
        <div v-for="record in filteredRecords" :key="record.id" class="card p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="font-medium">{{ record.patientName }}</div>
              <div class="text-sm text-slate-500">{{ record.location }} · {{ record.date }}<span v-if="record.patrolName"> · 巡逻员: {{ record.patrolName }}</span></div>
            </div>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', severityLabels[record.severity]?.color || '']">
              {{ severityLabels[record.severity]?.label || record.severity }}
            </span>
          </div>
          <p class="text-sm text-slate-600 mb-3">{{ record.description }}</p>

          <div v-if="hasNoAttachments(record)" class="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-3">
            <AlertTriangle class="w-4 h-4 flex-shrink-0" />
            <span>缺少附件证据 - 此记录缺少必要的证据附件</span>
          </div>

          <div v-else-if="allPlaceholders(record)" class="mb-3">
            <div class="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-600 mb-2">
              <AlertTriangle class="w-4 h-4 flex-shrink-0" />
              <span>所有附件均为占位，请尽快补全实际文件</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="att in record.attachments"
                :key="att.id"
                class="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs"
              >
                <component :is="getAttachmentIcon(att)" class="w-4 h-4 text-slate-400" />
                <span>{{ getAttachmentName(att) }}</span>
                <span v-if="att.isPlaceholder" class="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-medium">占位</span>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-wrap gap-2 mb-3">
            <div
              v-for="att in record.attachments"
              :key="att.id"
              class="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs"
            >
              <component :is="getAttachmentIcon(att)" class="w-4 h-4 text-slate-400" />
              <span>{{ getAttachmentName(att) }}</span>
              <span v-if="att.isPlaceholder" class="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-medium">占位</span>
            </div>
          </div>

          <div class="flex justify-end">
            <button v-if="isSafetyPatrol" @click="openEditModal(record)" class="btn-orange text-sm flex items-center gap-1">
              <Paperclip class="w-4 h-4" />补全附件
            </button>
          </div>
        </div>
        <div v-if="filteredRecords.length === 0" class="text-center py-8 text-slate-400 text-sm">
          暂无救援记录
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold mb-4">补全附件</h3>
        <div class="space-y-3 mb-4">
          <div v-for="(att, index) in editAttachments" :key="att.id" class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div class="flex-1 grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">文件名</label>
                <input v-model="att.fileName" class="input-field text-xs" placeholder="文件名" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">类型</label>
                <select v-model="att.fileType" class="input-field text-xs">
                  <option value="photo">照片</option>
                  <option value="video">视频</option>
                  <option value="report">报告</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">大小</label>
                <input v-model="att.size" class="input-field text-xs" placeholder="如 2.5MB" />
              </div>
            </div>
            <button @click="removeEditAttachment(index)" class="mt-5 p-1 text-red-400 hover:text-red-600">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <button @click="addEditAttachment" class="btn-secondary text-sm flex items-center gap-1">
            <Plus class="w-4 h-4" />添加附件
          </button>
          <div class="flex gap-2">
            <button @click="showEditModal = false" class="btn-secondary">取消</button>
            <button @click="saveAttachments" class="btn-primary">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
