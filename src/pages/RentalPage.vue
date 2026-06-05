<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useRoleStore } from '@/stores/role'
import StatusBadge from '@/components/StatusBadge.vue'
import { Plus, RotateCcw, Filter, AlertTriangle, List, Package } from 'lucide-vue-next'

const { get, post } = useApi()
const roleStore = useRoleStore()
const isRental = computed(() => roleStore.currentRole === 'rental')

interface Equipment {
  id: string
  code: string
  name: string
  type: string
  status: 'available' | 'rented' | 'maintenance'
  currentRentalId?: string
  studentName?: string
  abnormal?: { type: string; note?: string; actualReturner?: string }
}

interface Student {
  id: string
  name: string
  level: string
}

interface Rental {
  id: string
  equipmentId: string
  studentId: string
  studentName?: string
  equipmentCode?: string
  equipmentName?: string
  status: 'active' | 'returned' | 'abnormal'
  rentedAt: string
  returnedAt?: string
  abnormal?: { type: string; note?: string; actualReturner?: string }
}

const activeTab = ref<'equipment' | 'rentals'>('equipment')
const equipmentList = ref<Equipment[]>([])
const rentalList = ref<Rental[]>([])
const students = ref<Student[]>([])
const filterStatus = ref<string>('all')
const filterRentalStatus = ref<string>('all')
const showRentModal = ref(false)
const showReturnModal = ref(false)
const selectedEquipment = ref<Equipment | null>(null)
const rentForm = ref({ studentId: '' })
const returnForm = ref({ abnormal: false, abnormalType: 'wrong_person' as 'wrong_person' | 'damaged', actualReturner: '', note: '' })
const loading = ref(false)
const toast = ref('')

const typeLabels: Record<string, string> = {
  ski: '双板', snowboard: '单板', helmet: '头盔', goggles: '护目镜', boots: '雪鞋',
}

const filteredEquipment = computed(() => {
  if (filterStatus.value === 'all') return equipmentList.value
  return equipmentList.value.filter(e => e.status === filterStatus.value)
})

const filteredRentals = computed(() => {
  if (filterRentalStatus.value === 'all') return rentalList.value
  return rentalList.value.filter(r => r.status === filterRentalStatus.value)
})

const rentalStatusColor = (status: string) => {
  if (status === 'active') return 'bg-blue-100 text-blue-700'
  if (status === 'returned') return 'bg-green-100 text-green-700'
  return 'bg-orange-100 text-orange-700'
}

const rentalStatusLabel = (status: string) => {
  if (status === 'active') return '在租'
  if (status === 'returned') return '已归还'
  return '异常'
}

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

async function fetchEquipment() {
  loading.value = true
  try {
    const [eqRes, stRes] = await Promise.all([
      get<{ success: boolean; data: Equipment[] }>('/equipment'),
      get<{ success: boolean; data: Student[] }>('/students'),
    ])
    equipmentList.value = eqRes.data ?? []
    students.value = stRes.data ?? []
  } catch {
    equipmentList.value = []
    students.value = []
  } finally {
    loading.value = false
  }
}

async function fetchRentals() {
  try {
    const res = await get<{ success: boolean; data: Rental[] }>('/equipment/rentals')
    rentalList.value = res.data ?? []
  } catch {
    rentalList.value = []
  }
}

function switchTab(tab: 'equipment' | 'rentals') {
  activeTab.value = tab
  if (tab === 'equipment') fetchEquipment()
  else fetchRentals()
}

function openRentModal(item: Equipment) {
  selectedEquipment.value = item
  rentForm.value.studentId = ''
  showRentModal.value = true
}

function openReturnModal(item: Equipment) {
  selectedEquipment.value = item
  returnForm.value = { abnormal: false, abnormalType: 'wrong_person', actualReturner: '', note: '' }
  showReturnModal.value = true
}

async function submitRent() {
  if (!selectedEquipment.value || !rentForm.value.studentId) return
  try {
    await post('/equipment/rent', {
      equipmentId: selectedEquipment.value.id,
      studentId: rentForm.value.studentId,
    })
    showRentModal.value = false
    showToast('租赁成功')
    await fetchEquipment()
  } catch (e: any) {
    showToast(e.message || '租赁失败')
  }
}

async function submitReturn() {
  if (!selectedEquipment.value) return
  const rentalId = selectedEquipment.value.currentRentalId
  if (!rentalId) {
    showToast('未找到对应的租赁记录')
    return
  }
  const body: any = { rentalId }
  if (returnForm.value.abnormal) {
    body.abnormal = {
      type: returnForm.value.abnormalType,
      note: returnForm.value.note,
      ...(returnForm.value.abnormalType === 'wrong_person' ? { actualReturner: returnForm.value.actualReturner } : {}),
    }
  }
  try {
    await post('/equipment/return', body)
    showReturnModal.value = false
    showToast('归还成功')
    await fetchEquipment()
  } catch (e: any) {
    showToast(e.message || '归还失败')
  }
}

onMounted(fetchEquipment)
</script>

