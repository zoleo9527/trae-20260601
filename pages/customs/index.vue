<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">报关资料</h1>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        @click="handleCreateCustoms"
      >
        <Plus class="w-4 h-4" />
        创建报关资料
      </button>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">状态：</label>
          <select
            v-model="statusFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="draft">草稿</option>
            <option value="pending_review">待审核</option>
            <option value="reviewed">已审核</option>
            <option value="rejected">已驳回</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报关单号</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联订单</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">版本</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交人</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审核人</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="doc in filteredDocuments"
              :key="doc.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-4">
                <span class="text-sm font-medium text-blue-600 cursor-pointer" @click="viewDetail(doc.id)">
                  {{ doc.declarationNo || `BG${doc.id.slice(-8)}` }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ doc.orderNo }}</td>
              <td class="px-4 py-4 text-sm text-gray-600">V{{ doc.version }}</td>
              <td class="px-4 py-4">
                <StatusBadge :status="doc.status" type="customs" />
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ doc.submitter || '-' }}</td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ doc.reviewer || '-' }}</td>
              <td class="px-4 py-4 text-right text-sm">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="text-blue-600 hover:text-blue-800"
                    @click="viewDetail(doc.id)"
                  >
                    详情
                  </button>
                  <template v-if="doc.status === 'draft'">
                    <span class="text-gray-300">|</span>
                    <button
                      class="text-green-600 hover:text-green-800"
                      @click="submitReview(doc.id)"
                    >
                      提交审核
                    </button>
                    <span class="text-gray-300">|</span>
                    <button
                      class="text-yellow-600 hover:text-yellow-800"
                      @click="editDocument(doc.id)"
                    >
                      编辑
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="filteredDocuments.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                暂无报关资料
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import StatusBadge from '~/components/StatusBadge.vue'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { CustomsDocument, CustomsStatus } from '~/types'

const appStore = useAppStore()
const { formatDate } = useFormat()

const statusFilter = ref<string>('')

const { data: documents, refresh } = await useFetch<CustomsDocument[]>('/api/customs')

const filteredDocuments = computed(() => {
  if (!documents.value) return []

  return documents.value.filter(doc => {
    if (statusFilter.value && doc.status !== statusFilter.value) return false
    return true
  })
})

const handleCreateCustoms = () => {
  alert('请选择订单创建报关资料')
}

const viewDetail = (id: string) => {
  navigateTo(`/customs/${id}`)
}

const submitReview = async (id: string) => {
  await $fetch(`/api/customs/${id}/submit`, { method: 'POST' })
  refresh()
}

const editDocument = (id: string) => {
  alert(`编辑报关资料 ${id}`)
}
</script>
