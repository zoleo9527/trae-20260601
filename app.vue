<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'

const store = useInspectionStore()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <NuxtPage />
  </div>
</template>
