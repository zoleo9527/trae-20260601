<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-vue-next'
import type { Project } from '@/types'
import { testApi } from '@/api'
import { useRole } from '@/stores/role'

const router = useRouter()
const { roleName } = useRole()

const projects = ref<Project[]>([])
const form = ref({
  project_id: '',
  title: '',
  executor: '',
  planned_at: '',
  items: [
    { name: '', expected_result: '' },
    { name: '', expected_result: '' },
    { name: '', expected_result: '' },
  ],
})

const loading = ref(false)
const error = ref('')

async function fetchProjects() {
  try {
    const tests = await testApi.getTests()
    const projectSet = new Map<string, Project>()
    tests.forEach(t => {
      if (t.project) {
        projectSet.set(t.project.id, t.project)
      }
    })
    projects.value = Array.from(projectSet.values())
    if (projects.value.length > 0) {
      form.value.project_id = projects.value[0].id
    }
  } catch (err) {
    console.error('获取项目列表失败:', err)
  }
}

function addItem() {
  form.value.items.push({ name: '', expected_result: '' })
}

function removeItem(index: number) {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

async function handleSubmit() {
  if (!form.value.project_id) {
    error.value = '请选择项目'
    return
  }
  if (!form.value.title.trim()) {
    error.value = '请输入测试名称'
    return
  }
  const validItems = form.value.items.filter(i => i.name.trim())
  if (validItems.length === 0) {
    error.value = '请至少添加一个测试项'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await testApi.createTest({
      project_id: form.value.project_id,
      title: form.value.title.trim(),
      executor: form.value.executor.trim() || undefined,
      planned_at: form.value.planned_at || undefined,
      items: validItems,
    })
    router.push(`/tests/${result.id}`)
  } catch (err: any) {
    error.value = err.message || '创建失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjects()
  form.value.executor = roleName.value
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft class="w-5 h-5" />
        返回
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200">
      <div class="p-6 border-b border-slate-100">
        <h1 class="text-xl font-bold text-slate-900">新建联调测试</h1>
        <p class="text-slate-500 mt-1">填写测试基本信息和测试项清单</p>
      </div>

      <div class="p-6 space-y-6">
        <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {{ error }}
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              所属项目 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.project_id"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="" disabled>请选择项目</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              测试名称 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="请输入测试名称"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              执行人
            </label>
            <input
              v-model="form.executor"
              type="text"
              placeholder="请输入执行人姓名"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              计划时间
            </label>
            <input
              v-model="form.planned_at"
              type="datetime-local"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-4">
            <label class="block text-sm font-medium text-slate-700">
              测试项清单 <span class="text-red-500">*</span>
            </label>
            <button
              @click="addItem"
              type="button"
              class="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              <Plus class="w-4 h-4" />
              添加测试项
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="flex gap-3 items-start p-4 bg-slate-50 rounded-lg"
            >
              <div class="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0">
                {{ index + 1 }}
              </div>
              <div class="flex-1 space-y-3">
                <input
                  v-model="item.name"
                  type="text"
                  placeholder="测试项名称"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <input
                  v-model="item.expected_result"
                  type="text"
                  placeholder="预期结果（可选）"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <button
                v-if="form.items.length > 1"
                @click="removeItem(index)"
                type="button"
                class="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
        <button
          @click="router.back()"
          class="px-6 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-white transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save class="w-5 h-5" />
          {{ loading ? '创建中...' : '创建测试' }}
        </button>
      </div>
    </div>
  </div>
</template>
