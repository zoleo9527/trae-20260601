<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { X } from 'lucide-vue-next';
import type { CreateDispatchRequest } from '../types/index.js';
import { useInspectionStore } from '@/stores/inspection.js';
import { dispatchApi } from '@/utils/api.js';

interface Props {
  show: boolean;
  inspectionId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  success: [];
}>();

const store = useInspectionStore();
const loading = ref(false);
const receivers = ref<Array<{ id: string; name: string; department: string }>>([]);

const form = reactive({
  receiverId: '',
  dispatchRemark: '',
  expectedCompletionTime: ''
});

watch(() => props.show, (val) => {
  if (val) {
    loadReceivers();
  }
});

async function loadReceivers() {
  try {
    receivers.value = await dispatchApi.getAvailableReceivers();
    if (receivers.value.length > 0) {
      form.receiverId = receivers.value[0].id;
    }
  } catch (error) {
    console.error('加载接收人列表失败', error);
  }
}

async function handleSubmit() {
  if (!form.receiverId || !form.dispatchRemark) {
    alert('请填写完整信息');
    return;
  }

  loading.value = true;
  try {
    const data: CreateDispatchRequest = {
      inspectionId: props.inspectionId,
      receiverId: form.receiverId,
      dispatchRemark: form.dispatchRemark,
      expectedCompletionTime: form.expectedCompletionTime || undefined
    };

    await store.createDispatch(data);
    emit('success');
    handleClose();
  } catch (error) {
    console.error(error);
    alert('派发失败，请重试');
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  form.receiverId = '';
  form.dispatchRemark = '';
  form.expectedCompletionTime = '';
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="handleClose" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-bold text-gray-800">派发隐患</h3>
            <button
              @click="handleClose"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X class="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div class="p-6">
            <div class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">派发至</label>
                <select
                  v-model="form.receiverId"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                >
                  <option v-for="r in receivers" :key="r.id" :value="r.id">
                    {{ r.name }}（{{ r.department }}）
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">预计完成时间</label>
                <input
                  v-model="form.expectedCompletionTime"
                  type="datetime-local"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">派发说明</label>
                <textarea
                  v-model="form.dispatchRemark"
                  rows="3"
                  placeholder="请输入整改要求和说明..."
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              @click="handleClose"
              class="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="button"
              @click="handleSubmit"
              :disabled="loading"
              class="px-5 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">派发中...</span>
              <span v-else>确认派发</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(20px);
}
</style>
