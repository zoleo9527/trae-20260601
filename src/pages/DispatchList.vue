<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Send,
  Calendar,
  User,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  Users
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';
import { RiskLevelLabel, InspectionStatusLabel, RiskLevel, InspectionStatus } from '../types/index.js';
import RiskBadge from '@/components/RiskBadge.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import dayjs from 'dayjs';

const router = useRouter();
const store = useInspectionStore();

const searchKeyword = ref('');
const overdueFilter = ref<'all' | 'overdue' | 'normal'>('all');
const assigneeFilter = ref<string>('all');

async function loadData() {
  await store.fetchDispatches();
  await store.fetchInspections();
}

function viewDetail(inspectionId: string) {
  router.push(`/inspections/${inspectionId}`);
}

const assigneeOptions = computed(() => {
  const names = new Set<string>();
  store.dispatches.forEach(d => names.add(d.receiverName));
  return Array.from(names);
});

const ASSIGNEE_NEED_REMIND: InspectionStatus[] = [
  InspectionStatus.DISPATCHED,
  InspectionStatus.IN_PROGRESS
];

const filteredDispatches = computed(() => {
  let list = store.dispatches;

  if (overdueFilter.value !== 'all') {
    list = list.filter(d => {
      const status = getDispatchStatus(d);
      const needRemind = ASSIGNEE_NEED_REMIND.includes(status);
      if (overdueFilter.value === 'overdue') return needRemind && isOverdue(d);
      if (overdueFilter.value === 'normal') return needRemind && !isOverdue(d);
      return needRemind;
    });
  }

  if (assigneeFilter.value !== 'all') {
    list = list.filter(d => d.receiverName === assigneeFilter.value);
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(
      d =>
        d.dispatcherName.toLowerCase().includes(keyword) ||
        d.receiverName.toLowerCase().includes(keyword) ||
        d.dispatchRemark.toLowerCase().includes(keyword)
    );
  }

  return list;
});

function getDispatchStatus(dispatch: any): InspectionStatus {
  const inspection = store.inspections.find(i => i.id === dispatch.inspectionId);
  return (inspection?.status as InspectionStatus) || InspectionStatus.DISPATCHED;
}

function getInspectionInfo(inspectionId: string) {
  return store.inspections.find(i => i.id === inspectionId);
}

function formatDate(dateStr: string) {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
}

function needRemind(dispatch: any): boolean {
  return ASSIGNEE_NEED_REMIND.includes(getDispatchStatus(dispatch));
}

function isOverdue(dispatch: any) {
  if (!needRemind(dispatch)) return false;
  if (!dispatch.expectedCompletionTime) return false;
  return dayjs().isAfter(dayjs(dispatch.expectedCompletionTime));
}

function getOverdueDays(dispatch: any): number | null {
  if (!isOverdue(dispatch)) return null;
  return Math.ceil(dayjs().diff(dayjs(dispatch.expectedCompletionTime), 'day', true));
}

function getUrgencyClass(dispatch: any) {
  if (!needRemind(dispatch) || !isOverdue(dispatch)) return '';
  const days = getOverdueDays(dispatch) || 0;
  if (days >= 7) return 'border-red-500 bg-red-50 ring-2 ring-red-100';
  if (days >= 3) return 'border-red-400 bg-red-50';
  return 'border-orange-400 bg-orange-50';
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">派发记录</h2>
        <div
          v-if="overdueFilter !== 'all' || assigneeFilter !== 'all'"
          class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full"
        >
          已筛选: {{ filteredDispatches.length }} 条
        </div>
      </div>
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索派发人、接收人、备注..."
          class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
        />
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
        <AlertTriangle class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-600 font-medium">逾期状态：</span>
        <select
          v-model="overdueFilter"
          class="text-sm border-none focus:ring-0 bg-transparent text-gray-700 cursor-pointer"
        >
          <option value="all">全部</option>
          <option value="overdue">已逾期</option>
          <option value="normal">正常（未逾期）</option>
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

    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
    </div>

    <div v-else-if="filteredDispatches.length === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Send class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-800 mb-2">暂无匹配的派发记录</h3>
      <p class="text-gray-500">请尝试调整筛选条件</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="dispatch in filteredDispatches"
        :key="dispatch.id"
        class="bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-lg transition-all duration-300"
        :class="getUrgencyClass(dispatch)"
      >
        <div
          v-if="isOverdue(dispatch)"
          class="px-5 py-2 flex items-center justify-between text-sm font-semibold"
          :class="(getOverdueDays(dispatch) || 0) >= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'"
        >
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4" />
            <span>已逾期 {{ getOverdueDays(dispatch) }} 天</span>
          </div>
          <span class="text-xs opacity-80">请尽快催办</span>
        </div>
        <div class="p-5">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3 flex-wrap">
                <h3 class="font-semibold text-gray-800 text-lg">
                  {{ getInspectionInfo(dispatch.inspectionId)?.facilityName || '未知设施' }}
                </h3>
                <RiskBadge :level="(getInspectionInfo(dispatch.inspectionId)?.riskLevel as RiskLevel) || RiskLevel.LOW" />
                <StatusBadge :status="getDispatchStatus(dispatch)" />
              </div>

              <p class="text-gray-600 mb-4">
                {{ getInspectionInfo(dispatch.inspectionId)?.description || dispatch.dispatchRemark }}
              </p>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <User class="w-4 h-4 text-gray-400" />
                  <span>派发人：{{ dispatch.dispatcherName }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <Users class="w-4 h-4" :class="isOverdue(dispatch) ? 'text-red-500' : 'text-gray-400'" />
                  <span :class="isOverdue(dispatch) ? 'font-semibold text-red-700' : 'text-gray-500'">责任人：{{ dispatch.receiverName }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  <span>派发时间：{{ formatDate(dispatch.dispatchTime) }}</span>
                </div>
                <div
                  v-if="dispatch.expectedCompletionTime"
                  class="flex items-center gap-2 text-sm"
                  :class="isOverdue(dispatch) ? 'text-red-600 font-semibold' : 'text-gray-500'"
                >
                  <Clock class="w-4 h-4" />
                  <span>预计完成：{{ formatDate(dispatch.expectedCompletionTime) }}</span>
                </div>
              </div>

              <div v-if="dispatch.dispatchRemark" class="mt-3 pt-3 border-t border-gray-100">
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-700">派发备注：</span>
                  {{ dispatch.dispatchRemark }}
                </p>
              </div>

              <div v-if="dispatch.rectificationRemark" class="mt-2">
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-700">整改备注：</span>
                  {{ dispatch.rectificationRemark }}
                </p>
              </div>
            </div>

            <div class="flex lg:flex-col items-center gap-2 lg:gap-3">
              <button
                @click="viewDetail(dispatch.inspectionId)"
                class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                查看详情
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
