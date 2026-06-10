<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reportStore'

const router = useRouter()
const reportStore = useReportStore()

const currentRole = computed(() => reportStore.currentRole)

const form = ref({
  reporterName: '',
  barnNumber: '',
  chickenCount: 0,
  symptomDescription: '',
  suspectedDisease: '',
  severity: 'medium' as 'low' | 'medium' | 'high' | 'critical'
})

const isSubmitting = ref(false)

const barnOptions = ['A-01', 'A-02', 'B-01', 'B-02', 'B-03', 'C-01', 'C-02', 'D-01']

const diseaseOptions = [
  '传染性支气管炎',
  '鸡新城疫',
  '禽流感',
  '传染性法氏囊炎',
  '鸡痘',
  '大肠杆菌病',
  '沙门氏菌病',
  '其他'
]

function handleSubmit() {
  if (!form.value.reporterName.trim() ||
      !form.value.barnNumber ||
      !form.value.symptomDescription.trim() ||
      !form.value.suspectedDisease) {
    alert('请填写完整信息')
    return
  }

  isSubmitting.value = true

  reportStore.createReport({
    reporterRole: currentRole.value as 'feeder' | 'sorter',
    reporterName: form.value.reporterName,
    barnNumber: form.value.barnNumber,
    chickenCount: form.value.chickenCount || 1000,
    symptomDescription: form.value.symptomDescription,
    symptomPhotos: [],
    suspectedDisease: form.value.suspectedDisease,
    severity: form.value.severity
  })

  isSubmitting.value = false
  alert('疫病上报成功')
  router.push({ name: currentRole.value as string })
}

function goBack() {
  router.push({ name: currentRole.value as string })
}
</script>

<template>
  <div class="page-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">{{ currentRole === 'feeder' ? '🐔' : '🥚' }} {{ currentRole === 'feeder' ? '饲养员' : '分拣员' }}</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item" @click="goBack">
          <span>←</span> 返回工作台
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div class="form-container">
        <div class="form-header">
          <h1 class="page-title">疫病上报</h1>
          <p class="page-subtitle">记录并上报发现的疫病情况</p>
        </div>

        <div class="form-card">
          <div class="input-group">
            <label>上报人姓名 <span class="required">*</span></label>
            <input
              type="text"
              v-model="form.reporterName"
              placeholder="请输入您的姓名"
            />
          </div>

          <div class="input-row">
            <div class="input-group">
              <label>鸡舍编号 <span class="required">*</span></label>
              <select v-model="form.barnNumber">
                <option value="">请选择鸡舍</option>
                <option v-for="barn in barnOptions" :key="barn" :value="barn">
                  {{ barn }}
                </option>
              </select>
            </div>

            <div class="input-group">
              <label>鸡群数量</label>
              <input
                type="number"
                v-model="form.chickenCount"
                placeholder="预估数量"
              />
            </div>
          </div>

          <div class="input-group">
            <label>严重程度</label>
            <div class="severity-options">
              <label class="severity-option" :class="{ active: form.severity === 'low' }">
                <input type="radio" v-model="form.severity" value="low" />
                <span>轻微</span>
              </label>
              <label class="severity-option" :class="{ active: form.severity === 'medium' }">
                <input type="radio" v-model="form.severity" value="medium" />
                <span>中等</span>
              </label>
              <label class="severity-option" :class="{ active: form.severity === 'high' }">
                <input type="radio" v-model="form.severity" value="high" />
                <span>严重</span>
              </label>
              <label class="severity-option critical" :class="{ active: form.severity === 'critical' }">
                <input type="radio" v-model="form.severity" value="critical" />
                <span>紧急</span>
              </label>
            </div>
          </div>

          <div class="input-group">
            <label>疑似病症 <span class="required">*</span></label>
            <select v-model="form.suspectedDisease">
              <option value="">请选择疑似病症</option>
              <option v-for="disease in diseaseOptions" :key="disease" :value="disease">
                {{ disease }}
              </option>
            </select>
          </div>

          <div class="input-group">
            <label>症状描述 <span class="required">*</span></label>
            <textarea
              v-model="form.symptomDescription"
              rows="4"
              placeholder="请详细描述观察到的症状，包括发病时间、持续时长、涉及鸡只数量等..."
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="goBack">取消</button>
          <button
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '提交中...' : '✓ 提交上报' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 700px;
}

.form-header {
  margin-bottom: 24px;
}

.form-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 6px;
}

.required {
  color: var(--color-danger);
}

.input-group input,
.input-group select,
.input-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
}

.input-group input:focus,
.input-group select:focus,
.input-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-group textarea {
  resize: vertical;
}

.severity-options {
  display: flex;
  gap: 8px;
}

.severity-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.severity-option input {
  display: none;
}

.severity-option:hover {
  border-color: var(--color-primary);
}

.severity-option.active {
  border-color: var(--color-primary);
  background: rgba(45, 90, 39, 0.05);
  color: var(--color-primary);
  font-weight: 600;
}

.severity-option.critical.active {
  border-color: var(--color-danger);
  background: rgba(197, 75, 75, 0.05);
  color: var(--color-danger);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
