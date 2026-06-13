<template>
  <MainLayout :title="terminology?.sourceTerm || '术语详情'" subtitle="查看术语维护详情">
    <template #header-actions>
      <ActionButton
        variant="secondary"
        icon="ArrowLeft"
        @click="goBack"
      >
        返回
      </ActionButton>
    </template>

    <div v-if="terminology" class="space-y-6">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-start justify-between gap-6 mb-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex items-center gap-2">
                <span class="text-xl font-semibold text-gray-900">{{ terminology.sourceTerm }}</span>
                <ArrowRight class="w-5 h-5 text-gray-400" />
                <span class="text-xl font-semibold text-gray-900">{{ terminology.targetTerm }}</span>
              </div>
              <StatusBadge :status="terminology.status" type="terminology" />
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">关联任务：</span>
                <span class="text-gray-900">{{ assignment?.projectName || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500">创建时间：</span>
                <span class="text-gray-900">{{ formatDate(terminology.createdAt) }}</span>
              </div>
              <div>
                <span class="text-gray-500">更新时间：</span>
                <span class="text-gray-900">{{ formatDate(terminology.updatedAt) }}</span>
              </div>
              <div>
                <span class="text-gray-500">版本数：</span>
                <span class="text-gray-900">{{ terminology.versions.length }}</span>
              </div>
            </div>
            <div v-if="terminology.context" class="mt-4">
              <span class="text-sm text-gray-500">上下文：</span>
              <p class="text-sm text-gray-900 mt-1">{{ terminology.context }}</p>
            </div>
            <div v-if="terminology.note" class="mt-4">
              <span class="text-sm text-gray-500">备注：</span>
              <p class="text-sm text-gray-900 mt-1">{{ terminology.note }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <ActionButton
              v-if="terminology.status === 'pending'"
              variant="success"
              icon="CheckCircle"
              @click="approveTerm"
            >
              确认通过
            </ActionButton>
            <ActionButton
              v-if="terminology.status === 'pending'"
              variant="danger"
              icon="XCircle"
              @click="showRejectModal = true"
            >
              驳回术语
            </ActionButton>
            <ActionButton
              v-if="terminology.status === 'rejected'"
              variant="primary"
              icon="Edit"
              @click="showUpdateModal = true"
            >
              更新术语
            </ActionButton>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">历史版本</h3>
          <div class="space-y-3">
            <div
              v-for="(version, index) in terminology.versions"
              :key="version.id"
              :class="[
                'p-4 border rounded-lg',
                index === terminology.versions.length - 1
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-200'
              ]"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ version.sourceTerm }}</span>
                  <ArrowRight class="w-4 h-4 text-gray-400" />
                  <span class="font-medium text-gray-900">{{ version.targetTerm }}</span>
                </div>
                <span
                  v-if="index === terminology.versions.length - 1"
                  class="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700"
                >
                  当前版本
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span>{{ version.updatedBy }}</span>
                <span class="text-gray-400">|</span>
                <span>{{ formatDate(version.updatedAt) }}</span>
              </div>
              <div class="text-sm text-gray-500">
                {{ version.remark }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">操作历史</h3>
          <Timeline :items="terminology.history" />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <FileX class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>术语不存在</p>
    </div>

    <Modal
      :show="showRejectModal"
      title="驳回术语"
      size="md"
      @close="showRejectModal = false"
    >
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ terminology?.sourceTerm }}</span>
            <ArrowRight class="w-4 h-4 text-gray-400" />
            <span class="font-medium">{{ terminology?.targetTerm }}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">驳回原因（必填）</label>
          <textarea
            v-model="rejectReason"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="请详细说明驳回原因和修改建议..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showRejectModal = false">
          取消
        </ActionButton>
        <ActionButton variant="danger" @click="rejectTerm">
          确认驳回
        </ActionButton>
      </template>
    </Modal>

    <Modal
      :show="showUpdateModal"
      title="更新术语"
      size="md"
      @close="showUpdateModal = false"
    >
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-500 mb-2">原术语</div>
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ terminology?.sourceTerm }}</span>
            <ArrowRight class="w-4 h-4 text-gray-400" />
            <span class="font-medium">{{ terminology?.targetTerm }}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">新译文</label>
          <input
            v-model="newTargetTerm"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">修改说明</label>
          <textarea
            v-model="updateRemark"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="请说明修改原因..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showUpdateModal = false">
          取消
        </ActionButton>
        <ActionButton variant="primary" @click="updateTerm">
          确认更新
        </ActionButton>
      </template>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Edit, FileX } from 'lucide-vue-next'
import MainLayout from '@/components/layout/MainLayout.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Timeline from '@/components/common/Timeline.vue'
import Modal from '@/components/common/Modal.vue'
import { useTerminologyStore } from '@/stores/terminology'
import { useAssignmentStore } from '@/stores/assignment'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const terminologyStore = useTerminologyStore()
const assignmentStore = useAssignmentStore()
const userStore = useUserStore()

const terminologyId = route.params.id as string
const terminology = computed(() => terminologyStore.getTerminologyById(terminologyId))
const assignment = computed(() => {
  if (!terminology.value) return null
  return assignmentStore.getAssignmentById(terminology.value.assignmentId)
})

const showRejectModal = ref(false)
const showUpdateModal = ref(false)
const rejectReason = ref('')
const newTargetTerm = ref('')
const updateRemark = ref('')

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const goBack = () => {
  router.push('/terminology')
}

const approveTerm = () => {
  if (!terminology.value) return
  
  terminologyStore.approveTerminology(
    terminology.value.id,
    userStore.currentUser.name,
    '术语翻译准确，确认通过'
  )
}

const rejectTerm = () => {
  if (!terminology.value || !rejectReason.value) return
  
  terminologyStore.rejectTerminology(
    terminology.value.id,
    userStore.currentUser.name,
    rejectReason.value
  )
  
  showRejectModal.value = false
}

const updateTerm = () => {
  if (!terminology.value || !newTargetTerm.value) return
  
  terminologyStore.updateTerminology(
    terminology.value.id,
    newTargetTerm.value,
    userStore.currentUser.name,
    updateRemark.value || '修改术语翻译'
  )
  
  showUpdateModal.value = false
}
</script>