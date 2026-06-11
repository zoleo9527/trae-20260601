<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDataStore } from '@/stores/data'
import {
  ArrowLeft, Plus, Trash2, Save, Send, FileText, Building2, Users,
  User, Calendar, AlertTriangle, Camera, Upload, X, Check
} from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiInput from '@/components/ui/UiInput.vue'
import type { RequisitionItem, RequisitionTag, CableType, Shortage } from '@shared/types'

const router = useRouter()
const route = useRoute()
const store = useDataStore()

interface FormItem {
  id: string
  cableId: string
  designQty: number
  quantity: number
}

const form = reactive({
  projectId: '',
  teamId: '',
  applicant: '',
  applyDate: new Date().toISOString().slice(0, 10),
  type: 'normal' as 'normal' | 'supplement',
  relatedShortageId: '',
  remark: '',
  photos: [] as string[]
})

const items = ref<FormItem[]>([
  { id: crypto.randomUUID(), cableId: '', designQty: 0, quantity: 0 }
])

const submitting = ref(false)

function genItem(): FormItem {
  return { id: crypto.randomUUID(), cableId: '', designQty: 0, quantity: 0 }
}

function addItem() {
  items.value.push(genItem())
}

function removeItem(id: string) {
  if (items.value.length <= 1) return
  const idx = items.value.findIndex(i => i.id === id)
  if (idx >= 0) items.value.splice(idx, 1)
}

function getCable(id: string): CableType | undefined {
  return store.cables.find(c => c.id === id)
}

function getUnit(cableId: string): string {
  const c = getCable(cableId)
  if (!c) return ''
  return c.name.includes('米') ? '米' : '卷'
}

function isOverItem(item: FormItem): boolean {
  if (item.designQty <= 0) return false
  return item.quantity > item.designQty * 1.1
}

function diffItem(item: FormItem): number {
  return item.quantity - item.designQty
}

function overPercent(item: FormItem): number {
  if (item.designQty <= 0) return 0
  return Math.round(((item.quantity - item.designQty) / item.designQty) * 100)
}

const hasOverItem = computed(() => items.value.some(i => isOverItem(i)))

const totalsByCable = computed(() => {
  const map = new Map<string, { model: string; qty: number; unit: string }>()
  items.value.forEach(it => {
    if (!it.cableId) return
    const cable = getCable(it.cableId)
    if (!cable) return
    const existing = map.get(it.cableId)
    if (existing) {
      existing.qty += it.quantity
    } else {
      map.set(it.cableId, {
        model: cable.model,
        qty: it.quantity,
        unit: getUnit(it.cableId)
      })
    }
  })
  return Array.from(map.values())
})

const cableOptions = computed(() => {
  return store.cables.map(c => ({
    value: c.id,
    label: `${c.model} - ${c.name} - 库存${c.stock}${c.name.includes('米') ? '米' : '卷'}`
  }))
})

const projectOptions = computed(() =>
  store.projects.map(p => ({ value: p.id, label: p.name }))
)

const teamOptions = computed(() =>
  store.teams.map(t => ({ value: t.id, label: t.name }))
)

const shortageOptions = computed(() => {
  const list = store.shortages.filter(s => s.status !== 'closed')
  return [
    { value: '', label: '请选择关联缺料单' },
    ...list.map(s => ({
      value: s.id,
      label: `${s.code} - ${s.cableModel} - 缺${s.shortageQty}${store.cables.find(c => c.id === s.cableId)?.name.includes('米') ? '米' : '卷'}`
    }))
  ]
})

function handleShortageSelect(val: string | number) {
  form.relatedShortageId = String(val)
  if (form.relatedShortageId) {
    const s = store.shortages.find(x => x.id === form.relatedShortageId)
    if (s) {
      items.value = [{
        id: crypto.randomUUID(),
        cableId: s.cableId,
        designQty: 0,
        quantity: s.shortageQty
      }]
      if (!form.projectId) form.projectId = s.projectId
    }
  }
}

function handleCableSelect(itemId: string, val: string | number) {
  const item = items.value.find(i => i.id === itemId)
  if (!item) return
  item.cableId = String(val)
  const c = getCable(item.cableId)
  if (c && c.designQty && item.designQty === 0) {
    item.designQty = c.designQty
  }
}

const canSubmit = computed(() => {
  if (!form.projectId || !form.teamId || !form.applicant) return false
  if (form.type === 'supplement' && !form.relatedShortageId) return false
  if (items.value.length === 0) return false
  return items.value.every(it => it.cableId && it.quantity > 0)
})

function buildTags(): RequisitionTag[] {
  const tags: RequisitionTag[] = []
  if (form.type === 'supplement') {
    tags.push('supplement')
  }
  if (hasOverItem.value) {
    tags.push('over')
  }
  if (!tags.length) tags.push('normal')
  return tags
}

