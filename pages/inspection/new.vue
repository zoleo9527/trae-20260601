<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">提交年检资料</h2>
        <p class="text-sm text-neutral-500 mt-1">按TSG T7001标准逐项检测，不合格项必须填写判断依据和现场证据</p>
      </div>
      <button class="btn-secondary text-xs" @click="router.back()">
        <AppIcon name="IconChevronRight" class="w-4 h-4 mr-1 rotate-180" />
        返回列表
      </button>
    </div>

    <div class="card p-6 space-y-4">
      <h3 class="text-sm font-semibold text-neutral-800 border-b border-neutral-200 pb-3">基本信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="label-base">电梯名称</label>
          <select class="input-base">
            <option>1号楼A座-1号梯 · ELV-GX001</option>
            <option>1号楼A座-2号梯 · ELV-GX002</option>
            <option>2号楼-1号梯 · ELV-GX003</option>
          </select>
        </div>
        <div>
          <label class="label-base">检测日期</label>
          <input type="date" class="input-base" :value="today" />
        </div>
        <div>
          <label class="label-base">检测人</label>
          <input class="input-base" value="张师傅" readonly />
        </div>
        <div>
          <label class="label-base">检测类型</label>
          <select class="input-base">
            <option>年度定期检验</option>
            <option>季度维保自检</option>
            <option>专项检测</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label-base">详细地址</label>
        <input class="input-base" value="高新区科技园区A座1号楼" readonly />
      </div>
    </div>

    <div class="card p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h3 class="text-sm font-semibold text-neutral-800">逐项检测（共 {{ inspectionCriteria.length }} 项</h3>
        <div class="flex items-center gap-4 text-xs">
          <span class="flex items-center gap-1 text-success-600">
            <span class="w-2 h-2 rounded-full bg-success-500"></span> 通过 {{ passCount }}
          </span>
          <span class="flex items-center gap-1 text-danger-600">
            <span class="w-2 h-2 rounded-full bg-danger-500"></span> 不合格 {{ failCount }}
          </span>
        </div>
      </div>

      <div v-for="(c in groupedCriteria" :key="c.category" class="space-y-3">
        <div class="bg-neutral-50 -mx-6 px-6 py-2 text-xs font-semibold text-neutral-700 border-y border-neutral-200">
          {{ c.category }} · 共 {{ c.items.length }} 项
        </div>
        <div class="space-y-3">
          <div v-for="(item, idx) in c.items" :key="item.id" class="rounded-lg border border-neutral-200 p-4 space-y-3 hover:border-primary-200 hover:bg-primary-50 transition-all">
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
                title="不适用"></button>
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
                  v-model="getFailNote(item.id)"
                ></textarea>
              </div>
              <div>
                <label class="label-base text-[11px]">违反规范条款 / 判断依据说明</label>
                <input
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
    </div>

    <div class="card p-6 space-y-4">
      <h3 class="text-sm font-semibold text-neutral-800 border-b border-neutral-200 pb-3">年检结论</h3>
      <div>
        <label class="label-base">综合结论</label>
        <textarea class="input-base text-xs" rows="3" placeholder="请描述整体情况和建议"
          {{ failCount > 0
            ? `本次年检发现${failCount}项不合格，建议在整改期限内完成整改并申请复查。`
            : ''}"></textarea>
      </div>
      <div v-if="failCount > 0">
        <label class="label-base">建议整改期限</label>
        <input type="date" class="input-base" :value="defaultDeadline" />
      </div>
      <div>
        <label class="label-base">附件（签字确认</label>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex-1 rounded-lg border-2 border-dashed border-neutral-300 p-6 text-center text-neutral-400 cursor-pointer hover:border-primary-400 hover:bg-primary-50">
            <AppIcon name="IconUpload" class="w-6 h-6 mx-auto mb-1" />
            <span>点击上传签字扫描件
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-3 pt-2">
      <button class="btn-secondary text-xs">保存草稿</button>
      <button class="btn-primary text-xs" @click="submitInspection">
        <AppIcon name="IconCheck" class="w-4 h-4 mr-1.5" />
        提交审核
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { inspectionCriteria } from '~/data/mockData'

const router = useRouter()
const appStore = useAppStore()

const today = new Date().toISOString().split('T')[0]
const defaultDeadline = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  return d.toISOString().split('T')[0]
})()

type ItemResult = Record<string, 'pass' | 'fail' | 'na' | ''
const results = ref<ItemResult>({})
const failNotes = ref<Record<string, string>>({})

function setResult(id: string, r: 'pass' | 'fail' | 'na' | '') {
  results.value[id] = r
}
function getItemResult(id: string) {
  return results.value[id] || ''
}
function getFailNote(id: string) {
  return {
    get value() { return failNotes.value[id] || '' },
    set value(v: string) { failNotes.value[id] = v }
  }
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

function submitInspection() {
  alert('年检资料已提交！进入待主管审核。')
  router.push('/inspection')
}
</script>
