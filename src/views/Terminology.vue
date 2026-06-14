<template>
  <MainLayout title="术语维护" subtitle="管理翻译术语库">
    <div class="space-y-4">
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <select
              v-model="statusFilter"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已确认</option>
              <option value="rejected">已驳回</option>
            </select>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="搜索术语..."
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 p-6">
          <div
            v-for="term in filteredTerminologies"
            :key="term.id"
            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="goToDetail(term.id)"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-gray-900">{{ term.sourceTerm }}</span>
                  <ArrowRight class="w-4 h-4 text-gray-400" />
                  <span class="font-semibold text-gray-900">{{ term.targetTerm }}</span>
                </div>
                <StatusBadge :status="term.status" type="terminology" />
              </div>
            </div>
            
            <div v-if="term.context" class="text-sm text-gray-500 mb-2">
              {{ term.context }}
            </div>
            
            <div v-if="term.note" class="text-sm text-gray-600 mb-3">
              {{ term.note }}
            </div>

            <div class="flex items-center justify-between text-sm text-gray-500">
              <div>
                <span>版本数：{{ term.versions.length }}</span>
              </div>
              <div>
                <span>更新于 {{ formatDate(term.updatedAt) }}</span>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-2">
              <ActionButton
                v-if="isReviewer && term.status === 'pending'"
                variant="success"
                size="sm"
                :icon="CheckCircleIcon"
                @click.stop="approveTerm(term)"
              >
                确认
              </ActionButton>
              <ActionButton
                v-if="isReviewer && term.status === 'pending'"
                variant="danger"
                size="sm"
                :icon="XCircleIcon"
                @click.stop="openRejectModal(term)"
              >
                驳回
              </ActionButton>
              <ActionButton
                v-if="isTranslator && term.status === 'rejected'"
                variant="primary"
                size="sm"
                :icon="EditIcon"
                @click.stop="openUpdateModal(term)"
              >
                更新
              </ActionButton>
              <ActionButton
                variant="secondary"
                size="sm"
                :icon="HistoryIcon"
                @click.stop="openHistoryModal(term)"
              >
                回看
              </ActionButton>
            </div>
          </div>
        </div>

        <div
          v-if="filteredTerminologies.length === 0"
          class="px-6 py-12 text-center text-gray-500"
        >
          <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>暂无术语记录</p>
        </div>
      </div>
    </div>

    <Modal
      :show="showRejectModal"
      title="驳回术语"
      size="md"
      @close="showRejectModal = false"
    >
      <div class="space-y-4">
        <div v-if="currentTerm" class="p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-medium">{{ currentTerm.sourceTerm }}</span>
            <ArrowRight class="w-4 h-4 text-gray-400" />
            <span class="font-medium">{{ currentTerm.targetTerm }}</span>
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
        <div v-if="currentTerm" class="p-4 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-500 mb-2">原术语</div>
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ currentTerm.sourceTerm }}</span>
            <ArrowRight class="w-4 h-4 text-gray-400" />
            <span class="font-medium">{{ currentTerm.targetTerm }}</span>
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

    <Modal
      :show="showHistoryModal"
      title="术语历史版本"
      size="lg"
      @close="showHistoryModal = false"
    >
      <div v-if="currentTerm" class="space-y-6">
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-500 mb-2">当前版本</div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-900">{{ currentTerm.sourceTerm }}</span>
            <ArrowRight class="w-4 h-4 text-gray-400" />
            <span class="font-semibold text-gray-900">{{ currentTerm.targetTerm }}</span>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-900 mb-4">历史版本</h4>
          <div class="space-y-3">
            <div
              v-for="version in currentTerm.versions"
              :key="version.id"
              class="p-4 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ version.sourceTerm }}</span>
                  <ArrowRight class="w-4 h-4 text-gray-400" />
                  <span class="font-medium">{{ version.targetTerm }}</span>
                </div>
                <span class="text-sm text-gray-500">
                  {{ formatDate(version.updatedAt) }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span>{{ version.updatedBy }}</span>
                <span class="text-gray-400">|</span>
                <span>{{ version.remark }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-900 mb-4">操作记录</h4>
          <Timeline :items="currentTerm.history" />
        </div>
      </div>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, BookOpen, CheckCircle, XCircle, Edit, History } from 'lucide-vue-next'
import MainLayout from '@/components/layout/MainLayout.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Modal from '@/components/common/Modal.vue'
import Timeline from '@/components/common/Timeline.vue'
import { useTerminologyStore } from '@/stores/terminology'
import { useUserStore } from '@/stores/user'
import type { Terminology, TerminologyStatus } from '@/types'

const router = useRouter()
const terminologyStore = useTerminologyStore()
const userStore = useUserStore()

const CheckCircleIcon = CheckCircle
const XCircleIcon = XCircle
const EditIcon = Edit
const HistoryIcon = History

const statusFilter = ref<TerminologyStatus | ''>('')
const searchTerm = ref('')
const showRejectModal = ref(false)
const showUpdateModal = ref(false)
const showHistoryModal = ref(false)
const currentTerm = ref<Terminology | null>(null)
const rejectReason = ref('')
const newTargetTerm = ref('')
const updateRemark = ref('')

const filteredTerminologies = computed(() => {
  let terms = terminologyStore.terminologies
  
  if (statusFilter.value) {
    terms = terms.filter(t => t.status === statusFilter.value)
  }
  
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    terms = terms.filter(t => 
      t.sourceTerm.toLowerCase().includes(search) ||
      t.targetTerm.toLowerCase().includes(search)
    )
  }
  
  return terms
})

const isTranslator = computed(() => userStore.currentUser.role === 'translator')
const isReviewer = computed(() => userStore.currentUser.role === 'reviewer')

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const goToDetail = (id: string) => {
  router.push(`/terminology/${id}`)
}

const approveTerm = (term: Terminology) => {
  terminologyStore.approveTerminology(
    term.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    '术语翻译准确，确认通过'
  )
}

const openRejectModal = (term: Terminology) => {
  currentTerm.value = term
  rejectReason.value = ''
  showRejectModal.value = true
}

const rejectTerm = () => {
  if (!currentTerm.value || !rejectReason.value) return
  
  terminologyStore.rejectTerminology(
    currentTerm.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    rejectReason.value
  )
  
  showRejectModal.value = false
}

const openUpdateModal = (term: Terminology) => {
  currentTerm.value = term
  newTargetTerm.value = term.targetTerm
  updateRemark.value = ''
  showUpdateModal.value = true
}

const updateTerm = () => {
  if (!currentTerm.value || !newTargetTerm.value) return
  
  terminologyStore.updateTerminology(
    currentTerm.value.id,
    newTargetTerm.value,
    userStore.currentUser.name,
    userStore.currentUser.role,
    updateRemark.value || '修改术语翻译'
  )
  
  showUpdateModal.value = false
}

const openHistoryModal = (term: Terminology) => {
  currentTerm.value = term
  showHistoryModal.value = true
}
</script>