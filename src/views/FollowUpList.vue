<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import type { FollowUpRecord, FollowUpStatus } from "@/types";
import {
  getAllFollowUps,
  completeFollowUp,
  returnFollowUp,
  getTodayPendingFollowUps,
  getOverdueFollowUps,
  getRecentlyReturnedFollowUps,
  getAuditLogsByFollowUpId,
  followUpStatusMap,
  followUpTypeMap,
  staffRoleMap,
  auditActionMap,
} from "@/store";
import { formatDateTime, getRelativeTime } from "@/utils/format";

const router = useRouter();
const followUps = ref<FollowUpRecord[]>([]);
const todayPending = ref<FollowUpRecord[]>([]);
const overdueFollowUps = ref<FollowUpRecord[]>([]);
const recentlyReturned = ref<FollowUpRecord[]>([]);
const loading = ref(true);
const showCompleteModal = ref(false);
const showReturnModal = ref(false);
const selectedFollowUp = ref<FollowUpRecord | null>(null);
const statusFilter = ref<FollowUpStatus | "all">("all");
const completeForm = ref({
  patientCondition: "",
  vitalSigns: "",
  woundCondition: "",
  medicationCompliance: "",
  guidanceGiven: "",
  nextFollowUpTime: "",
  notes: "",
});
const returnReason = ref("");

