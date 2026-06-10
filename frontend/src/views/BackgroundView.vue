<script setup lang="ts">
import { ref } from 'vue'
import { maintenancePlans } from '@/mock/maintenancePlans'
import { faultCalls } from '@/mock/faultCalls'
import { inspectionDocs } from '@/mock/inspectionDocs'
import { formatDate, formatDateTime } from '@/utils/format'
import {
  MAINTENANCE_TYPE_LABEL,
  MAINTENANCE_STATUS_LABEL,
  FAULT_STATUS_LABEL,
  INSPECTION_TYPE_LABEL,
  INSPECTION_RESULT_LABEL,
} from '@/types/enums'
import {
  Eye,
  CheckCircle,
  Link2,
  Upload,
} from 'lucide-vue-next'
import type {
  MaintenancePlan,
  FaultCall,
  InspectionDoc,
  MaintenanceStatus,
  FaultStatus,
  InspectionResult,
} from '@/types'

type TabKey = 'maintenance' | 'fault' | 'inspection'

const activeTab = ref<TabKey>('maintenance')

const maintenanceStatusClasses: Record<MaintenanceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-400',
  completed: 'bg-green-100 text-green-700 border-green-400',
  overdue: 'bg-red-100 text-red-700 border-red-400',
}

const faultStatusClasses: Record<FaultStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-400',
  dispatched: 'bg-yellow-100 text-yellow-700 border-yellow-400',
  processing: 'bg-blue-100 text-blue-700 border-blue-400',
  resolved: 'bg-green-100 text-green-700 border-green-400',
  closed: 'bg-gray-100 text-gray-700 border-gray-400',
}

const inspectionResultClasses: Record<InspectionResult, string> = {
  passed: 'bg-green-100 text-green-700 border-green-400',
  failed: 'bg-red-100 text-red-700 border-red-400',
  conditional: 'bg-yellow-100 text-yellow-700 border-yellow-400',
}

function handleMaintenanceMarkComplete(plan: MaintenancePlan) {
  plan.status = 'completed'
  plan.actualDate = new Date().toISOString().slice(0, 10)
}

function handleLinkToReplacement(call: FaultCall) {
  alert(`关联故障电话 ${call.callNo} 到备件更换记录（占位功能）`)
}

function handleUpload() {
  alert('年检报告上传入口（占位）')
}

function handleViewMaintenance(plan: MaintenancePlan) {
  alert(`查看维保计划详情：${plan.id}`)
}

function handleViewFault(call: FaultCall) {
  alert(`查看故障电话详情：${call.callNo}`)
}

