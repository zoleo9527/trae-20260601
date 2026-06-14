<script setup lang="ts">
import { ArrowLeft, Upload, CheckCircle, XCircle, Plus, FileText } from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()
const caseStore = useCaseStore()

const caseId = computed(() => route.params.id as string)
const currentUser = computed(() => authStore.currentUser)

const showAddModal = ref(false)
const showRejectModal = ref(false)
const selectedMaterialId = ref('')
const rejectReason = ref('')

const newMaterial = reactive({
  materialName: '',
  materialType: 'document'
})

const materials = computed(() => caseStore.materials)
const currentCase = computed(() => caseStore.currentCase)

const canAddMaterial = computed(() => {
  return currentUser.value?.role === 'CLAIM_AGENT'
})

const canVerify = computed(() => {
  return currentUser.value?.role === 'SURVEYOR'
})

onMounted(async () => {
  if (!authStore.currentUser) {
    authStore.switchRole('CLAIM_AGENT')
  }
  await caseStore.fetchCase(caseId.value)
})

function openRejectModal(materialId: string) {
  selectedMaterialId.value = materialId
  rejectReason.value = ''
  showRejectModal.value = true
}

async function handleUpload(materialId: string) {
  if (!authStore.currentUser) return
  
  const attachmentUrl = `upload_${Date.now()}.pdf`
  try {
    await caseStore.uploadMaterial(
      materialId,
      attachmentUrl,
      authStore.currentUser.id
    )
  } catch (error) {
    alert('上传失败')
  }
}

async function handleVerify(materialId: string, status: 'confirmed' | 'rejected', remark?: string) {
  if (!authStore.currentUser) return
  
  try {
    await caseStore.verifyMaterial(
      materialId,
      authStore.currentUser.id,
      status,
      remark
    )
  } catch (error) {
    alert('审核失败')
  }
}

async function handleReject() {
  if (!rejectReason.value) return
  
  await handleVerify(selectedMaterialId.value, 'rejected', rejectReason.value)
  showRejectModal.value = false
  rejectReason.value = ''
  selectedMaterialId.value = ''
}

async function handleAddMaterial() {
  if (!newMaterial.materialName || !authStore.currentUser) return
  
  try {
    await caseStore.createMaterial({
      caseId: caseId.value,
      materialName: newMaterial.materialName,
      materialType: newMaterial.materialType,
      reporterId: authStore.currentUser.id
    })
    showAddModal.value = false
    newMaterial.materialName = ''
    newMaterial.materialType = 'document'
  } catch (error) {
    alert('添加材料失败')
  }
}

function getMaterialIcon(type: string) {
  return FileText
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex flex-between flex-center">
        <div>
          <NuxtLink :to="`/cases/${caseId}`" class="back-link">
            <ArrowLeft :size="16" />
            返回报案详情
          </NuxtLink>
          <h1 class="page-title mt-md">材料清单管理</h1>
          <p class="page-subtitle" v-if="currentCase">
            报案编号：{{ currentCase.reportNo }} | 被保险人：{{ currentCase.policyHolder }}
          </p>
        </div>
        <button 
          v-if="canAddMaterial"
          @click="showAddModal = true"
          class="btn btn-primary"
        >
          <Plus :size="16" />
          添加材料
        </button>
      </div>
    </div>

    <div class="card">
      <div v-if="materials.length === 0" class="empty-state">
        <FileText :size="48" class="empty-icon" />
        <p>暂无材料清单</p>
        <button 
          v-if="canAddMaterial"
          @click="showAddModal = true"
          class="btn btn-primary mt-md"
        >
          添加第一个材料
        </button>
      </div>

      <div v-else class="materials-grid">
        <div 
          v-for="material in materials" 
          :key="material.id" 
          class="material-card"
        >
          <div class="material-header">
            <div class="material-icon">
              <component :is="getMaterialIcon(material.materialType)" :size="24" />
            </div>
            <CommonUploadStatusBadge :status="material.uploadStatus" />
          </div>

          <div class="material-content">
            <h3 class="material-name">{{ material.materialName }}</h3>
            <p class="material-type">类型：{{ material.materialType }}</p>
            <p v-if="material.verifiedBy" class="material-verified">
              审核人：{{ material.verifiedBy }}
            </p>
          </div>

          <div class="material-actions">
            <template v-if="material.uploadStatus === 'NOT_UPLOADED'">
              <button 
                v-if="canAddMaterial"
                @click="handleUpload(material.id)"
                class="btn btn-primary btn-sm"
              >
                <Upload :size="14" />
                上传附件
              </button>
              <div v-else class="placeholder-box">
                <Upload :size="20" />
                <span>待上传</span>
              </div>
            </template>

            <template v-else-if="material.uploadStatus === 'UPLOADED' && canVerify">
              <button 
                @click="handleVerify(material.id, 'confirmed')"
                class="btn btn-success btn-sm"
              >
                <CheckCircle :size="14" />
                确认
              </button>
              <button 
                @click="openRejectModal(material.id)"
                class="btn btn-danger btn-sm"
              >
                <XCircle :size="14" />
                驳回
              </button>
            </template>

            <template v-else-if="material.uploadStatus === 'CONFIRMED'">
              <div class="confirmed-box">
                <CheckCircle :size="20" />
                <span>已确认</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">添加材料</h3>
        </div>
        <div class="form-group">
          <label class="form-label">材料名称 *</label>
          <input 
            v-model="newMaterial.materialName"
            type="text"
            class="input"
            placeholder="请输入材料名称"
          />
        </div>
        <div class="form-group">
          <label class="form-label">材料类型</label>
          <select v-model="newMaterial.materialType" class="input">
            <option value="document">文档</option>
            <option value="image">图片</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="modal-footer">
          <button @click="showAddModal = false" class="btn btn-secondary">
            取消
          </button>
          <button 
            @click="handleAddMaterial" 
            class="btn btn-primary"
            :disabled="!newMaterial.materialName"
          >
            添加
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">驳回材料</h3>
        </div>
        <div class="form-group">
          <label class="form-label">驳回原因 *</label>
          <textarea 
            v-model="rejectReason"
            class="textarea"
            placeholder="请填写驳回原因"
            rows="4"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showRejectModal = false" class="btn btn-secondary">
            取消
          </button>
          <button 
            @click="handleReject" 
            class="btn btn-danger"
            :disabled="!rejectReason"
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
}

.back-link:hover {
  color: var(--color-primary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.material-card {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.material-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.material-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.material-content {
  margin-bottom: var(--spacing-md);
}

.material-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.material-type {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.material-verified {
  font-size: 0.75rem;
  color: var(--color-success);
  margin-top: var(--spacing-xs);
}

.material-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.75rem;
}

.placeholder-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.confirmed-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-success);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
