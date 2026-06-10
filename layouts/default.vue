<template>
  <div class="flex h-screen overflow-hidden bg-neutral-50">
    <AppSidebar />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-y-auto scrollbar-thin p-6">
        <slot />
      </main>
    </div>
    <AlertPanel v-if="appStore.showAlertPanel" @close="appStore.closeAlertPanel()" />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
const appStore = useAppStore()
</script>
