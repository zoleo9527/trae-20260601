<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { COACHES, TIME_SLOTS, SUBJECTS, APPOINTMENT_STATUS } from '@/data/mock.js'
import dayjs from 'dayjs'

const props = defineProps({
  mode: { type: String, required: true },
  appointment: { type: Object, required: true }
})
const emit = defineEmits(['close'])
const router = useRouter()
const store = useAppStore()

const student = computed(() => store.getStudentById(props.appointment.studentId))
const form = ref({
  advisorNote: props.appointment.advisorNote || '',
  reviewNote: props.appointment.reviewNote || '',
  exceptionType: props.appointment.exception?.type || 'missing_idcard',
  exceptionMsg: props.appointment.exception?.message || '',
  coachId: '',
  date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
  slot: props.appointment.preferredSlots?.[0] || TIME_SLOTS[0],
  subject: props.appointment.subject || SUBJECTS[0]
})

const exceptionPresets = [
  { id: 'missing_idcard', label: '缺少身份证复印件', severity: 'warning' },
  { id: 'missing_medical', label: '未提交体检表', severity: 'warning' },
  { id: 'unpaid_fee', label: '学费未结清', severity: 'danger' },
  { id: 'missing_photo', label: '未提交一寸照片', severity: 'warning' },
  { id: 'info_conflict', label: '资料信息不一致', severity: 'danger' }
]

function selectException(p) {
  form.value.exceptionType = p.id
  form.value.exceptionMsg = p.label
}

const suitableCoaches = computed(() =>
  COACHES.filter(c => {
    if (!c.subjects.includes(form.value.subject)) return false
    if (student.value?.carType && c.carType !== student.value.carType && c.carType.indexOf(student.value.carType.slice(0, 2)) === -1) {
      if (student.value.carType === 'C2自动挡' && c.carType !== 'C2自动挡') return false
    }
    return true
  })
)

function doApprove() {
  store.approveAppointment(props.appointment.id, form.value.advisorNote)
  emit('close')
}
function doReject() {
  const preset = exceptionPresets.find(p => p.id === form.value.exceptionType)
  store.rejectAppointment(props.appointment.id, {
    exception: {
      type: form.value.exceptionType,
      severity: preset?.severity || 'warning',
      message: form.value.exceptionMsg || preset?.label || '资料待补'
    },
    reviewNote: form.value.reviewNote
  })
  emit('close')
}
function doRemind() {
  store.pushToast('已向 ' + (student.value?.name || '学员') + ' 发送短信 + 公众号双重催办提醒', 'warning')
  emit('close')
}
function doEdit() {
  store.reviewAppointment(props.appointment.id, {
    advisorNote: form.value.advisorNote,
    reviewNote: form.value.reviewNote
  })
  emit('close')
}
function doAssign() {
  if (!form.value.coachId) return store.pushToast('请先选择教练', 'warning')
  if (!form.value.date) return store.pushToast('请选择练车日期', 'warning')
  store.assignCoach({
    appointmentId: props.appointment.id,
    studentId: props.appointment.studentId,
    subject: form.value.subject,
    coachId: form.value.coachId,
    date: form.value.date,
    slot: form.value.slot,
    appointmentNote: form.value.advisorNote || props.appointment.advisorNote
  })
  emit('close')
  router.push('/schedules?filter=all')
}

const titleMap = {
  approve: '审核通过 · 确认排班前资料',
  reject: '标记异常 · 触发学员端提醒',
  remind: '催办提醒 · 发送短信和公众号消息',
  edit: '修改备注',
  assign: '分配教练 · 从预约进入排班'
}

