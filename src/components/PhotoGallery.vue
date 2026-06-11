<script setup lang="ts">
import { ref } from 'vue';
import type { Photo } from '../types/index.js';
import { X, ZoomIn } from 'lucide-vue-next';

interface Props {
  photos: Photo[];
}

defineProps<Props>();

const selectedPhoto = ref<Photo | null>(null);

function openLightbox(photo: Photo) {
  selectedPhoto.value = photo;
}

function closeLightbox() {
  selectedPhoto.value = null;
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="group relative aspect-video rounded-lg overflow-hidden cursor-pointer bg-gray-100"
      @click="openLightbox(photo)"
    >
      <img
        :src="photo.thumbnailUrl"
        :alt="photo.description || '现场照片'"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
        <ZoomIn class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <p
        v-if="photo.description"
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 truncate"
      >
        {{ photo.description }}
      </p>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="selectedPhoto"
      class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      @click.self="closeLightbox"
    >
      <button
        @click="closeLightbox"
        class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      >
        <X class="w-8 h-8" />
      </button>
      <div class="max-w-5xl max-h-full">
        <img
          :src="selectedPhoto.url"
          :alt="selectedPhoto.description || '现场照片'"
          class="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        <p v-if="selectedPhoto.description" class="text-white text-center mt-4">
          {{ selectedPhoto.description }}
        </p>
      </div>
    </div>
  </Teleport>
</template>
