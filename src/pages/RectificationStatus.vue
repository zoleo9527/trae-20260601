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
  AlertCircle,
  Users,
  Filter
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
const overdueFilter = ref<'all' | 'overdue' | 'urgent' | 'normal'>('all');
const assigneeFilter = ref<string>('all');

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

const assigneeOptions = computed(() => {
  const names = new Set<string>();
  store.sortedInspections.forEach(i => {
    const receiver = i.dispatches?.[0]?.receiverName;
    if (receiver) names.add(receiver);
  });
  return Array.from(names);
});

const NEED_REMIND_STATUS: string[] = ['dispatched', 'in_progress'];

function needRemind(inspection: any): boolean {
  return NEED_REMIND_STATUS.includes(inspection.status);
}

function getDaysRemaining(inspection: any) {
  const dispatch = inspection.dispatches?.[0];

  if (inspection.status === 'passed') {
    return { text: '已复查通过', level: 'done' as const, isOverdue: false, isUrgent: false, isDone: true };
  }
  if (inspection.status === 'completed' || inspection.status === 'pending_review_after') {
    return { text: '待复查', level: 'review' as const, isOverdue: false, isUrgent: false, isDone: true };
  }
  if (inspection.status === 'rejected') {
    return { text: '复查不通过', level: 'rejected' as const, isOverdue: false, isUrgent: false, isDone: true };
  }

  if (!needRemind(inspection) || !dispatch?.expectedCompletionTime) return null;

  const now = dayjs();
  const expected = dayjs(dispatch.expectedCompletionTime);
  const diff = Math.ceil(expected.diff(now, 'day', true));

  if (diff < 0) {
    const days = Math.abs(diff);
    let level: 'critical' | 'urgent' = 'urgent';
    if (days >= 3) level = 'critical';
    return { text: `逾期 ${days} 天`, level, isOverdue: true, isUrgent: false, isDone: false, days };
  } else if (diff === 0) {
    return { text: '今日到期', level: 'urgent' as const, isOverdue: false, isUrgent: true, isDone: false, days: 0 };
  } else if (diff <= 2) {
    return { text: `剩余 ${diff} 天`, level: 'urgent' as const, isOverdue: false, isUrgent: true, isDone: false, days: diff };
  } else {
    return { text: `剩余 ${diff} 天`, level: 'normal' as const, isOverdue: false, isUrgent: false, isDone: false, days: diff };
  }
}

function isOverdue(inspection: any) {
  const dr = getDaysRemaining(inspection);
  return needRemind(inspection) && dr?.isOverdue === true;
}

function isUrgent(inspection: any) {
  const dr = getDaysRemaining(inspection);
  return needRemind(inspection) && dr?.isUrgent === true;
}

function getRowClass(inspection: any) {
  if (!needRemind(inspection)) return '';
  const dr = getDaysRemaining(inspection);
  if (!dr?.isOverdue) return '';
  const days = dr.days || 0;
  if (days >= 7) return 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100';
  if (days >= 3) return 'bg-red-50 border-l-4 border-red-400 hover:bg-red-100';
  return 'bg-orange-50 border-l-4 border-orange-400 hover:bg-orange-100';
}

