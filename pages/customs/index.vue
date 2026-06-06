<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">报关资料</h1>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        @click="openCreateModal"
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
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">V{{ doc.version }}</span>
                  <span 
                    v-if="isLatestVersion(doc)"
                    class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"
                  >
                    最新
                  </span>
                  <span 
                    v-else
                    class="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium"
                  >
                    历史
                  </span>
                </div>
              </td>
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
                  <template v-if="isLatestVersion(doc) && doc.status === 'draft'">
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

    <CustomsFormModal
      :visible="showFormModal"
      :mode="formMode"
      :initial-data="editingDoc"
      :available-orders="availableOrders"
      @close="closeFormModal"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import StatusBadge from '~/components/StatusBadge.vue'
import CustomsFormModal from '~/components/CustomsFormModal.vue'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { CustomsDocument, CustomsStatus, Order } from '~/types'

const appStore = useAppStore()
const { formatDate } = useFormat()

const statusFilter = ref<string>('')
const showFormModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingDoc = ref<CustomsDocument | null>(null)

const { data: documentsRaw, refresh } = await useFetch<{ success: boolean; data: CustomsDocument[] }>('/api/customs')
const documents = computed(() => documentsRaw.value?.data)

const { data: ordersRaw } = await useFetch<{ success: boolean; data: Order[] }>('/api/orders')
const allOrders = computed(() => ordersRaw.value?.data || [])

const availableOrders = computed(() => {
  if (!allOrders.value) return []
  return allOrders.value.filter(order => 
    order.status === 'pending_customs' || order.status === 'synced'
  )
})

const orderMaxVersionMap = computed(() => {
  if (!documents.value) return {}
  const map: Record<string, number> = {}
  for (const doc of documents.value) {
    if (!map[doc.orderId] || doc.version > map[doc.orderId]) {
      map[doc.orderId] = doc.version
    }
  }
  return map
})

const isLatestVersion = (doc: CustomsDocument) => {
  return doc.version === orderMaxVersionMap.value[doc.orderId]
}

const filteredDocuments = computed(() => {
  if (!documents.value) return []

  return documents.value.filter(doc => {
    if (statusFilter.value && doc.status !== statusFilter.value) return false
    return true
  })
})

const openCreateModal = () => {
  formMode.value = 'create'
  editingDoc.value = null
  showFormModal.value = true
}

const openEditModal = (doc: CustomsDocument) => {
  formMode.value = 'edit'
  editingDoc.value = doc
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  editingDoc.value = null
}

const viewDetail = (id: string) => {
  navigateTo(`/customs/${id}`)
}

const submitReview = async (id: string) => {
  await $fetch(`/api/customs/${id}/submit`, { 
    method: 'POST',
    body: { submitter: appStore.currentUser.name }
  })
  refresh()
}

const editDocument = (id: string) => {
  const doc = documents.value?.find(d => d.id === id)
  if (doc) {
    openEditModal(doc)
  }
}

const handleFormSubmit = async (formData: any) => {
  try {
    if (formMode.value === 'create') {
      const result: any = await $fetch('/api/customs', {
        method: 'POST',
        body: {
          ...formData,
          version: 1,
          status: 'draft',
          submitter: appStore.currentUser.name
        }
      })
      closeFormModal()
      if (result?.success && result?.data?.id) {
        navigateTo(`/customs/${result.data.id}`)
      } else {
        refresh()
      }
    } else if (formMode.value === 'edit' && editingDoc.value) {
      const result: any = await $fetch(`/api/customs/${editingDoc.value.id}`, {
        method: 'PUT',
        body: { ...formData, operator: appStore.currentUser.name }
      })
      closeFormModal()
      if (result?.success && result?.data?.id) {
        navigateTo(`/customs/${result.data.id}`)
      } else {
        refresh()
      }
    }
  } catch (error: any) {
    alert(error.message || '操作失败，请重试')
  }
}
</script>
