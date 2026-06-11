<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">📥 导出中心 <el-tag size="small" type="info">本地记录触发结果</el-tag></div>
      <el-button type="primary" @click="dialog = true" :icon="Download">新建导出任务</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px;">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center;">
            <div style="font-size:12px;color:#6b7280;">任务总数</div>
            <div style="font-size:28px;font-weight:700;color:#4338ca;">{{ stats.total }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center;">
            <div style="font-size:12px;color:#6b7280;">已完成</div>
            <div style="font-size:28px;font-weight:700;color:#10b981;">{{ stats.done }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center;">
            <div style="font-size:12px;color:#6b7280;">处理中</div>
            <div style="font-size:28px;font-weight:700;color:#f59e0b;">{{ stats.running }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center;">
            <div style="font-size:12px;color:#6b7280;">失败</div>
            <div style="font-size:28px;font-weight:700;color:#ef4444;">{{ stats.fail }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header><b>📋 我的导出任务</b>（主管追问进度：每个任务均可追踪状态、文件路径）</template>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="task_name" label="任务名称" min-width="180">
          <template #default="{ row }"><b>{{ row.task_name }}</b> <el-tag size="small">{{ row.task_type }}</el-tag></template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="row.status==='FAILED'?'exception':(row.status==='COMPLETED'?'success':undefined)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-status-tag :status="row.status" /></template>
        </el-table-column>
        <el-table-column label="生成文件" min-width="260">
          <template #default="{ row }">
            <template v-if="row.status==='COMPLETED'">
              <el-icon :size="16" color="#10b981" style="vertical-align:middle;"><Document /></el-icon>
              <span style="margin-left:4px;">{{ row.file_name }}</span>
            </template>
            <span v-else-if="row.status==='FAILED'" style="color:#ef4444;font-size:12px;">{{ row.error_msg || '生成失败' }}</span>
            <span v-else style="color:#6b7280;font-size:12px;">处理中...</span>
          </template>
        </el-table-column>
        <el-table-column label="📁 本地路径" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <code v-if="row.file_path" style="font-size:11px;background:#f3f4f6;padding:2px 6px;border-radius:4px;">{{ row.file_path }}</code>
            <span v-else style="color:#9ca3af;font-size:12px;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column prop="completed_at" label="完成时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status==='COMPLETED'" type="primary" link size="small" @click="download(row)">
              下载
            </el-button>
            <el-button v-if="row.status==='COMPLETED'" link size="small" @click="refresh">
              刷新
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog" title="新建导出任务" width="500px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="导出类型" required>
          <el-select v-model="form.task_type" style="width:100%;">
            <el-option label="品牌租约列表" value="LEASE_LIST">
              <span style="float:right;color:#9ca3af;">含租约状态、扣点、责任标记</span>
            </el-option>
            <el-option label="扣点规则汇总表" value="DEDUCTION_SUMMARY" />
            <el-option label="⚠️ 责任不清报表" value="LIABILITY_REPORT">
              <el-tag type="danger" size="small" style="float:right;">主管重点关注</el-tag>
            </el-option>
            <el-option label="操作审计日志" value="OPERATION_LOG" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务名称" required>
          <el-input v-model="form.task_name" placeholder="如：6月第2周责任不清报表" />
        </el-form-item>
      </el-form>
      <el-alert type="info" :closable="false" show-icon style="margin-top:8px;">
        由于暂未接入真实通知渠道，导出结果以本地文件记录。完成后在列表中可查看文件路径。
      </el-alert>
      <template #footer>
        <el-button @click="dialog=false">取消</el-button>
        <el-button type="primary" @click="createTask" :loading="creating">创建任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Document } from '@element-plus/icons-vue'
import { getExportList, createExport } from '@/api'

const list = ref([])
const loading = ref(false)
const creating = ref(false)
const dialog = ref(false)
const form = reactive({ task_type: 'LEASE_LIST', task_name: '' })

const stats = computed(() => ({
  total: list.value.length,
  done: list.value.filter(x => x.status === 'COMPLETED').length,
  running: list.value.filter(x => ['PENDING', 'PROCESSING'].includes(x.status)).length,
  fail: list.value.filter(x => x.status === 'FAILED').length,
}))

const refresh = async () => {
  loading.value = true
  try {
    const res = await getExportList()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

const createTask = async () => {
  if (!form.task_type || !form.task_name.trim()) {
    ElMessage.warning('请填全信息'); return
  }
  creating.value = true
  try {
    const { data: { task_id } } = await createExport({
      task_type: form.task_type,
      task_name: form.task_name,
      params: { createdAt: new Date() },
    })
    ElMessage.success(`任务创建成功 (ID: ${task_id})，后台处理中`)
    dialog.value = false
    setTimeout(refresh, 1000)
    setTimeout(refresh, 3000)
  } finally {
    creating.value = false
  }
}

const download = (row) => {
  window.open(`/api/export/download/${row.id}`, '_blank')
}

onMounted(refresh)
</script>
