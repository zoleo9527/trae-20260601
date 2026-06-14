<script setup lang="ts">
import { ArrowLeft, Save } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const caseStore = useCaseStore()

const form = reactive({
  policyNo: '',
  policyHolder: '',
  accidentDesc: ''
})

const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return form.policyNo && form.policyHolder && form.accidentDesc
})

async function handleSubmit() {
  if (!canSubmit.value || !authStore.currentUser) return
  
  isSubmitting.value = true
  try {
    const newCase = await caseStore.createCase({
      ...form,
      reporterId: authStore.currentUser.id
    })
    
    await caseStore.createMaterial({
      caseId: newCase.id,
      materialName: '事故现场照片',
      materialType: 'image',
      reporterId: authStore.currentUser.id
    })
    
    await caseStore.createMaterial({
      caseId: newCase.id,
      materialName: '保单复印件',
      materialType: 'document',
      reporterId: authStore.currentUser.id
    })
    
    await caseStore.createMaterial({
      caseId: newCase.id,
      materialName: '身份证明',
      materialType: 'document',
      reporterId: authStore.currentUser.id
    })
    
    router.push(`/cases/${newCase.id}`)
  } catch (error) {
    alert('创建失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex flex-between flex-center">
        <div>
          <h1 class="page-title">新建报案</h1>
          <p class="page-subtitle">填写报案基本信息</p>
        </div>
        <NuxtLink to="/cases" class="btn btn-secondary">
          <ArrowLeft :size="16" />
          返回列表
        </NuxtLink>
      </div>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">保单号 *</label>
          <input 
            v-model="form.policyNo"
            type="text"
            class="input"
            placeholder="请输入保单号"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">被保险人 *</label>
          <input 
            v-model="form.policyHolder"
            type="text"
            class="input"
            placeholder="请输入被保险人姓名"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">事故经过 *</label>
          <textarea 
            v-model="form.accidentDesc"
            class="textarea"
            placeholder="请详细描述事故经过"
            rows="6"
            required
          ></textarea>
        </div>

        <div class="form-actions">
          <NuxtLink to="/cases" class="btn btn-secondary">
            取消
          </NuxtLink>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="!canSubmit || isSubmitting"
          >
            <Save :size="16" />
            {{ isSubmitting ? '创建中...' : '创建报案' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}
</style>
