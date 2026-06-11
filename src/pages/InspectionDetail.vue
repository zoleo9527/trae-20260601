<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  FileText,
  Camera,
  MessageSquare,
  Users
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';
import type { UpdateDispatchRequest } from '../types/index.js';
import RiskBadge from '@/components/RiskBadge.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import PhotoGallery from '@/components/PhotoGallery.vue';
import StatusTimeline from '@/components/StatusTimeline.vue';
import DispatchModal from '@/components/DispatchModal.vue';
import ReviewModal from '@/components/ReviewModal.vue';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const store = useInspectionStore();

const showDispatchModal = ref(false);
const showReviewModal = ref(false);
const activeTab = ref('info');

const expectedTimeForm = reactive({
  expectedCompletionTime: '',
  remark: ''
});

const dispatchUpdateLoading = ref(false);

const id = computed(() => route.params.id as string);

const NEED_REMIND_STATUS: string[] = ['dispatched', 'in_progress'];

const deadlineInfo = computed(() => {
  const dispatch = store.currentInspection?.dispatches?.[0];
  const inspection = store.currentInspection;
  if (!inspection) return null;

  if (inspection.status === 'passed') {
    return { text: '已复查通过', level: 'done' as const, isOverdue: false, isDone: true, needRemind: false };
  }
  if (inspection.status === 'pending_review_after' || inspection.status === 'completed') {
    return { text: '待复查', level: 'review' as const, isOverdue: false, isDone: true, needRemind: false };
  }
  if (inspection.status === 'rejected') {
    return { text: '复查不通过', level: 'rejected' as const, isOverdue: false, isDone: true, needRemind: false };
  }
  if (inspection.status === 'pending_review') {
    return { text: '等主管审核派发', level: 'review' as const, isOverdue: false, isDone: false, needRemind: false };
  }

  // 以下为 dispatched / in_progress（需要催办的状态）
  if (!dispatch?.expectedCompletionTime) {
    return { text: '待设置预计时间', level: 'warning' as const, isOverdue: false, isDone: false, needRemind: true };
  }

  const now = dayjs();
  const expected = dayjs(dispatch.expectedCompletionTime);
  const diff = Math.ceil(expected.diff(now, 'day', true));

  if (diff < 0) {
    const days = Math.abs(diff);
    let level: 'urgent' | 'critical' | 'warning' = 'warning';
    if (days >= 7) level = 'critical';
    else if (days >= 3) level = 'urgent';
    return { text: `已逾期 ${days} 天`, level, isOverdue: true, isDone: false, needRemind: true, days };
  } else if (diff === 0) {
    return { text: '今日到期', level: 'urgent' as const, isOverdue: false, isDone: false, needRemind: true, days: 0 };
  } else if (diff <= 2) {
    return { text: `剩余 ${diff} 天`, level: 'urgent' as const, isOverdue: false, isDone: false, needRemind: true, days: diff };
  } else {
    return { text: `剩余 ${diff} 天`, level: 'normal' as const, isOverdue: false, isDone: false, needRemind: true, days: diff };
  }
});

function deadlineBannerClass(info: any) {
  if (!info) return '';
  switch (info.level) {
    case 'critical': return 'bg-red-100 border-red-500 text-red-800 ring-2 ring-red-100';
    case 'urgent': return 'bg-orange-100 border-orange-400 text-orange-800';
    case 'warning': return 'bg-yellow-50 border-yellow-400 text-yellow-800';
    case 'done': return 'bg-emerald-50 border-emerald-400 text-emerald-800';
    case 'review': return 'bg-sky-50 border-sky-400 text-sky-800';
    case 'rejected': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    case 'normal': return 'bg-green-50 border-green-400 text-green-800';
    default: return 'bg-gray-50 border-gray-200 text-gray-600';
  }
}

function deadlineIcon(info: any) {
  if (!info) return Clock;
  if (info.level === 'done') return CheckCircle;
  if (info.level === 'review') return Clock;
  if (info.level === 'rejected') return AlertTriangle;
  if (info.level === 'warning') return AlertTriangle;
  if (info.isOverdue) return XCircle;
  if (info.level === 'urgent') return AlertTriangle;
  return Clock;
}

