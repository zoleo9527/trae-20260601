<template>
  <div class="space-y-3">
    <div class="flex items-center gap-3 p-2 rounded-lg bg-neutral-50">
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
        {{ user.avatar }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-neutral-800 truncate">{{ user.name }}</div>
        <div class="text-xs text-neutral-500 truncate">{{ roleLabel }}</div>
      </div>
    </div>
    <div class="space-y-1">
      <button
        v-for="opt in roleOptions"
        :key="opt.value"
        type="button"
        @click="switchRole(opt.value)"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all"
        :class="appStore.currentRole === opt.value
          ? 'bg-primary-50 text-primary-700 border border-primary-200'
          : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'"
      >
        <AppIcon :name="opt.icon" class="w-4 h-4" />
        <span class="flex-1 text-left">{{ opt.label }}</span>
        <span v-if="appStore.currentRole === opt.value" class="text-primary-600">
          <AppIcon name="IconCheck" class="w-4 h-4" />
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { UserRole } from '~/types'

const appStore = useAppStore()
const router = useRouter()

const user = computed(() => appStore.currentUser)

const roleLabel = computed(() => {
  const map: Record<UserRole, string> = {
    technician: '维保技师',
    customer_service: '客服专员',
    project_manager: '项目主管'
  }
  return map[appStore.currentRole]
})

const roleOptions: { value: UserRole; label: string; icon: string }[] = [
  { value: 'technician', label: '切换到 · 维保技师', icon: 'IconWrench' },
  { value: 'customer_service', label: '切换到 · 客服专员', icon: 'IconMessage' },
  { value: 'project_manager', label: '切换到 · 项目主管', icon: 'IconUser' }
]

function switchRole(role: UserRole) {
  appStore.switchRole(role)
  router.push('/')
}
</script>
