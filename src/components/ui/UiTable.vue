<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

interface Props {
  data?: any[]
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  emptyText: '暂无数据'
})
</script>

<template>
  <div class="w-full overflow-x-auto rounded-[4px] border border-gray-200">
    <table class="w-full min-w-max text-sm">
      <thead class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <tr>
          <slot name="headers" />
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-100">
        <template v-if="data && data.length > 0">
          <tr
            v-for="(item, index) in data"
            :key="index"
            class="group transition-colors hover:bg-blue-50/40 relative"
          >
            <td class="relative">
              <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1E40AF] -translate-x-full group-hover:translate-x-0 transition-transform duration-200" />
            </td>
            <slot name="row" :item="item" :index="index" />
          </tr>
        </template>
        <tr v-else>
          <td :colspan="100" class="px-4 py-16">
            <div class="flex flex-col items-center justify-center text-gray-400 gap-3">
              <Inbox class="w-12 h-12 text-gray-300" />
              <p class="text-sm">{{ emptyText }}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
