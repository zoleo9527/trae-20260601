<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { Project, JointTest, TestItem } from '@/types'
import { issueApi, testApi } from '@/api'

const router = useRouter()
const route = useRoute()

const projects = ref<Project[]>([])
const tests = ref<JointTest[]>([])
const testItems = ref<TestItem[]>([])

const form = ref({
  test_id: '',
  test_item_id: '',
  project_id: '',
  title: '',
  severity: 'major' as 'critical' | 'major' | 'minor',
  description: '',
  assignee: '',
})

const loading = ref(false)
const error = ref('')

const sourceTestId = computed(() => route.query.test_id as string)
const sourceItemId = computed(() => route.query.test_item_id as string)

const engineers = ['赵工', '钱工', '孙工', '周工']

async function fetchProjectsAndTests() {
  try {
    const [testsData] = await Promise.all([
      testApi.getTests(),
    ])
    tests.value = testsData

    const projectSet = new Map<string, Project>()
    testsData.forEach(t => {
      if (t.project) {
        projectSet.set(t.project.id, t.project)
      }
    })
    projects.value = Array.from(projectSet.values())

    if (sourceTestId.value) {
      form.value.test_id = sourceTestId.value
      const sourceTest = testsData.find(t => t.id === sourceTestId.value)
      if (sourceTest) {
        form.value.project_id = sourceTest.project_id
        testItems.value = sourceTest.items || []
        if (sourceItemId.value) {
          form.value.test_item_id = sourceItemId.value
          const sourceItem = testItems.value.find(i => i.id === sourceItemId.value)
          if (sourceItem) {
            form.value.title = sourceItem.name + ' - 测试未通过'
            form.value.description = `预期结果：${sourceItem.expected_result || '无'}\n实际结果：${sourceItem.actual_result || '无'}`
          }
        }
      }
    }

    if (projects.value.length > 0 && !form.value.project_id) {
      form.value.project_id = projects.value[0].id
    }
  } catch (err) {
    console.error('获取数据失败:', err)
  }
}

async function handleTestChange() {
  if (form.value.test_id) {
    try {
      const testDetail = await testApi.getTest(form.value.test_id)
      testItems.value = testDetail.items || []
      form.value.project_id = testDetail.project_id
    } catch (err) {
      console.error('获取测试详情失败:', err)
    }
  } else {
    testItems.value = []
  }
}

async function handleSubmit() {
  if (!form.value.project_id) {
    error.value = '请选择项目'
    return
  }
  if (!form.value.title.trim()) {
    error.value = '请输入问题标题'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await issueApi.createIssue({
      test_id: form.value.test_id || undefined,
      test_item_id: form.value.test_item_id || undefined,
      project_id: form.value.project_id,
      title: form.value.title.trim(),
      severity: form.value.severity,
      description: form.value.description.trim() || undefined,
      assignee: form.value.assignee || undefined,
    })
    router.push(`/issues/${result.id}`)
  } catch (err: any) {
    error.value = err.message || '创建失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjectsAndTests()
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
        <h1 class="text-xl font-bold text-slate-900">新建问题整改</h1>
        <p class="text-slate-500 mt-1">填写问题基本信息，指派整改责任人</p>
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
              严重程度 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.severity"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="critical">严重</option>
              <option value="major">主要</option>
              <option value="minor">次要</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            问题标题 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="请输入问题标题"
            class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              关联联调测试（可选）
            </label>
            <select
              v-model="form.test_id"
              @change="handleTestChange"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">不关联</option>
              <option v-for="t in tests" :key="t.id" :value="t.id">
                {{ t.title }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              关联测试项（可选）
            </label>
            <select
              v-model="form.test_item_id"
              :disabled="!form.test_id"
              class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="">不关联</option>
              <option v-for="item in testItems" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            责任人（可选，不填则状态为待指派）
          </label>
          <select
            v-model="form.assignee"
            class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">待指派</option>
            <option v-for="e in engineers" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            问题描述
          </label>
          <textarea
            v-model="form.description"
            rows="5"
            placeholder="请详细描述问题情况、预期结果和实际结果..."
            class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          ></textarea>
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
          {{ loading ? '创建中...' : '创建问题整改' }}
        </button>
      </div>
    </div>
  </div>
</template>
