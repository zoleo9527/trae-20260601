<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { Patient, Surgery, ComplicationSeverity } from "@/types";
import {
  createReport,
  getPatientList,
  getSurgeryList,
  getComplicationTypes,
} from "@/store";
import { severityMap } from "@/utils/statusMap";

const router = useRouter();

const patients = ref<Patient[]>([]);
const surgeries = ref<Surgery[]>([]);
const complicationTypes = ref<{ code: string; name: string }[]>([]);

const form = ref({
  patientId: "",
  surgeryId: "",
  complicationType: "",
  complicationCode: "",
  severity: "moderate" as ComplicationSeverity,
  onsetTime: "",
  description: "",
  clinicalManifestation: "",
  treatmentMeasures: "",
  currentStatus: "",
  isUrgent: false,
  department: "眼科",
});

const submitting = ref(false);

async function loadOptions() {
  const [patientsRes, surgeriesRes, typesRes] = await Promise.all([
    getPatientList(),
    getSurgeryList(),
    getComplicationTypes(),
  ]);
  if (patientsRes.code === 0) patients.value = patientsRes.data!;
  if (surgeriesRes.code === 0) surgeries.value = surgeriesRes.data!;
  if (typesRes.code === 0) complicationTypes.value = typesRes.data!;
}

function onPatientChange() {
  form.value.surgeryId = "";
}

function onComplicationTypeChange() {
  const selected = complicationTypes.value.find(
    (t) => t.name === form.value.complicationType,
  );
  if (selected) {
    form.value.complicationCode = selected.code;
  }
}

const availableSurgeries = computed(() => {
  if (!form.value.patientId) return [];
  return surgeries.value.filter(
    (s) =>
      s.patientId === form.value.patientId && s.surgeryStatus === "completed",
  );
});

const severityOptions = [
  { value: "mild", label: "轻度" },
  { value: "moderate", label: "中度" },
  { value: "severe", label: "重度" },
  { value: "critical", label: "危重" },
];

async function handleSubmit() {
  if (!form.value.patientId) {
    alert("请选择患者");
    return;
  }
  if (!form.value.complicationType) {
    alert("请选择并发症类型");
    return;
  }
  if (!form.value.description) {
    alert("请填写情况描述");
    return;
  }
  if (!form.value.onsetTime) {
    alert("请选择发生时间");
    return;
  }

  submitting.value = true;
  try {
    const res = await createReport({
      ...form.value,
    });
    if (res.code === 0) {
      alert("上报成功！");
      router.push(`/reports/${res.data!.id}`);
    } else {
      alert(`上报失败：${res.message}`);
    }
  } finally {
    submitting.value = false;
  }
}

import { computed } from "vue";

onMounted(() => {
  loadOptions();
});
</script>

<template>
  <div class="report-create">
    <div class="page-header">
      <div>
        <div class="breadcrumb">
          <button class="link-btn" @click="router.push('/reports')">
            ← 返回列表
          </button>
          <span class="separator">/</span>
          <span>新建并发症上报</span>
        </div>
        <h2>并发症上报</h2>
        <p class="text-muted text-sm">请如实、完整地填写并发症相关信息</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">基本信息</h3>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">患者</label>
            <select
              v-model="form.patientId"
              class="form-select"
              @change="onPatientChange"
            >
              <option value="">请选择患者</option>
              <option v-for="p in patients" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.gender === "male" ? "男" : "女"
                }}{{ p.age }}岁 · {{ p.bedNumber }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">关联手术</label>
            <select
              v-model="form.surgeryId"
              class="form-select"
              :disabled="!form.patientId"
            >
              <option value="">无（非手术相关）</option>
              <option v-for="s in availableSurgeries" :key="s.id" :value="s.id">
                {{ s.surgeryName }} · {{ s.surgeryDate }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">并发症类型</label>
            <select
              v-model="form.complicationType"
              class="form-select"
              @change="onComplicationTypeChange"
            >
              <option value="">请选择并发症类型</option>
              <option
                v-for="t in complicationTypes"
                :key="t.code"
                :value="t.name"
              >
                {{ t.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">并发症编码</label>
            <input
              v-model="form.complicationCode"
              type="text"
              class="form-input"
              placeholder="系统自动填充"
              readonly
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">严重程度</label>
            <div class="severity-options">
              <label
                v-for="opt in severityOptions"
                :key="opt.value"
                class="severity-option"
                :class="{ active: form.severity === opt.value }"
                :style="{
                  '--color':
                    severityMap[opt.value as ComplicationSeverity].color,
                  '--bgColor':
                    severityMap[opt.value as ComplicationSeverity].bgColor,
                }"
              >
                <input
                  type="radio"
                  :value="opt.value"
                  v-model="form.severity"
                  class="hidden"
                />
                <span class="severity-label">{{ opt.label }}</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label required">发生时间</label>
            <input
              v-model="form.onsetTime"
              type="datetime-local"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="form.isUrgent" class="checkbox" />
            <span class="urgent-text">标记为紧急（需要立即处理）</span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">详细情况</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label required">情况描述</label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            rows="3"
            placeholder="请详细描述并发症发生的经过、时间、诱因等..."
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label required">临床表现</label>
          <textarea
            v-model="form.clinicalManifestation"
            class="form-textarea"
            rows="3"
            placeholder="请描述症状、体征、检查结果等..."
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label required">已采取的处理措施</label>
          <textarea
            v-model="form.treatmentMeasures"
            class="form-textarea"
            rows="3"
            placeholder="请描述已经采取的治疗、护理措施..."
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label required">患者当前状态</label>
          <textarea
            v-model="form.currentStatus"
            class="form-textarea"
            rows="2"
            placeholder="请描述患者目前的状况..."
          ></textarea>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button class="btn btn-outline" @click="router.push('/reports')">
        取消
      </button>
      <button
        class="btn btn-primary"
        @click="handleSubmit"
        :disabled="submitting"
      >
        {{ submitting ? "提交中..." : "提交上报" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.report-create {
  min-height: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.link-btn {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
}

.link-btn:hover {
  text-decoration: underline;
}

.separator {
  color: #9ca3af;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.card {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-body {
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-label.required::after {
  content: " *";
  color: #ef4444;
}

.form-textarea,
.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  background: white;
}

.form-textarea:focus,
.form-input:focus,
.form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.severity-options {
  display: flex;
  gap: 12px;
}

.severity-option {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.severity-option:hover {
  border-color: var(--color);
}

.severity-option.active {
  border-color: var(--color);
  background: var(--bgColor);
}

.severity-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color);
}

.hidden {
  display: none;
}

.checkbox {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}

.urgent-text {
  color: #dc2626;
  font-weight: 500;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
}

.text-muted {
  color: #6b7280;
}

.text-sm {
  font-size: 12px;
}
</style>
