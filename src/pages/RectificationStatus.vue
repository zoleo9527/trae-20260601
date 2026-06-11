<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  MapPin,
  ChevronRight,
  AlertCircle
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';
import { RiskLevelLabel, InspectionStatusLabel } from '../types/index.js';
import type { InspectionStatus } from '../types/index.js';
import RiskBadge from '@/components/RiskBadge.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import dayjs from 'dayjs';

const router = useRouter();
const store = useInspectionStore();

const activeTab = ref<InspectionStatus | 'all'>('all');

async function loadData() {
  await store.fetchStats();
  await store.fetchInspections();
}

function viewDetail(id: string) {
  router.push(`/inspections/${id}`);
}

const tabOptions = [
  { value: 'all', label: '全部', icon: TrendingUp },
  { value: 'dispatched', label: '已派发', icon: Clock },
  { value: 'in_progress', label: '整改中', icon: AlertTriangle },
  { value: 'pending_review_after', label: '待复查', icon: AlertCircle },
  { value: 'passed', label: '已完成', icon: CheckCircle }
];

const filteredInspections = computed(() => {
  let list = store.sortedInspections.filter(i => 
    ['dispatched', 'in_progress', 'completed', 'pending_review_after', 'passed', 'rejected'].includes(i.status)
  );
  
  if (activeTab.value !== 'all') {
    list = list.filter(i => i.status === activeTab.value);
  }
  
  return list;
});

function getProgressPercentage(inspection: any) {
  const statusOrder: Record<string, number> = {
    'dispatched': 25,
    'in_progress': 50,
    'completed': 75,
    'pending_review_after': 90,
    'passed': 100,
    'rejected': 0
  };
  return statusOrder[inspection.status] || 0;
}

function getDaysRemaining(inspection: any) {
  const dispatch = inspection.dispatches?.[0];
  if (!dispatch?.expectedCompletionTime) return null;
  
  const now = dayjs();
  const expected = dayjs(dispatch.expectedCompletionTime);
  const diff = expected.diff(now, 'day');
  
  if (diff < 0) {
    return { text: `逾期 ${Math.abs(diff)} 天`, isOverdue: true };
  } else if (diff === 0) {
    return { text: '今日到期', isOverdue: false };
  } else {
    return { text: `剩余 ${diff} 天`, isOverdue: false };
  }
}

function formatDate(dateStr: string) {
  return dayjs(dateStr).format('MM-DD HH:mm');
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 class="text-2xl font-bold text-gray-800">整改状态</h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <TrendingUp class="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p class="text-xs text-gray-500">总数</p>
            <p class="text-xl font-bold text-gray-800">{{ store.stats?.total || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="text-xs text-gray-500">已派发</p>
            <p class="text-xl font-bold text-blue-600">{{ store.stats?.pending || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p class="text-xs text-gray-500">整改中</p>
            <p class="text-xl font-bold text-yellow-600">{{ store.stats?.inProgress || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <AlertCircle class="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p class="text-xs text-gray-500">待复查</p>
            <p class="text-xl font-bold text-orange-600">{{ store.stats?.pendingReview || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-xs text-gray-500">已完成</p>
            <p class="text-xl font-bold text-green-600">{{ store.stats?.completed || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <XCircle class="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p class="text-xs text-gray-500">已逾期</p>
            <p class="text-xl font-bold text-red-600">{{ store.stats?.overdue || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
      <div class="border-b border-gray-200">
        <nav class="flex overflow-x-auto">
          <button
            v-for="tab in tabOptions"
            :key="tab.value"
            @click="activeTab = tab.value as any"
            :class="[
              'inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.value
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div v-if="store.loading" class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
      </div>

      <div v-else-if="filteredInspections.length === 0" class="p-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-800 mb-2">暂无整改记录</h3>
        <p class="text-gray-500">隐患派发后将在此处显示整改进度</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="inspection in filteredInspections"
          :key="inspection.id"
          class="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="viewDetail(inspection.id)"
        >
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-semibold text-gray-800 truncate">
                  {{ inspection.facilityName }}
                </h3>
                <RiskBadge :level="inspection.riskLevel" />
                <StatusBadge :status="inspection.status" />
                <div
                  v-if="getDaysRemaining(inspection)?.isOverdue"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                >
                  <XCircle class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
                <div
                  v-else-if="getDaysRemaining(inspection)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                >
                  <Clock class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
              </div>

              <p class="text-sm text-gray-500 mb-3 line-clamp-1">
                {{ inspection.description }}
              </p>

              <div class="flex items-center gap-4 text-xs text-gray-500">
                <div class="flex items-center gap-1">
                  <MapPin class="w-3.5 h-3.5" />
                  {{ inspection.location }}
                </div>
                <div v-if="inspection.dispatches?.[0]">
                  接收人：{{ inspection.dispatches[0].receiverName }}
                </div>
                <div>
                  发现时间：{{ formatDate(inspection.discoveryTime) }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <div class="w-48">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>整改进度</span>
                  <span class="font-medium text-gray-700">{{ getProgressPercentage(inspection) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    :class="[
                      getProgressPercentage(inspection) === 100 ? 'bg-green-500' :
                      getProgressPercentage(inspection) >= 75 ? 'bg-blue-500' :
                      getProgressPercentage(inspection) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    ]"
                    :style="{ width: `${getProgressPercentage(inspection)}%` }"
                  ></div>
                </div>
              </div>

              <ChevronRight class="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
