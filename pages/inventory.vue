<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">海外仓库存</h1>

    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">仓库：</label>
          <select
            v-model="warehouseFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="深圳仓库">深圳仓库</option>
            <option value="义乌仓库">义乌仓库</option>
            <option value="广州仓库">广州仓库</option>
          </select>
        </div>

        <div class="flex-1 min-w-[200px] max-w-md">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索 SKU、商品名称..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名称</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">仓库</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">总库存</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">预留</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">可用</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">预警阈值</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              class="hover:bg-gray-50"
              :class="{ 'bg-red-50': item.availableQuantity < item.warningThreshold }"
            >
              <td class="px-4 py-4">
                <span class="text-sm font-mono text-gray-900">{{ item.sku }}</span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ item.productName }}</td>
              <td class="px-4 py-4 text-sm text-gray-600">{{ item.warehouse }}</td>
              <td class="px-4 py-4 text-sm text-gray-900 font-medium text-right">
                {{ item.quantity }}
              </td>
              <td class="px-4 py-4 text-sm text-yellow-600 text-right">
                {{ item.reservedQuantity }}
              </td>
              <td class="px-4 py-4 text-sm text-right">
                <span :class="item.availableQuantity < item.warningThreshold ? 'text-red-600 font-medium' : 'text-green-600'">
                  {{ item.availableQuantity }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 text-right">
                {{ item.warningThreshold }}
              </td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                暂无库存数据
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
import { Search } from 'lucide-vue-next'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { InventoryItem } from '~/types'

const appStore = useAppStore()
const { formatDate } = useFormat()

const warehouseFilter = ref<string>('')
const searchKeyword = ref<string>('')

const { data: inventoryItemsRaw } = await useFetch<{ success: boolean; data: InventoryItem[] }>('/api/inventory')
const inventoryItems = computed(() => inventoryItemsRaw.value?.data)

const filteredItems = computed(() => {
  if (!inventoryItems.value) return []

  return inventoryItems.value.filter(item => {
    if (warehouseFilter.value && item.warehouse !== warehouseFilter.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      return (
        item.sku.toLowerCase().includes(keyword) ||
        item.productName.toLowerCase().includes(keyword)
      )
    }
    return true
  })
})
</script>
