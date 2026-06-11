<script setup lang="ts">
import { ref, reactive } from 'vue';
import { X, Plus, Camera } from 'lucide-vue-next';
import type { CreateInspectionRequest, RiskLevel } from '../types/index.js';
import { RiskLevelLabel } from '../types/index.js';
import { useInspectionStore } from '@/stores/inspection.js';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  success: [];
}>();

const store = useInspectionStore();
const loading = ref(false);

const form = reactive({
  facilityType: '',
  facilityName: '',
  location: '',
  riskLevel: 'medium' as RiskLevel,
  description: ''
});

const photos = ref<Array<{ url: string; thumbnailUrl: string; description: string }>>([]);

const facilityTypes = ['灭火器', '消防栓', '消防通道', '喷淋系统', '烟感探测器', '应急照明', '疏散指示标志', '防火门', '其他'];

function addPhoto() {
  const seed = `photo-${Date.now()}`;
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
  if (!form.facilityType || !form.facilityName || !form.location || !form.description) {
    alert('请填写完整信息');
    return;
  }

  loading.value = true;
  try {
    const data: CreateInspectionRequest = {
      facilityType: form.facilityType,
      facilityName: form.facilityName,
      location: form.location,
      riskLevel: form.riskLevel,
      description: form.description,
      photos: photos.value
    };

    await store.createInspection(data);
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
  form.facilityType = '';
  form.facilityName = '';
  form.location = '';
  form.riskLevel = 'medium' as RiskLevel;
  form.description = '';
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
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-bold text-gray-800">新增抽检记录</h3>
            <button
              @click="handleClose"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X class="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div class="space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">设施类型</label>
                  <select
                    v-model="form.facilityType"
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  >
                    <option value="">请选择</option>
                    <option v-for="type in facilityTypes" :key="type" :value="type">{{ type }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">风险等级</label>
                  <select
                    v-model="form.riskLevel"
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  >
                    <option v-for="(label, key) in RiskLevelLabel" :key="key" :value="key">
                      {{ label }}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">设施名称</label>
                <input
                  v-model="form.facilityName"
                  type="text"
                  placeholder="例如：干粉灭火器 MFZ/ABC4"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">具体位置</label>
                <input
                  v-model="form.location"
                  type="text"
                  placeholder="例如：A栋1层走廊西侧"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">问题描述</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  placeholder="请详细描述发现的问题..."
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-sm font-medium text-gray-700">现场照片</label>
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
                    <input
                      v-model="photo.description"
                      type="text"
                      placeholder="照片描述"
                      class="mt-1.5 w-full px-2 py-1 text-xs border border-gray-200 rounded"
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
                  class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-300 transition-colors cursor-pointer"
                  @click="addPhoto"
                >
                  <Camera class="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p class="text-sm text-gray-500">点击添加现场照片</p>
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
              class="px-5 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="loading">提交中...</span>
              <span v-else>提交抽检</span>
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
