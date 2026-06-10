<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ShieldX, ArrowLeft } from 'lucide-vue-next'
import RoleBadge from '@/components/RoleBadge.vue'

const router = useRouter()
const auth = useAuthStore()
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center max-w-sm">
      <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
        <ShieldX :size="28" class="text-red-400" />
      </div>
      <h2 class="text-lg font-semibold text-slate-100 mb-2">无访问权限</h2>
      <p class="text-sm text-slate-400 mb-1">
        当前角色
        <RoleBadge :role="auth.role || ''" class="mx-1" />
        无权访问此页面
      </p>
      <p class="text-xs text-slate-600 mb-6">请联系管理员或切换角色后再试</p>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
        @click="router.push('/')"
      >
        <ArrowLeft :size="16" />
        返回工作台
      </button>
    </div>
  </div>
</template>