const dateOptions = Array.from({ length: 14 }).map((_, i) => dayjs().add(i, 'day').format('YYYY-MM-DD'))
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ titleMap[mode] }}</h3>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="stu-card">
          <div class="flex items-center gap-3">
            <div class="stu-avatar">{{ (student?.name || '?').charAt(0) }}</div>
            <div>
              <div class="font-semibold text-base">{{ student?.name }} <span class="tag tag-blue tag-sm ml-1">{{ appointment.subject }}</span></div>
              <div class="text-sm text-gray mt-0.5">{{ appointment.id }} · {{ student?.carType }} · {{ student?.phone }}</div>
            </div>
          </div>
          <div class="text-xs text-muted mt-2">
            期望日期：<b>{{ appointment.preferredDates?.join(' / ') }}</b> 　
            时间段：<b>{{ appointment.preferredSlots?.join('、') }}</b>
          </div>
        </div>

        <template v-if="mode === 'approve' || mode === 'edit' || mode === 'assign'">
          <div class="mt-4">
            <div class="section-title">资料状态</div>
            <div class="grid-4 mt-2">
              <div class="check-card" :class="student?.idCardReady ? 'ok' : 'no'"><span class="check-ico">◉</span>身份证复印件</div>
              <div class="check-card" :class="student?.medicalDone ? 'ok' : 'no'"><span class="check-ico">◉</span>学车体检表</div>
              <div class="check-card" :class="student?.paymentDone ? 'ok' : 'no'"><span class="check-ico">◉</span>学费已缴</div>
              <div class="check-card" :class="student?.photoDone ? 'ok' : 'no'"><span class="check-ico">◉</span>一寸照片</div>
            </div>
          </div>
          <div class="form-grid mt-4">
            <div class="form-row">
              <label>顾问审核备注</label>
              <textarea v-model="form.reviewNote" class="textarea" placeholder="资料检查、学员情况等"></textarea>
            </div>
            <div class="form-row">
              <label>
                <span style="color:#2563eb;">备注 → 会传递给排班教练</span>
              </label>
              <textarea v-model="form.advisorNote" class="textarea" placeholder="例如：学员希望安排脾气好的女教练，路考经验丰富等"></textarea>
            </div>
          </div>
        </template>

        <template v-if="mode === 'reject'">
          <div class="mt-3">
            <div class="section-title">选择异常类型（会立即向学员发送提醒）</div>
            <div class="ex-grid mt-2">
              <div v-for="p in exceptionPresets" :key="p.id"
                   class="ex-card clickable"
                   :class="{ active: form.exceptionType === p.id, danger: p.severity === 'danger' }"
                   @click="selectException(p)">
                <div class="ex-name">{{ p.label }}</div>
                <div class="text-xs mt-1" :class="p.severity === 'danger' ? 'text-danger' : 'text-warning'">
                  严重度：{{ p.severity === 'danger' ? '高（需人工跟进）' : '中（自动提醒）' }}
                </div>
              </div>
            </div>
          </div>
          <div class="form-row mt-4">
            <label>异常补充说明（会显示给学员）</label>
            <textarea v-model="form.exceptionMsg" class="textarea" placeholder="例如：身份证照片模糊，请重新上传清晰的正反面"></textarea>
          </div>
          <div class="form-row mt-3">
            <label>内审核记录</label>
            <textarea v-model="form.reviewNote" class="textarea" placeholder="内部备注，仅员工可见"></textarea>
          </div>
        </template>

        <template v-if="mode === 'remind'">
          <div class="remind-box">
            <div class="text-sm mb-2">将通过以下方式提醒 <b>{{ student?.name }}</b>：</div>
            <ul class="rlist">
              <li>✉ 短信：{{ student?.phone }} —— 补充资料提醒</li>
              <li>🔔 微信公众号服务通知（已关注）</li>
              <li>📞 系统已通知招生顾问：<b>{{ store.staffMap[appointment.handler]?.name || '陈媛媛' }}</b> 48 小时内电话回访</li>
            </ul>
            <div v-if="appointment.exception" class="mt-2 p-2 rounded" style="background:#fef3c7;border:1px solid #fde68a;">
              <div class="text-xs" style="color:#92400e;">当前异常：<b>{{ appointment.exception.message }}</b></div>
            </div>
          </div>
        </template>

        <template v-if="mode === 'assign'">
          <div class="mt-4">
            <div class="section-title">选择教练（按学员条件自动筛选）</div>
            <div v-if="suitableCoaches.length === 0" class="text-sm text-gray mt-2">暂无符合条件的教练，请先调整科目或车型筛选</div>
            <div class="coach-grid mt-2">
              <div v-for="c in suitableCoaches" :key="c.id"
                   class="coach-card clickable"
                   :class="{ active: form.coachId === c.id }"
                   @click="form.coachId = c.id">
                <div class="flex items-center gap-2">
                  <div class="coach-avatar" :style="{ background: form.coachId === c.id ? '#2563eb' : '#e0e7ff', color: form.coachId === c.id ? '#fff' : '#4338ca' }">{{ c.name.charAt(0) }}</div>
                  <div>
                    <div class="font-medium">{{ c.name }}</div>
                    <div class="text-xs text-gray">{{ c.carType }} · 容量 {{ c.capacity }}人/天</div>
                  </div>
                </div>
                <div class="coach-subj mt-1">
                  <span v-for="s in c.subjects" :key="s" class="tag tag-gray tag-sm" style="font-size:10.5px;">{{ s }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="form-grid mt-4">
            <div class="form-row">
              <label>练车日期</label>
              <select v-model="form.date" class="select">
                <option v-for="d in dateOptions" :key="d" :value="d">{{ d }} (周{{ '日一二三四五六'[dayjs(d).day()] }})</option>
              </select>
            </div>
            <div class="form-row">
              <label>时间段</label>
              <select v-model="form.slot" class="select">
                <option v-for="s in TIME_SLOTS" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
        </template>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" @click="emit('close')">取消</button>
        <template v-if="mode === 'approve'"><button class="btn btn-success" @click="doApprove">确认通过，进入排班池</button></template>
        <template v-else-if="mode === 'reject'"><button class="btn btn-warning" @click="doReject">🔔 标记异常并发送提醒</button></template>
        <template v-else-if="mode === 'remind'"><button class="btn btn-warning" @click="doRemind">立即催办</button></template>
        <template v-else-if="mode === 'edit'"><button class="btn btn-primary" @click="doEdit">保存备注</button></template>
        <template v-else-if="mode === 'assign'"><button class="btn btn-primary" @click="doAssign">确认分配教练</button></template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title { font-size: 13px; font-weight: 600; color: var(--gray-700); }
.stu-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%);
  border: 1px solid #bfdbfe;
  border-radius: 10px; padding: 14px;
}
.stu-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff; font-weight: 700; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
}
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.check-card {
  padding: 10px; border-radius: 8px; border: 1px solid var(--gray-200);
  background: #fff; font-size: 12.5px; font-weight: 500; color: var(--gray-600);
}
.check-card.ok { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.check-card.no { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.check-ico { margin-right: 4px; }

.ex-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.ex-card {
  padding: 12px; border-radius: 8px; border: 2px solid var(--gray-200);
  background: #fff;
}
.ex-card:hover { border-color: #bfdbfe; background: #eff6ff; }
.ex-card.active { border-color: #2563eb; background: #eff6ff; }
.ex-card.danger.active { border-color: #ef4444; background: #fef2f2; }
.ex-name { font-weight: 600; font-size: 13px; color: var(--gray-800); }
.text-danger { color: #b91c1c; } .text-warning { color: #92400e; }

.remind-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; }
.rlist { list-style: none; padding-left: 0; }
.rlist li { padding: 4px 0; font-size: 13px; color: var(--gray-700); }

.coach-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.coach-card {
  padding: 12px; border-radius: 8px; border: 2px solid var(--gray-200);
  background: #fff;
}
.coach-card:hover { border-color: #bfdbfe; }
.coach-card.active { border-color: #2563eb; background: #eff6ff; }
.coach-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
}
.tag-sm { padding: 1px 6px; font-size: 11px; }
</style>
