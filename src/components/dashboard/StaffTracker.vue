<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <Users class="w-5 h-5 text-flow-blue" />
      <h2 class="text-lg font-semibold text-gray-200">处理人追踪</h2>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-2">
      <div
        v-for="group in roleGroups"
        :key="group.role"
        class="flex-shrink-0 bg-factory-surface border border-factory-border rounded-xl p-4 min-w-[220px]"
      >
        <h3 class="text-sm font-medium text-gray-400 mb-3">{{ group.label }}</h3>
        <div class="space-y-2">
          <div
            v-for="member in group.staff"
            :key="member.id"
            class="flex items-center gap-2.5"
          >
            <div
              class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium bg-factory-surface-light text-gray-300"
            >
              {{ getInitials(member.name) }}
            </div>
            <span class="text-sm text-gray-300 flex-1">{{ member.name }}</span>
            <span
              class="text-xs font-mono px-1.5 py-0.5 rounded bg-factory-surface-light text-gray-400"
            >
              {{ member.processingCount }}
            </span>
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="member.isOnline ? 'bg-pass-green' : 'bg-gray-600'"
            />
          </div>
          <p v-if="group.staff.length === 0" class="text-xs text-gray-600 italic">
            暂无在线人员
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Users } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staff'
import type { RoleType } from '@/types'

const staffStore = useStaffStore()

interface RoleGroup {
  role: RoleType
  label: string
  staff: ReturnType<typeof staffStore.getStaffByRole>
}

const roleGroups = computed<RoleGroup[]>(() => [
  { role: 'cs', label: '接单客服', staff: staffStore.getStaffByRole('cs') },
  { role: 'designer', label: '数字设计师', staff: staffStore.getStaffByRole('designer') },
  { role: 'qc', label: '质检员', staff: staffStore.getStaffByRole('qc') },
])

function getInitials(name: string): string {
  return name.slice(0, 1)
}
</script>
