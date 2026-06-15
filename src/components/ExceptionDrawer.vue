<script setup lang="ts">import { ref, computed, watch } from 'vue';
import type { Review, ReviewFollowUp, Compensation } from '@/types';
import { cleaners, customers, orders } from '@/data/mockData';
import { useReviewsStore } from '@/stores/reviews';
const props = defineProps<{
 review: Review;
 visible: boolean;
}>();
const emit = defineEmits<{
 (e: 'close'): void;
 (e: 'submit'): void;
}>();
const store = useReviewsStore();
const cleaner = computed(() => cleaners.find(c => c.id === props.review.cleanerId));
const customer = computed(() => customers.find(c => c.id === props.review.customerId));
const order = computed(() => orders.find(o => o.id === props.review.orderId));
const followUps = computed(() => store.getFollowUpsByReviewId(props.review.id));
const compensation = computed(() => store.getCompensationByReviewId(props.review.id));
const submittedBy = ref('客服小王');
const content = ref('');
const actionTaken = ref('电话回访');
const actionOptions = [
 { value: '电话回访', label: '电话回访' },
 { value: '短信通知', label: '短信通知' },
 { value: '上门沟通', label: '上门沟通' },
 { value: '道歉+补偿', label: '道歉+补偿' },
 { value: '记录问题', label: '记录问题' },
];
const showCompensationForm = ref(false);
const compensationAmount = ref(0);
const compensationType = ref('refund');
const compensationDescription = ref('');
const compensationTypes = [
 { value: 'refund', label: '退款' },
 { value: 'discount', label: '折扣券' },
 { value: 'service', label: '免费服务' },
 { value: 'gift', label: '礼品' },
];
const categoryLabels: Record<string, string> = {
 service: '服务内容',
 attitude: '服务态度',
 timeliness: '准时性',
 quality: '服务质量',
 other: '其他'
};
const statusLabels: Record<string, {
 text: string;
 color: string;
}> = {
 pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-800' },
 reviewed: { text: '已回访', color: 'bg-blue-100 text-blue-800' },
 resolved: { text: '已解决', color: 'bg-green-100 text-green-800' }
};
const followUpStatusLabels: Record<string, {
 text: string;
 color: string;
}> = {
 pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-800' },
 processing: { text: '处理中', color: 'bg-blue-100 text-blue-800' },
 completed: { text: '已完成', color: 'bg-green-100 text-green-800' }
};
const compensationStatusLabels: Record<string, {
 text: string;
 color: string;
}> = {
 pending: { text: '待审批', color: 'bg-yellow-100 text-yellow-800' },
 approved: { text: '已批准', color: 'bg-green-100 text-green-800' },
 rejected: { text: '已拒绝', color: 'bg-red-100 text-red-800' },
 processed: { text: '已处理', color: 'bg-blue-100 text-blue-800' }
};
const handleSubmitFollowUp = () => {
 if (!content.value.trim())
 return;
 const newFollowUp = store.createFollowUp(props.review.id, submittedBy.value, content.value, actionTaken.value);
 content.value = '';
 showCompensationForm.value = true;
};
const handleSubmitCompensation = () => {
 if (!compensationAmount.value || !compensationDescription.value.trim())
 return;
 const latestFollowUp = [...followUps.value].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
 store.createCompensation(props.review.id, latestFollowUp?.id || '', compensationAmount.value, compensationType.value, compensationDescription.value);
 showCompensationForm.value = false;
 compensationAmount.value = 0;
 compensationDescription.value = '';
};
watch(() => props.visible, (newVal) => {
 if (newVal) {
 content.value = '';
 showCompensationForm.value = false;
 }
});
</script>

