<template>
  <el-dialog
    v-model="dialogVisible"
    title="租户/顾客回访"
    width="620px"
    :close-on-click-modal="false"
  >
    <div v-if="complaint" style="margin-bottom:16px;">
      <div style="padding:12px;background:#ecf5ff;border:1px solid #d9ecff;border-radius:6px;margin-bottom:12px;">
        <div style="font-size:12px;color:#409eff;font-weight:600;margin-bottom:8px;">
          <el-icon><Promotion /></el-icon> 回访时请参考以下关键判断
        </div>
        <div v-if="complaint.keyJudgements.length === 0" style="font-size:12px;color:#909399;">
          暂无关键判断记录
        </div>
        <div v-for="j in complaint.keyJudgements.slice(0, 2)" :key="j.id" style="font-size:12px;color:#1f2d3d;line-height:1.7;margin-top:4px;">
          · {{ j.content }}
          <span style="color:#909399;font-size:11px;">（{{ j.operator }}）</span>
        </div>
      </div>
      <div style="padding:10px 12px;background:#f5f7fa;border-radius:6px;">
        <div style="font-size:12px;color:#909399;">客诉编号：<span style="font-family:monospace;color:#606266;">{{ complaint.code }}</span></div>
        <div style="font-weight:500;margin-top:2px;">{{ complaint.title }}</div>
      </div>
    </div>

    <el-form :model="form" label-width="100px">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="回访对象" required>
            <el-input v-model="form.tenantContact" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话">
            <el-input v-model="form.tenantPhone" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="回访结果" required>
        <el-radio-group v-model="form.result">
          <el-radio value="satisfied" border>
            <span style="color:#67c23a;">●</span> 满意
          </el-radio>
          <el-radio value="basically_satisfied" border>
            <span style="color:#409eff;">●</span> 基本满意
          </el-radio>
          <el-radio value="dissatisfied" border>
            <span style="color:#f56c6c;">●</span> 不满意（需重新处理）
          </el-radio>
          <el-radio value="unreachable" border>
            <span style="color:#909399;">●</span> 无法联系
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="反馈内容" required>
        <el-input
          v-model="form.feedback"
          type="textarea"
          :rows="4"
          :placeholder="form.result === 'dissatisfied' ? '请详细记录不满意的原因和具体诉求...' : '请记录对方反馈的具体内容、对处理过程的评价、潜在改进建议等...'"
        />
      </el-form-item>
      <el-form-item label="改进项">
        <el-select
          v-model="form.improvementItems"
          multiple
          filterable
          allow-create
          default-first-option
          style="width:100%;"
          placeholder="可多选或手动输入，按回车添加"
        >
          <el-option label="纳入月度巡检清单" value="纳入月度巡检清单" />
          <el-option label="物业现场复核" value="物业现场复核" />
          <el-option label="租户经营公约学习" value="租户经营公约学习" />
          <el-option label="优化SLA监控规则" value="优化SLA监控规则" />
          <el-option label="完善责任边界条款" value="完善责任边界条款" />
          <el-option label="安排上门沟通" value="安排上门沟通" />
        </el-select>
      </el-form-item>
      <el-form-item label="下次跟进">
        <el-date-picker
          v-model="form.nextFollowUp"
          type="date"
          style="width:100%;"
          placeholder="如有后续跟进事项请选择日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        <el-icon><Check /></el-icon>提交回访
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Complaint, VisitResult } from '@/types/complaint'
import { mockShops } from '@/mock/complaintData'

const props = defineProps<{
  visible: boolean
  complaint: Complaint | null
}>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'submit', payload: any): void
}>()

const dialogVisible = ref(props.visible)
watch(() => props.visible, v => { dialogVisible.value = v })
watch(dialogVisible, v => emit('update:visible', v))

const form = reactive({
  tenantContact: '',
  tenantPhone: '',
  result: 'pending' as VisitResult,
  feedback: '',
  improvementItems: [] as string[],
  nextFollowUp: '' as string | null
})

watch(() => props.complaint, c => {
  if (c) {
    const pendingVisit = c.tenantVisits.find(v => v.result === 'pending')
    const shop = mockShops.find(s => s.code === c.shopCode)
    const lastVisit = c.tenantVisits[c.tenantVisits.length - 1]
    form.tenantContact = pendingVisit?.tenantContact || shop?.contact || lastVisit?.tenantContact || c.complainantName
    form.tenantPhone = pendingVisit?.tenantPhone || shop?.phone || lastVisit?.tenantPhone || c.complainantPhone
    form.result = 'pending'
    form.feedback = ''
    form.improvementItems = []
    form.nextFollowUp = null
  }
}, { immediate: true })

function handleSubmit() {
  if (form.result === 'pending') { ElMessage.warning('请选择回访结果'); return }
  if (!form.feedback.trim()) { ElMessage.warning('请填写反馈内容'); return }
  if (!form.tenantContact.trim()) { ElMessage.warning('请填写回访对象'); return }
  emit('submit', { ...form })
}
</script>
