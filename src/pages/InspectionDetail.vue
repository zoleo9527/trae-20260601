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
  Wrench,
  FileText,
  Camera,
  MessageSquare
} from 'lucide-vue-next';
import { useInspectionStore } from '@/stores/inspection.js';
import type { UpdateDispatchRequest } from '../types/index.js';
import RiskBadge from '@/components/RiskBadge.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import PhotoGallery from '@/components/PhotoGallery.vue';
import StatusTimeline from '@/components/StatusTimeline.vue';
import DispatchModal from '@/components/DispatchModal.vue';
import ReviewModal from '@/components/ReviewModal.vue';

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
      rectificationRemark: '已开始整改工作'
    };
    await store.updateDispatch(store.currentInspection.dispatches[0].id, data);
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

            <div v-if="store.currentInspection.dispatches.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h3 class="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <Wrench class="w-5 h-5" />
                整改信息
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span class="text-sm text-blue-600">派发人</span>
                  <p class="font-medium text-blue-800">{{ store.currentInspection.dispatches[0].dispatcherName }}</p>
                </div>
                <div>
                  <span class="text-sm text-blue-600">接收人</span>
                  <p class="font-medium text-blue-800">{{ store.currentInspection.dispatches[0].receiverName }}</p>
                </div>
                <div>
                  <span class="text-sm text-blue-600">派发时间</span>
                  <p class="font-medium text-blue-800">{{ store.currentInspection.dispatches[0].dispatchTime }}</p>
                </div>
                <div>
                  <span class="text-sm text-blue-600">预计完成时间</span>
                  <p class="font-medium text-blue-800">{{ store.currentInspection.dispatches[0].expectedCompletionTime || '待设置' }}</p>
                </div>
              </div>
              <div class="mb-4">
                <span class="text-sm text-blue-600">派发要求</span>
                <p class="font-medium text-blue-800">{{ store.currentInspection.dispatches[0].dispatchRemark }}</p>
              </div>
              <div v-if="store.currentInspection.dispatches[0].rectificationRemark">
                <span class="text-sm text-blue-600">整改说明</span>
                <p class="font-medium text-blue-800">{{ store.currentInspection.dispatches[0].rectificationRemark }}</p>
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