<template>
  <div class="space-y-4">
    <div v-if="toast" class="fixed top-4 right-4 z-50 bg-sky-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-[100]">
      {{ toast }}
    </div>

    <div class="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
      <button
        @click="switchTab('equipment')"
        :class="['px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5', activeTab === 'equipment' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-800']"
      >
        <Package class="w-4 h-4" />雪具列表
      </button>
      <button
        @click="switchTab('rentals')"
        :class="['px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5', activeTab === 'rentals' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-800']"
      >
        <List class="w-4 h-4" />租赁记录
      </button>
    </div>

    <div v-if="activeTab === 'equipment'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-slate-400" />
          <select v-model="filterStatus" class="input-field w-36">
            <option value="all">全部状态</option>
            <option value="available">空闲</option>
            <option value="rented">在租</option>
            <option value="maintenance">维护</option>
          </select>
        </div>
        <span class="text-sm text-slate-400">共 {{ filteredEquipment.length }} 件</span>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-slate-600">编号</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600">名称</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600">类型</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th class="text-left px-4 py-3 font-medium text-slate-600">关联学员</th>
              <th v-if="isRental" class="text-right px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredEquipment" :key="item.id" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3 font-mono">{{ item.code }}</td>
              <td class="px-4 py-3">
                <span class="flex items-center gap-1.5">
                  <span
                    v-if="item.abnormal"
                    class="inline-block w-2 h-2 rounded-full bg-orange-500 blink-warning"
                    :title="item.abnormal.type === 'wrong_person' ? '错拿' : '损坏'"
                  ></span>
                  {{ item.name }}
                </span>
              </td>
              <td class="px-4 py-3">{{ typeLabels[item.type] || item.type }}</td>
              <td class="px-4 py-3"><StatusBadge :status="item.status" type="equipment" /></td>
              <td class="px-4 py-3">{{ item.studentName || '-' }}</td>
              <td v-if="isRental" class="px-4 py-3 text-right space-x-2">
                <button v-if="item.status === 'available'" @click="openRentModal(item)" class="btn-primary text-xs px-3 py-1">
                  <Plus class="w-3 h-3 inline mr-1" />租赁
                </button>
                <button v-if="item.status === 'rented'" @click="openReturnModal(item)" class="btn-secondary text-xs px-3 py-1">
                  <RotateCcw class="w-3 h-3 inline mr-1" />归还
                </button>
              </td>
            </tr>
            <tr v-if="filteredEquipment.length === 0">
              <td :colspan="isRental ? 6 : 5" class="px-4 py-8 text-center text-slate-400">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'rentals'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-slate-400" />
          <select v-model="filterRentalStatus" class="input-field w-36">
            <option value="all">全部</option>
            <option value="active">在租</option>
            <option value="returned">已归还</option>
          </select>
        </div>
        <span class="text-sm text-slate-400">共 {{ filteredRentals.length }} 条</span>
      </div>

      <div class="space-y-3">
        <div
          v-for="r in filteredRentals"
          :key="r.id"
          :class="['card p-5', r.abnormal ? 'border-l-4 border-l-orange-400' : '']"
        >
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-medium flex items-center gap-2">
                {{ r.equipmentCode || r.equipmentId }}
                <span v-if="r.equipmentName" class="text-slate-500 font-normal">· {{ r.equipmentName }}</span>
                <AlertTriangle v-if="r.abnormal" class="w-4 h-4 text-orange-500" />
              </div>
              <div class="text-sm text-slate-500">{{ r.studentName || '-' }}</div>
            </div>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', rentalStatusColor(r.status)]">
              {{ rentalStatusLabel(r.status) }}
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-slate-500">
            <span>租赁时间: {{ new Date(r.rentedAt).toLocaleString('zh-CN') }}</span>
            <span v-if="r.returnedAt">归还时间: {{ new Date(r.returnedAt).toLocaleString('zh-CN') }}</span>
          </div>
          <div v-if="r.abnormal" class="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700 flex items-center gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5" />
            <span>异常: {{ r.abnormal.type === 'wrong_person' ? '错拿' : '损坏' }}</span>
            <span v-if="r.abnormal.actualReturner">· 实际归还人: {{ r.abnormal.actualReturner }}</span>
            <span v-if="r.abnormal.note">· {{ r.abnormal.note }}</span>
          </div>
        </div>
        <div v-if="filteredRentals.length === 0" class="text-center py-8 text-slate-400 text-sm">
          暂无租赁记录
        </div>
      </div>
    </div>

    <div v-if="showRentModal" class="modal-overlay" @click.self="showRentModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold mb-4">租赁雪具 - {{ selectedEquipment?.code }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">选择学员</label>
            <select v-model="rentForm.studentId" class="input-field">
              <option value="">请选择学员</option>
              <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}（{{ s.level }}）</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showRentModal = false" class="btn-secondary">取消</button>
          <button @click="submitRent" :disabled="!rentForm.studentId" class="btn-primary">确认租赁</button>
        </div>
      </div>
    </div>

    <div v-if="showReturnModal" class="modal-overlay" @click.self="showReturnModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold mb-4">归还雪具 - {{ selectedEquipment?.code }}</h3>
        <div class="space-y-4">
          <div v-if="selectedEquipment?.studentName" class="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            当前租赁人：{{ selectedEquipment.studentName }}
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="returnForm.abnormal" class="rounded border-slate-300" />
            <span class="text-sm font-medium text-slate-700">标记异常</span>
          </label>
          <template v-if="returnForm.abnormal">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">异常类型</label>
              <select v-model="returnForm.abnormalType" class="input-field">
                <option value="wrong_person">错拿</option>
                <option value="damaged">损坏</option>
              </select>
            </div>
            <div v-if="returnForm.abnormalType === 'wrong_person'">
              <label class="block text-sm font-medium text-slate-700 mb-1">实际归还人</label>
              <input v-model="returnForm.actualReturner" class="input-field" placeholder="请输入实际归还人姓名" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
              <textarea v-model="returnForm.note" class="input-field" rows="3" placeholder="请描述异常情况" />
            </div>
          </template>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showReturnModal = false" class="btn-secondary">取消</button>
          <button @click="submitReturn" class="btn-primary">确认归还</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes blink-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
.blink-warning {
  animation: blink-warning 1.2s ease-in-out infinite;
}
</style>
