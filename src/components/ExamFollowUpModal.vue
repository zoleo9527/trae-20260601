<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { EXAM_STATUS, EXAM_SITES, SUBJECTS } from '@/data/mock.js'
import StatusTag from '@/components/StatusTag.vue'
import dayjs from 'dayjs'

const props = defineProps({
  mode: { type: String, required: true },
  exam: { type: Object, required: true }
})
const emit = defineEmits(['close'])
const store = useAppStore()

const student = computed(() => store.getStudentById(props.exam.studentId))
const coach = computed(() => props.exam.coachId ? store.getCoachById(props.exam.coachId) : null)

const form = ref({
  bookedDate: props.exam.bookedDate || dayjs().add(3, 'day').format('YYYY-MM-DD'),
  bookedSite: props.exam.bookedSite || EXAM_SITES[0],
  bookedSlot: props.exam.bookedSlot || '上午场 09:00',
  note: props.exam.examinerNote || '',
  exceptionMsg: props.exam.exception?.message || '',
  passed: true
})

const dateOptions = Array.from({ length: 30 }).map((_, i) => dayjs().add(i, 'day').format('YYYY-MM-DD'))
const slotOptions = ['上午场 09:00', '上午场 10:30', '下午场 14:00', '下午场 15:30']

function doClaim() {
  store.claimExamFollowUp(props.exam.id)
  emit('close')
}
function doMarkReady() {
  store.markExamReady(props.exam.id, form.value.note)
  emit('close')
}
function doBook() {
  if (!form.value.bookedDate || !form.value.bookedSite) return store.pushToast('请完整填写约考信息', 'warning')
  store.bookExam(props.exam.id, {
    date: form.value.bookedDate,
    site: form.value.bookedSite,
    slot: form.value.bookedSlot,
    note: form.value.note
  })
  emit('close')
}
function doException() {
  if (!form.value.exceptionMsg.trim()) return store.pushToast('请填写异常说明', 'warning')
  store.markExamException(props.exam.id,
    { type: 'manual', severity: 'warning', message: form.value.exceptionMsg },
    form.value.note
  )
  emit('close')
}
function doFinish() {
  store.finishExam(props.exam.id, {
    passed: form.value.passed,
    note: form.value.note
  })
  emit('close')
}