const RECT_CARD_COLORS: Record<string, { wrap: string; title: string; label: string; value: string; valueBold: string }> = {
  critical: {
    wrap: 'bg-red-50 border-red-200',
    title: 'text-red-800',
    label: 'text-red-600',
    value: 'text-red-800',
    valueBold: 'text-red-800 font-bold'
  },
  urgent: {
    wrap: 'bg-orange-50 border-orange-200',
    title: 'text-orange-800',
    label: 'text-orange-600',
    value: 'text-orange-800',
    valueBold: 'text-orange-800 font-semibold'
  },
  warning: {
    wrap: 'bg-yellow-50 border-yellow-200',
    title: 'text-yellow-800',
    label: 'text-yellow-600',
    value: 'text-yellow-800',
    valueBold: 'text-yellow-800 font-semibold'
  },
  normal: {
    wrap: 'bg-blue-50 border-blue-200',
    title: 'text-blue-800',
    label: 'text-blue-600',
    value: 'text-blue-800',
    valueBold: 'text-blue-800'
  },
  done: {
    wrap: 'bg-emerald-50 border-emerald-200',
    title: 'text-emerald-800',
    label: 'text-emerald-600',
    value: 'text-emerald-800',
    valueBold: 'text-emerald-800'
  },
  review: {
    wrap: 'bg-sky-50 border-sky-200',
    title: 'text-sky-800',
    label: 'text-sky-600',
    value: 'text-sky-800',
    valueBold: 'text-sky-800'
  },
  rejected: {
    wrap: 'bg-yellow-50 border-yellow-300',
    title: 'text-yellow-800',
    label: 'text-yellow-700',
    value: 'text-yellow-900',
    valueBold: 'text-yellow-900 font-semibold'
  }
};

const rectCardColors = computed(() => {
  const level = deadlineInfo.value?.level || 'normal';
  return RECT_CARD_COLORS[level] || RECT_CARD_COLORS.normal;
});

async function loadData() {
  if (id.value) {
    await store.fetchInspectionById(id.value);
    if (store.currentInspection?.dispatches[0]?.expectedCompletionTime) {
      expectedTimeForm.expectedCompletionTime = store.currentInspection.dispatches[0].expectedCompletionTime.replace(' ', 'T').slice(0, 16);
    }
  }
}

function goBack() {
  router.back();
  store.clearCurrentInspection();
}

async function handleDispatchSuccess() {
  await loadData();
}

async function handleReviewSuccess() {
  await loadData();
}

async function updateExpectedTime() {
  if (!store.currentInspection?.dispatches[0]?.id || !expectedTimeForm.expectedCompletionTime) {
    alert('请填写预计完成时间');
    return;
  }

  dispatchUpdateLoading.value = true;
  try {
    const data: UpdateDispatchRequest = {
      expectedCompletionTime: expectedTimeForm.expectedCompletionTime.replace('T', ' '),
      rectificationRemark: expectedTimeForm.remark || undefined
    };
    await store.updateDispatch(store.currentInspection.dispatches[0].id, data);
    expectedTimeForm.remark = '';
  } catch (error) {
    console.error(error);
    alert('更新失败');
  } finally {
    dispatchUpdateLoading.value = false;
  }
}

async function markInProgress() {
  if (!store.currentInspection?.dispatches[0]?.id) return;

  dispatchUpdateLoading.value = true;
  try {
    const data: UpdateDispatchRequest = {
      isStarted: true,
      rectificationRemark: expectedTimeForm.remark || '已开始整改工作'
    };
    await store.updateDispatch(store.currentInspection.dispatches[0].id, data);
    expectedTimeForm.remark = '';
  } catch (error) {
    console.error(error);
    alert('操作失败');
  } finally {
    dispatchUpdateLoading.value = false;
  }
}

async function markCompleted() {
  if (!store.currentInspection?.dispatches[0]?.id || !expectedTimeForm.remark) {
    alert('请填写整改说明');
    return;
  }

  dispatchUpdateLoading.value = true;
  try {
    const data: UpdateDispatchRequest = {
      isCompleted: true,
      rectificationRemark: expectedTimeForm.remark
    };
    await store.updateDispatch(store.currentInspection.dispatches[0].id, data);
    expectedTimeForm.remark = '';
  } catch (error) {
    console.error(error);
    alert('操作失败');
  } finally {
    dispatchUpdateLoading.value = false;
  }
}

