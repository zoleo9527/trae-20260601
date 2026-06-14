<script setup lang="ts">
import type { Role } from '~/types'
import { roleLabels } from '~/types'

const props = defineProps<{
  role: Role
}>()

const roleClass = computed(() => {
  const classMap: Record<Role, string> = {
    CLAIM_AGENT: 'role-agent',
    SURVEYOR: 'role-surveyor',
    UNDERWRITER: 'role-underwriter'
  }
  return classMap[props.role]
})
</script>

<template>
  <span class="role-tag" :class="roleClass">
    {{ roleLabels[role] }}
  </span>
</template>

<style scoped>
.role-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.role-agent {
  background-color: #dbeafe;
  color: #1e40af;
}

.role-surveyor {
  background-color: #fef3c7;
  color: #92400e;
}

.role-underwriter {
  background-color: #f3e8ff;
  color: #7c3aed;
}
</style>
