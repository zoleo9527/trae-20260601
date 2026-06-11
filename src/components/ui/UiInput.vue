<script setup lang="ts">
import { computed } from 'vue'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ChevronDown } from 'lucide-vue-next'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

type InputType = 'text' | 'textarea' | 'number' | 'select'

interface Props {
  modelValue: string | number
  type?: InputType
  label?: string
  placeholder?: string
  options?: SelectOption[]
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  name?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  required: false,
  disabled: false,
  rows: 4
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputId = computed(() => props.id || props.name || `input-${Math.random().toString(36).slice(2, 9)}`)

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

const baseInputClasses = 'w-full px-3 py-2 text-sm bg-white border border-[#D4D4D8] rounded-[4px] text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:border-[#1E40AF] focus:shadow-[0_0_0_3px_rgba(30,64,175,0.15)] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'

const errorClasses = computed(() =>
  props.error ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''
)
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <textarea
      v-if="type === 'textarea'"
      :id="inputId"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :class="cn(baseInputClasses, errorClasses, 'resize-y min-h-[96px]')"
      @input="handleInput"
    />

    <div v-else-if="type === 'select'" class="relative">
      <select
        :id="inputId"
        :name="name"
        :value="modelValue"
        :disabled="disabled"
        :class="cn(baseInputClasses, errorClasses, 'appearance-none pr-10 cursor-pointer')"
        @change="handleInput"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </option>
      </select>
      <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>

    <input
      v-else
      :id="inputId"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="cn(baseInputClasses, errorClasses)"
      @input="handleInput"
    />

    <p v-if="error" class="mt-1.5 text-xs text-red-500">{{ error }}</p>
  </div>
</template>
