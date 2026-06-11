<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Search,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Eye
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';
import { InspectionStatus } from '../types/index.js';
import RiskBadge from '@/components/RiskBadge.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import ReviewModal from '@/components/ReviewModal.vue';
import dayjs from 'dayjs';

const router = useRouter();
const store = useInspectionStore();

const searchKeyword = ref('');
const showReviewModal = ref(false);
const selectedInspectionId = ref<string | null>(null);

async function loadData() {
  await store.fetchPendingReviews();
  await store.fetchInspections();
}

function viewDetail(id: string) {
  router.push(`/inspections/${id}`);
}

function openReviewModal(id: string) {
  selectedInspectionId.value = id;
  showReviewModal.value = true;
}

function handleReviewSuccess() {
  showReviewModal.value = false;
  selectedInspectionId.value = null;
  loadData();
}

const filteredReviews = computed(() => {
  if (!searchKeyword.value) return store.pendingReviews;
  const keyword = searchKeyword.value.toLowerCase();
  return store.pendingReviews.filter(
    i =>
      i.facilityName.toLowerCase().includes(keyword) ||
      i.location.toLowerCase().includes(keyword) ||
      i.description.toLowerCase().includes(keyword)
  );
});

function formatDate(dateStr: string) {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
}

function getDaysPending(inspection: any) {
  const completedLog = inspection.statusLogs?.find(
    (log: any) => log.toStatus === 'completed' || log.toStatus === 'pending_review_after'
  );
  if (!completedLog) return 0;
  return dayjs().diff(dayjs(completedLog.timestamp), 'day');
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">复查入口</h2>
        <p class="text-gray-500 mt-1">
          待复查 <span class="font-semibold text-orange-600">{{ store.pendingReviews.length }}</span> 条隐患
        </p>
      </div>
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索设施名称、位置、描述..."
          class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
        />
      </div>
    </div>

    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
    </div>

    <div v-else-if="filteredReviews.length === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle class="w-8 h-8 text-green-600" />
      </div>
      <h3 class="text-lg font-medium text-gray-800 mb-2">暂无待复查项</h3>
      <p class="text-gray-500">所有隐患整改已完成复查</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div
        v-for="inspection in filteredReviews"
        :key="inspection.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        <div class="relative h-36 bg-gray-100">
          <img
            v-if="inspection.photos.length > 0"
            :src="inspection.photos[0].thumbnailUrl"
            :alt="inspection.facilityName"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span class="text-gray-400 text-sm">暂无照片</span>
          </div>
          <div class="absolute top-3 left-3 flex gap-2">
            <RiskBadge :level="inspection.riskLevel" />
          </div>
          <div class="absolute top-3 right-3">
            <StatusBadge :status="InspectionStatus.PENDING_REVIEW_AFTER" />
          </div>
        </div>

        <div class="p-5">
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-semibold text-gray-800 text-lg">
              {{ inspection.facilityName }}
            </h3>
            <div
              v-if="getDaysPending(inspection) > 2"
              class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full"
            >
              <AlertCircle class="w-3 h-3" />
              待复查 {{ getDaysPending(inspection) }} 天
            </div>
          </div>

          <p class="text-gray-600 text-sm mb-4 line-clamp-2">
            {{ inspection.description }}
          </p>

          <div class="space-y-2 text-xs text-gray-500 mb-5">
            <div class="flex items-center gap-2">
              <MapPin class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ inspection.location }}</span>
            </div>
            <div class="flex items-center gap-2">
              <User class="w-3.5 h-3.5 text-gray-400" />
              <span>发现人：{{ inspection.discovererName }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Calendar class="w-3.5 h-3.5 text-gray-400" />
              <span>发现时间：{{ formatDate(inspection.discoveryTime) }}</span>
            </div>
            <div v-if="inspection.dispatches?.[0]" class="flex items-center gap-2">
              <User class="w-3.5 h-3.5 text-gray-400" />
              <span>整改责任人：{{ inspection.dispatches[0].receiverName }}</span>
            </div>
          </div>

          <div v-if="inspection.dispatches?.[0]?.rectificationRemark" class="mb-5 p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">整改说明</p>
            <p class="text-sm text-gray-700">
              {{ inspection.dispatches[0].rectificationRemark }}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              @click="viewDetail(inspection.id)"
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Eye class="w-4 h-4" />
              查看详情
            </button>
            <button
              @click="openReviewModal(inspection.id)"
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-600/30"
            >
              <CheckCircle class="w-4 h-4" />
              执行复查
            </button>
          </div>
        </div>
      </div>
    </div>

    <ReviewModal
      v-if="selectedInspectionId"
      :show="showReviewModal"
      :inspection-id="selectedInspectionId"
      @close="showReviewModal = false; selectedInspectionId = null"
      @success="handleReviewSuccess"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
