<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type {
  ComplicationReport,
  FollowUpRecord,
  AuditLog,
  ComplicationStatus,
} from "@/types";
import {
  getReportById,
  getFollowUpsByReportId,
  getAuditLogsByReportId,
  changeStatus,
  updateReport,
  createFollowUp,
  completeFollowUp,
  statusMap,
  severityMap,
  staffRoleMap,
  followUpStatusMap,
  followUpTypeMap,
  auditActionMap,
} from "@/store";
import { formatDateTime } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const reportId = route.params.id as string;

const report = ref<ComplicationReport | null>(null);
const followUps = ref<FollowUpRecord[]>([]);
const auditLogs = ref<AuditLog[]>([]);
const loading = ref(true);

const activeTab = ref<"info" | "followup" | "audit">("info");
const showStatusModal = ref(false);
const showFollowUpModal = ref(false);
const showCompleteFollowUpModal = ref(false);
const selectedFollowUp = ref<FollowUpRecord | null>(null);

const newStatus = ref<ComplicationStatus>("processing");
const rejectReason = ref("");
const resolution = ref("");

const newFollowUp = ref({
  followUpType: "inpatient" as const,
  plannedTime: "",
});

const completeForm = ref({
  patientCondition: "",
  vitalSigns: "",
  woundCondition: "",
  medicationCompliance: "",
  guidanceGiven: "",
  nextFollowUpTime: "",
  notes: "",
});

const editMode = ref(false);
const editForm = ref({
  description: "",
  clinicalManifestation: "",
  treatmentMeasures: "",
  currentStatus: "",
});

async function loadData() {
  loading.value = true;
  try {
    const [reportRes, followUpsRes, auditRes] = await Promise.all([
      getReportById(reportId),
      getFollowUpsByReportId(reportId),
      getAuditLogsByReportId(reportId),
    ]);
    if (reportRes.code === 0) {
      report.value = reportRes.data!;
      editForm.value = {
        description: report.value.description,
        clinicalManifestation: report.value.clinicalManifestation,
        treatmentMeasures: report.value.treatmentMeasures,
        currentStatus: report.value.currentStatus,
      };
    }
    if (followUpsRes.code === 0) followUps.value = followUpsRes.data!;
    if (auditRes.code === 0) auditLogs.value = auditRes.data!;
  } finally {
    loading.value = false;
  }
}

function openStatusModal() {
  newStatus.value = "processing";
  rejectReason.value = "";
  resolution.value = "";
  showStatusModal.value = true;
}

