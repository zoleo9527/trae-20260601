<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import type { RoleType, BookingRecord, Court, Coach, MemberCard, BookingSupplement, MemberVerify } from '../types';
import { api } from '../api';
import { formatLocalDateTime } from '../utils/date';

const props = defineProps<{
  bookingId: number;
  role: RoleType;
  courts: Court[];
  coaches: Coach[];
  members: MemberCard[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
}>();

const booking = ref<BookingRecord | null>(null);
const loading = ref(false);
const activeTab = ref('info');

const showReturnModal = ref(false);
const showSupplementModal = ref(false);
const showReviewModal = ref(false);
const showVerifyModal = ref(false);

const returnForm = reactive({
  reason: '',
});

const supplementForm = reactive<BookingSupplement>({
  supplement_note: '',
  member_id: undefined,
  coach_id: undefined,
});

const reviewForm = reactive({
  review_note: '',
});

const verifyForm = reactive<MemberVerify>({
  card_no: '',
  amount: 0,
  balance_before: 0,
  balance_after: 0,
});

const operatorName = computed(() => {
  const map: Record<RoleType, string> = {
    reception: '前台用户',
    coach: '教练',
    manager: '值班店长',
  };
  return map[props.role];
});

const canReturn = computed(() => {
  return props.role === 'manager' && ['pending', 'supplemented'].includes(booking.value?.status || '');
});

const canSupplement = computed(() => {
  return props.role === 'reception' && booking.value?.status === 'returned';
});

const canReview = computed(() => {
  return props.role === 'manager' && booking.value?.status === 'supplemented';
});

const canVerify = computed(() => {
  return props.role === 'reception' && booking.value?.status === 'approved';
});

const loadBooking = async () => {
  loading.value = true;
  try {
    booking.value = await api.getBookingById(props.bookingId);
  } finally {
    loading.value = false;
  }
};

const handleReturn = async () => {
  if (!returnForm.reason.trim()) {
    alert('请填写退回原因');
    return;
  }
  try {
    await api.returnBooking(props.bookingId, returnForm.reason, operatorName.value);
    showReturnModal.value = false;
    returnForm.reason = '';
    loadBooking();
    emit('refresh');
  } catch (e) {
    alert('操作失败：' + e);
  }
};

const handleSupplement = async () => {
  if (!supplementForm.supplement_note.trim()) {
    alert('请填写补充说明');
    return;
  }
  try {
    await api.supplementBooking(props.bookingId, { ...supplementForm }, operatorName.value);
    showSupplementModal.value = false;
    supplementForm.supplement_note = '';
    supplementForm.member_id = undefined;
    supplementForm.coach_id = undefined;
    loadBooking();
    emit('refresh');
  } catch (e) {
    alert('操作失败：' + e);
  }
};

const handleReview = async (approved: boolean) => {
  try {
    await api.reviewBooking(props.bookingId, approved, reviewForm.review_note || null, operatorName.value);
    showReviewModal.value = false;
    reviewForm.review_note = '';
    loadBooking();
    emit('refresh');
  } catch (e) {
    alert('操作失败：' + e);
  }
};

const handleVerify = async () => {
  if (!verifyForm.card_no || verifyForm.amount <= 0) {
    alert('请填写完整核销信息');
    return;
  }
  try {
    await api.verifyMember(props.bookingId, { ...verifyForm }, operatorName.value);
    showVerifyModal.value = false;
    Object.assign(verifyForm, {
      card_no: '',
      amount: 0,
      balance_before: 0,
      balance_after: 0,
    });
    loadBooking();
    emit('refresh');
  } catch (e) {
    alert('操作失败：' + e);
  }
};

const selectMemberForVerify = (memberId: number) => {
  const member = props.members.find(m => m.id === memberId);
  if (member) {
    verifyForm.card_no = member.card_no;
    verifyForm.balance_before = member.balance;
  }
};

const calculateBalanceAfter = () => {
  verifyForm.balance_after = verifyForm.balance_before - verifyForm.amount;
};

onMounted(() => {
  loadBooking();
});
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal" style="width: 720px;">
      <div class="modal-header">
        <h3>
          预约详情
          <span v-if="booking" class="status-badge" :class="booking.status" style="margin-left:8px;">{{ booking.status_text }}</span>
        </h3>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>

      <div v-if="loading" class="modal-body">
        <div style="text-align:center;padding:40px;">加载中...</div>
      </div>

      <div v-else-if="booking">
        <div class="tabs" style="margin: 0 24px;">
          <div class="tab" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">基本信息</div>
          <div class="tab" :class="{ active: activeTab === 'flow' }" @click="activeTab = 'flow'">处理流程</div>
          <div class="tab" :class="{ active: activeTab === 'verify' }" @click="activeTab = 'verify'">核销信息</div>
        </div>

        <div class="modal-body">
          <div v-if="booking.liability_flag" style="background:#fef2f2;border:1px solid #fecaca;padding:12px 16px;border-radius:8px;margin-bottom:20px;">
            <div style="color:#b91c1c;font-weight:600;">⚠️ {{ booking.liability_flag }}</div>
            <div style="color:#7f1d1d;font-size:13px;margin-top:4px;">场地预约和会员核销之间存在责任边界，需跟进确认。</div>
          </div>

          <div v-if="activeTab === 'info'">
            <div class="detail-section">
              <h4>预约信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="label">预订号</div>
                  <div class="value">{{ booking.booking_no }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">场地</div>
                  <div class="value">{{ booking.court_name }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">预约日期</div>
                  <div class="value">{{ booking.booking_date }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">时段</div>
                  <div class="value">{{ booking.start_time }} - {{ booking.end_time }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">预订人</div>
                  <div class="value">{{ booking.booker_name }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">联系电话</div>
                  <div class="value">{{ booking.booker_phone }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">教练</div>
                  <div class="value">{{ booking.coach_name || '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">会员</div>
                  <div class="value">{{ booking.member_name ? `${booking.member_name} (${booking.member_card_no})` : '散客' }}</div>
                </div>
                <div class="detail-item" style="grid-column: span 2;">
                  <div class="label">备注</div>
                  <div class="value">{{ booking.remark || '-' }}</div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="booking.return_reason">
              <h4>退回信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="label">退回原因</div>
                  <div class="value" style="color:#991b1b;">{{ booking.return_reason }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">退回人</div>
                  <div class="value">{{ booking.return_by }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">退回时间</div>
                  <div class="value">{{ formatLocalDateTime(booking.return_at) }}</div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="booking.supplement_note">
              <h4>补录信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="label">补充说明</div>
                  <div class="value" style="color:#1e40af;">{{ booking.supplement_note }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">补录人</div>
                  <div class="value">{{ booking.supplement_by }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">补录时间</div>
                  <div class="value">{{ formatLocalDateTime(booking.supplement_at) }}</div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="booking.review_result">
              <h4>复核信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="label">复核结果</div>
                  <div class="value" :style="{ color: booking.review_result === 'approved' ? '#065f46' : '#7f1d1d' }">
                    {{ booking.review_result === 'approved' ? '通过' : '拒绝' }}
                  </div>
                </div>
                <div class="detail-item">
                  <div class="label">复核人</div>
                  <div class="value">{{ booking.review_by }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">复核时间</div>
                  <div class="value">{{ formatLocalDateTime(booking.review_at) }}</div>
                </div>
                <div class="detail-item" v-if="booking.review_note" style="grid-column: span 2;">
                  <div class="label">复核备注</div>
                  <div class="value">{{ booking.review_note }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'flow'">
            <div class="timeline">
              <div class="timeline-item">
                <div class="time">{{ formatLocalDateTime(booking.created_at) }}</div>
                <div class="title">预约创建</div>
                <div class="note">由 {{ booking.created_by }} 创建预约</div>
              </div>
              <div v-if="booking.return_at" class="timeline-item">
                <div class="time">{{ formatLocalDateTime(booking.return_at) }}</div>
                <div class="title" style="color:#dc2626;">已退回</div>
                <div class="note">{{ booking.return_by }}：{{ booking.return_reason }}</div>
              </div>
              <div v-if="booking.supplement_at" class="timeline-item">
                <div class="time">{{ formatLocalDateTime(booking.supplement_at) }}</div>
                <div class="title" style="color:#2563eb;">补录完成</div>
                <div class="note">{{ booking.supplement_by }}：{{ booking.supplement_note }}</div>
              </div>
              <div v-if="booking.review_at" class="timeline-item">
                <div class="time">{{ formatLocalDateTime(booking.review_at) }}</div>
                <div class="title" :style="{ color: booking.review_result === 'approved' ? '#059669' : '#dc2626' }">
                  复核{{ booking.review_result === 'approved' ? '通过' : '拒绝' }}
                </div>
                <div class="note">{{ booking.review_by }}：{{ booking.review_note || '无备注' }}</div>
              </div>
              <div v-if="booking.verify_at" class="timeline-item">
                <div class="time">{{ formatLocalDateTime(booking.verify_at) }}</div>
                <div class="title" style="color:#8b5cf6;">会员核销完成</div>
                <div class="note">
                  {{ booking.verify_by }} 核销卡号 {{ booking.verify_card_no }}，
                  金额 ¥{{ booking.verify_amount?.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'verify'">
            <div v-if="booking.verify_status" class="detail-section">
              <h4>核销记录</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="label">会员卡号</div>
                  <div class="value"><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">{{ booking.verify_card_no }}</code></div>
                </div>
                <div class="detail-item">
                  <div class="label">核销金额</div>
                  <div class="value" style="color:#ef4444;font-weight:600;">-¥{{ booking.verify_amount?.toFixed(2) }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">核销前余额</div>
                  <div class="value">¥{{ booking.verify_balance_before?.toFixed(2) }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">核销后余额</div>
                  <div class="value" style="color:#10b981;font-weight:600;">¥{{ booking.verify_balance_after?.toFixed(2) }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">核销人</div>
                  <div class="value">{{ booking.verify_by }}</div>
                </div>
                <div class="detail-item">
                  <div class="label">核销时间</div>
                  <div class="value">{{ formatLocalDateTime(booking.verify_at) }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="icon">💳</div>
              <div class="text">暂无核销记录</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="canReturn" class="btn btn-danger" @click="showReturnModal = true">
            ↩️ 退回
          </button>
          <button v-if="canSupplement" class="btn btn-warning" @click="showSupplementModal = true">
            ✏️ 补录
          </button>
          <button v-if="canReview" class="btn btn-primary" @click="showReviewModal = true">
            ✅ 复核
          </button>
          <button v-if="canVerify" class="btn btn-success" @click="showVerifyModal = true">
            💳 会员核销
          </button>
          <button class="btn btn-secondary" @click="emit('close')">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="showReturnModal" class="modal-overlay" @click.self="showReturnModal = false">
      <div class="modal" style="width: 480px;">
        <div class="modal-header">
          <h3>退回预约</h3>
          <button class="modal-close" @click="showReturnModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>退回原因 <span class="required">*</span></label>
            <textarea v-model="returnForm.reason" rows="4" placeholder="请说明退回原因，如会员卡信息不一致、场地冲突等"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showReturnModal = false">取消</button>
          <button class="btn btn-danger" @click="handleReturn">确认退回</button>
        </div>
      </div>
    </div>

    <div v-if="showSupplementModal" class="modal-overlay" @click.self="showSupplementModal = false">
      <div class="modal" style="width: 520px;">
        <div class="modal-header">
          <h3>补录信息</h3>
          <button class="modal-close" @click="showSupplementModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>补充说明 <span class="required">*</span></label>
            <textarea v-model="supplementForm.supplement_note" rows="3" placeholder="请填写补充的信息说明"></textarea>
          </div>
          <div class="form-group">
            <label>会员信息（如之前未填写）</label>
            <select v-model.number="supplementForm.member_id">
              <option :value="undefined">不选择（散客）</option>
              <option v-for="m in members" :key="m.id" :value="m.id">{{ m.member_name }} - {{ m.card_no }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>教练（如之前未填写）</label>
            <select v-model.number="supplementForm.coach_id">
              <option :value="undefined">不选择</option>
              <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }} ({{ c.specialty }})</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showSupplementModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSupplement">提交补录</button>
        </div>
      </div>
    </div>

    <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal" style="width: 480px;">
        <div class="modal-header">
          <h3>复核预约</h3>
          <button class="modal-close" @click="showReviewModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>复核备注</label>
            <textarea v-model="reviewForm.review_note" rows="3" placeholder="选填，说明复核意见"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showReviewModal = false">取消</button>
          <button class="btn btn-danger" @click="handleReview(false)">拒绝</button>
          <button class="btn btn-success" @click="handleReview(true)">通过</button>
        </div>
      </div>
    </div>

    <div v-if="showVerifyModal" class="modal-overlay" @click.self="showVerifyModal = false">
      <div class="modal" style="width: 520px;">
        <div class="modal-header">
          <h3>会员核销</h3>
          <button class="modal-close" @click="showVerifyModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>选择会员</label>
            <select @change="selectMemberForVerify(Number(($event.target as HTMLSelectElement).value))">
              <option :value="0">请选择会员</option>
              <option v-for="m in members" :key="m.id" :value="m.id">{{ m.member_name }} - {{ m.card_no }} (余额:¥{{ m.balance }})</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>会员卡号</label>
              <input type="text" v-model="verifyForm.card_no" placeholder="系统自动填入或手动输入" />
            </div>
            <div class="form-group">
              <label>核销前余额</label>
              <input type="number" v-model.number="verifyForm.balance_before" @change="calculateBalanceAfter" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>核销金额 <span class="required">*</span></label>
              <input type="number" v-model.number="verifyForm.amount" @change="calculateBalanceAfter" placeholder="请输入金额" />
            </div>
            <div class="form-group">
              <label>核销后余额</label>
              <input type="number" v-model.number="verifyForm.balance_after" readonly style="background:#f3f4f6;" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showVerifyModal = false">取消</button>
          <button class="btn btn-success" @click="handleVerify">确认核销</button>
        </div>
      </div>
    </div>
  </div>
</template>
