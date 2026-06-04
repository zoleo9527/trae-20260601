<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import type {
  ComplicationReport,
  FollowUpRecord,
  DashboardStats,
} from "@/types";
import {
  getDashboardStats,
  getTodayPending,
  getOverdueReports,
  getRecentlyRejected,
  getTodayPendingFollowUps,
  getOverdueFollowUps,
  getRecentlyReturnedFollowUps,
  changeStatus,
  statusMap,
  severityMap,
  staffRoleMap,
  followUpStatusMap,
  followUpTypeMap,
} from "@/store";
import { formatDateTime, getRelativeTime } from "@/utils/format";

const router = useRouter();
const stats = ref<DashboardStats | null>(null);
const todayPending = ref<ComplicationReport[]>([]);
const overdueReports = ref<ComplicationReport[]>([]);
const recentlyRejected = ref<ComplicationReport[]>([]);
const todayPendingFollowUps = ref<FollowUpRecord[]>([]);
const overdueFollowUps = ref<FollowUpRecord[]>([]);
const recentlyReturnedFollowUps = ref<FollowUpRecord[]>([]);
const loading = ref(true);
const activeReportTab = ref<"pending" | "overdue" | "rejected">("pending");
const activeFollowUpTab = ref<"pending" | "overdue" | "returned">("pending");

async function loadData() {
  loading.value = true;
  try {
    const [
      statsRes,
      pendingRes,
      overdueRes,
      rejectedRes,
      followUpPendingRes,
      followUpOverdueRes,
      followUpReturnedRes,
    ] = await Promise.all([
      getDashboardStats(),
      getTodayPending(),
      getOverdueReports(),
      getRecentlyRejected(),
      getTodayPendingFollowUps(),
      getOverdueFollowUps(),
      getRecentlyReturnedFollowUps(),
    ]);
    if (statsRes.code === 0) stats.value = statsRes.data!;
    if (pendingRes.code === 0) todayPending.value = pendingRes.data!;
    if (overdueRes.code === 0) overdueReports.value = overdueRes.data!;
    if (rejectedRes.code === 0) recentlyRejected.value = rejectedRes.data!;
    if (followUpPendingRes.code === 0)
      todayPendingFollowUps.value = followUpPendingRes.data!;
    if (followUpOverdueRes.code === 0)
      overdueFollowUps.value = followUpOverdueRes.data!;
    if (followUpReturnedRes.code === 0)
      recentlyReturnedFollowUps.value = followUpReturnedRes.data!;
  } finally {
    loading.value = false;
  }
}

function viewDetail(report: ComplicationReport) {
  router.push(`/reports/${report.id}`);
}

async function handleAccept(report: ComplicationReport) {
  const res = await changeStatus({
    id: report.id,
    status: "processing",
    handlerId: "s1",
  });
  if (res.code === 0) {
    alert(res.message);
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

async function handleReject(report: ComplicationReport) {
  const reason = prompt("请输入驳回原因：");
  if (!reason) return;
  const res = await changeStatus({
    id: report.id,
    status: "rejected",
    rejectReason: reason,
  });
  if (res.code === 0) {
    alert(res.message);
    loadData();
  } else {
    alert(`操作失败：${res.message}`);
  }
}

function viewFollowUpReport(followUp: FollowUpRecord) {
  router.push(`/reports/${followUp.reportId}`);
}

const currentReportList = computed(() => {
  switch (activeReportTab.value) {
    case "pending":
      return todayPending.value;
    case "overdue":
      return overdueReports.value;
    case "rejected":
      return recentlyRejected.value;
  }
});

const currentFollowUpList = computed(() => {
  switch (activeFollowUpTab.value) {
    case "pending":
      return todayPendingFollowUps.value;
    case "overdue":
      return overdueFollowUps.value;
    case "returned":
      return recentlyReturnedFollowUps.value;
  }
});

const reportTabCounts = computed(() => ({
  pending: todayPending.value.length,
  overdue: overdueReports.value.length,
  rejected: recentlyRejected.value.length,
}));

const followUpTabCounts = computed(() => ({
  pending: todayPendingFollowUps.value.length,
  overdue: overdueFollowUps.value.length,
  returned: recentlyReturnedFollowUps.value.length,
}));

function getOverdueHours(report: ComplicationReport): number {
  const now = new Date();
  const created = new Date(report.createdAt);
  return Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60));
}

function getTimeLimit(report: ComplicationReport): number {
  if (report.isUrgent) return 2;
  switch (report.severity) {
    case "critical":
      return 4;
    case "severe":
      return 8;
    case "moderate":
      return 24;
    case "mild":
      return 48;
  }
}

