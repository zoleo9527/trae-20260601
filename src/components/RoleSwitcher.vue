<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="open = !open"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-gray-50 transition-colors text-sm"
    >
      <UserCircle class="w-4 h-4 text-[#1B4965]" />
      <span class="font-medium text-[#1B4965]">{{ roleStore.roleLabel }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
    </button>
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 mt-1.5 w-44 bg-white rounded-lg shadow-lg border border-[#E2E8F0] z-50 overflow-hidden"
      >
        <button
          v-for="r in roleStore.roles"
          :key="r.value"
          @click="handleSwitch(r.value)"
          class="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
          :class="r.value === roleStore.currentRole ? 'bg-[#F7F9FC] font-medium' : ''"
        >
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="dotColor(r.value)"
          />
          <span>{{ r.label }}</span>
          <Check
            v-if="r.value === roleStore.currentRole"
            class="w-3.5 h-3.5 ml-auto text-[#1B4965]"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { UserCircle, ChevronDown, Check } from 'lucide-vue-next'
import { useRoleStore } from '@/stores/role'
import type { UserRole } from '@/types'

const roleStore = useRoleStore()
const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function dotColor(role: UserRole) {
  const map: Record<UserRole, string> = {
    sales_clerk: 'bg-blue-500',
    warehouse: 'bg-green-500',
    after_sales: 'bg-orange-500',
  }
  return map[role]
}

function handleSwitch(role: UserRole) {
  roleStore.switchRole(role)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>
