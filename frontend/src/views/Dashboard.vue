<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">📊 工作台 - 主管进度视图</div>
      <el-button @click="loadAll" :icon="Refresh">刷新</el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6"><div class="stat-card draft">
        <div class="label">草稿状态</div>
        <div class="value">{{ summary?.byStatus?.DRAFT || 0 }}</div>
        <div class="hint">招商经理编辑中</div>
      </div></el-col>
      <el-col :span="6"><div class="stat-card pending">
        <div class="label">待确认(待办)</div>
        <div class="value">{{ summary?.byStatus?.PENDING || 0 }}</div>
        <div class="hint">营运督导待处理</div>
      </div></el-col>
      <el-col :span="6"><div class="stat-card active">
        <div class="label">已生效租约</div>
        <div class="value">{{ summary?.byStatus?.ACTIVE || 0 }}</div>
        <div class="hint">占比 {{ totalLease > 0 ? Math.round(summary?.byStatus?.ACTIVE * 100 / totalLease) : 0 }}%</div>
      </div></el-col>
      <el-col :span="6"><div class="stat-card liability">
        <div class="label">⚠️ 责任不清项</div>
        <div class="value">{{ summary?.liabilityCount || 0 }}</div>
        <div class="hint"><router-link to="/liability" style="color:#fff;text-decoration:underline;">立即处理 →</router-link></div>
      </div></el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px;">
      <el-col :span="12">
        <el-card>
          <template #header><b>📋 租约状态分布</b></template>
          <div ref="chartRef" style="height:280px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><b>👥 各角色近7日操作</b></template>
          <div ref="chartRef2" style="height:280px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top:16px;">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <b>⚡ 我的待办 / 关键动态</b>
          <el-tag type="warning" size="small">主管追问时的进度依据</el-tag>
        </div>
      </template>

      <el-table :data="pending" v-loading="loadingPending" size="small">
        <el-table-column prop="lease_no" label="租约编号" width="160" />
        <el-table-column prop="brand_name" label="品牌" width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-status-tag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="责任不清标记" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.liability_flag" type="danger" effect="dark" size="small">⚠️ {{ row.liability_desc }}</el-tag>
            <span v-else style="color:#10b981;">✓ 无</span>
          </template>
        </el-table-column>
        <el-table-column prop="submitter_name" label="招商经理" width="120" />
        <el-table-column prop="submitted_at" label="提交时间" width="170" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <router-link :to="`/leases/${row.id}`">
              <el-button size="small" type="primary" link>查看详情</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboard, getMyPending } from '@/api'

const summary = ref({ byStatus: {} })
const totalLease = ref(0)
const pending = ref([])
const loadingPending = ref(false)
const chartRef = ref()
const chartRef2 = ref()

const loadAll = async () => {
  const res = await getDashboard()
  summary.value = res.data
  totalLease.value = res.data.totalLease
  await nextTick()
  renderCharts()

  loadingPending.value = true
  const res2 = await getMyPending()
  pending.value = res2.data
  loadingPending.value = false
}

const renderCharts = () => {
  if (chartRef.value) {
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      tooltip: {},
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        label: { formatter: '{b}: {c}' },
        data: [
          { name: '草稿', value: summary.value.byStatus.DRAFT || 0, itemStyle: { color: '#9ca3af' } },
          { name: '待确认', value: summary.value.byStatus.PENDING || 0, itemStyle: { color: '#f59e0b' } },
          { name: '已生效', value: summary.value.byStatus.ACTIVE || 0, itemStyle: { color: '#10b981' } },
          { name: '已驳回', value: summary.value.byStatus.REJECTED || 0, itemStyle: { color: '#ef4444' } },
        ],
      }],
    })
  }
  if (chartRef2.value && summary.value.recentActions) {
    const chart = echarts.init(chartRef2.value)
    const roleMap = {
      ROLE_MERCHANDISE_MANAGER: '招商经理',
      ROLE_OPERATION_SUPERVISOR: '营运督导',
      ROLE_STORE_MANAGER: '品牌店长',
      ROLE_SUPERVISOR: '主管',
      SYSTEM: '系统',
    }
    const actionMap = {
      LEASE_CREATE: '创建租约', LEASE_SUBMIT: '提交租约', LEASE_CONFIRM: '确认租约',
      LEASE_REJECT: '驳回租约', DEDUCTION_CREATE: '创建扣点', DEDUCTION_CONFIRM: '确认扣点',
      DEDUCTION_MARK_LIABILITY: '标记责任', EXPORT_CREATE: '导出报表',
    }
    chart.setOption({
      tooltip: {},
      xAxis: { type: 'category', data: summary.value.recentActions.map(a => actionMap[a.action] || a.action) },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: summary.value.recentActions.map(a => ({
          value: a.cnt,
          itemStyle: { color: ['#6366f1','#10b981','#f59e0b','#ef4444'][Math.floor(Math.random()*4)] },
        })),
        label: { show: true, position: 'top', formatter: p => `${roleMap[summary.value.recentActions[p.dataIndex]?.operator_role] || ''}` },
      }],
    })
  }
}

onMounted(loadAll)
</script>

<style scoped>
.stats-row { margin-bottom: 16px; }
.stat-card { border-radius: 12px; padding: 20px; color: #fff; }
.stat-card .label { font-size: 13px; opacity: 0.9; }
.stat-card .value { font-size: 32px; font-weight: 700; margin: 8px 0 4px; }
.stat-card .hint { font-size: 12px; opacity: 0.85; }
.stat-card.draft { background: linear-gradient(135deg, #6b7280, #4b5563); }
.stat-card.pending { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-card.active { background: linear-gradient(135deg, #10b981, #059669); }
.stat-card.liability { background: linear-gradient(135deg, #ef4444, #dc2626); }
</style>