function getFollowUpOverdueHours(followUp: FollowUpRecord): number {
  const now = new Date();
  const planned = new Date(followUp.plannedTime);
  return Math.round((now.getTime() - planned.getTime()) / (1000 * 60 * 60));
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h2>今日工作概览</h2>
        <p class="text-muted text-sm">
          眼科手术中心并发症上报与回访跟踪 - 待办事项一目了然
        </p>
      </div>
      <button class="btn btn-primary" @click="router.push('/reports/create')">
        ➕ 新建并发症上报
      </button>
    </div>

    <div class="stats-grid-9" v-if="stats">
      <div class="stat-card stat-danger">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayPending }}</div>
          <div class="stat-label">今日待处理</div>
        </div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayOverdue }}</div>
          <div class="stat-label">上报超时</div>
        </div>
      </div>
      <div class="stat-card stat-rejected">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.recentlyRejected }}</div>
          <div class="stat-label">上报退回</div>
        </div>
      </div>
      <div class="stat-card stat-primary">
        <div class="stat-icon">📞</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.followUpTodayPending }}</div>
          <div class="stat-label">回访待处理</div>
        </div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.followUpOverdue }}</div>
          <div class="stat-label">回访超时</div>
        </div>
      </div>
      <div class="stat-card stat-rejected">
        <div class="stat-icon">↩️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.followUpRecentlyReturned }}</div>
          <div class="stat-label">回访退回</div>
        </div>
      </div>
      <div class="stat-card stat-purple">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalProcessing }}</div>
          <div class="stat-label">处理中</div>
        </div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.resolvedThisWeek }}</div>
          <div class="stat-label">本周已解决</div>
        </div>
      </div>
      <div class="stat-card stat-gray">
        <div class="stat-icon">⏱️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.averageResolutionHours }}h</div>
          <div class="stat-label">平均解决时长</div>
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">并发症上报待办</h3>
          <div class="tabs">
            <button
              class="tab-btn"
              :class="{ active: activeReportTab === 'pending' }"
              @click="activeReportTab = 'pending'"
            >
              今日待处理
              <span
                class="tab-badge pending"
                v-if="reportTabCounts.pending > 0"
                >{{ reportTabCounts.pending }}</span
              >
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeReportTab === 'overdue' }"
              @click="activeReportTab = 'overdue'"
            >
              超时预警
              <span
                class="tab-badge overdue"
                v-if="reportTabCounts.overdue > 0"
                >{{ reportTabCounts.overdue }}</span
              >
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeReportTab === 'rejected' }"
              @click="activeReportTab = 'rejected'"
            >
              刚被退回
              <span
                class="tab-badge rejected"
                v-if="reportTabCounts.rejected > 0"
                >{{ reportTabCounts.rejected }}</span
              >
            </button>
          </div>
        </div>
        <div class="card-body" style="padding: 0">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="currentReportList.length === 0" class="empty-state">
            <div class="empty-icon">🎉</div>
            <p>
              {{
                activeReportTab === "pending"
                  ? "今日暂无待处理事项"
                  : activeReportTab === "overdue"
                    ? "暂无超时记录"
                    : "暂无被退回记录"
              }}
            </p>
          </div>
          <table v-else class="table">
            <thead>
              <tr>
                <th>上报编号</th>
                <th>患者信息</th>
                <th>并发症类型</th>
                <th>严重程度</th>
                <th v-if="activeReportTab === 'overdue'">超时情况</th>
                <th v-if="activeReportTab === 'rejected'">驳回原因</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in currentReportList" :key="report.id">
                <td>
                  <span class="report-no">{{ report.reportNo }}</span>
                  <span v-if="report.isUrgent" class="urgent-tag">紧急</span>
                </td>
                <td>
                  <div class="patient-info">
                    <div class="avatar">
                      {{ report.patient.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-medium">{{ report.patient.name }}</div>
                      <div class="text-sm text-muted">
                        {{ report.patient.gender === "male" ? "男" : "女" }}
                        {{ report.patient.age }}岁 ·
                        {{ report.patient.roomNumber }}/{{
                          report.patient.bedNumber
                        }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="complication-type">
                    {{ report.complicationType }}
                  </div>
                  <div class="text-sm text-muted">
                    {{ report.complicationCode }}
                  </div>
                </td>
                <td>
                  <span
                    class="severity-tag"
                    :style="{
                      backgroundColor: severityMap[report.severity].bgColor,
                      color: severityMap[report.severity].color,
                    }"
                  >
                    {{ severityMap[report.severity].label }}
                  </span>
                </td>
                <td v-if="activeReportTab === 'overdue'">
                  <div class="overdue-info">
                    <span class="overdue-hours"
                      >已超时 {{ getOverdueHours(report) }} 小时</span
                    >
                    <div class="text-sm text-muted">
                      处理时限 {{ getTimeLimit(report) }} 小时
                    </div>
                  </div>
                </td>
                <td v-if="activeReportTab === 'rejected'">
                  <div class="reject-reason">{{ report.rejectReason }}</div>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :style="{
                      backgroundColor: statusMap[report.status].bgColor,
                      color: statusMap[report.status].color,
                    }"
                  >
                    {{ statusMap[report.status].label }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="btn btn-outline btn-sm"
                      @click="viewDetail(report)"
                    >
                      查看详情
                    </button>
                    <button
                      v-if="
                        report.status === 'pending' ||
                        report.status === 'rejected'
                      "
                      class="btn btn-primary btn-sm"
                      @click="handleAccept(report)"
                    >
                      开始处理
                    </button>
                    <button
                      v-if="report.status === 'pending'"
                      class="btn btn-danger btn-sm"
                      @click="handleReject(report)"
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

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">回访跟踪待办</h3>
          <div class="tabs">
            <button
              class="tab-btn"
              :class="{ active: activeFollowUpTab === 'pending' }"
              @click="activeFollowUpTab = 'pending'"
            >
              今日待处理
              <span
                class="tab-badge pending"
                v-if="followUpTabCounts.pending > 0"
                >{{ followUpTabCounts.pending }}</span
              >
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeFollowUpTab === 'overdue' }"
              @click="activeFollowUpTab = 'overdue'"
            >
              回访超时
              <span
                class="tab-badge overdue"
                v-if="followUpTabCounts.overdue > 0"
                >{{ followUpTabCounts.overdue }}</span
              >
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeFollowUpTab === 'returned' }"
              @click="activeFollowUpTab = 'returned'"
            >
              刚被退回
              <span
                class="tab-badge rejected"
                v-if="followUpTabCounts.returned > 0"
                >{{ followUpTabCounts.returned }}</span
              >
            </button>
          </div>
        </div>
        <div class="card-body" style="padding: 0">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="currentFollowUpList.length === 0" class="empty-state">
            <div class="empty-icon">🎉</div>
            <p>
              {{
                activeFollowUpTab === "pending"
                  ? "今日暂无待处理回访"
                  : activeFollowUpTab === "overdue"
                    ? "暂无超时回访"
                    : "暂无被退回回访"
              }}
            </p>
          </div>
          <div v-else class="follow-up-list">
            <div
              v-for="followUp in currentFollowUpList"
              :key="followUp.id"
              class="follow-up-item"
            >
              <div class="fu-main">
                <div class="fu-header">
                  <span class="fu-patient">{{
                    followUp.report.patient.name
                  }}</span>
                  <span
                    class="fu-type-tag"
                    :style="{
                      color: followUpTypeMap[followUp.followUpType].color,
                    }"
                  >
                    {{ followUpTypeMap[followUp.followUpType].label }}
                  </span>
                  <span
                    class="status-badge"
                    :style="{
                      backgroundColor:
                        followUpStatusMap[followUp.status].bgColor,
                      color: followUpStatusMap[followUp.status].color,
                    }"
                  >
                    {{ followUpStatusMap[followUp.status].label }}
                  </span>
                </div>
                <div class="fu-detail">
                  <span class="text-muted">{{
                    followUp.report.complicationType
                  }}</span>
                  <span class="fu-sep">·</span>
                  <span class="text-muted"
                    >计划 {{ formatDateTime(followUp.plannedTime) }}</span
                  >
                  <span
                    v-if="activeFollowUpTab === 'overdue'"
                    class="fu-overdue-hours"
                  >
                    已超时 {{ getFollowUpOverdueHours(followUp) }}h
                  </span>
                </div>
                <div
                  v-if="
                    activeFollowUpTab === 'returned' && followUp.returnReason
                  "
                  class="fu-return-reason"
                >
                  退回原因：{{ followUp.returnReason }}
                  <span v-if="followUp.returnedBy" class="text-muted text-sm"
                    >（{{ followUp.returnedBy.name }}）</span
                  >
                </div>
              </div>
              <div class="fu-actions">
                <button
                  class="btn btn-primary btn-sm"
                  @click="viewFollowUpReport(followUp)"
                >
                  查看上报
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stats-grid-9 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
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

