<template>
  <MainLayout :title="assignment?.projectName || '任务详情'" subtitle="查看完整流程和操作历史">
    <template #header-actions>
      <ActionButton
        variant="secondary"
        icon="ArrowLeft"
        @click="goBack"
      >
        返回
      </ActionButton>
    </template>

    <div v-if="assignment" class="space-y-6">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-start justify-between gap-6 mb-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-4">
              <h2 class="text-xl font-semibold text-gray-900">{{ assignment.projectName }}</h2>
              <StatusBadge :status="assignment.status" />
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">源语言：</span>
                <span class="text-gray-900">{{ assignment.sourceLanguage }}</span>
              </div>
              <div>
                <span class="text-gray-500">目标语言：</span>
                <span class="text-gray-900">{{ assignment.targetLanguage }}</span>
              </div>
              <div>
                <span class="text-gray-500">译员：</span>
                <span class="text-gray-900">{{ assignment.translatorName || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500">审校：</span>
                <span class="text-gray-900">{{ assignment.reviewerName || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500">字数：</span>
                <span class="text-gray-900">{{ assignment.wordCount || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500">截止日期：</span>
                <span class="text-gray-900">{{ formatDate(assignment.deadline) }}</span>
              </div>
            </div>
            <div v-if="assignment.description" class="mt-4">
              <span class="text-sm text-gray-500">描述：</span>
              <p class="text-sm text-gray-900 mt-1">{{ assignment.description }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <ActionButton
              v-if="assignment.status === 'pending'"
              variant="primary"
              icon="UserPlus"
              @click="showAssignModal = true"
            >
              分配译员
            </ActionButton>
            <ActionButton
              v-if="assignment.status === 'assigned'"
              variant="primary"
              icon="CheckCircle"
              @click="acceptTask"
            >
              接收任务
            </ActionButton>
            <ActionButton
              v-if="assignment.status === 'in_progress'"
              variant="primary"
              icon="Send"
              @click="showSubmitModal = true"
            >
              提交译稿
            </ActionButton>
            <ActionButton
              v-if="assignment.status === 'reviewing'"
              variant="success"
              icon="CheckCircle"
              @click="showApproveModal = true"
            >
              通过审核
            </ActionButton>
            <ActionButton
              v-if="assignment.status === 'reviewing'"
              variant="danger"
              icon="XCircle"
              @click="showRejectModal = true"
            >
              驳回译稿
            </ActionButton>
            <ActionButton
              v-if="assignment.status === 'rejected'"
              variant="primary"
              icon="Send"
              @click="showResubmitModal = true"
            >
              重新提交
            </ActionButton>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-6">
          <h3 class="font-semibold text-gray-900 mb-4">流程进度</h3>
          <div class="flex items-center gap-2">
            <div
              v-for="(step, index) in workflowSteps"
              :key="step.status"
              class="flex items-center"
            >
              <div
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  getStepClass(step.status, index)
                ]"
              >
                <component
                  :is="step.icon"
                  :class="['w-5 h-5', getStepIconColor(step.status, index)]"
                />
                <span class="text-sm font-medium">{{ step.label }}</span>
              </div>
              <div
                v-if="index < workflowSteps.length - 1"
                :class="[
                  'w-8 h-0.5 mx-2',
                  getConnectorClass(index)
                ]"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">操作历史</h3>
          <Timeline :items="assignment.history" />
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">关联术语</h3>
          <div v-if="terminologies.length > 0" class="space-y-3">
            <div
              v-for="term in terminologies"
              :key="term.id"
              class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              @click="goToTerminology(term.id)"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ term.sourceTerm }}</span>
                  <ArrowRight class="w-4 h-4 text-gray-400" />
                  <span class="font-medium text-gray-900">{{ term.targetTerm }}</span>
                </div>
                <StatusBadge :status="term.status" type="terminology" />
              </div>
              <div v-if="term.context" class="text-sm text-gray-500">
                {{ term.context }}
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无关联术语</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <FileX class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>任务不存在</p>
    </div>

    <Modal
      :show="showAssignModal"
      title="分配译员"
      size="md"
      @close="showAssignModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">选择译员</label>
          <select
            v-model="selectedTranslator"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">请选择译员</option>
            <option
              v-for="translator in translators"
              :key="translator.id"
              :value="translator.id"
            >
              {{ translator.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            v-model="assignRemark"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="分配说明..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showAssignModal = false">
          取消
        </ActionButton>
        <ActionButton variant="primary" @click="assignTranslator">
          确认分配
        </ActionButton>
      </template>
    </Modal>

    <Modal
      :show="showSubmitModal"
      title="提交译稿"
      size="md"
      @close="showSubmitModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">提交说明</label>
          <textarea
            v-model="submitRemark"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="请说明翻译完成情况..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showSubmitModal = false">
          取消
        </ActionButton>
        <ActionButton variant="primary" @click="submitForReview">
          提交审核
        </ActionButton>
      </template>
    </Modal>

    <Modal
      :show="showRejectModal"
      title="驳回译稿"
      size="md"
      @close="showRejectModal = false"
    >
      <div class="space-y-4">
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
        <ActionButton variant="danger" @click="rejectAssignment">
          确认驳回
        </ActionButton>
      </template>
    </Modal>

    <Modal
      :show="showApproveModal"
      title="通过审核"
      size="md"
      @close="showApproveModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">审核说明</label>
          <textarea
            v-model="approveRemark"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="审核说明..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showApproveModal = false">
          取消
        </ActionButton>
        <ActionButton variant="success" @click="approveAssignment">
          确认通过
        </ActionButton>
      </template>
    </Modal>

    <Modal
      :show="showResubmitModal"
      title="重新提交"
      size="md"
      @close="showResubmitModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">修改说明</label>
          <textarea
            v-model="resubmitRemark"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="请说明修改内容..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showResubmitModal = false">
          取消
        </ActionButton>
        <ActionButton variant="primary" @click="resubmitForReview">
          重新提交
        </ActionButton>
      </template>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  Send,
  XCircle,
  Clock,
  UserCheck,
  Loader,
  Eye,
  ArrowRight,
  BookOpen,
  FileX
} from 'lucide-vue-next'
import MainLayout from '@/components/layout/MainLayout.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Timeline from '@/components/common/Timeline.vue'
import Modal from '@/components/common/Modal.vue'
import { useAssignmentStore } from '@/stores/assignment'
import { useTerminologyStore } from '@/stores/terminology'
import { useUserStore } from '@/stores/user'
import type { AssignmentStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()
const terminologyStore = useTerminologyStore()
const userStore = useUserStore()

const assignmentId = route.params.id as string
const assignment = computed(() => assignmentStore.getAssignmentById(assignmentId))
const terminologies = computed(() => terminologyStore.getTerminologiesByAssignment(assignmentId))

const showAssignModal = ref(false)
const showSubmitModal = ref(false)
const showRejectModal = ref(false)
const showApproveModal = ref(false)
const showResubmitModal = ref(false)

const selectedTranslator = ref('')
const assignRemark = ref('')
const submitRemark = ref('')
const rejectReason = ref('')
const approveRemark = ref('')
const resubmitRemark = ref('')

const translators = computed(() => userStore.getUsersByRole('translator'))

const workflowSteps = [
  { status: 'pending', label: '待分配', icon: Clock },
  { status: 'assigned', label: '已分配', icon: UserCheck },
  { status: 'in_progress', label: '进行中', icon: Loader },
  { status: 'reviewing', label: '待审核', icon: Eye },
  { status: 'completed', label: '已完成', icon: CheckCircle },
]

const currentStepIndex = computed(() => {
  if (!assignment.value) return 0
  const statusOrder: AssignmentStatus[] = ['pending', 'assigned', 'in_progress', 'reviewing', 'completed']
  let index = statusOrder.indexOf(assignment.value.status)
  if (assignment.value.status === 'rejected') {
    index = 3
  }
  return index
})

const getStepClass = (status: AssignmentStatus, index: number) => {
  if (index <= currentStepIndex.value) {
    return 'bg-primary-50 text-primary-700 border border-primary-200'
  }
  return 'bg-gray-50 text-gray-400 border border-gray-200'
}

const getStepIconColor = (status: AssignmentStatus, index: number) => {
  if (index <= currentStepIndex.value) {
    return 'text-primary-600'
  }
  return 'text-gray-400'
}

const getConnectorClass = (index: number) => {
  if (index < currentStepIndex.value) {
    return 'bg-primary-500'
  }
  return 'bg-gray-200'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const goBack = () => {
  router.push('/assignments')
}

const goToTerminology = (id: string) => {
  router.push(`/terminology/${id}`)
}

const acceptTask = () => {
  if (!assignment.value) return
  assignmentStore.acceptAssignment(
    assignment.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    '已接收任务，开始翻译工作'
  )
}

const assignTranslator = () => {
  if (!assignment.value || !selectedTranslator.value) return
  
  const translator = userStore.getUserById(selectedTranslator.value)
  if (!translator) return
  
  assignmentStore.assignTranslator(
    assignment.value.id,
    translator.id,
    translator.name,
    userStore.currentUser.name,
    userStore.currentUser.role
  )
  
  showAssignModal.value = false
}

const submitForReview = () => {
  if (!assignment.value) return
  
  assignmentStore.submitForReview(
    assignment.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    submitRemark.value || '已完成翻译，提交审核'
  )
  
  showSubmitModal.value = false
}

const rejectAssignment = () => {
  if (!assignment.value || !rejectReason.value) return
  
  assignmentStore.rejectAssignment(
    assignment.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    rejectReason.value
  )
  
  showRejectModal.value = false
}

const approveAssignment = () => {
  if (!assignment.value) return
  
  assignmentStore.approveAssignment(
    assignment.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    approveRemark.value || '审核通过'
  )
  
  showApproveModal.value = false
}

const resubmitForReview = () => {
  if (!assignment.value) return
  
  assignmentStore.submitForReview(
    assignment.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    resubmitRemark.value || '已完成修改，重新提交'
  )
  
  showResubmitModal.value = false
}
</script>