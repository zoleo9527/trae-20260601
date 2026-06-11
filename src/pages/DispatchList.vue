<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Send,
  Calendar,
  User,
  Clock,
  AlertCircle,
  ChevronRight,
  Search
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';
import { RiskLevelLabel, InspectionStatusLabel, RiskLevel, InspectionStatus } from '../types/index.js';
import RiskBadge from '@/components/RiskBadge.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import dayjs from 'dayjs';

const router = useRouter();
const store = useInspectionStore();

const searchKeyword = ref('');

async function loadData() {
  await store.fetchDispatches();
}

function viewDetail(inspectionId: string) {
  router.push(`/inspections/${inspectionId}`);
}

const filteredDispatches = computed(() => {
  if (!searchKeyword.value) return store.dispatches;
  const keyword = searchKeyword.value.toLowerCase();
  return store.dispatches.filter(
    d =>
      d.dispatcherName.toLowerCase().includes(keyword) ||
      d.receiverName.toLowerCase().includes(keyword) ||
      d.dispatchRemark.toLowerCase().includes(keyword)
  );
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

function isOverdue(dispatch: any) {
  if (!dispatch.expectedCompletionTime) return false;
  const status = getDispatchStatus(dispatch);
  if (status === 'passed' || status === 'completed') return false;
  return dayjs().isAfter(dayjs(dispatch.expectedCompletionTime));
}

onMounted(() => {
  loadData();
  store.fetchInspections();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 class="text-2xl font-bold text-gray-800">派发记录</h2>
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

    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
    </div>

    <div v-else-if="filteredDispatches.length === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Send class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-800 mb-2">暂无派发记录</h3>
      <p class="text-gray-500">隐患派发后将在此处显示</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="dispatch in filteredDispatches"
        :key="dispatch.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        <div class="p-5">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <h3 class="font-semibold text-gray-800 text-lg">
                  {{ getInspectionInfo(dispatch.inspectionId)?.facilityName || '未知设施' }}
                </h3>
                <RiskBadge :level="(getInspectionInfo(dispatch.inspectionId)?.riskLevel as RiskLevel) || RiskLevel.LOW" />
                <StatusBadge :status="getDispatchStatus(dispatch)" />
                <div
                  v-if="isOverdue(dispatch)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                >
                  <AlertCircle class="w-3 h-3" />
                  已逾期
                </div>
              </div>

              <p class="text-gray-600 mb-4">
                {{ getInspectionInfo(dispatch.inspectionId)?.description || dispatch.dispatchRemark }}
              </p>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <User class="w-4 h-4 text-gray-400" />
                  <span>派发人：{{ dispatch.dispatcherName }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <User class="w-4 h-4 text-gray-400" />
                  <span>接收人：{{ dispatch.receiverName }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  <span>派发时间：{{ formatDate(dispatch.dispatchTime) }}</span>
                </div>
                <div
                  v-if="dispatch.expectedCompletionTime"
                  class="flex items-center gap-2 text-sm"
                  :class="isOverdue(dispatch) ? 'text-red-600' : 'text-gray-500'"
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