const canDispatch = computed(() => {
  return store.currentInspection?.status === 'pending_review';
});

const canSetExpectedTime = computed(() => {
  return store.currentInspection?.status === 'dispatched';
});

const canStartRectification = computed(() => {
  return store.currentInspection?.status === 'dispatched' && store.currentInspection?.dispatches[0]?.expectedCompletionTime;
});

const canComplete = computed(() => {
  return store.currentInspection?.status === 'in_progress';
});

const canReview = computed(() => {
  return store.currentInspection?.status === 'pending_review_after';
});

onMounted(() => {
  loadData();
});

watch(() => route.params.id, () => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <button
      @click="goBack"
      class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft class="w-5 h-5" />
      返回列表
    </button>

    <div
      v-if="store.currentInspection && deadlineInfo"
      class="rounded-xl border-2 px-5 py-4 flex items-center justify-between"
      :class="deadlineBannerClass(deadlineInfo)"
    >
      <div class="flex items-center gap-3">
        <component :is="deadlineIcon(deadlineInfo)" class="w-6 h-6" />
        <div>
          <p class="font-bold text-lg">
            {{ deadlineInfo.text }}
          </p>
          <p v-if="store.currentInspection.dispatches?.[0]" class="text-sm opacity-80">
            截止时间：{{ store.currentInspection.dispatches[0].expectedCompletionTime || '未设置' }}
            <span v-if="store.currentInspection.dispatches[0].receiverName" class="ml-3">
              责任人：{{ store.currentInspection.dispatches[0].receiverName }}
            </span>
          </p>
          <p v-else class="text-sm opacity-80">
            尚未派发给物业联系人
          </p>
        </div>
      </div>
      <div v-if="deadlineInfo.needRemind && deadlineInfo.isOverdue" class="text-right">
        <span class="text-sm font-semibold px-3 py-1 rounded-full bg-white bg-opacity-50">
          请尽快催办
        </span>
      </div>
    </div>

    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
    </div>

    <div v-else-if="!store.currentInspection" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
      <AlertTriangle class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-800 mb-2">记录不存在</h3>
      <p class="text-gray-500">该抽检记录可能已被删除或不存在</p>
    </div>

    <template v-else>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6 border-b border-gray-100">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-3">
                <h1 class="text-2xl font-bold text-gray-800">{{ store.currentInspection.facilityName }}</h1>
                <RiskBadge :level="store.currentInspection.riskLevel" />
                <StatusBadge :status="store.currentInspection.status" />
              </div>
              <p class="text-gray-600">{{ store.currentInspection.description }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="canDispatch"
                @click="showDispatchModal = true"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Send class="w-4 h-4" />
                派发隐患
              </button>
              <button
                v-if="canReview"
                @click="showReviewModal = true"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <CheckCircle class="w-4 h-4" />
                执行复查
              </button>
            </div>
          </div>
        </div>

        <div class="border-b border-gray-200">
          <nav class="flex">
            <button
              v-for="tab in [
                { key: 'info', label: '基本信息', icon: FileText },
                { key: 'photos', label: '现场照片', icon: Camera },
                { key: 'dispatches', label: '派发记录', icon: Send },
                { key: 'timeline', label: '状态流转', icon: Clock }
              ]"
              :key="tab.key"
              @click="activeTab = tab.key"
              :class="[
                'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <div class="p-6">
          <div v-show="activeTab === 'info'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center gap-3 text-gray-600 mb-1">
                  <MapPin class="w-5 h-5 text-gray-400" />
                  <span class="text-sm">具体位置</span>
                </div>
                <p class="font-medium text-gray-800">{{ store.currentInspection.location }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center gap-3 text-gray-600 mb-1">
                  <FileText class="w-5 h-5 text-gray-400" />
                  <span class="text-sm">设施类型</span>
                </div>
                <p class="font-medium text-gray-800">{{ store.currentInspection.facilityType }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center gap-3 text-gray-600 mb-1">
                  <Calendar class="w-5 h-5 text-gray-400" />
                  <span class="text-sm">发现时间</span>
                </div>
                <p class="font-medium text-gray-800">{{ store.currentInspection.discoveryTime }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center gap-3 text-gray-600 mb-1">
                  <User class="w-5 h-5 text-gray-400" />
                  <span class="text-sm">发现人</span>
                </div>
                <p class="font-medium text-gray-800">{{ store.currentInspection.discovererName }}</p>
              </div>
            </div>

            <div
              v-if="store.currentInspection.dispatches.length > 0"
              class="rounded-lg p-5 border"
              :class="rectCardColors.wrap"
            >
              <h3
                class="font-semibold mb-4 flex items-center gap-2"
                :class="rectCardColors.title"
              >
                <Wrench class="w-5 h-5" />
                整改信息
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span class="text-sm" :class="rectCardColors.label">派发人</span>
                  <p class="font-medium" :class="rectCardColors.value">{{ store.currentInspection.dispatches[0].dispatcherName }}</p>
                </div>
                <div>
                  <span class="text-sm" :class="rectCardColors.label">接收人（责任人）</span>
                  <p class="font-medium" :class="rectCardColors.value">{{ store.currentInspection.dispatches[0].receiverName }}</p>
                </div>
                <div>
                  <span class="text-sm" :class="rectCardColors.label">派发时间</span>
                  <p class="font-medium" :class="rectCardColors.value">{{ store.currentInspection.dispatches[0].dispatchTime }}</p>
                </div>
                <div>
                  <span class="text-sm" :class="rectCardColors.label">预计完成时间</span>
                  <p class="font-medium" :class="rectCardColors.valueBold">{{ store.currentInspection.dispatches[0].expectedCompletionTime || '待设置' }}</p>
                </div>
              </div>
              <div class="mb-4">
                <span class="text-sm" :class="rectCardColors.label">派发要求</span>
                <p class="font-medium" :class="rectCardColors.value">{{ store.currentInspection.dispatches[0].dispatchRemark }}</p>
              </div>
              <div v-if="store.currentInspection.dispatches[0].rectificationRemark">
                <span class="text-sm" :class="rectCardColors.label">整改说明</span>
                <p class="font-medium" :class="rectCardColors.value">{{ store.currentInspection.dispatches[0].rectificationRemark }}</p>
              </div>
            </div>

            <div
              v-if="store.currentInspection.reviewResult"
              class="rounded-lg p-5 border"
              :class="store.currentInspection.reviewResult === 'pass'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'"
            >
              <h3
                class="font-semibold mb-4 flex items-center gap-2"
                :class="store.currentInspection.reviewResult === 'pass'
                  ? 'text-emerald-800'
                  : 'text-red-800'"
              >
                <component
                  :is="store.currentInspection.reviewResult === 'pass' ? CheckCircle : XCircle"
                  class="w-5 h-5"
                />
                {{ store.currentInspection.reviewResult === 'pass' ? '复查通过' : '复查不通过' }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span
                    class="text-sm"
                    :class="store.currentInspection.reviewResult === 'pass' ? 'text-emerald-600' : 'text-red-600'"
                  >复查人</span>
                  <p
                    class="font-medium"
                    :class="store.currentInspection.reviewResult === 'pass' ? 'text-emerald-800' : 'text-red-800'"
                  >{{ store.currentInspection.reviewerName }}</p>
                </div>
                <div>
                  <span
                    class="text-sm"
                    :class="store.currentInspection.reviewResult === 'pass' ? 'text-emerald-600' : 'text-red-600'"
                  >复查时间</span>
                  <p
                    class="font-medium"
                    :class="store.currentInspection.reviewResult === 'pass' ? 'text-emerald-800' : 'text-red-800'"
                  >{{ store.currentInspection.reviewTime }}</p>
                </div>
              </div>
              <div v-if="store.currentInspection.reviewRemark">
                <span
                  class="text-sm"
                  :class="store.currentInspection.reviewResult === 'pass' ? 'text-emerald-600' : 'text-red-600'"
                >复查意见</span>
                <p
                  class="font-medium"
                  :class="store.currentInspection.reviewResult === 'pass' ? 'text-emerald-800' : 'text-red-800'"
                >{{ store.currentInspection.reviewRemark }}</p>
              </div>
            </div>

            <div v-if="canSetExpectedTime || canStartRectification || canComplete" class="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
              <h3 class="font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                <MessageSquare class="w-5 h-5" />
                物业操作
              </h3>

              <div v-if="canSetExpectedTime" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-yellow-700 mb-1.5">设置预计完成时间</label>
                  <input
                    v-model="expectedTimeForm.expectedCompletionTime"
                    type="datetime-local"
                    class="w-full px-3 py-2.5 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-yellow-700 mb-1.5">备注说明</label>
                  <textarea
                    v-model="expectedTimeForm.remark"
                    rows="2"
                    placeholder="填写整改计划或说明..."
                    class="w-full px-3 py-2.5 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                  />
                </div>
                <button
                  @click="updateExpectedTime"
                  :disabled="dispatchUpdateLoading"
                  class="px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50"
                >
                  {{ dispatchUpdateLoading ? '提交中...' : '确认预计时间' }}
                </button>
              </div>

              <div v-if="canStartRectification" class="space-y-4">
                <p class="text-sm text-yellow-700">已设置预计完成时间，可开始整改工作</p>
                <button
                  @click="markInProgress"
                  :disabled="dispatchUpdateLoading"
                  class="px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50"
                >
                  {{ dispatchUpdateLoading ? '操作中...' : '开始整改' }}
                </button>
              </div>

              <div v-if="canComplete" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-yellow-700 mb-1.5">整改完成说明</label>
                  <textarea
                    v-model="expectedTimeForm.remark"
                    rows="3"
                    placeholder="请详细描述整改内容和结果..."
                    class="w-full px-3 py-2.5 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                  />
                </div>
                <button
                  @click="markCompleted"
                  :disabled="dispatchUpdateLoading"
                  class="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {{ dispatchUpdateLoading ? '提交中...' : '提交整改完成' }}
                </button>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'photos'">
            <h3 class="font-semibold text-gray-800 mb-4">现场照片（{{ store.currentInspection.photos.length }}张）</h3>
            <PhotoGallery v-if="store.currentInspection.photos.length > 0" :photos="store.currentInspection.photos" />
            <div v-else class="text-center py-12 text-gray-500">
              <Camera class="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无照片</p>
            </div>
          </div>

          <div v-show="activeTab === 'dispatches'">
            <h3 class="font-semibold text-gray-800 mb-4">派发记录</h3>
            <div v-if="store.currentInspection.dispatches.length > 0" class="space-y-4">
              <div
                v-for="dispatch in store.currentInspection.dispatches"
                :key="dispatch.id"
                class="bg-gray-50 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-800">{{ dispatch.dispatchRemark }}</span>
                  <span class="text-xs text-gray-500">{{ dispatch.dispatchTime }}</span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span class="text-gray-500">派发人：</span>
                    <span class="text-gray-700">{{ dispatch.dispatcherName }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">接收人：</span>
                    <span class="text-gray-700">{{ dispatch.receiverName }}</span>
                  </div>
                  <div v-if="dispatch.expectedCompletionTime">
                    <span class="text-gray-500">预计完成：</span>
                    <span class="text-gray-700">{{ dispatch.expectedCompletionTime }}</span>
                  </div>
                  <div v-if="dispatch.actualCompletionTime">
                    <span class="text-gray-500">实际完成：</span>
                    <span class="text-gray-700">{{ dispatch.actualCompletionTime }}</span>
                  </div>
                </div>
                <div v-if="dispatch.rectificationRemark" class="mt-2 pt-2 border-t border-gray-200">
                  <span class="text-gray-500 text-sm">整改说明：</span>
                  <span class="text-gray-700 text-sm">{{ dispatch.rectificationRemark }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12 text-gray-500">
              <Send class="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无派发记录</p>
            </div>
          </div>

          <div v-show="activeTab === 'timeline'">
            <h3 class="font-semibold text-gray-800 mb-4">状态流转记录</h3>
            <StatusTimeline v-if="store.currentInspection.statusLogs.length > 0" :logs="store.currentInspection.statusLogs" />
            <div v-else class="text-center py-12 text-gray-500">
              <Clock class="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无状态记录</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <DispatchModal
      :show="showDispatchModal"
      :inspection-id="id"
      @close="showDispatchModal = false"
      @success="handleDispatchSuccess"
    />

    <ReviewModal
      :show="showReviewModal"
      :inspection-id="id"
      @close="showReviewModal = false"
      @success="handleReviewSuccess"
    />
  </div>
</template>
