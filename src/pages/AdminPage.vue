<template>
  <div class="space-y-6">
    <div v-if="store.currentRole !== '店长'" class="card p-6 border-alert/30">
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-6 h-6 text-alert" />
        <div>
          <h3 class="font-heading text-lg font-semibold text-alert">权限不足</h3>
          <p class="text-sm text-text-secondary">数据管理功能仅限店长角色使用，请切换身份后重试。</p>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <Database class="w-5 h-5 text-accent" />
          <h3 class="font-heading text-lg font-semibold text-accent">数据重置</h3>
        </div>
        <div class="p-3 rounded bg-alert/5 border border-alert/20 mb-4">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-alert mt-0.5 shrink-0" />
            <p class="text-sm text-alert/90">
              此操作将清空所有报名、座位分配和交接记录数据，且不可恢复。请在确认前仔细考虑。
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex gap-3">
            <input
              v-model="resetConfirmText"
              class="input-dark flex-1"
              placeholder='请输入"确认重置"以确认操作'
            />
            <button
              class="btn-danger"
              :disabled="resetConfirmText !== '确认重置'"
              :class="{ 'opacity-50 cursor-not-allowed': resetConfirmText !== '确认重置' }"
              @click="showResetDialog = true"
            >
              重置数据
            </button>
          </div>
        </div>

        <div
          v-if="resetSuccess"
          class="mt-3 flex items-center gap-2 p-3 rounded bg-accent/10 border border-accent/30"
        >
          <Check class="w-4 h-4 text-accent" />
          <span class="text-sm text-accent">数据已成功重置</span>
        </div>
      </div>

      <div
        v-if="showResetDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="showResetDialog = false"
      >
        <div class="card p-6 w-96 border-alert/30 glow-red">
          <div class="flex items-center gap-3 mb-4">
            <AlertTriangle class="w-6 h-6 text-alert" />
            <h3 class="font-heading text-lg font-semibold text-alert">确认重置</h3>
          </div>
          <p class="text-sm text-text-secondary mb-4">
            即将清空所有数据，此操作不可撤销。确定要继续吗？
          </p>
          <div class="flex gap-3 justify-end">
            <button class="px-4 py-2 rounded text-text-secondary hover:text-text-primary transition-colors" @click="showResetDialog = false">
              取消
            </button>
            <button
              class="btn-danger"
              :disabled="isResetting"
              @click="performReset"
            >
              {{ isResetting ? '重置中...' : '确认重置' }}
            </button>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <FileText class="w-5 h-5 text-accent" />
            <h3 class="font-heading text-lg font-semibold text-accent">附件管理</h3>
          </div>
          <button
            class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-text-secondary hover:text-accent border border-border/30 hover:border-accent/30 transition-all duration-200"
            :disabled="isLoadingAttachments"
            @click="loadAttachments"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoadingAttachments }" />
            刷新
          </button>
        </div>

        <div v-if="isLoadingAttachments" class="text-text-secondary text-sm py-8 text-center">
          加载中...
        </div>

        <div v-else-if="attachmentGroups.length === 0" class="text-text-secondary text-sm py-8 text-center">
          暂无附件数据
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="group in attachmentGroups"
            :key="group.registrationId"
            class="rounded border border-border/30 overflow-hidden"
          >
            <div class="px-4 py-2.5 bg-bg-primary/60 border-b border-border/20">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-accent/70" />
                <span class="text-sm font-semibold text-text-primary">{{ group.eventName }}</span>
                <span class="text-xs text-text-secondary">({{ group.attachments.length }} 个附件)</span>
              </div>
            </div>
            <div class="divide-y divide-border/10">
              <div
                v-for="att in group.attachments"
                :key="att.id"
                class="flex items-center gap-4 px-4 py-3 hover:bg-bg-primary/30 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-text-primary truncate">{{ att.file_name }}</p>
                  <p class="text-xs text-text-secondary">{{ att.file_size }}</p>
                </div>

                <div class="shrink-0">
                  <span
                    v-if="att.status === 'uploaded'"
                    class="inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded"
                  >
                    <Check class="w-3.5 h-3.5" />
                    已上传
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 text-xs text-text-secondary bg-bg-primary/60 border border-border/30 px-2 py-1 rounded"
                  >
                    <Upload class="w-3.5 h-3.5" />
                    待上传
                  </span>
                </div>

                <div class="shrink-0 w-28 text-right">
                  <template v-if="att.status === 'uploaded' && att.uploaded_at">
                    <p class="text-xs text-text-secondary">{{ formatDateTime(att.uploaded_at) }}</p>
                    <p class="text-xs text-text-secondary/60">{{ att.uploaded_by }}</p>
                  </template>
                  <template v-else>
                    <p class="text-xs text-text-secondary/40">—</p>
                  </template>
                </div>

                <div class="shrink-0">
                  <button
                    v-if="att.status === 'placeholder'"
                    class="btn-primary text-xs px-3 py-1.5"
                    :disabled="updatingAttachmentId === att.id"
                    @click="markUploaded(att)"
                  >
                    <span v-if="updatingAttachmentId === att.id">处理中...</span>
                    <span v-else class="flex items-center gap-1">
                      <Upload class="w-3.5 h-3.5" />
                      标记已上传
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <Database class="w-5 h-5 text-accent" />
          <h3 class="font-heading text-lg font-semibold text-accent">系统信息</h3>
        </div>
        <div class="grid grid-cols-4 gap-4">
          <div class="p-4 rounded border border-border/20 bg-bg-primary/30 text-center">
            <p class="font-heading text-2xl font-bold text-accent">{{ store.registrations.length }}</p>
            <p class="text-xs text-text-secondary mt-1">报名记录</p>
          </div>
          <div class="p-4 rounded border border-border/20 bg-bg-primary/30 text-center">
            <p class="font-heading text-2xl font-bold text-accent">{{ store.seats.length }}</p>
            <p class="text-xs text-text-secondary mt-1">座位数</p>
          </div>
          <div class="p-4 rounded border border-border/20 bg-bg-primary/30 text-center">
            <p class="font-heading text-2xl font-bold text-accent">{{ store.allocations.length }}</p>
            <p class="text-xs text-text-secondary mt-1">分配记录</p>
          </div>
          <div class="p-4 rounded border border-border/20 bg-bg-primary/30 text-center">
            <p class="font-heading text-2xl font-bold text-accent">{{ totalAttachments }}</p>
            <p class="text-xs text-text-secondary mt-1">附件数</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AlertTriangle, Database, FileText, Upload, Check, RefreshCw } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { Attachment } from '@/types'

