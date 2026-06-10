<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { ArrowLeft, AlertCircle, X } from 'lucide-vue-next'

const router = useRouter()
const api = useApi()

const form = ref({
  earTag: '',
  breed: '',
  ageDays: '',
  fromPen: '',
  toPen: '',
  reason: '',
  remark: '',
})

const errors = ref<Record<string, string>>({})
const pageError = ref('')
const submitting = ref(false)

function validate() {
  errors.value = {}
  const required: Record<string, string> = {
    earTag: '耳号',
    breed: '品种',
    ageDays: '日龄',
    fromPen: '原栏位',
    toPen: '目标栏位',
    reason: '转栏原因',
  }
  for (const [key, label] of Object.entries(required)) {
    if (!form.value[key as keyof typeof form.value]) {
      errors.value[key] = `${label}不能为空`
    }
  }
  return Object.keys(errors.value).length === 0
}

function dismissPageError() {
  pageError.value = ''
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  pageError.value = ''
  try {
    const res = await api.createTransfer({
      earTag: form.value.earTag,
      breed: form.value.breed,
      ageDays: Number(form.value.ageDays),
      fromPen: form.value.fromPen,
      toPen: form.value.toPen,
      reason: form.value.reason,
      remark: form.value.remark,
    })
    const id = res.data?.id || res.id
    router.push(`/transfer/${id}`)
  } catch (e: any) {
    pageError.value = e.error || e.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h2 class="text-xl font-semibold text-slate-100">新建转栏</h2>
    </div>

    <div
      v-if="pageError"
      class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3"
    >
      <AlertCircle :size="18" class="text-red-400 shrink-0 mt-0.5" />
      <p class="text-sm text-red-300 flex-1">{{ pageError }}</p>
      <button class="text-red-400/60 hover:text-red-300 transition-colors" @click="dismissPageError">
        <X :size="16" />
      </button>
    </div>

    <div class="card space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-400 mb-1.5">耳号 <span class="text-red-400">*</span></label>
          <input v-model="form.earTag" type="text" class="input-field" placeholder="输入耳号" />
          <p v-if="errors.earTag" class="text-xs text-red-400 mt-1">{{ errors.earTag }}</p>
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1.5">品种 <span class="text-red-400">*</span></label>
          <input v-model="form.breed" type="text" class="input-field" placeholder="输入品种" />
          <p v-if="errors.breed" class="text-xs text-red-400 mt-1">{{ errors.breed }}</p>
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1.5">日龄 <span class="text-red-400">*</span></label>
          <input v-model="form.ageDays" type="number" class="input-field" placeholder="输入日龄" />
          <p v-if="errors.ageDays" class="text-xs text-red-400 mt-1">{{ errors.ageDays }}</p>
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1.5">原栏位 <span class="text-red-400">*</span></label>
          <input v-model="form.fromPen" type="text" class="input-field" placeholder="输入原栏位" />
          <p v-if="errors.fromPen" class="text-xs text-red-400 mt-1">{{ errors.fromPen }}</p>
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1.5">目标栏位 <span class="text-red-400">*</span></label>
          <input v-model="form.toPen" type="text" class="input-field" placeholder="输入目标栏位" />
          <p v-if="errors.toPen" class="text-xs text-red-400 mt-1">{{ errors.toPen }}</p>
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1.5">转栏原因 <span class="text-red-400">*</span></label>
          <input v-model="form.reason" type="text" class="input-field" placeholder="输入转栏原因" />
          <p v-if="errors.reason" class="text-xs text-red-400 mt-1">{{ errors.reason }}</p>
        </div>
      </div>
      <div>
        <label class="block text-sm text-slate-400 mb-1.5">备注</label>
        <textarea v-model="form.remark" class="input-field min-h-[80px] resize-y" placeholder="可选填写备注" />
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button class="btn-secondary" @click="router.back()">取消</button>
        <button class="btn-primary" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '提交' }}
        </button>
      </div>
    </div>
  </div>
</template>
