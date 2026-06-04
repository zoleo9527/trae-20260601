<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import type {
  ComplicationReport,
  ComplicationStatus,
  ComplicationSeverity,
} from "@/types";
import {
  queryReports,
  changeStatus,
  statusMap,
  severityMap,
  staffRoleMap,
} from "@/store";
import { formatDateTime, getRelativeTime } from "@/utils/format";

const router = useRouter();
const reports = ref<ComplicationReport[]>([]);
const total = ref(0);
const loading = ref(false);

const statusFilter = ref<ComplicationStatus | "all">("all");
const severityFilter = ref<ComplicationSeverity | "all">("all");
const keyword = ref("");
const page = ref(1);
const pageSize = ref(10);

async function loadData() {
  loading.value = true;
  try {
    const res = await queryReports({
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value === "all" ? undefined : statusFilter.value,
      severity:
        severityFilter.value === "all" ? undefined : severityFilter.value,
      keyword: keyword.value || undefined,
    });
    if (res.code === 0 && res.data) {
      reports.value = res.data.list;
      total.value = res.data.total;
    }
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

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

function prevPage() {
  if (page.value > 1) {
    page.value--;
    loadData();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    loadData();
  }
}

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "pending_followup", label: "待回访" },
  { value: "resolved", label: "已解决" },
  { value: "closed", label: "已结案" },
  { value: "rejected", label: "已驳回" },
];

const severityOptions = [
  { value: "all", label: "全部程度" },
  { value: "mild", label: "轻度" },
  { value: "moderate", label: "中度" },
  { value: "severe", label: "重度" },
  { value: "critical", label: "危重" },
];

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="report-list">
    <div class="page-header">
      <div>
        <h2>并发症上报列表</h2>
        <p class="text-muted text-sm">查看和管理所有并发症上报记录</p>
      </div>
      <button class="btn btn-primary" @click="router.push('/reports/create')">
        ➕ 新建上报
      </button>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="search-box">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索患者姓名、并发症类型、上报编号..."
            class="search-input"
            @keyup.enter="loadData"
          />
          <button class="btn btn-outline btn-sm" @click="loadData">搜索</button>
        </div>
        <div class="filter-selects">
          <select v-model="statusFilter" class="select" @change="loadData">
            <option
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
          <select v-model="severityFilter" class="select" @change="loadData">
            <option
              v-for="opt in severityOptions"
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
        <div v-else-if="reports.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暂无上报记录</p>
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>上报编号</th>
              <th>患者</th>
              <th>并发症</th>
              <th>严重程度</th>
              <th>手术</th>
              <th>上报人</th>
              <th>处理人</th>
              <th>上报时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td>
                <span class="report-no">{{ report.reportNo }}</span>
                <span v-if="report.isUrgent" class="urgent-tag">紧急</span>
              </td>
              <td>
                <div class="patient-mini">
                  <div class="font-medium">{{ report.patient.name }}</div>
                  <div class="text-sm text-muted">
                    {{ report.patient.gender === "male" ? "男" : "女"
                    }}{{ report.patient.age }}岁
                  </div>
                </div>
              </td>
              <td>
                <div>{{ report.complicationType }}</div>
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
              <td>
                <div v-if="report.surgery" class="surgery-mini">
                  <div>{{ report.surgery.surgeryName }}</div>
                  <div class="text-sm text-muted">
                    {{ report.surgery.surgeryDate }}
                  </div>
                </div>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <div class="staff-mini">
                  <span
                    class="staff-role"
                    :style="{ color: staffRoleMap[report.reporter.role].color }"
                  >
                    {{ staffRoleMap[report.reporter.role].label }}
                  </span>
                  <span class="staff-name">{{ report.reporter.name }}</span>
                </div>
              </td>
              <td>
                <div v-if="report.handler" class="staff-mini">
                  <span
                    class="staff-role"
                    :style="{ color: staffRoleMap[report.handler.role].color }"
                  >
                    {{ staffRoleMap[report.handler.role].label }}
                  </span>
                  <span class="staff-name">{{ report.handler.name }}</span>
                </div>
                <span v-else class="text-muted text-sm">待分配</span>
              </td>
              <td>
                <div>{{ formatDateTime(report.reportTime) }}</div>
                <div class="text-sm text-muted">
                  {{ getRelativeTime(report.reportTime) }}
                </div>
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
                    详情
                  </button>
                  <button
                    v-if="
                      report.status === 'pending' ||
                      report.status === 'rejected'
                    "
                    class="btn btn-primary btn-sm"
                    @click="handleAccept(report)"
                  >
                    受理
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

        <div v-if="total > pageSize" class="pagination">
          <span class="pagination-info"
            >共 {{ total }} 条记录，第 {{ page }} / {{ totalPages }} 页</span
          >
          <div class="pagination-buttons">
            <button
              class="btn btn-outline btn-sm"
              @click="prevPage"
              :disabled="page === 1"
            >
              上一页
            </button>
            <button
              class="btn btn-outline btn-sm"
              @click="nextPage"
              :disabled="page === totalPages"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-list {
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

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-bar {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 300px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.filter-selects {
  display: flex;
  gap: 8px;
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

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 12px;
}

.text-muted {
  color: #6b7280;
}

.patient-mini,
.surgery-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.severity-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.pagination {
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info {
  font-size: 13px;
  color: #6b7280;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
}
</style>