const store = useAppStore()
const resetConfirmText = ref('')
const showResetDialog = ref(false)
const isResetting = ref(false)
const resetSuccess = ref(false)
const isLoadingAttachments = ref(false)
const updatingAttachmentId = ref<string | null>(null)
const allAttachments = ref<Attachment[]>([])

interface AttachmentGroup {
  registrationId: string
  eventName: string
  attachments: Attachment[]
}

const attachmentGroups = computed<AttachmentGroup[]>(() => {
  const groupMap = new Map<string, AttachmentGroup>()

  for (const att of allAttachments.value) {
    if (!groupMap.has(att.registration_id)) {
      const reg = store.registrations.find(r => r.id === att.registration_id)
      groupMap.set(att.registration_id, {
        registrationId: att.registration_id,
        eventName: reg?.event_name ?? `报名 #${att.registration_id.slice(0, 8)}`,
        attachments: [],
      })
    }
    groupMap.get(att.registration_id)!.attachments.push(att)
  }

  return Array.from(groupMap.values())
})

const totalAttachments = computed(() => allAttachments.value.length)

async function loadAttachments() {
  isLoadingAttachments.value = true
  try {
    await store.fetchRegistrations()
    const attachments: Attachment[] = []
    const fetches = store.registrations.map(async (reg) => {
      try {
        const res = await fetch(`/api/registrations/${reg.id}`)
        const data = await res.json()
        if (data.success && data.data?.attachments) {
          attachments.push(...data.data.attachments)
        }
      } catch {
        // skip failed fetch
      }
    })
    await Promise.all(fetches)
    allAttachments.value = attachments
  } finally {
    isLoadingAttachments.value = false
  }
}

async function markUploaded(att: Attachment) {
  updatingAttachmentId.value = att.id
  const success = await store.updateAttachment(att.id, 'uploaded')
  if (success) {
    const idx = allAttachments.value.findIndex(a => a.id === att.id)
    if (idx !== -1) {
      allAttachments.value[idx] = {
        ...allAttachments.value[idx],
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
        uploaded_by: `${store.currentRole}/${store.currentName}`,
      }
    }
  }
  updatingAttachmentId.value = null
}

async function performReset() {
  if (resetConfirmText.value !== '确认重置') return
  isResetting.value = true
  const success = await store.resetData(resetConfirmText.value)
  isResetting.value = false
  if (success) {
    resetConfirmText.value = ''
    showResetDialog.value = false
    resetSuccess.value = true
    allAttachments.value = []
    setTimeout(() => { resetSuccess.value = false }, 3000)
  }
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
}

onMounted(() => {
  if (store.currentRole === '店长') {
    loadAttachments()
  }
})
</script>