const filteredInspections = computed(() => {
  let list = store.sortedInspections.filter(i =>
    ['dispatched', 'in_progress', 'completed', 'pending_review_after', 'passed', 'rejected'].includes(i.status)
  );

  if (activeTab.value !== 'all') {
    list = list.filter(i => i.status === activeTab.value);
  }

  if (overdueFilter.value !== 'all') {
    list = list.filter(i => {
      const dr = getDaysRemaining(i);
      if (overdueFilter.value === 'overdue') return needRemind(i) && dr?.isOverdue;
      if (overdueFilter.value === 'urgent') return needRemind(i) && dr?.isUrgent && !dr?.isOverdue;
      if (overdueFilter.value === 'normal') return needRemind(i) && dr && !dr?.isOverdue && !dr?.isUrgent;
      return true;
    });
  }

  if (assigneeFilter.value !== 'all') {
    list = list.filter(i => i.dispatches?.[0]?.receiverName === assigneeFilter.value);
  }

  return list.sort((a, b) => {
    const aRemind = needRemind(a) ? 0 : 1;
    const bRemind = needRemind(b) ? 0 : 1;
    if (aRemind !== bRemind) return aRemind - bRemind;
    const aDr = getDaysRemaining(a);
    const bDr = getDaysRemaining(b);
    const aOverdueDays = aDr?.isOverdue ? aDr.days : -1;
    const bOverdueDays = bDr?.isOverdue ? bDr.days : -1;
    if (aOverdueDays !== bOverdueDays) return bOverdueDays - aOverdueDays;
    const aDays = aDr?.days ?? 999;
    const bDays = bDr?.days ?? 999;
    return aDays - bDays;
  });
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
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">整改状态</h2>
        <div
          v-if="(overdueFilter !== 'all' || assigneeFilter !== 'all' || activeTab !== 'all')"
          class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full"
        >
          已筛选: {{ filteredInspections.length }} 条
        </div>
      </div>
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

      <div class="bg-white rounded-xl p-4 shadow-sm border-2 border-red-200 bg-red-50/30">
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

    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
        <Filter class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-600 font-medium">时间状态：</span>
        <select
          v-model="overdueFilter"
          class="text-sm border-none focus:ring-0 bg-transparent text-gray-700 cursor-pointer"
        >
          <option value="all">全部</option>
          <option value="overdue">已逾期</option>
          <option value="urgent">临近到期（≤2天）</option>
          <option value="normal">正常（>2天）</option>
        </select>
      </div>
      <div class="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
        <Users class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-600 font-medium">责任人：</span>
        <select
          v-model="assigneeFilter"
          class="text-sm border-none focus:ring-0 bg-transparent text-gray-700 cursor-pointer"
        >
          <option value="all">全部</option>
          <option v-for="name in assigneeOptions" :key="name" :value="name">{{ name }}</option>
        </select>
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
        <h3 class="text-lg font-medium text-gray-800 mb-2">暂无匹配的整改记录</h3>
        <p class="text-gray-500">请尝试调整筛选条件</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="inspection in filteredInspections"
          :key="inspection.id"
          class="p-5 transition-colors cursor-pointer"
          :class="getRowClass(inspection) || 'hover:bg-gray-50'"
          @click="viewDetail(inspection.id)"
        >
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2 flex-wrap">
                <h3 class="font-semibold" :class="isOverdue(inspection) ? 'text-red-800' : 'text-gray-800'">
                  {{ inspection.facilityName }}
                </h3>
                <RiskBadge :level="inspection.riskLevel" />
                <StatusBadge :status="inspection.status" />
                <div
                  v-if="isOverdue(inspection)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full"
                >
                  <XCircle class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
                <div
                  v-else-if="isUrgent(inspection)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
                <div
                  v-else-if="getDaysRemaining(inspection)?.level === 'normal'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                >
                  <Clock class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
                <div
                  v-else-if="getDaysRemaining(inspection)?.level === 'done'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"
                >
                  <CheckCircle class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
                <div
                  v-else-if="getDaysRemaining(inspection)?.level === 'review'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full"
                >
                  <AlertCircle class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
                <div
                  v-else-if="getDaysRemaining(inspection)?.level === 'rejected'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ getDaysRemaining(inspection)?.text }}
                </div>
              </div>

              <p class="text-sm text-gray-500 mb-3 line-clamp-1">
                {{ inspection.description }}
              </p>

              <div class="flex items-center gap-4 text-xs flex-wrap">
                <div class="flex items-center gap-1 text-gray-500">
                  <MapPin class="w-3.5 h-3.5" />
                  {{ inspection.location }}
                </div>
                <div
                  v-if="inspection.dispatches?.[0]"
                  class="flex items-center gap-1"
                  :class="isOverdue(inspection) ? 'font-semibold text-red-700' : 'text-gray-500'"
                >
                  <Users class="w-3.5 h-3.5" />
                  责任人：{{ inspection.dispatches[0].receiverName }}
                </div>
                <div class="text-gray-500">
                  发现时间：{{ formatDate(inspection.discoveryTime) }}
                </div>
                <div v-if="inspection.dispatches?.[0]?.expectedCompletionTime" class="text-gray-500">
                  截止：{{ formatDate(inspection.dispatches[0].expectedCompletionTime) }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <div class="w-48">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>整改进度</span>
                  <span class="font-medium" :class="getProgressPercentage(inspection) === 100 ? 'text-green-700' : 'text-gray-700'">{{ getProgressPercentage(inspection) }}%</span>
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

              <ChevronRight class="w-5 h-5" :class="isOverdue(inspection) ? 'text-red-500' : 'text-gray-400'" />
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
