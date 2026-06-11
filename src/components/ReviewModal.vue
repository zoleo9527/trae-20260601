<script setup lang="ts">
import { ref, reactive } from 'vue';
import { X, Camera, Plus } from 'lucide-vue-next';
import type { ReviewRequest } from '../types/index.js';
import { useInspectionStore } from '@/stores/inspection.js';

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

const form = reactive({
  result: 'pass' as 'pass' | 'fail',
  remark: ''
});

const photos = ref<Array<{ url: string; thumbnailUrl: string; description: string }>>([]);

function addPhoto() {
  const seed = `review-${Date.now()}`;
  photos.value.push({
    url: `https://picsum.photos/seed/${seed}/800/600`,
    thumbnailUrl: `https://picsum.photos/seed/${seed}/200/150`,
    description: ''
  });
}

function removePhoto(index: number) {
  photos.value.splice(index, 1);
}

async function handleSubmit() {
  if (!form.remark) {
    alert('请填写复查说明');
    return;
  }

  loading.value = true;
  try {
    const data: ReviewRequest = {
      inspectionId: props.inspectionId,
      result: form.result,
      remark: form.remark,
      photos: photos.value
    };

    await store.submitReview(data);
    emit('success');
    handleClose();
  } catch (error) {
    console.error(error);
    alert('提交失败，请重试');
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  form.result = 'pass';
  form.remark = '';
  photos.value = [];
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
            <h3 class="text-lg font-bold text-gray-800">复查确认</h3>
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
                <label class="block text-sm font-medium text-gray-700 mb-3">复查结果</label>
                <div class="grid grid-cols-2 gap-3">
                  <label
                    :class="[
                      'flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                      form.result === 'pass'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    ]"
                  >
                    <input
                      type="radio"
                      v-model="form.result"
                      value="pass"
                      class="sr-only"
                    />
                    <span class="font-medium">复查通过</span>
                  </label>
                  <label
                    :class="[
                      'flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                      form.result === 'fail'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    ]"
                  >
                    <input
                      type="radio"
                      v-model="form.result"
                      value="fail"
                      class="sr-only"
                    />
                    <span class="font-medium">需要整改</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">复查说明</label>
                <textarea
                  v-model="form.remark"
                  rows="3"
                  placeholder="请详细描述复查结果..."
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-sm font-medium text-gray-700">复查照片</label>
                  <button
                    type="button"
                    @click="addPhoto"
                    class="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    <Plus class="w-4 h-4" />
                    添加照片
                  </button>
                </div>
                <div v-if="photos.length > 0" class="grid grid-cols-3 gap-3">
                  <div
                    v-for="(photo, index) in photos"
                    :key="index"
                    class="relative group"
                  >
                    <img
                      :src="photo.thumbnailUrl"
                      class="w-full aspect-video object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      @click="removePhoto(index)"
                      class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div
                  v-else
                  class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-300 transition-colors cursor-pointer"
                  @click="addPhoto"
                >
                  <Camera class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p class="text-sm text-gray-500">点击添加复查照片</p>
                </div>
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
              :class="[
                'px-5 py-2.5 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed',
                form.result === 'pass' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              ]"
            >
              <span v-if="loading">提交中...</span>
              <span v-else>确认提交</span>
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
