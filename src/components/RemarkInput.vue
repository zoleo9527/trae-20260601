<template>
  <div class="space-y-2">
    <textarea
      v-model="content"
      rows="3"
      placeholder="添加备注..."
      class="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4965]/20 focus:border-[#1B4965] transition-colors placeholder:text-gray-400"
    />
    <div class="flex justify-end">
      <button
        :disabled="!content.trim()"
        @click="submit"
        class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-[#1B4965] hover:bg-[#1B4965]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send class="w-3.5 h-3.5" />
        提交
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useRoleStore } from '@/stores/role'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{ submitted: [] }>()

const ordersStore = useOrdersStore()
const roleStore = useRoleStore()
const content = ref('')

function submit() {
  if (!content.value.trim()) return
  ordersStore.addRemark(props.orderId, {
    id: String(Date.now()),
    author: roleStore.roleLabel,
    role: roleStore.currentRole,
    content: content.value.trim(),
    createdAt: new Date().toLocaleString('zh-CN'),
  })
  content.value = ''
  emit('submitted')
}
</script>
