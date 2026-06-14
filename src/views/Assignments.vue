<template>
  <MainLayout title="译员分配" subtitle="管理翻译任务分配">
    <template #header-actions>
      <ActionButton
        variant="primary"
        :icon="PlusIcon"
        @click="showCreateModal = true"
      >
        新建分配
      </ActionButton>
    </template>

    <div class="space-y-4">
      <div
        v-if="assignmentStore.selectedIds.length > 0"
        class="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <span class="text-sm text-primary-700">
            已选择 {{ assignmentStore.selectedIds.length }} 项
          </span>
        </div>
        <div class="flex items-center gap-2">
          <ActionButton
            v-if="isProjectManager"
            variant="secondary"
            size="sm"
            :icon="UserPlusIcon"
            @click="showBatchAssignModal = true"
          >
            批量分配
          </ActionButton>
          <ActionButton
            v-if="isReviewer"
            variant="danger"
            size="sm"
            :icon="XCircleIcon"
            @click="showBatchRejectModal = true"
          >
            批量驳回
          </ActionButton>
          <ActionButton
            v-if="isReviewer"
            variant="success"
            size="sm"
            :icon="CheckCircleIcon"
            @click="showBatchApproveModal = true"
          >
            批量通过
          </ActionButton>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleAllSelection"
                  class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">项目名称</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">语言</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">译员</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">截止日期</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">字数</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="assignment in assignmentStore.assignments"
              :key="assignment.id"
              :class="[
                'hover:bg-gray-50 transition-colors',
                { 'bg-primary-50': isSelected(assignment.id) }
              ]"
            >
              <td class="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  :checked="isSelected(assignment.id)"
                  @change="toggleSelection(assignment.id)"
                  class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ assignment.projectName }}</div>
                <div class="text-sm text-gray-500">{{ assignment.description }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ assignment.sourceLanguage }} → {{ assignment.targetLanguage }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ assignment.translatorName || '-' }}
              </td>
              <td class="px-4 py-3">
                <StatusBadge :status="assignment.status" />
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ formatDate(assignment.deadline) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ assignment.wordCount || '-' }}
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    @click="goToDetail(assignment.id)"
                  >
                    查看
                  </button>
                  <button
                    v-if="isProjectManager && assignment.status === 'pending'"
                    class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    @click="openAssignModal(assignment)"
                  >
                    分配
                  </button>
                  <button
                    v-if="isReviewer && assignment.status === 'reviewing'"
                    class="text-success-600 hover:text-success-700 text-sm font-medium"
                    @click="openApproveModal(assignment)"
                  >
                    通过
                  </button>
                  <button
                    v-if="isReviewer && assignment.status === 'reviewing'"
                    class="text-red-600 hover:text-red-700 text-sm font-medium"
                    @click="openRejectModal(assignment)"
                  >
                    驳回
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal
      :show="showCreateModal"
      title="新建分配"
      size="lg"
      @close="showCreateModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
          <input
            v-model="newAssignment.projectName"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">源语言</label>
            <select
              v-model="newAssignment.sourceLanguage"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="中文">中文</option>
              <option value="英语">英语</option>
              <option value="日语">日语</option>
              <option value="韩语">韩语</option>
              <option value="德语">德语</option>
              <option value="法语">法语</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目标语言</label>
            <select
              v-model="newAssignment.targetLanguage"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="中文">中文</option>
              <option value="英语">英语</option>
              <option value="日语">日语</option>
              <option value="韩语">韩语</option>
              <option value="德语">德语</option>
              <option value="法语">法语</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">字数</label>
          <input
            v-model.number="newAssignment.wordCount"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
          <input
            v-model="newAssignment.deadline"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="newAssignment.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showCreateModal = false">
          取消
        </ActionButton>
        <ActionButton variant="primary" @click="createAssignment">
          创建
        </ActionButton>
      </template>
    </Modal>

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
      title="确认通过"
      size="md"
      @close="showApproveModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
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
      :show="showBatchAssignModal"
      title="批量分配译员"
      size="md"
      @close="showBatchAssignModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">选择译员</label>
          <select
            v-model="batchTranslator"
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
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showBatchAssignModal = false">
          取消
        </ActionButton>
        <ActionButton variant="primary" @click="batchAssign">
          确认分配
        </ActionButton>
      </template>
    </Modal>

    <Modal
      :show="showBatchRejectModal"
      title="批量驳回"
      size="md"
      @close="showBatchRejectModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">驳回原因（必填）</label>
          <textarea
            v-model="batchRejectReason"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="请详细说明驳回原因..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showBatchRejectModal = false">
          取消
        </ActionButton>
        <ActionButton variant="danger" @click="batchReject">
          确认驳回
        </ActionButton>
      </template>
    </Modal>

    <Modal
      :show="showBatchApproveModal"
      title="批量通过"
      size="md"
      @close="showBatchApproveModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            v-model="batchApproveRemark"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="审核说明..."
          />
        </div>
      </div>
      <template #footer>
        <ActionButton variant="secondary" @click="showBatchApproveModal = false">
          取消
        </ActionButton>
        <ActionButton variant="success" @click="batchApprove">
          确认通过
        </ActionButton>
      </template>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, UserPlus, XCircle, CheckCircle } from 'lucide-vue-next'
