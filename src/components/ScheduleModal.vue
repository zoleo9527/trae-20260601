<script setup>import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app.js';
import { COACHES, TIME_SLOTS, SUBJECTS, ROLES } from '@/data/mock.js';
import StatusTag from '@/components/StatusTag.vue';
import dayjs from 'dayjs';
const props = defineProps({
 mode: { type: String, required: true },
 schedule: { type: Object, required: true }
});
const emit = defineEmits(['close']);
const router = useRouter();
const store = useAppStore();
const student = computed(() => store.getStudentById(props.schedule.studentId));
const coach = computed(() => props.schedule.coachId ? store.getCoachById(props.schedule.coachId) : null);
const form = ref({
 coachId: props.schedule.coachId || '',
 date: props.schedule.date || dayjs().add(1, 'day').format('YYYY-MM-DD'),
 slot: props.schedule.slot || TIME_SLOTS[0],
 subject: props.schedule.subject || SUBJECTS[0],
 coachNote: props.schedule.coachNote || '',
 rejectReason: props.schedule.rejectReason || '',
 completeNote: '',
 studentNote: props.schedule.studentNote || ''
});
const suitableCoaches = computed(() => COACHES.filter(c => c.subjects.includes(form.value.subject)));
const dateOptions = Array.from({ length: 14 }).map((_, i) => dayjs().add(i, 'day').format('YYYY-MM-DD'));
function doAssign() {
 if (!form.value.coachId)
 return store.pushToast('请选择教练', 'warning');
 store.reassignSchedule(props.schedule.id, {
 coachId: form.value.coachId,
 date: form.value.date,
 slot: form.value.slot
 });
 emit('close');
}
function doCoachConfirm() {
 store.coachConfirmSchedule(props.schedule.id, form.value.coachNote);
 emit('close');
}
function doCoachReject() {
 if (!form.value.rejectReason.trim())
 return store.pushToast('请填写退回原因（方便重新安排）', 'warning');
 store.coachRejectSchedule(props.schedule.id, form.value.rejectReason);
 emit('close');
}
function doComplete() {
 store.completeSchedule(props.schedule.id, form.value.completeNote);
 emit('close');
}
function doStudentConfirm() {
 store.studentConfirmSchedule(props.schedule.id, form.value.studentNote);
 emit('close');
}
function doRemind() {
 store.pushToast('已向 ' + (coach.value?.name || '教练') + ' 发送短信 + 企业微信提醒', 'info');
 emit('close');
}
const titleMap = {
 view: '排班详情 · 全链路回看',
 assign: '首次分配教练',
 reassign: '改派教练 / 调整时间',
 confirm: '教练确认排班',
 reject: '退回排班 · 说明原因',
 remind: '催促教练确认',
 complete: '完成练车 · 教学记录',
 studentConfirm: '学员确认排班'
};
const isCoach = computed(() => store.currentRole === ROLES.COACH);
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal-card" :style="{ maxWidth: mode === 'view' ? '720px' : '640px' }">
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
                <div class="avatar-s" style="background:#dbeafe;color:#1e40af;">{{ (student?.name || '?').charAt(0) }}</div>
                <div>
                  <div class="font-semibold">{{ student?.name }} <span class="tag tag-blue ml-1" style="font-size:10.5px;">{{ schedule.subject }}</span></div>
                  <div class="text-xs text-gray">📞 {{ student?.phone }} · {{ student?.carType }}</div>
                </div>
              </div>
            </div>
            <div class="arrow-col">
              <StatusTag :kind="schedule.status" type="schedule" />
              <div class="text-xs text-muted mt-1">编号：{{ schedule.id }}</div>
            </div>
            <div class="party-col">
              <div class="p-label text-right">教练</div>
              <div class="flex items-center gap-2 justify-end">
                <div class="text-right">
                  <div class="font-semibold">{{ coach?.name || '待分配' }}</div>
                  <div class="text-xs text-gray">{{ coach?.carType || '—' }} · {{ coach?.phone || '' }}</div>
                </div>
                <div class="avatar-s" style="background:#d1fae5;color:#047857;">{{ (coach?.name || '?').charAt(0) }}</div>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="flex items-center justify-between">
            <div>
              <span class="p-label">练车时间：</span>
              <b v-if="schedule.date">{{ schedule.date }}（周{{ '日一二三四五六'[dayjs(schedule.date).day()] }}）{{ schedule.slot }}</b>
              <span v-else class="tag tag-yellow">待定</span>
            </div>
            <div class="text-xs text-gray">
              派单人：{{ store.staffMap[schedule.assignedBy]?.name || '系统' }} · {{ schedule.assignedAt }}
            </div>
          </div>
        </div>

        <template v-if="mode === 'view'">
          <div class="timeline mt-4">
            <div class="section-title mb-2">🔗 从预约到排班 · 完整链路</div>
            <div class="tl-item start">
              <div class="tl-dot"></div>
              <div class="tl-content">
                <div class="flex-between">
                  <b>学员提交练车预约</b>
                  <span class="text-xs text-muted">{{ schedule.assignedAt ? dayjs(schedule.assignedAt).subtract(1, 'day').format('YYYY-MM-DD HH:mm') : '—' }}</span>
                </div>
                <div class="text-sm text-gray mt-1">
                  意向 {{ schedule.subject }} · 期望时段：{{ schedule.slot || '—' }}
                </div>
              </div>
            </div>
            <div class="tl-item">
              <div class="tl-dot blue"></div>
              <div class="tl-content">
                <div class="flex-between">
                  <b>招生顾问审核通过</b>
                  <span class="text-xs text-muted">{{ schedule.assignedAt }}</span>
                </div>
                <div class="mt-2 note-panel note-blue">
                  <div class="text-xs font-medium mb-1" style="color:#1e40af;">📝 给到排班的备注（从预约传递而来）</div>
                  <div class="text-sm">{{ schedule.passedAppointmentNote || '无备注' }}</div>
                </div>
              </div>
            </div>
            <div class="tl-item">
              <div class="tl-dot green"></div>
              <div class="tl-content">
                <div class="flex-between">
                  <b>{{ coach ? '已分配教练 ' + coach.name : '待分配教练' }}</b>
                  <span class="text-xs text-muted">{{ schedule.date ? schedule.date + ' ' + schedule.slot : '—' }}</span>
                </div>
                <div v-if="schedule.rejectReason" class="mt-2 note-panel note-red">
                  <div class="text-xs font-medium mb-1" style="color:#b91c1c;">↩ 教练退回原因</div>
                  <div class="text-sm">{{ schedule.rejectReason }}</div>
                </div>
                <div v-if="schedule.coachNote" class="mt-2 note-panel note-green">
                  <div class="text-xs font-medium mb-1" style="color:#047857;">🎯 教练反馈</div>
                  <div class="text-sm" style="white-space:pre-line;">{{ schedule.coachNote }}</div>
                </div>
              </div>
            </div>
            <div class="tl-item" v-if="schedule.completedAt">
              <div class="tl-dot gray"></div>
              <div class="tl-content">
                <div class="flex-between"><b>练车完成</b><span class="text-xs text-muted">{{ schedule.completedAt }}</span></div>
              </div>
            </div>
            <div class="tl-item pending" v-else>
              <div class="tl-dot outline"></div>
              <div class="tl-content text-gray">
                <b>下一步</b>：
                <template v-if="schedule.status === 'unassigned'">招生顾问分配教练</template>
                <template v-else-if="schedule.status === 'assigned'">{{ coach?.name }} 确认排班</template>
                <template v-else-if="schedule.status === 'coach_confirmed'">学员确认并到场练车</template>
                <template v-else-if="schedule.status === 'rejected'">重新分配教练</template>
                <template v-else-if="schedule.status === 'student_confirmed'">教练完成并记录教学</template>
              </div>
            </div>
          </div>
        </template>

        <template v-if="mode === 'assign' || mode === 'reassign'">
          <div v-if="schedule.passedAppointmentNote" class="mt-3 note-panel note-blue">
            <div class="text-xs font-medium mb-1" style="color:#1e40af;">📝 招生顾问的建议（来自预约备注）</div>
            <div class="text-sm">{{ schedule.passedAppointmentNote }}</div>
          </div>

          <div class="mt-4">
            <div class="section-title">选择教练</div>
            <div class="coach-grid mt-2">
              <div v-for="c in suitableCoaches" :key="c.id"
                   class="coach-card clickable"
                   :class="{ active: form.coachId === c.id }"
                   @click="form.coachId = c.id">
                <div class="flex items-center gap-2">
                  <div class="coach-avatar" :style="{ background: form.coachId === c.id ? '#10b981' : '#d1fae5', color: form.coachId === c.id ? '#fff' : '#047857' }">{{ c.name.charAt(0) }}</div>
                  <div>
                    <div class="font-medium">{{ c.name }}</div>
                    <div class="text-xs text-gray">{{ c.carType }} · 容量{{ c.capacity }}人</div>
                  </div>
                </div>
                <div class="mt-1">
                  <span v-for="s in c.subjects" :key="s" class="tag tag-gray tag-sm" style="font-size:10.5px;">{{ s }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-grid mt-4">
            <div class="form-row">
              <label>日期</label>
              <select v-model="form.date" class="select">
                <option v-for="d in dateOptions" :key="d" :value="d">{{ d }} (周{{ '日一二三四五六'[dayjs(d).day()] }})</option>
              </select>
            </div>
            <div class="form-row">
              <label>时段</label>
              <select v-model="form.slot" class="select">
                <option v-for="s in TIME_SLOTS" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
        </template>

        <template v-if="mode === 'confirm'">
          <div v-if="schedule.passedAppointmentNote" class="mt-3 note-panel note-blue">
            <div class="text-xs font-medium mb-1" style="color:#1e40af;">📝 学员情况（来自预约流程）</div>
            <div class="text-sm">{{ schedule.passedAppointmentNote }}</div>
          </div>
          <div class="form-row mt-4">
            <label>教练的话（可选，会发给学员）</label>
            <textarea v-model="form.coachNote" class="textarea" placeholder="例如：请提前15分钟到达场地，带好学员卡"></textarea>
          </div>
        </template>

        <template v-if="mode === 'reject'">
          <div class="ex-grid mt-3">
            <div v-for="r in ['个人请假', '学员要求冲突', '车辆维护', '与其他学员冲突', '其他原因']" :key="r"
                 class="ex-card clickable"
                 :class="{ active: form.rejectReason === r }"
                 @click="form.rejectReason = r">
              {{ r }}
            </div>
          </div>
          <div class="form-row mt-4">
            <label>详细说明（必填，方便招生顾问改派）</label>
            <textarea v-model="form.rejectReason" class="textarea" placeholder="例如：本周三下午要送孩子去医院，调整到周四以后都可以"></textarea>
          </div>
        </template>

        <template v-if="mode === 'remind'">
          <div class="remind-box">
            <div class="text-sm mb-2">将向 <b>{{ coach?.name || '教练' }}</b> 发送确认提醒：</div>
            <ul class="rlist">
              <li>📱 短信：{{ coach?.phone || '—' }}</li>
              <li>💬 企业微信推送（值班教练群）</li>
              <li>⏰ 超过 24 小时未确认将自动通知主管</li>
            </ul>
          </div>
        </template>

        <template v-if="mode === 'studentConfirm'">
          <div v-if="schedule.passedAppointmentNote" class="mt-3 note-panel note-blue">
            <div class="text-xs font-medium mb-1" style="color:#1e40af;">📝 预约备注（已传达给教练）</div>
            <div class="text-sm">{{ schedule.passedAppointmentNote }}</div>
          </div>
          <div v-if="schedule.coachNote" class="mt-3 note-panel note-green">
            <div class="text-xs font-medium mb-1" style="color:#047857;">🎯 教练的话</div>
            <div class="text-sm" style="white-space:pre-line;">{{ schedule.coachNote }}</div>
          </div>
          <div class="form-row mt-4">
            <label>学员备注（可选）</label>
            <textarea v-model="form.studentNote" class="textarea" placeholder="例如：准时到达、需要调整副驾驶座椅高度"></textarea>
          </div>
        </template>

        <template v-if="mode === 'complete'">
          <div class="form-grid">
            <div class="form-row">
              <label>本次练车时长</label>
              <select class="select">
                <option>2 小时（标准）</option>
                <option>1 小时</option>
                <option>3 小时</option>
              </select>
            </div>
            <div class="form-row">
              <label>表现评估</label>
              <select class="select">
                <option>进展正常</option>
                <option>进步明显，可约考</option>
                <option>需加强练习</option>
                <option>异常情况</option>
              </select>
            </div>
          </div>
          <div class="form-row mt-3">
            <label>教学记录（会写入学员档案）</label>
            <textarea v-model="form.completeNote" class="textarea" placeholder="例如：倒车入库入库点判断准确，侧方位停车回方向时机偏早，下次重点练习"></textarea>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn btn-default" @click="emit('close')">取消</button>
        <template v-if="mode === 'view'">
          <button v-if="schedule.appointmentId && schedule.appointmentId.startsWith('AP')"
                  class="btn btn-default"
                  @click="router.push('/trace/' + schedule.appointmentId)">查看预约追溯</button>
          <template v-if="schedule.status === 'unassigned'">
            <button class="btn btn-primary" @click="emit('close'); $nextTick(() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { mode: 'assign', schedule } })))">去分配</button>
          </template>
        </template>
        <template v-else-if="mode === 'assign'"><button class="btn btn-primary" @click="doAssign">{{ schedule.status === 'unassigned' ? '确认分配' : '调整分配' }}</button></template>
        <template v-else-if="mode === 'reassign'"><button class="btn btn-primary" @click="doAssign">确认改派</button></template>
        <template v-else-if="mode === 'confirm'"><button class="btn btn-success" @click="doCoachConfirm">✓ 我确认，通知学员</button></template>
        <template v-else-if="mode === 'reject'"><button class="btn btn-danger" @click="doCoachReject">↩ 退回并说明原因</button></template>
        <template v-else-if="mode === 'remind'"><button class="btn btn-warning" @click="doRemind">立即催办</button></template>
        <template v-else-if="mode === 'studentConfirm'"><button class="btn btn-success" @click="doStudentConfirm">✓ 我已确认，等待练车</button></template>
        <template v-else-if="mode === 'complete'"><button class="btn btn-success" @click="doComplete">✓ 完成并写入档案</button></template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title { font-size: 13px; font-weight: 600; color: var(--gray-700); }
.summary-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid var(--gray-200);
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

.timeline { padding: 4px 0; }
.tl-item {
  display: flex; gap: 14px; position: relative;
  padding-bottom: 18px;
}
.tl-item:not(:last-child)::before {
  content: ''; position: absolute;
  left: 8px; top: 18px; bottom: 0;
  width: 2px; background: var(--gray-200);
}
.tl-item.pending::before { display: none; }
.tl-dot {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--success); flex-shrink: 0; margin-top: 2px;
  border: 3px solid #d1fae5; z-index: 1;
}
.tl-dot.blue { background: var(--primary); border-color: #dbeafe; }
.tl-dot.gray { background: var(--gray-400); border-color: var(--gray-200); }
.tl-dot.outline { background: #fff; border: 2px dashed var(--gray-300); }
.tl-content { flex: 1; min-width: 0; padding-top: 1px; }

.note-panel {
  border-radius: 8px; padding: 10px 12px;
  border: 1px solid transparent;
}
.note-blue { background: #eff6ff; border-color: #bfdbfe; }
.note-green { background: #f0fdf4; border-color: #bbf7d0; }
.note-red { background: #fef2f2; border-color: #fecaca; }

.coach-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.coach-card { padding: 12px; border-radius: 8px; border: 2px solid var(--gray-200); background: #fff; }
.coach-card:hover { border-color: #a7f3d0; }
.coach-card.active { border-color: var(--success); background: #ecfdf5; }
.coach-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
}

.ex-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ex-card {
  padding: 10px 12px; border-radius: 8px; border: 2px solid var(--gray-200);
  background: #fff; font-size: 12.5px; font-weight: 500; color: var(--gray-700);
  text-align: center;
}
.ex-card:hover { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.ex-card.active { border-color: var(--danger); background: #fef2f2; color: #b91c1c; }

.remind-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; }
.rlist { list-style: none; padding: 0; }
.rlist li { padding: 4px 0; font-size: 13px; color: var(--gray-700); }

.tag-sm { padding: 1px 6px; font-size: 11px; }
</style>