function handleViewInspection(doc: InspectionDoc) {
  alert(`查看年检资料详情：${doc.reportNo}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-7xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">背景资料</h1>
      </div>

      <div class="bg-white border border-gray-200">
        <div class="border-b border-gray-200">
          <nav class="flex">
            <button
              type="button"
              class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === 'maintenance'
                  ? 'border-blue-900 text-blue-900 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              "
              @click="activeTab = 'maintenance'"
            >
              维保计划
            </button>
            <button
              type="button"
              class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === 'fault'
                  ? 'border-blue-900 text-blue-900 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              "
              @click="activeTab = 'fault'"
            >
              故障电话
            </button>
            <button
              type="button"
              class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === 'inspection'
                  ? 'border-blue-900 text-blue-900 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              "
              @click="activeTab = 'inspection'"
            >
              年检资料
            </button>
          </nav>
        </div>

        <div v-show="activeTab === 'maintenance'">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">计划编号</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">电梯编号</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">客户</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">计划日期</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">维保类型</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">内容</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">负责人</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">状态</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-600 w-36">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="plan in maintenancePlans"
                  :key="plan.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="px-3 py-2.5 font-mono text-gray-900">{{ plan.id }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ plan.elevatorId }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ plan.customerName }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ formatDate(plan.planDate) }}</td>
                  <td class="px-3 py-2.5 text-gray-700">
                    {{ MAINTENANCE_TYPE_LABEL[plan.planType] }}
                  </td>
                  <td class="px-3 py-2.5 text-gray-700 max-w-xs truncate" :title="plan.content">
                    {{ plan.content }}
                  </td>
                  <td class="px-3 py-2.5 text-gray-700">{{ plan.technicianName }}</td>
                  <td class="px-3 py-2.5">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium border',
                        maintenanceStatusClasses[plan.status],
                      ]"
                    >
                      {{ MAINTENANCE_STATUS_LABEL[plan.status] }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-right">
                    <div class="flex justify-end gap-1.5">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
                        @click="handleViewMaintenance(plan)"
                      >
                        <Eye :size="12" />
                        查看
                      </button>
                      <button
                        v-if="plan.status !== 'completed'"
                        type="button"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
                        @click="handleMaintenanceMarkComplete(plan)"
                      >
                        <CheckCircle :size="12" />
                        标记完成
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="maintenancePlans.length === 0">
                  <td colspan="9" class="px-4 py-12 text-center text-gray-500">
                    暂无维保计划记录
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-show="activeTab === 'fault'">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">来电编号</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">来电时间</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">客户</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">电梯</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">故障描述</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">来电人</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">电话</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">处理状态</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">派单技师</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-600 w-44">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="call in faultCalls"
                  :key="call.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="px-3 py-2.5 font-mono text-gray-900">{{ call.callNo }}</td>
                  <td class="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                    {{ formatDateTime(call.callTime) }}
                  </td>
                  <td class="px-3 py-2.5 text-gray-700">{{ call.customerName }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ call.elevatorId }}</td>
                  <td
                    class="px-3 py-2.5 text-gray-700 max-w-xs truncate"
                    :title="call.faultDescription"
                  >
                    {{ call.faultDescription }}
                  </td>
                  <td class="px-3 py-2.5 text-gray-700">{{ call.callerName }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ call.callerPhone }}</td>
                  <td class="px-3 py-2.5">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium border',
                        faultStatusClasses[call.status],
                      ]"
                    >
                      {{ FAULT_STATUS_LABEL[call.status] }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-gray-700">{{ call.technicianName || '-' }}</td>
                  <td class="px-3 py-2.5 text-right">
                    <div class="flex justify-end gap-1.5">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
                        @click="handleViewFault(call)"
                      >
                        <Eye :size="12" />
                        查看详情
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 border border-orange-300 bg-orange-50 hover:bg-orange-100 transition-colors"
                        @click="handleLinkToReplacement(call)"
                      >
                        <Link2 :size="12" />
                        关联记录
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="faultCalls.length === 0">
                  <td colspan="10" class="px-4 py-12 text-center text-gray-500">
                    暂无故障电话记录
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-show="activeTab === 'inspection'">
          <div class="p-4 border-b border-gray-200 flex justify-end">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white text-sm font-medium border border-blue-900 hover:bg-blue-800 transition-colors"
              @click="handleUpload"
            >
              <Upload :size="16" />
              上传年检报告
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">资料编号</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">电梯</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">客户</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">检验类型</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">检验日期</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">检验机构</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">检验结果</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">有效期</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600">报告编号</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-600 w-36">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="doc in inspectionDocs"
                  :key="doc.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="px-3 py-2.5 font-mono text-gray-900">{{ doc.id }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ doc.elevatorId }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ doc.customerName }}</td>
                  <td class="px-3 py-2.5 text-gray-700">
                    {{ INSPECTION_TYPE_LABEL[doc.inspectionType] }}
                  </td>
                  <td class="px-3 py-2.5 text-gray-700">{{ formatDate(doc.inspectionDate) }}</td>
                  <td class="px-3 py-2.5 text-gray-700">{{ doc.inspectionAgency }}</td>
                  <td class="px-3 py-2.5">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium border',
                        inspectionResultClasses[doc.result],
                      ]"
                    >
                      {{ INSPECTION_RESULT_LABEL[doc.result] }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-gray-700">{{ formatDate(doc.expiryDate) }}</td>
                  <td class="px-3 py-2.5 text-gray-700 font-mono text-xs">{{ doc.reportNo }}</td>
                  <td class="px-3 py-2.5 text-right">
                    <div class="flex justify-end gap-1.5">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
                        @click="handleViewInspection(doc)"
                      >
                        <Eye :size="12" />
                        查看
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                        @click="handleUpload"
                      >
                        <Upload :size="12" />
                        上传
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="inspectionDocs.length === 0">
                  <td colspan="10" class="px-4 py-12 text-center text-gray-500">
                    暂无年检资料记录
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