import MainLayout from '@/components/layout/MainLayout.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Modal from '@/components/common/Modal.vue'
import { useAssignmentStore } from '@/stores/assignment'
import { useUserStore } from '@/stores/user'
import type { Assignment } from '@/types'

const router = useRouter()
const assignmentStore = useAssignmentStore()
const userStore = useUserStore()

const PlusIcon = Plus
const UserPlusIcon = UserPlus
const XCircleIcon = XCircle
const CheckCircleIcon = CheckCircle

const showCreateModal = ref(false)
const showAssignModal = ref(false)
const showRejectModal = ref(false)
const showApproveModal = ref(false)
const showBatchAssignModal = ref(false)
const showBatchRejectModal = ref(false)
const showBatchApproveModal = ref(false)

const newAssignment = ref({
  projectName: '',
  sourceLanguage: '中文',
  targetLanguage: '英语',
  wordCount: 0,
  deadline: '',
  description: '',
})

const currentAssignment = ref<Assignment | null>(null)
const selectedTranslator = ref('')
const assignRemark = ref('')
const rejectReason = ref('')
const approveRemark = ref('')
const batchTranslator = ref('')
const batchRejectReason = ref('')
const batchApproveRemark = ref('')

const translators = computed(() => userStore.getUsersByRole('translator'))

const isProjectManager = computed(() => userStore.currentUser.role === 'project_manager')
const isReviewer = computed(() => userStore.currentUser.role === 'reviewer')

const isAllSelected = computed(() => {
  return assignmentStore.assignments.length > 0 &&
    assignmentStore.selectedIds.length === assignmentStore.assignments.length
})

const isSelected = (id: string) => {
  return assignmentStore.selectedIds.includes(id)
}

const toggleAllSelection = () => {
  if (isAllSelected.value) {
    assignmentStore.clearSelection()
  } else {
    assignmentStore.selectedIds = assignmentStore.assignments.map(a => a.id)
  }
}

const toggleSelection = (id: string) => {
  assignmentStore.toggleSelection(id)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const goToDetail = (id: string) => {
  router.push(`/assignments/${id}`)
}

const openAssignModal = (assignment: Assignment) => {
  currentAssignment.value = assignment
  selectedTranslator.value = ''
  assignRemark.value = ''
  showAssignModal.value = true
}

const openRejectModal = (assignment: Assignment) => {
  currentAssignment.value = assignment
  rejectReason.value = ''
  showRejectModal.value = true
}

const openApproveModal = (assignment: Assignment) => {
  currentAssignment.value = assignment
  approveRemark.value = ''
  showApproveModal.value = true
}

const createAssignment = () => {
  if (!newAssignment.value.projectName) return
  
  assignmentStore.createAssignment(
    newAssignment.value,
    userStore.currentUser.name,
    userStore.currentUser.role
  )
  
  showCreateModal.value = false
  newAssignment.value = {
    projectName: '',
    sourceLanguage: '中文',
    targetLanguage: '英语',
    wordCount: 0,
    deadline: '',
    description: '',
  }
}

const assignTranslator = () => {
  if (!currentAssignment.value || !selectedTranslator.value) return
  
  const translator = userStore.getUserById(selectedTranslator.value)
  if (!translator) return
  
  assignmentStore.assignTranslator(
    currentAssignment.value.id,
    translator.id,
    translator.name,
    userStore.currentUser.name,
    userStore.currentUser.role
  )
  
  showAssignModal.value = false
}

const rejectAssignment = () => {
  if (!currentAssignment.value || !rejectReason.value) return
  
  assignmentStore.rejectAssignment(
    currentAssignment.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    rejectReason.value
  )
  
  showRejectModal.value = false
}

const approveAssignment = () => {
  if (!currentAssignment.value) return
  
  assignmentStore.approveAssignment(
    currentAssignment.value.id,
    userStore.currentUser.name,
    userStore.currentUser.role,
    approveRemark.value || '审核通过'
  )
  
  showApproveModal.value = false
}

const batchAssign = () => {
  if (!batchTranslator.value) return
  
  const translator = userStore.getUserById(batchTranslator.value)
  if (!translator) return
  
  assignmentStore.batchAssign(
    assignmentStore.selectedIds,
    translator.id,
    translator.name,
    userStore.currentUser.name,
    userStore.currentUser.role
  )
  
  showBatchAssignModal.value = false
}

const batchReject = () => {
  if (!batchRejectReason.value) return
  
  assignmentStore.batchReject(
    assignmentStore.selectedIds,
    userStore.currentUser.name,
    userStore.currentUser.role,
    batchRejectReason.value
  )
  
  showBatchRejectModal.value = false
}

const batchApprove = () => {
  assignmentStore.batchApprove(
    assignmentStore.selectedIds,
    userStore.currentUser.name,
    userStore.currentUser.role,
    batchApproveRemark.value || '批量审核通过'
  )
  
  showBatchApproveModal.value = false
}
</script>