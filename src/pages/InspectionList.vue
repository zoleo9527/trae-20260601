<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  X
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';
import type { RiskLevel, InspectionStatus } from '../types/index.js';
import { RiskLevelLabel, InspectionStatusLabel } from '../types/index.js';
import RiskBadge from '@/components/RiskBadge.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import CreateInspectionModal from '@/components/CreateInspectionModal.vue';

const router = useRouter();
const store = useInspectionStore();

const showCreateModal = ref(false);
const showFilters = ref(false);

const filters = reactive({
  riskLevel: '' as RiskLevel | '',
  status: '' as InspectionStatus | '',
  facilityType: '',
  keyword: ''
});

const riskLevelOptions = Object.entries(RiskLevelLabel).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(InspectionStatusLabel).map(([value, label]) => ({ value, label }));

async function loadData() {
  const filterParams = {
    ...(filters.riskLevel && { riskLevel: filters.riskLevel as RiskLevel }),
    ...(filters.status && { status: filters.status as InspectionStatus }),
    ...(filters.facilityType && { facilityType: filters.facilityType })
  };
  await store.fetchInspections(Object.keys(filterParams).length > 0 ? filterParams : undefined);
}

function resetFilters() {
  filters.riskLevel = '';
  filters.status = '';
  filters.facilityType = '';
  filters.keyword = '';
  loadData();
}

function viewDetail(id: string) {
  router.push(`/inspections/${id}`);
}

const filteredInspections = () => {
  if (!filters.keyword) return store.sortedInspections;
  const keyword = filters.keyword.toLowerCase();
  return store.sortedInspections.filter(
    i =>
      i.facilityName.toLowerCase().includes(keyword) ||
      i.location.toLowerCase().includes(keyword) ||
      i.description.toLowerCase().includes(keyword)
  );
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索设施名称、位置、描述..."
          class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
          @input="loadData"
        />
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="showFilters = !showFilters"
          :class="[
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all font-medium',
            showFilters
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          ]"
        >
          <Filter class="w-4 h-4" />
          筛选
        </button>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40"
        >
          <Plus class="w-4 h-4" />
          新增抽检
        </button>
      </div>
    </div>

    <Transition name="slide-down">
      <div
        v-if="showFilters"
        class="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">风险等级</label>
            <select
              v-model="filters.riskLevel"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">全部</option>
              <option v-for="opt in riskLevelOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">处理状态</label>
            <select
              v-model="filters.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">全部</option>
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">设施类型</label>
            <input
              v-model="filters.facilityType"
              type="text"
              placeholder="如：灭火器"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="loadData"
              class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              应用筛选
            </button>
            <button
              @click="resetFilters"
              class="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
    </div>

    <div v-else-if="filteredInspections().length === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-800 mb-2">暂无抽检记录</h3>
      <p class="text-gray-500 mb-4">点击"新增抽检"按钮添加第一条记录</p>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
      >
        <Plus class="w-4 h-4" />
        新增抽检
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="inspection in filteredInspections()"
        :key="inspection.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
        @click="viewDetail(inspection.id)"
      >
        <div class="relative h-40 bg-gray-100">
          <img
            v-if="inspection.photos.length > 0"
            :src="inspection.photos[0].thumbnailUrl"
            :alt="inspection.facilityName"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span class="text-gray-400 text-sm">暂无照片</span>
          </div>
          <div class="absolute top-3 left-3 flex gap-2">
            <RiskBadge :level="inspection.riskLevel" />
          </div>
          <div class="absolute top-3 right-3">
            <StatusBadge :status="inspection.status" />
          </div>
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
              {{ inspection.facilityName }}
            </h3>
            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
          </div>
          <p class="text-sm text-gray-500 mb-3 line-clamp-2">{{ inspection.description }}</p>
          <div class="space-y-2 text-xs text-gray-500">
            <div class="flex items-center gap-2">
              <MapPin class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ inspection.location }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Calendar class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ inspection.discoveryTime }}</span>
            </div>
            <div class="flex items-center gap-2">
              <User class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ inspection.discovererName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CreateInspectionModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @success="loadData"
    />
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