async function handleStatusChange() {
  if (!report.value) return;

  const res = await changeStatus({
    id: report.value.id,
    status: newStatus.value,
    handlerId: "s1",
    rejectReason:
      newStatus.value === "rejected" ? rejectReason.value : undefined,
    resolution:
      newStatus.value === "resolved" || newStatus.value === "closed"
        ? resolution.value
        : undefined,
  });

  if (res.code === 0) {
    alert(res.message);
    showStatusModal.value = false;
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

function openFollowUpModal() {
  newFollowUp.value = {
    followUpType: "inpatient",
    plannedTime: "",
  };
  showFollowUpModal.value = true;
}

async function handleCreateFollowUp() {
  if (!report.value) return;

  const res = await createFollowUp({
    reportId: report.value.id,
    followUpType: newFollowUp.value.followUpType,
    plannedTime: newFollowUp.value.plannedTime,
  });

  if (res.code === 0) {
    alert(res.message);
    showFollowUpModal.value = false;
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

function openCompleteModal(followUp: FollowUpRecord) {
  selectedFollowUp.value = followUp;
  completeForm.value = {
    patientCondition: "",
    vitalSigns: "",
    woundCondition: "",
    medicationCompliance: "",
    guidanceGiven: "",
    nextFollowUpTime: "",
    notes: "",
  };
  showCompleteFollowUpModal.value = true;
}

async function handleCompleteFollowUp() {
  if (!selectedFollowUp.value) return;

  const res = await completeFollowUp({
    id: selectedFollowUp.value.id,
    ...completeForm.value,
  });

  if (res.code === 0) {
    alert(res.message);
    showCompleteFollowUpModal.value = false;
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

function enableEdit() {
  editMode.value = true;
}

async function handleSaveEdit() {
  if (!report.value) return;

  const res = await updateReport({
    id: report.value.id,
    ...editForm.value,
  });

  if (res.code === 0) {
    alert(res.message);
    editMode.value = false;
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

function cancelEdit() {
  if (report.value) {
    editForm.value = {
      description: report.value.description,
      clinicalManifestation: report.value.clinicalManifestation,
      treatmentMeasures: report.value.treatmentMeasures,
      currentStatus: report.value.currentStatus,
    };
  }
  editMode.value = false;
}

const availableStatuses = computed(() => {
  if (!report.value) return [];
  const transitions: Record<ComplicationStatus, ComplicationStatus[]> = {
    pending: ["processing", "rejected"],
    processing: ["pending_followup", "resolved", "rejected"],
    pending_followup: ["processing", "resolved", "rejected"],
    resolved: ["closed", "processing"],
    closed: [],
    rejected: ["pending", "processing"],
  };
  return transitions[report.value.status] || [];
});

const availableStatusOptions = computed(() => {
  return availableStatuses.value.map((s) => ({
    value: s,
    label: statusMap[s].label,
  }));
});

const followUpTypeOptions = [
  { value: "inpatient", label: "住院查房" },
  { value: "outpatient", label: "门诊复查" },
  { value: "phone", label: "电话回访" },
  { value: "home", label: "上门随访" },
];

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="report-detail" v-if="!loading && report">
    <div class="page-header">
      <div>
        <div class="breadcrumb">
          <button class="link-btn" @click="router.push('/reports')">
            ← 返回列表
          </button>
          <span class="separator">/</span>
          <span>{{ report.reportNo }}</span>
        </div>
        <h2>
          {{ report.complicationType }}
          <span v-if="report.isUrgent" class="urgent-tag">紧急</span>
        </h2>
        <p class="text-muted text-sm">
          患者：{{ report.patient.name }} · 上报时间：{{
            formatDateTime(report.reportTime)
          }}
        </p>
      </div>
      <div class="header-actions">
        <button
          v-if="report.status !== 'closed'"
          class="btn btn-outline"
          @click="enableEdit"
          v-show="!editMode"
        >
          ✏️ 编辑
        </button>
        <button
          v-if="report.status !== 'closed' && availableStatuses.length > 0"
          class="btn btn-primary"
          @click="openStatusModal"
        >
          🔄 变更状态
        </button>
      </div>
    </div>

    <div class="status-bar">
      <div class="status-info">
        <span class="label">当前状态</span>
        <span
          class="status-badge"
          :style="{
            backgroundColor: statusMap[report.status].bgColor,
            color: statusMap[report.status].color,
          }"
        >
          {{ statusMap[report.status].label }}
        </span>
      </div>
      <div class="status-info">
        <span class="label">严重程度</span>
        <span
          class="severity-tag"
          :style="{
            backgroundColor: severityMap[report.severity].bgColor,
            color: severityMap[report.severity].color,
          }"
        >
          {{ severityMap[report.severity].label }}
        </span>
      </div>
      <div class="status-info">
        <span class="label">上报人</span>
        <span class="value">
          <span
            class="role-tag"
            :style="{ color: staffRoleMap[report.reporter.role].color }"
          >
            {{ staffRoleMap[report.reporter.role].label }}
          </span>
          {{ report.reporter.name }}
        </span>
      </div>
      <div class="status-info" v-if="report.handler">
        <span class="label">处理人</span>
        <span class="value">
          <span
            class="role-tag"
            :style="{ color: staffRoleMap[report.handler.role].color }"
          >
            {{ staffRoleMap[report.handler.role].label }}
          </span>
          {{ report.handler.name }}
        </span>
      </div>
    </div>

    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'info' }"
        @click="activeTab = 'info'"
      >
        📝 上报信息
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'followup' }"
        @click="activeTab = 'followup'"
      >
        📞 回访记录
        <span v-if="followUps.length > 0" class="tab-count">{{
          followUps.length
        }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'audit' }"
        @click="activeTab = 'audit'"
      >
        📜 操作历史
        <span v-if="auditLogs.length > 0" class="tab-count">{{
          auditLogs.length
        }}</span>
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'info'" class="info-panel">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">患者信息</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">姓名</span>
                <span class="info-value">{{ report.patient.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">性别/年龄</span>
                <span class="info-value"
                  >{{ report.patient.gender === "male" ? "男" : "女" }}
                  {{ report.patient.age }}岁</span
                >
              </div>
              <div class="info-item">
                <span class="info-label">床位</span>
                <span class="info-value"
                  >{{ report.patient.roomNumber }} /
                  {{ report.patient.bedNumber }}</span
                >
              </div>
              <div class="info-item">
                <span class="info-label">联系电话</span>
                <span class="info-value">{{ report.patient.phone }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card" v-if="report.surgery">
          <div class="card-header">
            <h3 class="card-title">关联手术</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">手术名称</span>
                <span class="info-value">{{ report.surgery.surgeryName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">手术编码</span>
                <span class="info-value">{{ report.surgery.surgeryCode }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">手术日期</span>
                <span class="info-value">{{ report.surgery.surgeryDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">主刀医生</span>
                <span class="info-value">{{
                  report.surgery.surgeon.name
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">麻醉师</span>
                <span class="info-value">{{
                  report.surgery.anesthesiologist.name
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">术前诊断</span>
                <span class="info-value">{{ report.surgery.diagnosis }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">并发症详情</h3>
            <div v-if="!editMode && report.status !== 'closed'">
              <button class="btn btn-link" @click="enableEdit">编辑</button>
            </div>
            <div v-if="editMode" class="edit-actions">
              <button class="btn btn-primary btn-sm" @click="handleSaveEdit">
                保存
              </button>
              <button class="btn btn-outline btn-sm" @click="cancelEdit">
                取消
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="form-section">
              <label class="form-label">并发症类型</label>
              <div class="form-value">
                {{ report.complicationType }} ({{ report.complicationCode }})
              </div>
            </div>
            <div class="form-section">
              <label class="form-label">发生时间</label>
              <div class="form-value">
                {{ formatDateTime(report.onsetTime) }}
              </div>
            </div>
            <div class="form-section">
              <label class="form-label">情况描述</label>
              <textarea
                v-if="editMode"
                v-model="editForm.description"
                class="form-textarea"
                rows="3"
              ></textarea>
              <div v-else class="form-value">{{ report.description }}</div>
            </div>
            <div class="form-section">
              <label class="form-label">临床表现</label>
              <textarea
                v-if="editMode"
                v-model="editForm.clinicalManifestation"
                class="form-textarea"
                rows="3"
              ></textarea>
              <div v-else class="form-value">
                {{ report.clinicalManifestation }}
              </div>
            </div>
            <div class="form-section">
              <label class="form-label">处理措施</label>
              <textarea
                v-if="editMode"
                v-model="editForm.treatmentMeasures"
                class="form-textarea"
                rows="3"
              ></textarea>
              <div v-else class="form-value">
                {{ report.treatmentMeasures }}
              </div>
            </div>
            <div class="form-section">
              <label class="form-label">当前状态</label>
              <textarea
                v-if="editMode"
                v-model="editForm.currentStatus"
                class="form-textarea"
                rows="2"
              ></textarea>
              <div v-else class="form-value">{{ report.currentStatus }}</div>
            </div>

            <div class="form-section" v-if="report.rejectReason">
              <label class="form-label">驳回原因</label>
              <div class="form-value reject-reason">
                {{ report.rejectReason }}
              </div>
            </div>

            <div class="form-section" v-if="report.resolution">
              <label class="form-label">处理结果</label>
              <div class="form-value resolution">{{ report.resolution }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'followup'" class="followup-panel">
        <div class="panel-header">
          <h3>回访记录</h3>
          <button
            v-if="report.status !== 'closed'"
            class="btn btn-primary btn-sm"
            @click="openFollowUpModal"
          >
            ➕ 新增回访
          </button>
        </div>

        <div v-if="followUps.length === 0" class="empty-state">
          <div class="empty-icon">📞</div>
          <p>暂无回访记录</p>
        </div>

        <div v-else class="followup-list">
          <div
            v-for="followUp in followUps"
            :key="followUp.id"
            class="followup-card"
          >
            <div class="followup-header">
              <div class="followup-type">
                <span
                  class="type-tag"
                  :style="{
                    color: followUpTypeMap[followUp.followUpType].color,
                  }"
                >
                  {{ followUpTypeMap[followUp.followUpType].label }}
                </span>
                <span
                  class="status-tag"
                  :style="{
                    backgroundColor: followUpStatusMap[followUp.status].bgColor,
                    color: followUpStatusMap[followUp.status].color,
                  }"
                >
                  {{ followUpStatusMap[followUp.status].label }}
                </span>
              </div>
              <div class="followup-time">
                计划：{{ formatDateTime(followUp.plannedTime) }}
                <template v-if="followUp.actualTime">
                  · 实际：{{ formatDateTime(followUp.actualTime) }}
                </template>
              </div>
            </div>

            <div
              v-if="followUp.status === 'completed'"
              class="followup-content"
            >
              <div class="followup-section">
                <span class="section-label">患者情况</span>
                <p>{{ followUp.patientCondition }}</p>
              </div>
              <div class="followup-section" v-if="followUp.vitalSigns">
                <span class="section-label">生命体征</span>
                <p>{{ followUp.vitalSigns }}</p>
              </div>
              <div class="followup-section" v-if="followUp.woundCondition">
                <span class="section-label">伤口情况</span>
                <p>{{ followUp.woundCondition }}</p>
              </div>
              <div
                class="followup-section"
                v-if="followUp.medicationCompliance"
              >
                <span class="section-label">用药依从性</span>
                <p>{{ followUp.medicationCompliance }}</p>
              </div>
              <div class="followup-section">
                <span class="section-label">指导意见</span>
                <p>{{ followUp.guidanceGiven }}</p>
              </div>
              <div class="followup-section" v-if="followUp.nextFollowUpTime">
                <span class="section-label">下次回访</span>
                <p>{{ formatDateTime(followUp.nextFollowUpTime) }}</p>
              </div>
              <div class="followup-section" v-if="followUp.notes">
                <span class="section-label">备注</span>
                <p>{{ followUp.notes }}</p>
              </div>
              <div class="followup-footer">
                <span>
                  操作人：
                  <span
                    class="role-tag"
                    :style="{
                      color: staffRoleMap[followUp.operator.role].color,
                    }"
                  >
                    {{ staffRoleMap[followUp.operator.role].label }}
                  </span>
                  {{ followUp.operator.name }}
                </span>
              </div>
            </div>

            <div
              v-else-if="followUp.status === 'returned'"
              class="followup-returned"
            >
              <div class="return-reason">
                <span class="reason-label">⚠️ 退回原因：</span>
                {{ followUp.returnReason }}
              </div>
              <button
                class="btn btn-primary btn-sm"
                @click="openCompleteModal(followUp)"
              >
                🔄 重新完成回访
              </button>
            </div>

            <div
              v-else-if="followUp.status === 'pending'"
              class="followup-pending"
            >
              <p>等待回访...</p>
              <button
                class="btn btn-primary btn-sm"
                @click="openCompleteModal(followUp)"
              >
                ✅ 完成回访
              </button>
            </div>

            <div v-else class="followup-readonly">
              <p
                v-if="followUp.status === 'missed'"
                class="readonly-text missed-text"
              >
                已错过计划回访时间
              </p>
              <p
                v-if="followUp.status === 'cancelled'"
                class="readonly-text cancelled-text"
              >
                已取消{{ followUp.notes ? "：" + followUp.notes : "" }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'audit'" class="audit-panel">
        <h3>操作历史（完整追溯）</h3>

        <div v-if="auditLogs.length === 0" class="empty-state">
          <div class="empty-icon">📜</div>
          <p>暂无操作记录</p>
        </div>

        <div v-else class="timeline">
          <div
            v-for="(log, index) in auditLogs"
            :key="log.id"
            class="timeline-item"
          >
            <div
              class="timeline-line"
              v-if="index < auditLogs.length - 1"
            ></div>
            <div
              class="timeline-dot"
              :style="{ backgroundColor: auditActionMap[log.action].color }"
            >
              {{ auditActionMap[log.action].icon }}
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span
                  class="action-type"
                  :style="{ color: auditActionMap[log.action].color }"
                >
                  {{ auditActionMap[log.action].label }}
                </span>
                <span class="timeline-time">{{
                  formatDateTime(log.timestamp)
                }}</span>
              </div>
              <p class="timeline-desc">{{ log.description }}</p>
              <div class="timeline-operator">
                <span
                  class="role-tag"
                  :style="{ color: staffRoleMap[log.operatorRole].color }"
                >
                  {{ staffRoleMap[log.operatorRole].label }}
                </span>
                {{ log.operatorName }}
              </div>
              <div v-if="log.oldValue && log.newValue" class="timeline-diff">
                <span class="old-value">旧值：{{ log.oldValue }}</span>
                <span class="arrow">→</span>
                <span class="new-value">新值：{{ log.newValue }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal-overlay"
      v-if="showStatusModal"
      @click.self="showStatusModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>变更状态</h3>
          <button class="close-btn" @click="showStatusModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <label class="form-label">当前状态</label>
            <span
              class="status-badge"
              :style="{
                backgroundColor: statusMap[report.status].bgColor,
                color: statusMap[report.status].color,
              }"
            >
              {{ statusMap[report.status].label }}
            </span>
          </div>
          <div class="form-section">
            <label class="form-label required">目标状态</label>
            <select v-model="newStatus" class="form-select">
              <option
                v-for="opt in availableStatusOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="form-section" v-if="newStatus === 'rejected'">
            <label class="form-label required">驳回原因</label>
            <textarea
              v-model="rejectReason"
              class="form-textarea"
              rows="3"
              placeholder="请输入驳回原因..."
            ></textarea>
          </div>
          <div
            class="form-section"
            v-if="newStatus === 'resolved' || newStatus === 'closed'"
          >
            <label class="form-label required">处理结果</label>
            <textarea
              v-model="resolution"
              class="form-textarea"
              rows="3"
              placeholder="请输入处理结果..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showStatusModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="handleStatusChange">
            确认变更
          </button>
        </div>
      </div>
    </div>

    <div
      class="modal-overlay"
      v-if="showFollowUpModal"
      @click.self="showFollowUpModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>新增回访计划</h3>
          <button class="close-btn" @click="showFollowUpModal = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <label class="form-label required">回访类型</label>
            <select v-model="newFollowUp.followUpType" class="form-select">
              <option
                v-for="opt in followUpTypeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="form-section">
            <label class="form-label required">计划时间</label>
            <input
              v-model="newFollowUp.plannedTime"
              type="datetime-local"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showFollowUpModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="handleCreateFollowUp">
            创建
          </button>
        </div>
      </div>
    </div>

    <div
      class="modal-overlay"
      v-if="showCompleteFollowUpModal"
      @click.self="showCompleteFollowUpModal = false"
    >
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>
            {{
              selectedFollowUp?.status === "returned"
                ? "重新完成回访记录"
                : "完成回访记录"
            }}
          </h3>
          <button class="close-btn" @click="showCompleteFollowUpModal = false">
            ×
          </button>
        </div>
        <div
          v-if="selectedFollowUp?.status === 'returned'"
          class="return-alert"
        >
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">
            退回原因：{{ selectedFollowUp.returnReason }}
          </span>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <label class="form-label required">患者情况</label>
            <textarea
              v-model="completeForm.patientCondition"
              class="form-textarea"
              rows="3"
              placeholder="请描述患者当前情况..."
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-section">
              <label class="form-label">生命体征</label>
              <input
                v-model="completeForm.vitalSigns"
                type="text"
                class="form-input"
                placeholder="如：BP 130/80mmHg, P 78次/分"
              />
            </div>
            <div class="form-section">
              <label class="form-label">伤口情况</label>
              <input
                v-model="completeForm.woundCondition"
                type="text"
                class="form-input"
                placeholder="如：切口愈合良好，无红肿渗液"
              />
            </div>
          </div>
          <div class="form-section">
            <label class="form-label">用药依从性</label>
            <input
              v-model="completeForm.medicationCompliance"
              type="text"
              class="form-input"
              placeholder="如：遵医嘱用药，无漏服"
            />
          </div>
          <div class="form-section">
            <label class="form-label required">指导意见</label>
            <textarea
              v-model="completeForm.guidanceGiven"
              class="form-textarea"
              rows="2"
              placeholder="请输入对患者的指导意见..."
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-section">
              <label class="form-label">下次回访时间</label>
              <input
                v-model="completeForm.nextFollowUpTime"
                type="datetime-local"
                class="form-input"
              />
            </div>
            <div class="form-section">
              <label class="form-label">备注</label>
              <input
                v-model="completeForm.notes"
                type="text"
                class="form-input"
                placeholder="其他需要记录的内容"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-outline"
            @click="showCompleteFollowUpModal = false"
          >
            取消
          </button>
          <button class="btn btn-primary" @click="handleCompleteFollowUp">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="loading" class="loading-state">
    <div class="loading-spinner"></div>
    <p>加载中...</p>
  </div>
</template>

<style scoped>
.report-detail {
  min-height: 100%;
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
  display: flex;
  align-items: center;
  gap: 12px;
}

.urgent-tag {
  padding: 4px 10px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  border-radius: 6px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.status-bar {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: #6b7280;
}

.value {
  font-size: 14px;
  color: #1f2937;
}

.status-badge,
.severity-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.role-tag {
  font-size: 12px;
  font-weight: 600;
  margin-right: 4px;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #374151;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 500;
}

.tab-count {
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.tab-btn.active .tab-count {
  background: #dbeafe;
  color: #1d4ed8;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-body {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.form-section {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.form-value {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
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
}

.form-textarea:focus,
.form-input:focus,
.form-select:focus {
  border-color: #3b82f6;
}

.reject-reason {
  color: #dc2626;
  background: #fef2f2;
}

.resolution {
  color: #059669;
  background: #f0fdf4;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.btn-link {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
}

.btn-link:hover {
  text-decoration: underline;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.followup-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.followup-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.followup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.followup-type {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-tag {
  font-size: 13px;
  font-weight: 600;
}

.followup-time {
  font-size: 12px;
  color: #6b7280;
}

.followup-section {
  margin-bottom: 12px;
}

.section-label {
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
}

.followup-section p {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
  margin: 0;
}

.followup-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
  color: #6b7280;
}

.followup-pending {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fef3c7;
  border-radius: 8px;
}

.followup-pending p {
  color: #92400e;
  margin: 0;
}

.followup-returned {
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.return-reason {
  font-size: 13px;
  color: #991b1b;
  line-height: 1.5;
}

.reason-label {
  font-weight: 600;
}

.followup-returned .btn {
  align-self: flex-end;
}

.followup-readonly {
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.readonly-text {
  font-size: 13px;
  margin: 0;
}

.missed-text {
  color: #b45309;
}

.cancelled-text {
  color: #6b7280;
}

.return-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 20px;
  font-size: 13px;
  color: #991b1b;
}

.return-alert .alert-icon {
  font-size: 16px;
}

.return-alert .alert-text {
  flex: 1;
  line-height: 1.5;
}

.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-line {
  position: absolute;
  left: -24px;
  top: 30px;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-dot {
  position: absolute;
  left: -36px;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
}

.timeline-content {
  background: white;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.action-type {
  font-size: 13px;
  font-weight: 600;
}

.timeline-time {
  font-size: 12px;
  color: #6b7280;
}

.timeline-desc {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.5;
}

.timeline-operator {
  font-size: 12px;
  color: #6b7280;
}

.timeline-diff {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.old-value {
  color: #dc2626;
  text-decoration: line-through;
}

.arrow {
  color: #9ca3af;
}

.new-value {
  color: #059669;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6b7280;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-lg {
  max-width: 700px;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.text-muted {
  color: #6b7280;
}

.text-sm {
  font-size: 12px;
}
</style>
