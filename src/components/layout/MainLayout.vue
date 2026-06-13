<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar />
    <Header :title="title" :subtitle="subtitle">
      <template #actions>
        <slot name="header-actions" />
      </template>
    </Header>
    <main class="ml-64 pt-16 p-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

defineProps<{
  title: string
  subtitle?: string
}>()
</script>