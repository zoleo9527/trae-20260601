<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Sprout, Stethoscope, Crown, ArrowRight } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

const roles = [
  {
    key: '繁育员',
    icon: Sprout,
    desc: '负责仔猪转栏申请与确认',
    color: 'border-emerald-500/50 hover:shadow-emerald-500/20',
    iconColor: 'text-emerald-400',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    key: '兽医',
    icon: Stethoscope,
    desc: '负责健康评估与淘汰建议',
    color: 'border-blue-500/50 hover:shadow-blue-500/20',
    iconColor: 'text-blue-400',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    key: '场长',
    icon: Crown,
    desc: '负责审批淘汰与全局管理',
    color: 'border-amber-500/50 hover:shadow-amber-500/20',
    iconColor: 'text-amber-400',
    btnColor: 'bg-amber-600 hover:bg-amber-700',
  },
]

const names: Record<string, string> = {
  '繁育员': '',
  '兽医': '',
  '场长': '',
}

function handleEnter(roleKey: string) {
  const userName = names[roleKey].trim()
  if (!userName) return
  auth.login(roleKey, userName)
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
    <div class="w-full max-w-3xl">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-slate-100">仔猪转栏与淘汰评估</h1>
        <p class="text-slate-500 mt-2">选择您的角色进入系统</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          v-for="role in roles"
          :key="role.key"
          :class="[
            'card border-2 hover:shadow-lg transition-all duration-300 flex flex-col',
            role.color
          ]"
        >
          <div class="flex flex-col items-center pt-4 pb-3">
            <div class="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <component :is="role.icon" :size="28" :class="role.iconColor" />
            </div>
            <h3 class="text-lg font-semibold text-slate-100">{{ role.key }}</h3>
            <p class="text-xs text-slate-500 mt-1 text-center">{{ role.desc }}</p>
          </div>
          <div class="mt-auto pt-4 space-y-3">
            <input
              v-model="names[role.key]"
              type="text"
              placeholder="输入姓名"
              class="input-field text-sm"
              @keyup.enter="handleEnter(role.key)"
            />
            <button
              :disabled="!names[role.key].trim()"
              :class="[
                'w-full flex items-center justify-center gap-2 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                role.btnColor
              ]"
              @click="handleEnter(role.key)"
            >
              <span>进入</span>
              <ArrowRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