.stat-card.stat-purple {
  border-left-color: #8b5cf6;
}

.stat-card.stat-rejected {
  border-left-color: #dc2626;
}

.stat-card.stat-gray {
  border-left-color: #9ca3af;
}

.stat-icon {
  font-size: 36px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

.two-col {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
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

.tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f3f4f6;
}

.tab-btn.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.tab-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
}

.tab-badge.pending {
  background: #ef4444;
}

.tab-badge.overdue {
  background: #f59e0b;
}

.tab-badge.rejected {
  background: #dc2626;
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

.report-no {
  font-family: monospace;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.urgent-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 500;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
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

.complication-type {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.severity-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.overdue-info {
  text-align: left;
}

.overdue-hours {
  color: #dc2626;
  font-weight: 600;
  font-size: 13px;
}

.reject-reason {
  max-width: 200px;
  font-size: 12px;
  color: #dc2626;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
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

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
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

.follow-up-list {
  padding: 8px 0;
}

.follow-up-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}

.follow-up-item:last-child {
  border-bottom: none;
}

.follow-up-item:hover {
  background: #f9fafb;
}

.fu-main {
  flex: 1;
  min-width: 0;
}

.fu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.fu-patient {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.fu-type-tag {
  font-size: 12px;
  font-weight: 500;
}

.fu-detail {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.fu-sep {
  color: #d1d5db;
}

.fu-overdue-hours {
  color: #dc2626;
  font-weight: 600;
  margin-left: 8px;
}

.fu-return-reason {
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
  line-height: 1.5;
}

.fu-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-left: 12px;
  flex-shrink: 0;
}
</style>
