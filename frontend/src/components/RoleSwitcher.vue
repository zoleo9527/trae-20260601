<script setup lang="ts">
import type { UserRole } from '../types'
import { ROLE_LABEL } from '../types/enums'
import { cn } from '../lib/utils'

const props = defineProps<{
  currentRole: UserRole
}>()

const emit = defineEmits<{
  change: [role: UserRole]
}>()

const roles: UserRole[] = ['technician', 'customer_service', 'supervisor']

function handleClick(role: UserRole) {
  if (role !== props.currentRole) {
    emit('change', role)
  }
}
</script>

<template>
  <div class="inline-flex">
    <button
      v-for="(role, index) in roles"
      :key="role"
      type="button"
      @click="handleClick(role)"
      :class="cn(
        'px-4 py-2 text-sm font-medium border transition-colors',
        props.currentRole === role
          ? 'bg-blue-900 text-white border-blue-900'
          : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50',
        index === 0 ? '' : '-ml-px'
      )"
    >
      {{ ROLE_LABEL[role] }}
    </button>
  </div>
</template>
