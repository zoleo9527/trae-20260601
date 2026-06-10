<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">提交年检资料</h2>
        <p class="text-sm text-neutral-500 mt-1">按TSG T7001标准逐项检测，不合格项必须填写判断依据和现场证据</p>
      </div>
      <button type="button" class="btn-secondary text-xs" @click="goBack">
        <AppIcon name="IconChevronRight" class="w-4 h-4 mr-1 rotate-180" />
        返回列表
      </button>
    </div>

    <div class="card p-6 space-y-4">
      <h3 class="text-sm font-semibold text-neutral-800 border-b border-neutral-200 pb-3">基本信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="label-base">电梯名称</label>
          <select v-model="form.elevatorName" class="input-base">
            <option value="1号楼A座-1号梯">1号楼A座-1号梯 · ELV-GX001</option>
            <option value="1号楼A座-2号梯">1号楼A座-2号梯 · ELV-GX002</option>
            <option value="2号楼-1号梯">2号楼-1号梯 · ELV-GX003</option>
            <option value="2号楼B座-1号梯">2号楼B座-1号梯 · ELV-GX004</option>
          </select>
        </div>
        <div>
          <label class="label-base">检测日期</label>
          <input v-model="form.inspectionDate" type="date" class="input-base" />
        </div>
        <div>
          <label class="label-base">检测人</label>
          <input class="input-base" :value="appStore.currentUser.name" readonly />
        </div>
        <div>
          <label class="label-base">检测类型</label>
          <select v-model="form.inspectionType" class="input-base">
            <option value="年度定期检验">年度定期检验</option>
            <option value="季度维保自检">季度维保自检</option>
            <option value="专项检测">专项检测</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label-base">详细地址</label>
        <input v-model="form.location" class="input-base" />
      </div>
    </div>

    <div class="card p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h3 class="text-sm font-semibold text-neutral-800">逐项检测（共 {{ inspectionCriteria.length }} 项）</h3>
        <div class="flex items-center gap-4 text-xs">
          <span class="flex items-center gap-1 text-success-600">
            <span class="w-2 h-2 rounded-full bg-success-500"></span> 通过 {{ passCount }}
          </span>
          <span class="flex items-center gap-1 text-danger-600">
            <span class="w-2 h-2 rounded-full bg-danger-500"></span> 不合格 {{ failCount }}
          </span>
        </div>
      </div>

      <div v-for="group in criteriaByCategory" :key="group.category" class="space-y-3">
        <div class="bg-neutral-50 -mx-6 px-6 py-2 text-xs font-semibold text-neutral-700 border-y border-neutral-200">
          {{ group.category }} · 共 {{ group.items.length }} 项
        </div>
        <div class="space-y-3">
          <div
            v-for="item in group.items"
            :key="item.id"
            class="rounded-lg border border-neutral-200 p-4 space-y-3 hover:border-primary-200 hover:bg-primary-50 transition-all"
          >
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono text-neutral-500">{{ item.code }}</span>
                  <span class="text-sm font-medium text-neutral-800">{{ item.name }}</span>
                  <span v-if="item.isRequired" class="text-[10px] px-1.5 py-0.5 rounded bg-danger-50 text-danger-700">必检</span>
                </div>
                <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div class="rounded-md bg-white p-2 border border-neutral-200">
                    <span class="font-semibold text-neutral-500">📋 标准依据：</span>{{ item.standard }}
                  </div>
                  <div class="rounded-md bg-white p-2 border border-neutral-200">
                    <span class="font-semibold text-neutral-500">🔍 检测方法：</span>{{ item.method }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1 p-1 rounded-lg border border-neutral-200 bg-white">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  :class="getItemResult(item.id) === 'pass' ? 'bg-success-500 text-white' : 'text-neutral-500 hover:text-success-700 hover:bg-success-50'"
                  @click="setResult(item.id, 'pass')"
                >✓ 通过</button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  :class="getItemResult(item.id) === 'fail' ? 'bg-danger-500 text-white' : 'text-neutral-500 hover:text-danger-700 hover:bg-danger-50'"
                  @click="setResult(item.id, 'fail')"
                >✗ 不合格</button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  :class="getItemResult(item.id) === 'na' ? 'bg-neutral-500 text-white' : 'text-neutral-500 hover:bg-neutral-100'"
                  @click="setResult(item.id, 'na')"
                  title="不适用"
                >--</button>
              </div>
            </div>
            <div v-if="getItemResult(item.id) === 'fail'" class="pt-3 border-t border-danger-200 bg-danger-50 -mx-4 px-4 pb-3 space-y-2">
              <div class="text-[11px] font-bold text-danger-700">⚠️ 请填写不合格原因（为什么不合格）</div>
              <div>
                <label class="label-base text-[11px]">现场证据 / 实测数据</label>
                <textarea
                  class="input-base text-xs"
                  rows="2"
                  placeholder="例：实测机房温度43.2℃，超过40℃标准限值"
                  v-model="failNotes[item.id]"
                ></textarea>
              </div>
              <div>
                <label class="label-base text-[11px]">违反规范条款 / 判断依据说明</label>
                <input
                  v-model="failViolations[item.id]"
                  type="text"
                  class="input-base text-xs"
                  placeholder="例：违反TSG T7001-2009第X.X项"
                />
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="btn-secondary text-xs py-1.5">
                  <AppIcon name="IconUpload" class="w-3.5 h-3.5 mr-1" />
                  上传现场照片
                </button>
                <span class="text-[11px] text-neutral-500">支持 jpg/png，最多9张</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6 space-y-4">
      <h3 class="text-sm font-semibold text-neutral-800 border-b border-neutral-200 pb-3">年检结论</h3>
      <div>
        <label class="label-base">综合结论</label>
        <textarea v-model="form.conclusion" class="input-base text-xs" rows="3" :placeholder="conclusionPlaceholder"></textarea>
      </div>
      <div v-if="failCount > 0">
        <label class="label-base">建议整改期限</label>
        <input v-model="form.deadline" type="date" class="input-base" />
      </div>
      <div>
        <label class="label-base">附件（签字确认）</label>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex-1 rounded-lg border-2 border-dashed border-neutral-300 p-6 text-center text-neutral-400 cursor-pointer hover:border-primary-400 hover:bg-primary-50">
            <AppIcon name="IconUpload" class="w-6 h-6 mx-auto mb-1" />
            <span>点击上传签字扫描件</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-3 pt-2">
      <button type="button" class="btn-secondary text-xs" @click="goBack">取消</button>
      <button type="button" class="btn-primary text-xs" @click="submitInspection" :disabled="submitting">
        <AppIcon v-if="!submitting" name="IconCheck" class="w-4 h-4 mr-1.5" />
        <AppIcon v-else name="IconLoader" class="w-4 h-4 mr-1.5 animate-spin" />
        {{ submitting ? '提交中...' : '提交审核' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { inspectionCriteria } from '~/data/mockData'
import type { InspectionRecord, InspectionItemResult, Alert } from '~/types'

const router = useRouter()
const appStore = useAppStore()

const submitting = ref(false)

const today = new Date().toISOString().split('T')[0]
const defaultDeadline = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  return d.toISOString().split('T')[0]
})()

const form = reactive({
  elevatorName: '1号楼A座-1号梯',
  elevatorId: 'ELV-GX001',
  location: '高新区科技园区A座1号楼',
  inspectionDate: today,
  inspectionType: '年度定期检验',
  conclusion: '',
  deadline: defaultDeadline
})

type ItemResult = Record<string, 'pass' | 'fail' | 'na' | ''>
const results = ref<ItemResult>({})
const failNotes = ref<Record<string, string>>({})
const failViolations = ref<Record<string, string>>({})

function setResult(id: string, r: 'pass' | 'fail' | 'na' | '') {
  results.value[id] = r
}
function getItemResult(id: string) {
  return results.value[id] || ''
}

const criteriaByCategory = computed(() => {
  const m = new Map<string, any[]>()
  inspectionCriteria.forEach(c => {
    if (!m.has(c.category)) m.set(c.category, [])
    m.get(c.category)!.push(c)
  })
  return Array.from(m.entries()).map(([category, items]) => ({ category, items }))
})

const passCount = computed(() => Object.values(results.value).filter(r => r === 'pass').length)
const failCount = computed(() => Object.values(results.value).filter(r => r === 'fail').length)

const conclusionPlaceholder = computed(() => {
  return failCount.value > 0
    ? `本次年检发现${failCount.value}项不合格，建议在整改期限内完成整改并申请复查。`
    : '本次年检全部项目合格，通过年检。'
})

function getElevatorIdByName(name: string) {
  const map: Record<string, string> = {
    '1号楼A座-1号梯': 'ELV-GX001',
    '1号楼A座-2号梯': 'ELV-GX002',
    '2号楼-1号梯': 'ELV-GX003',
    '2号楼B座-1号梯': 'ELV-GX004'
  }
  return map[name] || 'ELV-GX001'
}

function generateInspectionId() {
  const count = appStore.inspections.length + 1
  const num = String(count).padStart(4, '0')
  return `INSP-2026-${num}`
}

async function submitInspection() {
  const answeredCount = Object.values(results.value).filter(r => r).length
  if (answeredCount < inspectionCriteria.length) {
    alert(`还有 ${inspectionCriteria.length - answeredCount} 项未填写检测结果，请完成所有检测项后提交。`)
    return
  }

  submitting.value = true

  const failItems: string[] = []
  const failReasons: string[] = []
  const items: InspectionItemResult[] = inspectionCriteria.map(c => {
    const r = results.value[c.id] || 'pass'
    const note = failNotes.value[c.id]
    const violation = failViolations.value[c.id]
    if (r === 'fail') {
      failItems.push(`${c.code} ${c.name}`)
      if (violation) {
        failReasons.push(violation)
      } else if (note) {
        failReasons.push(note)
      } else {
        failReasons.push(`${c.name}检测不合格`)
      }
    }
    const item: InspectionItemResult = {
      criterionId: c.id,
      result: r as 'pass' | 'fail' | 'na'
    }
    if (note) item.note = note
    if (note) item.evidence = note
    return item
  })

  const newId = generateInspectionId()
  const hasFailed = failItems.length > 0
  const status = hasFailed ? 'under_review' : 'under_review'

  const newRecord: InspectionRecord = {
    id: newId,
    elevatorId: getElevatorIdByName(form.elevatorName),
    elevatorName: form.elevatorName,
    location: form.location,
    inspectionDate: form.inspectionDate,
    inspector: appStore.currentUser.name,
    status: status,
    items: items,
    failItems: failItems,
    failReasons: failReasons,
    conclusion: form.conclusion || conclusionPlaceholder.value,
    rectificationDeadline: hasFailed ? form.deadline : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await new Promise(resolve => setTimeout(resolve, 500))

  appStore.addInspection(newRecord)

  const newAlert: Alert = {
    id: `al${Date.now()}`,
    type: hasFailed ? 'non_compliant' : 'system',
    title: hasFailed ? `年检不合格：${failItems.length}项问题` : '年检资料待审核',
    message: `${form.elevatorName}年检资料已提交，${hasFailed ? `发现${failItems.length}项不合格` : '全部合格'}，请主管及时审核。`,
    description: `${appStore.currentUser.name}已提交${form.elevatorName}的年检资料（${newId}），${hasFailed ? `不合格项：${failItems.join('、')}` : '共15项全部合格'}，请王主管审核确认。`,
    relatedId: newId,
    relatedType: 'inspection',
    linkId: newId,
    linkType: 'inspection',
    priority: hasFailed ? 'high' : 'medium',
    isRead: false,
    createdAt: new Date().toISOString(),
    meta: {
      elevator: form.elevatorName,
      relatedId: newId
    }
  }
  appStore.addAlert(newAlert)

  submitting.value = false

  alert(`年检资料已提交！编号：${newId}\n状态：待主管审核。`)
  router.push('/inspection')
}

function goBack() {
  router.back()
}
</script>