async function loadData() {
  loading.value = true;
  try {
    const [allRes, todayRes, overdueRes, returnedRes] = await Promise.all([
      getAllFollowUps(),
      getTodayPendingFollowUps(),
      getOverdueFollowUps(),
      getRecentlyReturnedFollowUps(),
    ]);
    if (allRes.code === 0 && allRes.data) {
      followUps.value = allRes.data.list;
    }
    if (todayRes.code === 0 && todayRes.data) {
      todayPending.value = todayRes.data;
    }
    if (overdueRes.code === 0 && overdueRes.data) {
      overdueFollowUps.value = overdueRes.data;
    }
    if (returnedRes.code === 0 && returnedRes.data) {
      recentlyReturned.value = returnedRes.data;
    }
  } finally {
    loading.value = false;
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
  showCompleteModal.value = true;
}

async function handleComplete() {
  if (!selectedFollowUp.value) return;
  const res = await completeFollowUp({
    id: selectedFollowUp.value.id,
    ...completeForm.value,
  });
  if (res.code === 0) {
    alert(res.message);
    showCompleteModal.value = false;
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

function openReturnModal(followUp: FollowUpRecord) {
  selectedFollowUp.value = followUp;
  returnReason.value = "";
  showReturnModal.value = true;
}

async function handleReturn() {
  if (!selectedFollowUp.value || !returnReason.value) return;
  const res = await returnFollowUp({
    id: selectedFollowUp.value.id,
    reason: returnReason.value,
  });
  if (res.code === 0) {
    alert(res.message);
    showReturnModal.value = false;
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

function viewReport(reportId: string) {
  router.push(`/reports/${reportId}`);
}

function isOverdue(followUp: FollowUpRecord): boolean {
  if (followUp.status !== "pending" && followUp.status !== "returned")
    return false;
  return new Date() > new Date(followUp.plannedTime);
}

function getOverdueHours(followUp: FollowUpRecord): number {
  const diff = new Date().getTime() - new Date(followUp.plannedTime).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

function scrollToFilter(status: FollowUpStatus) {
  statusFilter.value = status;
  const el = document.querySelector(".card");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const filteredFollowUps = computed(() => {
  if (statusFilter.value === "all") return followUps.value;
  return followUps.value.filter((f) => f.status === statusFilter.value);
});

const statusOptions = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待回访" },
  { value: "completed", label: "已完成" },
  { value: "missed", label: "已错过" },
  { value: "cancelled", label: "已取消" },
  { value: "returned", label: "已退回" },
];

const stats = computed(() => ({
  total: followUps.value.length,
  pending: followUps.value.filter((f) => f.status === "pending").length,
  completed: followUps.value.filter((f) => f.status === "completed").length,
  missed: followUps.value.filter((f) => f.status === "missed").length,
  cancelled: followUps.value.filter((f) => f.status === "cancelled").length,
  returned: followUps.value.filter((f) => f.status === "returned").length,
  overdue: followUps.value.filter((f) => isOverdue(f)).length,
  today: todayPending.value.length,
}));

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="followup-list">
    <div class="page-header">
      <div>
        <h2>回访跟踪管理</h2>
        <p class="text-muted text-sm">
          管理和追踪并发症患者的回访记录，所有操作可追溯
        </p>
      </div>
    </div>

    <div class="alert-row">
      <div class="alert-card alert-pending">
        <div class="alert-card-header">
          <div class="alert-title">今日待处理</div>
          <div class="alert-count">{{ todayPending.length }}</div>
        </div>
        <div class="alert-list" v-if="todayPending.length > 0">
          <div
            v-for="item in todayPending.slice(0, 5)"
            :key="item.id"
            class="alert-item"
            @click="scrollToFilter(item.status)"
          >
            <span class="alert-item-name">{{ item.report.patient.name }}</span>
            <span class="alert-item-type">{{
              followUpTypeMap[item.followUpType].label
            }}</span>
            <span class="alert-item-time">{{
              formatDateTime(item.plannedTime)
            }}</span>
          </div>
        </div>
        <div v-else class="alert-empty">暂无待处理</div>
        <div
          class="alert-link"
          v-if="todayPending.length > 0"
          @click="scrollToFilter('pending')"
        >
          查看全部
        </div>
      </div>

      <div class="alert-card alert-overdue">
        <div class="alert-card-header">
          <div class="alert-title">回访超时</div>
          <div class="alert-count alert-count-danger">
            {{ overdueFollowUps.length }}
          </div>
        </div>
        <div class="alert-list" v-if="overdueFollowUps.length > 0">
          <div
            v-for="item in overdueFollowUps.slice(0, 5)"
            :key="item.id"
            class="alert-item"
            @click="scrollToFilter(item.status)"
          >
            <span class="alert-item-name">{{ item.report.patient.name }}</span>
            <span class="alert-item-type">{{
              followUpTypeMap[item.followUpType].label
            }}</span>
            <span class="alert-item-overdue"
              >超时{{ getOverdueHours(item) }}h</span
            >
          </div>
        </div>
        <div v-else class="alert-empty">暂无超时</div>
        <div
          class="alert-link"
          v-if="overdueFollowUps.length > 0"
          @click="scrollToFilter('pending')"
        >
          查看全部
        </div>
      </div>

      <div class="alert-card alert-returned">
        <div class="alert-card-header">
          <div class="alert-title">刚被退回</div>
          <div class="alert-count alert-count-danger">
            {{ recentlyReturned.length }}
          </div>
        </div>
        <div class="alert-list" v-if="recentlyReturned.length > 0">
          <div
            v-for="item in recentlyReturned.slice(0, 5)"
            :key="item.id"
            class="alert-item"
            @click="scrollToFilter('returned')"
          >
            <span class="alert-item-name">{{ item.report.patient.name }}</span>
            <span class="alert-item-type">{{
              followUpTypeMap[item.followUpType].label
            }}</span>
            <span class="alert-item-reason">{{ item.returnReason }}</span>
          </div>
        </div>
        <div v-else class="alert-empty">暂无退回</div>
        <div
          class="alert-link"
          v-if="recentlyReturned.length > 0"
          @click="scrollToFilter('returned')"
        >
          查看全部
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">全部回访</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-value">{{ stats.today }}</div>
        <div class="stat-label">今日待处理</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-value">{{ stats.overdue }}</div>
        <div class="stat-label">回访超时</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card stat-returned">
        <div class="stat-value">{{ stats.returned }}</div>
        <div class="stat-label">已退回</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">回访列表</h3>
        <div class="filter-select">
          <select v-model="statusFilter" class="select">
            <option
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="card-body" style="padding: 0">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="filteredFollowUps.length === 0" class="empty-state">
          <div class="empty-icon">📞</div>
          <p>暂无回访记录</p>
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>回访编号</th>
              <th>患者</th>
              <th>并发症</th>
              <th>回访类型</th>
              <th>计划时间</th>
              <th>操作人</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="followUp in filteredFollowUps" :key="followUp.id">
              <td>
                <span class="followup-no">{{ followUp.id }}</span>
              </td>
              <td>
                <div class="patient-mini">
                  <div class="font-medium">
                    {{ followUp.report.patient.name }}
                  </div>
                  <div class="text-sm text-muted">
                    {{ followUp.report.patient.gender === "male" ? "男" : "女"
                    }}{{ followUp.report.patient.age }}岁
                  </div>
                </div>
              </td>
              <td>
                <div>{{ followUp.report.complicationType }}</div>
                <div class="text-sm text-muted">
                  {{ followUp.report.reportNo }}
                </div>
              </td>
              <td>
                <span
                  class="type-tag"
                  :style="{
                    color: followUpTypeMap[followUp.followUpType].color,
                  }"
                >
                  {{ followUpTypeMap[followUp.followUpType].label }}
                </span>
              </td>
              <td>
                <div>{{ formatDateTime(followUp.plannedTime) }}</div>
                <div
                  class="text-sm"
                  :class="isOverdue(followUp) ? 'text-danger' : 'text-muted'"
                >
                  {{ getRelativeTime(followUp.plannedTime) }}
                  <span v-if="isOverdue(followUp)" class="overdue-badge"
                    >已超时</span
                  >
                </div>
              </td>
              <td>
                <div class="staff-mini">
                  <span
                    class="staff-role"
                    :style="{
                      color: staffRoleMap[followUp.operator.role].color,
                    }"
                  >
                    {{ staffRoleMap[followUp.operator.role].label }}
                  </span>
                  <span class="staff-name">{{ followUp.operator.name }}</span>
                </div>
              </td>
              <td>
                <span
                  class="status-badge"
                  :style="{
                    backgroundColor: followUpStatusMap[followUp.status].bgColor,
                    color: followUpStatusMap[followUp.status].color,
                  }"
                >
                  {{ followUpStatusMap[followUp.status].label }}
                </span>
                <div
                  v-if="followUp.status === 'returned' && followUp.returnReason"
                  class="return-reason-text"
                >
                  {{ followUp.returnReason }}
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn btn-outline btn-sm"
                    @click="viewReport(followUp.reportId)"
                  >
                    查看上报
                  </button>
                  <button
                    v-if="
                      followUp.status === 'pending' ||
                      followUp.status === 'returned'
                    "
                    class="btn btn-primary btn-sm"
                    @click="openCompleteModal(followUp)"
                  >
                    完成回访
                  </button>
                  <button
                    v-if="followUp.status === 'completed'"
                    class="btn btn-danger btn-sm"
                    @click="openReturnModal(followUp)"
                  >
                    退回
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      class="modal-overlay"
      v-if="showCompleteModal"
      @click.self="showCompleteModal = false"
    >
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>完成回访记录</h3>
          <button class="close-btn" @click="showCompleteModal = false">
            ×
          </button>
        </div>
        <div class="modal-body" v-if="selectedFollowUp">
          <div class="patient-summary">
            <div class="avatar">
              {{ selectedFollowUp.report.patient.name.charAt(0) }}
            </div>
            <div>
              <div class="font-medium">
                {{ selectedFollowUp.report.patient.name }}
              </div>
              <div class="text-sm text-muted">
                {{ selectedFollowUp.report.complicationType }} ·
                {{ followUpTypeMap[selectedFollowUp.followUpType].label }}
              </div>
            </div>
          </div>

          <div
            v-if="
              selectedFollowUp.status === 'returned' &&
              selectedFollowUp.returnReason
            "
            class="return-notice"
          >
            <div class="return-notice-label">退回原因</div>
            <div class="return-notice-text">
              {{ selectedFollowUp.returnReason }}
            </div>
          </div>

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
          <button class="btn btn-outline" @click="showCompleteModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="handleComplete">保存</button>
        </div>
      </div>
    </div>

    <div
      class="modal-overlay"
      v-if="showReturnModal"
      @click.self="showReturnModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>退回回访记录</h3>
          <button class="close-btn" @click="showReturnModal = false">×</button>
        </div>
        <div class="modal-body" v-if="selectedFollowUp">
          <div class="patient-summary">
            <div class="avatar">
              {{ selectedFollowUp.report.patient.name.charAt(0) }}
            </div>
            <div>
              <div class="font-medium">
                {{ selectedFollowUp.report.patient.name }}
              </div>
              <div class="text-sm text-muted">
                {{ selectedFollowUp.report.complicationType }} ·
                {{ followUpTypeMap[selectedFollowUp.followUpType].label }} ·
                {{ formatDateTime(selectedFollowUp.plannedTime) }}
              </div>
            </div>
          </div>

          <div class="form-section">
            <label class="form-label required">退回原因</label>
            <textarea
              v-model="returnReason"
              class="form-textarea"
              rows="4"
              placeholder="请输入退回原因..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showReturnModal = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            @click="handleReturn"
            :disabled="!returnReason"
          >
            确认退回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.followup-list {
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.alert-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.alert-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.alert-pending {
  border-left: 4px solid #3b82f6;
}

.alert-overdue {
  border-left: 4px solid #f59e0b;
}

.alert-returned {
  border-left: 4px solid #ef4444;
}

.alert-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.alert-count {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.alert-count-danger {
  color: #ef4444;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 160px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.alert-item:hover {
  background: #f9fafb;
}

.alert-item-name {
  font-weight: 500;
  color: #1f2937;
}

.alert-item-type {
  color: #6b7280;
}

.alert-item-time {
  color: #6b7280;
  font-size: 12px;
  margin-left: auto;
}

.alert-item-overdue {
  color: #ef4444;
  font-weight: 600;
  font-size: 12px;
  margin-left: auto;
}

.alert-item-reason {
  color: #ef4444;
  font-size: 12px;
  margin-left: auto;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 16px 0;
}

.alert-link {
  margin-top: 12px;
  text-align: center;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
}

.alert-link:hover {
  text-decoration: underline;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-card.stat-primary {
  border-left-color: #3b82f6;
}
.stat-card.stat-danger {
  border-left-color: #ef4444;
}
.stat-card.stat-warning {
  border-left-color: #f59e0b;
}
.stat-card.stat-success {
  border-left-color: #10b981;
}
.stat-card.stat-returned {
  border-left-color: #8b5cf6;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  outline: none;
  cursor: pointer;
}

.card-body {
  padding: 20px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.table tbody tr:hover {
  background: #f9fafb;
}

.followup-no {
  font-family: monospace;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 12px;
}

.text-muted {
  color: #6b7280;
}

.text-danger {
  color: #dc2626;
}

.patient-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.type-tag {
  font-size: 12px;
  font-weight: 600;
}

.overdue-badge {
  margin-left: 6px;
  padding: 2px 6px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 11px;
  border-radius: 4px;
}

.staff-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.staff-role {
  font-size: 11px;
  font-weight: 600;
}

.staff-name {
  font-size: 13px;
  color: #374151;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.return-reason-text {
  font-size: 11px;
  color: #dc2626;
  margin-top: 4px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 6px;
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

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-danger:disabled {
  background: #fca5a5;
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

.patient-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

.return-notice {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
}

.return-notice-label {
  font-size: 12px;
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 4px;
}

.return-notice-text {
  font-size: 13px;
  color: #dc2626;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-section {
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
.form-input {
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
.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
