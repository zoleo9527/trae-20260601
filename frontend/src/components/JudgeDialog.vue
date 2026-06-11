<template>
  <el-dialog
    v-model="dialogVisible"
    title="责任归属判定"
    width="580px"
    :close-on-click-modal="false"
  >
    <div v-if="complaint" style="margin-bottom:16px;padding:12px;background:#f5f7fa;border-radius:6px;">
      <div style="font-size:12px;color:#909399;margin-bottom:4px;">待判定客诉</div>
      <div style="font-weight:500;">{{ complaint.title }}</div>
      <div style="font-size:12px;color:#606266;margin-top:2px;font-family:monospace;">
        {{ complaint.code }} · {{ complaint.locationFloor }} {{ complaint.locationArea }}
      </div>
    </div>

    <el-form :model="form" label-width="100px">
      <el-form-item label="责任方" required>
        <el-radio-group v-model="form.party">
          <el-radio v-for="(label, key) in RESPONSIBILITY_PARTY_MAP" :key="key" :value="key" border>
            {{ label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="判定说明" required>
        <el-input
          v-model="form.detail"
          type="textarea"
          :rows="2"
          placeholder="请描述判定依据，包括合同条款、现场调查、证据等"
        />
      </el-form-item>
      <el-form-item label="关键判断" required>
        <el-input
          v-model="form.judgement"
          type="textarea"
          :rows="3"
          placeholder="此判断将作为回访时的关键参考信息，请写明判定结论、根因或处置要点"
        />
      </el-form-item>
      <el-divider style="margin:8px 0 16px;">同步派单给处理人</el-divider>
      <el-form-item label="处理人">
        <el-select v-model="form.handler" clearable style="width:100%;" placeholder="留空则稍后派单">
          <el-option v-for="s in mockStaff" :key="s.id" :label="`${s.name}（${s.role}）`" :value="s.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" placeholder="可选" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交判定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Complaint, ResponsibilityParty } from '@/types/complaint'
import { RESPONSIBILITY_PARTY_MAP } from '@/types/complaint'
import { mockStaff } from '@/mock/complaintData'

const props = defineProps<{
  visible: boolean
  complaint: Complaint | null
}>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'submit', payload: any): void
}>()

const dialogVisible = ref(props.visible)
watch(() => props.visible, (v) => { dialogVisible.value = v })
watch(dialogVisible, (v) => emit('update:visible', v))

const form = reactive({
  party: 'undetermined' as ResponsibilityParty,
  detail: '',
  judgement: '',
  handler: '',
  handlerRole: '',
  remark: ''
})

watch(() => form.handler, (name) => {
  const s = mockStaff.find(x => x.name === name)
  form.handlerRole = s?.role || ''
})

watch(() => props.complaint, (c) => {
  if (c) {
    form.party = c.responsibilityParty
    form.detail = c.responsibilityPartyDetail === '待判定' ? '' : c.responsibilityPartyDetail
    form.judgement = ''
    form.handler = ''
    form.handlerRole = ''
    form.remark = ''
  }
}, { immediate: true })

function handleSubmit() {
  if (form.party === 'undetermined') { ElMessage.warning('请选择责任方'); return }
  if (!form.detail.trim()) { ElMessage.warning('请填写判定说明'); return }
  if (!form.judgement.trim()) { ElMessage.warning('请填写关键判断'); return }
  emit('submit', { ...form })
}
</script>
