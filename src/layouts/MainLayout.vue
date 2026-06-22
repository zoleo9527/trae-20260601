<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { useRole } from '@/stores/role'

const route = useRoute()
const { fetchRole } = useRole()
const loaded = ref(false)

onMounted(async () => {
  await fetchRole()
  loaded.value = true
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Sidebar />
    <main class="ml-60 min-h-screen">
      <div v-if="loaded" class="p-8">
        <router-view />
      </div>
      <div v-else class="flex items-center justify-center h-screen">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    </main>
  </div>
</template>