const titleMap = {
  view: '考试跟进详情 · 全链路回看',
  claim: '认领考试跟进',
  'mark-ready': '标记为可约考',
  book: '约考登记',
  exception: '标记异常',
  finish: '记录考试成绩',
  rebook: '安排重考'
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal-card" :style="{ maxWidth: mode === 'view' ? '760px' : '620px' }">
      <div class="modal-header">
        <h3>{{ titleMap[mode] }}</h3>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="summary-card">
          <div class="flex items-start gap-4">
            <div class="party-col">
              <div class="p-label">学员</div>
              <div class="flex items-center gap-2">
                <div class="avatar-s" style="background:#ede9fe;color:#6d28d9;">{{ (student?.name || '?').charAt(0) }}</div>
                <div>
                  <div class="font-semibold">{{ student?.name }} <span class="tag tag-purple ml-1" style="font-size:10.5px;">{{ exam.subject }}</span></div>
                  <div class="text-xs text-gray">📞 {{ student?.phone }} · {{ student?.carType }}</div>
                </div>
              </div>
            </div>
            <div class="arrow-col">
              <StatusTag :kind="exam.status" type="exam" />
              <div class="text-xs text-muted mt-1">编号：{{ exam.id }}</div>
            </div>
            <div class="party-col">
              <div class="p-label text-right">考试专员</div>
              <div class="flex items-center gap-2 justify-end">
                <div class="text-right">
                  <div class="font-semibold">{{ exam.handlerName || '待认领' }}</div>
                  <div class="text-xs text-gray">{{ exam.handler ? '已认领处理中' : '尚未分配' }}</div>
                </div>
                <div class="avatar-s" style="background: linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;">{{ (exam.handlerName || '?').charAt(0) }}</div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="grid-3col">
            <div>
              <div class="p-label">教练评估（透传自练车完成备注）</div>
              <div class="text-sm p-2 rounded" style="background:#faf5ff;border:1px solid #e9d5ff;color:#581c87;">
                💬 {{ exam.coachAssessment || exam.coachCompletionNote || '教练未给出评估' }}
              </div>
              <div v-if="exam.coachId" class="text-xs text-muted mt-1">来自教练：{{ coach?.name || '—' }} · 完成 {{ exam.completedAt }}</div>
            </div>
            <div v-if="exam.bookedDate">
              <div class="p-label">约考信息</div>
              <div class="text-sm font-medium">{{ exam.bookedDate }} · {{ exam.bookedSlot }}</div>
              <div class="text-xs text-gray mt-1">{{ exam.bookedSite }}</div>
            </div>
            <div v-if="exam.exception">
              <div class="p-label">异常标记</div>
              <div class="text-sm p-2 rounded" :style="exam.exception.severity === 'danger' ? 'background:#fef2f2;border:1px solid #fecaca;color:#991b1b;' : 'background:#fffbeb;border:1px solid #fde68a;color:#92400e;'">
                ⚠ {{ exam.exception.message }}
              </div>
            </div>
          </div>
        </div>

        <template v-if="mode === 'view'">
          <div class="timeline mt-4">
            <div class="section-title mb-2">🔗 练车完成 → 考试跟进 · 链路</div>
            <div class="tl-item">
              <div class="tl-dot green"></div>
              <div class="tl-content">
                <div class="flex-between">
                  <b>教练完成练车</b>
                  <span class="text-xs text-muted">{{ exam.completedAt }}</span>
                </div>
                <div class="mt-2 note-panel note-green">
                  <div class="text-xs font-medium mb-1" style="color:#047857;">🎯 教练完成备注（自动透传到考试跟进）</div>
                  <div class="text-sm" style="white-space:pre-line;">{{ exam.coachCompletionNote || '—' }}</div>
                </div>
              </div>
            </div>
            <div class="tl-item">
              <div class="tl-dot" :class="exam.handler ? 'purple' : 'yellow'"></div>
              <div class="tl-content">
                <div class="flex-between">
                  <b>{{ exam.handler ? '考试专员已认领' : '等待考试专员认领' }}</b>
                  <span class="text-xs text-muted">{{ exam.handlerName ? exam.completedAt : '—' }}</span>
                </div>
                <div v-if="exam.examinerNote" class="mt-2 note-panel note-purple">
                  <div class="text-xs font-medium mb-1" style="color:#6d28d9;">📝 考试专员备注</div>
                  <div class="text-sm" style="white-space:pre-line;">{{ exam.examinerNote }}</div>
                </div>
              </div>
            </div>
            <div v-if="exam.bookedDate" class="tl-item">
              <div class="tl-dot cyan"></div>
              <div class="tl-content">
                <div class="flex-between">
                  <b>已完成约考</b>
                  <span class="text-xs text-muted">{{ exam.bookedDate }}</span>
                </div>
                <div class="text-sm text-gray mt-1">
                  {{ exam.bookedDate }} {{ exam.bookedSlot }} · {{ exam.bookedSite }}
                </div>
              </div>
            </div>
            <div v-if="exam.status === 'exam_passed' || exam.status === 'exam_failed'" class="tl-item">
              <div class="tl-dot" :class="exam.status === 'exam_passed' ? 'green' : 'red'"></div>
              <div class="tl-content">
                <b>{{ exam.status === 'exam_passed' ? '🎉 考试通过，跟进结案' : '考试未通过，等待安排重考' }}</b>
              </div>
            </div>
            <div v-else class="tl-item pending">
              <div class="tl-dot outline"></div>
              <div class="tl-content text-gray">
                <b>下一步</b>：
                <template v-if="exam.status === 'pending_review'">考试专员认领并复核教练评估</template>
                <template v-else-if="exam.status === 'ready_to_book'">根据学员情况确定约考日期</template>
                <template v-else-if="exam.status === 'booked'">学员确认约考信息</template>
                <template v-else-if="exam.status === 'student_confirmed'">学员参加考试，记录成绩</template>
                <template v-else-if="exam.status === 'exam_failed'">安排补训后重新约考</template>
              </div>
            </div>
          </div>
        </template>

        <template v-if="mode === 'claim'">
          <div class="remind-box" style="background:#f5f3ff;border-color:#ddd6fe;">
            <div class="text-sm mb-1">将把本次考试跟进的责任人设置为你：</div>
            <div class="font-semibold text-base" style="color:#6d28d9;">孙伟峰（E001）</div>
            <div class="text-xs text-gray mt-2">同时将状态从「待复核」调整为「可约考」</div>
          </div>
          <div class="form-row mt-4">
            <label>处理备注（可选）</label>
            <textarea v-model="form.note" class="textarea" placeholder="例如：已确认学员可约考，明天上午联系"></textarea>
          </div>
        </template>

        <template v-if="mode === 'mark-ready'">
          <div class="form-row">
            <label>审核备注</label>
            <textarea v-model="form.note" class="textarea" placeholder="复核教练评估后，学员已具备约考条件"></textarea>
          </div>
        </template>

        <template v-if="mode === 'book' || mode === 'rebook'">
          <div class="form-grid mt-3">
            <div class="form-row">
              <label>约考日期</label>
              <select v-model="form.bookedDate" class="select">
                <option v-for="d in dateOptions" :key="d" :value="d">{{ d }} (周{{ '日一二三四五六'[dayjs(d).day()] }})</option>
              </select>
            </div>
            <div class="form-row">
              <label>考试场次</label>
              <select v-model="form.bookedSlot" class="select">
                <option v-for="s in slotOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="form-row mt-3">
            <label>考试地点</label>
            <select v-model="form.bookedSite" class="select">
              <option v-for="s in EXAM_SITES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-row mt-3">
            <label>备注（会告知学员）</label>
            <textarea v-model="form.note" class="textarea" placeholder="请携带身份证原件，提前 30 分钟到达考场..."></textarea>
          </div>
        </template>

        <template v-if="mode === 'exception'">
          <div class="ex-grid mt-3">
            <div v-for="ex in ['学员暂不参加', '教练建议再练习', '资料不齐全', '学员未回复确认', '其他异常']" :key="ex"
                 class="ex-card clickable"
                 :class="{ active: form.exceptionMsg === ex }"
                 @click="form.exceptionMsg = ex">
              {{ ex }}
            </div>
          </div>
          <div class="form-row mt-3">
            <label>异常详情</label>
            <textarea v-model="form.exceptionMsg" class="textarea" placeholder="详细说明异常情况，便于后续跟进"></textarea>
          </div>
          <div class="form-row mt-3">
            <label>内部备注</label>
            <textarea v-model="form.note" class="textarea" placeholder="处理计划等"></textarea>
          </div>
        </template>

        <template v-if="mode === 'finish'">
          <div class="form-row">
            <label>考试结果</label>
            <div class="flex gap-3 mt-1">
              <label class="flex items-center gap-2 clickable p-2 rounded" style="background:#f0fdf4;border:1px solid #bbf7d0;">
                <input type="radio" v-model="form.passed" :value="true" />
                <span class="font-medium" style="color:#166534;">✓ 考试通过</span>
              </label>
              <label class="flex items-center gap-2 clickable p-2 rounded" style="background:#fef2f2;border:1px solid #fecaca;">
                <input type="radio" v-model="form.passed" :value="false" />
                <span class="font-medium" style="color:#991b1b;">✕ 考试未通过</span>
              </label>
            </div>
          </div>
          <div class="form-row mt-3">
            <label>成绩 / 备注</label>
            <textarea v-model="form.note" class="textarea" placeholder="例如：科目三 90 分，直线行驶平稳。或：扣分项：倒车入库超时，建议强化练习。"></textarea>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn btn-default" @click="emit('close')">取消</button>
        <template v-if="mode === 'view'"></template>
        <template v-else-if="mode === 'claim'"><button class="btn btn-primary" @click="doClaim">✓ 认领并设为可约考</button></template>
        <template v-else-if="mode === 'mark-ready'"><button class="btn btn-primary" @click="doMarkReady">标记可约考</button></template>
        <template v-else-if="mode === 'book' || mode === 'rebook'"><button class="btn btn-primary" @click="doBook">确认约考</button></template>
        <template v-else-if="mode === 'exception'"><button class="btn btn-warning" @click="doException">🔔 标记异常</button></template>
        <template v-else-if="mode === 'finish'"><button class="btn" :class="form.passed ? 'btn-success' : 'btn-danger'" @click="doFinish">{{ form.passed ? '🎉 记录通过' : '记录未通过' }}</button></template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title { font-size: 13px; font-weight: 600; color: var(--gray-700); }
.summary-card {
  background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
  border: 1px solid #e9d5ff;
  border-radius: 10px; padding: 16px;
}
.p-label { font-size: 11.5px; font-weight: 600; color: var(--gray-400); letter-spacing: .5px; margin-bottom: 4px; }
.party-col { flex: 1; min-width: 0; }
.arrow-col { text-align: center; padding: 0 12px; }
.avatar-s {
  width: 36px; height: 36px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.grid-3col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.timeline { padding: 4px 0; }
.tl-item { display: flex; gap: 14px; position: relative; padding-bottom: 18px; }
.tl-item:not(:last-child)::before {
  content: ''; position: absolute;
  left: 8px; top: 18px; bottom: 0;
  width: 2px; background: var(--gray-200);
}
.tl-item.pending::before { display: none; }
.tl-dot {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--primary); flex-shrink: 0; margin-top: 2px;
  border: 3px solid #dbeafe; z-index: 1;
}
.tl-dot.green { background: var(--success); border-color: #d1fae5; }
.tl-dot.yellow { background: var(--warning); border-color: #fef3c7; }
.tl-dot.purple { background: #8b5cf6; border-color: #ede9fe; }
.tl-dot.cyan { background: var(--info); border-color: #cffafe; }
.tl-dot.red { background: var(--danger); border-color: #fee2e2; }
.tl-dot.outline { background: #fff; border: 2px dashed var(--gray-300); }
.tl-content { flex: 1; min-width: 0; padding-top: 1px; }

.note-panel { border-radius: 8px; padding: 10px 12px; border: 1px solid transparent; }
.note-green { background: #f0fdf4; border-color: #bbf7d0; }
.note-purple { background: #f5f3ff; border-color: #ddd6fe; }

.ex-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ex-card {
  padding: 10px 12px; border-radius: 8px; border: 2px solid var(--gray-200);
  background: #fff; font-size: 12.5px; font-weight: 500; color: var(--gray-700); text-align: center;
}
.ex-card:hover { border-color: #ddd6fe; background: #f5f3ff; color: #6d28d9; }
.ex-card.active { border-color: #8b5cf6; background: #f5f3ff; color: #6d28d9; }

.remind-box { padding: 14px; border-radius: 10px; border: 1px solid; }
</style>