<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 z-50 flex justify-end"
  >
    <div class="absolute inset-0 bg-black/50" @click="emit('close')"></div>
    
    <div class="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
      <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">差评详情与处理</h2>
        <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-6">
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">差评信息</h3>
          <div class="bg-red-50 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-600">订单号: {{ review.orderId }}</span>
                <span :class="['px-2 py-1 rounded-full text-xs font-medium', statusLabels[review.status].color]">
                  {{ statusLabels[review.status].text }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span v-for="i in 5" :key="i" class="text-yellow-500">{{ i <= review.rating ? '★' : '☆' }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-600">{{ categoryLabels[review.category] }}</span>
              <span class="text-sm text-gray-500">{{ review.createdAt }}</span>
            </div>
            <p class="text-gray-800">{{ review.content }}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-500 mb-1">客户信息</div>
            <div class="font-medium">{{ customer?.name }} {{ customer?.phone }}</div>
            <div class="text-sm text-gray-500">{{ customer?.address }}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-500 mb-1">服务阿姨</div>
            <div class="font-medium">{{ cleaner?.name }} {{ cleaner?.phone }}</div>
            <div class="text-sm text-gray-500">评分: {{ cleaner?.rating }} | 完成订单: {{ cleaner?.completedOrders }}</div>
          </div>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="text-sm text-gray-500 mb-1">服务信息</div>
          <div class="flex flex-wrap gap-4 text-sm">
            <span><strong>服务类型:</strong> {{ order?.serviceType }}</span>
            <span><strong>服务日期:</strong> {{ order?.date }}</span>
            <span><strong>服务时间:</strong> {{ order?.startTime }}-{{ order?.endTime }}</span>
            <span><strong>服务地址:</strong> {{ order?.address }}</span>
            <span><strong>订单金额:</strong> ¥{{ order?.totalAmount }}</span>
          </div>
        </div>
        
        <div v-if="followUps.length > 0" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-3">历史回访记录</h3>
          <div class="space-y-3">
            <div v-for="followUp in followUps" :key="followUp.id" class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <span class="text-sm font-medium text-gray-700">{{ followUp.submittedBy }}</span>
                <span :class="['px-2 py-1 rounded-full text-xs font-medium', followUpStatusLabels[followUp.status].color]">
                  {{ followUpStatusLabels[followUp.status].text }}
                </span>
              </div>
              <div class="text-sm text-gray-500 mb-1">{{ followUp.submittedAt }}</div>
              <div class="text-sm text-gray-600 mb-2">{{ followUp.content }}</div>
              <div class="flex items-center gap-2 text-xs">
                <span class="text-gray-500">处理方式:</span>
                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{{ followUp.actionTaken }}</span>
                <span v-if="followUp.nextAction" class="text-gray-500">下一步: {{ followUp.nextAction }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="compensation" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-3">补偿记录</h3>
          <div class="border rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-gray-700">补偿ID: {{ compensation.id }}</span>
              <span :class="['px-2 py-1 rounded-full text-xs font-medium', compensationStatusLabels[compensation.status].color]">
                {{ compensationStatusLabels[compensation.status].text }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-gray-500">补偿类型:</span>
                <span class="ml-2">{{ compensationTypes.find(t => t.value === compensation.type)?.label }}</span>
              </div>
              <div>
                <span class="text-gray-500">补偿金额:</span>
                <span class="ml-2 font-medium">¥{{ compensation.amount }}</span>
              </div>
              <div>
                <span class="text-gray-500">描述:</span>
                <span class="ml-2">{{ compensation.description }}</span>
              </div>
              <div>
                <span class="text-gray-500">申请时间:</span>
                <span class="ml-2">{{ compensation.createdAt }}</span>
              </div>
              <div v-if="compensation.approvedBy">
                <span class="text-gray-500">审批人:</span>
                <span class="ml-2">{{ compensation.approvedBy }}</span>
              </div>
              <div v-if="compensation.approvedAt">
                <span class="text-gray-500">审批时间:</span>
                <span class="ml-2">{{ compensation.approvedAt }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="review.status === 'pending'" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-3">提交回访记录</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">处理人</label>
              <select 
                v-model="submittedBy" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="客服小王">客服小王</option>
                <option value="客服小李">客服小李</option>
                <option value="客服小张">客服小张</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">处理方式</label>
              <select 
                v-model="actionTaken" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">回访内容</label>
              <textarea 
                v-model="content" 
                rows="4" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="请输入回访内容..."
              ></textarea>
            </div>
            <button 
              @click="handleSubmitFollowUp"
              :disabled="!content.trim()"
              class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              提交回访记录
            </button>
          </div>
        </div>
        
        <div v-if="showCompensationForm" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-3">申请补偿</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">补偿类型</label>
              <select 
                v-model="compensationType" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="opt in compensationTypes" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">补偿金额</label>
              <div class="flex items-center">
                <span class="text-gray-500 mr-2">¥</span>
                <input 
                  v-model.number="compensationAmount" 
                  type="number" 
                  min="0"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入补偿金额"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">补偿说明</label>
              <textarea 
                v-model="compensationDescription" 
                rows="3" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="请输入补偿说明..."
              ></textarea>
            </div>
            <div class="flex gap-3">
              <button 
                @click="showCompensationForm = false"
                class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                @click="handleSubmitCompensation"
                :disabled="!compensationAmount || !compensationDescription.trim()"
                class="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                提交补偿申请
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="review.status !== 'pending'" class="flex gap-3">
          <button 
            @click="emit('close')"
            class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