function buildItems(): RequisitionItem[] {
  return items.value
    .filter(it => it.cableId && it.quantity > 0)
    .map(it => {
      const c = getCable(it.cableId)!
      return {
        cableId: it.cableId,
        cableModel: c.model,
        cableName: c.name,
        quantity: it.quantity,
        designQty: it.designQty,
        overFlag: isOverItem(it)
      }
    })
}

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div')
  el.className = `fixed top-6 right-6 z-[9999] px-5 py-3 rounded-[4px] shadow-lg text-sm font-medium flex items-center gap-2 fade-slide ${
    type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white'
  }`
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><${type === 'success' ? 'polyline points="20 6 9 17 4 12"' : 'line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"'}/></svg><span>${msg}</span>`
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.3s'
    setTimeout(() => el.remove(), 300)
  }, 2400)
}

async function submitForm(isDraft: boolean) {
  if (!isDraft && !canSubmit.value) {
    showToast('请完整填写必填项', 'error')
    return
  }
  submitting.value = true
  try {
    const payload: any = {
      projectId: form.projectId,
      teamId: form.teamId,
      applicant: form.applicant,
      applyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      items: buildItems(),
      status: isDraft ? 'pending' : 'pending',
      tags: buildTags(),
      remark: form.remark,
      photos: form.photos
    }
    if (form.type === 'supplement' && form.relatedShortageId) {
      payload.relatedId = form.relatedShortageId
    }
    const code = `LL-${form.applyDate.replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`
    payload.code = code

    await store.createRequisition(payload)
    showToast(isDraft ? '草稿已保存' : '领料单已提交，等待审批')
    setTimeout(() => router.push('/requisitions'), 600)
  } catch (e) {
    showToast('操作失败，请重试', 'error')
  } finally {
    submitting.value = false
  }
}

function handlePhotoUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  Array.from(input.files).forEach(f => {
    const reader = new FileReader()
    reader.onload = () => {
      form.photos.push(reader.result as string)
    }
    reader.readAsDataURL(f)
  })
  input.value = ''
}

function removePhoto(idx: number) {
  form.photos.splice(idx, 1)
}

async function initFromRoute() {
  if (store.cables.length === 0) {
    await store.loadAll()
  }
  const shortageId = route.query.shortageId as string
  const projectId = route.query.projectId as string
  if (projectId) {
    form.projectId = projectId
  }
  if (shortageId) {
    const s = store.shortages.find(x => x.id === shortageId)
    if (s) {
      form.type = 'supplement'
      form.relatedShortageId = shortageId
      if (!form.projectId) form.projectId = s.projectId
      items.value = [{
        id: crypto.randomUUID(),
        cableId: s.cableId,
        designQty: 0,
        quantity: s.shortageQty
      }]
      if (!form.applicant) form.applicant = s.reporter
      if (!form.remark) form.remark = `【补领】关联缺料单 ${s.code}，${s.remark || ''}`
    }
  }
}

onMounted(() => {
  initFromRoute()
})

watch(() => route.query, () => {
  initFromRoute()
}, { deep: true })
</script>

<template>
  <div class="p-6 space-y-5 fade-slide max-w-6xl mx-auto">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-[4px] transition-colors"
          @click="router.push('/requisitions')"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 font-serif-sc flex items-center gap-2.5">
            <FileText class="w-7 h-7 text-[#1E40AF]" />
            新建领料单
          </h1>
          <p class="text-sm text-gray-500 mt-1 ml-9.5">填写领料明细信息，提交审批后仓库安排发料</p>
        </div>
      </div>
    </div>

    <form @submit.prevent class="space-y-5">
      <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative">
        <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
          <Building2 class="w-4 h-4 text-[#1E40AF]" />
          基础信息
        </legend>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <UiInput
            v-model="form.projectId"
            type="select"
            label="所属项目"
            placeholder="请选择项目"
            :options="projectOptions"
            required
          />
          <UiInput
            v-model="form.teamId"
            type="select"
            label="施工班组"
            placeholder="请选择班组"
            :options="teamOptions"
            required
          />
          <UiInput
            v-model="form.applicant"
            type="text"
            label="申请人"
            placeholder="请输入申请人姓名"
            :icon-left="User"
            required
          >
            <template #label>
              <span class="flex items-center gap-1.5">
                <User class="w-3.5 h-3.5 text-gray-400" />
                申请人<span class="text-red-500">*</span>
              </span>
            </template>
          </UiInput>
          <UiInput
            v-model="form.applyDate"
            type="text"
            label="申请日期"
          >
            <template #label>
              <span class="flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-gray-400" />
                申请日期
              </span>
            </template>
          </UiInput>
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">领料类型</label>
            <div class="flex gap-3">
              <label
                class="flex-1 flex items-center gap-3 p-3 border-2 rounded-[4px] cursor-pointer transition-all"
                :class="form.type === 'normal'
                  ? 'border-[#1E40AF] bg-blue-50/50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'"
              >
                <input
                  type="radio"
                  v-model="form.type"
                  value="normal"
                  class="sr-only"
                />
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  :class="form.type === 'normal' ? 'border-[#1E40AF]' : 'border-gray-300'"
                >
                  <div v-if="form.type === 'normal'" class="w-2.5 h-2.5 rounded-full bg-[#1E40AF]" />
                </div>
                <div>
                  <div class="font-medium text-gray-800 text-sm">正常领料</div>
                  <div class="text-xs text-gray-500">按施工计划正常申请领用</div>
                </div>
              </label>
              <label
                class="flex-1 flex items-center gap-3 p-3 border-2 rounded-[4px] cursor-pointer transition-all"
                :class="form.type === 'supplement'
                  ? 'border-orange-500 bg-orange-50/50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'"
              >
                <input
                  type="radio"
                  v-model="form.type"
                  value="supplement"
                  class="sr-only"
                />
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  :class="form.type === 'supplement' ? 'border-orange-500' : 'border-gray-300'"
                >
                  <div v-if="form.type === 'supplement'" class="w-2.5 h-2.5 rounded-full bg-orange-500" />
                </div>
                <div>
                  <div class="font-medium text-gray-800 text-sm flex items-center gap-1.5">
                    补领领料
                    <UiBadge variant="orange" size="sm">关联缺料</UiBadge>
                  </div>
                  <div class="text-xs text-gray-500">针对已上报的缺料单进行补充领料</div>
                </div>
              </label>
            </div>
          </div>
          <UiInput
            v-if="form.type === 'supplement'"
            :model-value="form.relatedShortageId"
            type="select"
            label="关联缺料单"
            :options="shortageOptions"
            required
            @update:model-value="handleShortageSelect"
          />
        </div>
      </fieldset>

      <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative">
        <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
          <Users class="w-4 h-4 text-[#1E40AF]" />
          线缆明细
          <span class="text-xs text-gray-400 font-normal ml-1">（超过设计用量110%将标记超领）</span>
        </legend>

        <div v-if="hasOverItem" class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-[4px] flex items-start gap-2.5">
          <AlertTriangle class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div class="text-sm text-orange-700">
            <span class="font-semibold">检测到超领申请</span>
            <span class="ml-1">系统将自动为该单添加「超领」标签，审批时需重点关注用量合理性。</span>
          </div>
        </div>

        <div class="w-full overflow-x-auto rounded-[4px] border border-gray-200">
          <table class="w-full min-w-[800px] text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-14">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">线缆型号</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">设计用量</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">申请数量</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">单位</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">差额</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">超领标记</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr
                v-for="(it, idx) in items"
                :key="it.id"
                class="transition-colors"
                :class="isOverItem(it) ? 'bg-orange-50/60' : ''"
              >
                <td class="px-4 py-3 text-gray-500 font-mono-num text-center">{{ idx + 1 }}</td>
                <td class="px-4 py-3">
                  <div class="relative">
                    <select
                      :value="it.cableId"
                      class="w-full px-3 py-2 text-sm bg-white border border-[#D4D4D8] rounded-[4px] text-gray-900 transition-all focus:outline-none focus:border-[#1E40AF] focus:shadow-[0_0_0_3px_rgba(30,64,175,0.15)] appearance-none pr-10 cursor-pointer"
                      @change="(e) => handleCableSelect(it.id, (e.target as HTMLSelectElement).value)"
                    >
                      <option value="" disabled>请选择线缆型号</option>
                      <option
                        v-for="opt in cableOptions"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    :value="it.designQty"
                    min="0"
                    class="w-full px-3 py-2 text-sm bg-white border border-[#D4D4D8] rounded-[4px] text-gray-900 text-right transition-all focus:outline-none focus:border-[#1E40AF] focus:shadow-[0_0_0_3px_rgba(30,64,175,0.15)]"
                    @input="(e) => it.designQty = Number((e.target as HTMLInputElement).value)"
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    :value="it.quantity"
                    min="0"
                    class="w-full px-3 py-2 text-sm bg-white border rounded-[4px] text-gray-900 text-right transition-all focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,64,175,0.15)] font-medium"
                    :class="isOverItem(it)
                      ? 'border-orange-400 text-orange-600 focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(234,88,12,0.15)] bg-orange-50'
                      : 'border-[#D4D4D8] focus:border-[#1E40AF]'"
                    @input="(e) => it.quantity = Number((e.target as HTMLInputElement).value)"
                  />
                </td>
                <td class="px-4 py-3 text-center text-gray-600 font-medium">
                  {{ getUnit(it.cableId) || '—' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <span
                    class="font-mono-num font-medium"
                    :class="{
                      'text-orange-600': diffItem(it) > 0,
                      'text-gray-600': diffItem(it) <= 0
                    }"
                  >
                    {{ diffItem(it) > 0 ? '+' : '' }}{{ diffItem(it) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <template v-if="isOverItem(it)">
                    <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 rounded-[4px]">
                      <AlertTriangle class="w-3 h-3" />
                      超{{ overPercent(it) }}%
                    </span>
                  </template>
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    type="button"
                    class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[4px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="items.length <= 1"
                    @click="removeItem(it.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider" colspan="2">
                  合计
                </td>
                <td class="px-4 py-3 text-right text-xs font-semibold text-gray-500" colspan="6">
                  <div class="flex flex-wrap gap-2 justify-end">
                    <span
                      v-for="(t, i) in totalsByCable"
                      :key="i"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-[4px] text-xs"
                    >
                      <span class="font-mono-num text-gray-700">{{ t.model }}</span>
                      <span class="text-gray-400">×</span>
                      <span class="font-semibold text-[#1E40AF]">{{ t.qty }}{{ t.unit }}</span>
                    </span>
                    <span v-if="totalsByCable.length === 0" class="text-gray-400 italic">待填写明细</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="mt-4">
          <UiButton variant="secondary" size="sm" type="button" @click="addItem">
            <template #icon><Plus class="w-4 h-4" /></template>
            添加一行
          </UiButton>
        </div>
      </fieldset>

      <fieldset class="border-2 border-gray-300 rounded-[6px] p-5 bg-white relative">
        <legend class="px-3 text-sm font-semibold text-gray-700 bg-[#FAFAFA] mx-1 flex items-center gap-1.5">
          <FileText class="w-4 h-4 text-[#1E40AF]" />
          备注说明
        </legend>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <UiInput
            v-model="form.remark"
            type="textarea"
            label="备注说明"
            placeholder="请填写本次领料的施工用途、区域说明、特殊要求等（选填）"
            :rows="5"
          />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Camera class="w-3.5 h-3.5 text-gray-400" />
              照片上传
              <span class="text-xs text-gray-400 font-normal">（可选，多张）</span>
            </label>
            <div class="grid grid-cols-4 gap-2.5">
              <label
                v-for="(photo, idx) in form.photos"
                :key="idx"
                class="relative aspect-square rounded-[4px] overflow-hidden border border-gray-200 bg-gray-50 group cursor-pointer"
              >
                <img :src="photo" alt="" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  @click="removePhoto(idx)"
                >
                  <X class="w-3 h-3" />
                </button>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="text-[10px] text-white">照片 {{ idx + 1 }}</span>
                </div>
              </label>
              <label
                v-if="form.photos.length < 8"
                class="aspect-square rounded-[4px] border-2 border-dashed border-gray-300 hover:border-[#1E40AF] hover:bg-blue-50/50 bg-gray-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Upload class="w-6 h-6 text-gray-400" />
                <span class="text-xs text-gray-500">上传照片</span>
                <input type="file" accept="image/*" multiple class="hidden" @change="handlePhotoUpload" />
              </label>
            </div>
            <p class="text-xs text-gray-400 mt-2">支持 JPG/PNG 格式，最多8张</p>
          </div>
        </div>
      </fieldset>

      <div class="sticky bottom-0 -mx-6 px-6 py-4 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent pt-8">
        <div class="flex items-center justify-between max-w-6xl mx-auto">
          <div class="flex items-center gap-3 text-sm">
            <div v-if="hasOverItem" class="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-[4px] font-medium">
              <AlertTriangle class="w-4 h-4" />
              含超领申请
            </div>
            <div v-if="form.type === 'supplement'" class="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-[4px] font-medium">
              补领领料
            </div>
            <span v-if="!canSubmit" class="text-xs text-gray-400 italic">
              请完成必填项后再提交
            </span>
          </div>
          <div class="flex items-center gap-3">
            <UiButton
              variant="secondary"
              size="lg"
              type="button"
              :loading="submitting"
              @click="router.push('/requisitions')"
            >
              取消
            </UiButton>
            <UiButton
              variant="secondary"
              size="lg"
              type="button"
              :loading="submitting"
              @click="submitForm(true)"
            >
              <template #icon><Save class="w-4 h-4" /></template>
              保存草稿
            </UiButton>
            <UiButton
              variant="primary"
              size="lg"
              type="button"
              :loading="submitting"
              :disabled="!canSubmit"
              @click="submitForm(false)"
            >
              <template #icon><Send class="w-4 h-4" /></template>
              提交审批
            </UiButton>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
