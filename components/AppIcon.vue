<template>
  <component :is="iconComponent" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { IconRegistry } from '~/composables/useIcons'

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const iconComponent = computed((): Component | undefined => {
  return IconRegistry[props.name]
})
</script>
