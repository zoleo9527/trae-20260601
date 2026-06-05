<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import type { RoleType, BookingRecord, Court, Coach, MemberCard, BookingFilter, CreateBooking } from '../types';
import { api } from '../api';

const props = defineProps<{
  role: RoleType;
  courts: Court[];
  coaches: Coach[];
  members: MemberCard[];
}>();

const emit = defineEmits<{
  (e: 'row-click', id: number): void;
  (e: 'refresh'): void;
}>();

const bookings = ref<BookingRecord[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);

const filter = reactive<BookingFilter>({
  status: '',
  date_from: '',
  date_to: '',
  court_id: undefined,
  keyword: '',
});

const newBooking = reactive<CreateBooking>({
  court_id: 0,
  coach_id: undefined,
  member_id: undefined,
  booker_name: '',
  booker_phone: '',
  booking_date: new Date().toISOString().split('T')[0],
  start_time: '09:00',
  end_time: '10:00',
  created_by: '前台用户',
  remark: '',
});

const quickFilters = [
  { label: '全部', status: '' },
  { label: '待确认', status: 'pending' },
  { label: '已退回', status: 'returned' },
  { label: '待复核', status: 'supplemented' },
  { label: '已确认', status: 'approved' },
  { label: '已核销', status: 'verified' },
];

const loadBookings = async () => {
  loading.value = true;
  try {
    const f: BookingFilter = {};
    if (filter.status) f.status = filter.status;
    if (filter.date_from) f.date_from = filter.date_from;
    if (filter.date_to) f.date_to = filter.date_to;
    if (filter.court_id) f.court_id = filter.court_id;
    if (filter.keyword) f.keyword = filter.keyword;
    bookings.value = await api.getBookings(f);
  } finally {
    loading.value = false;
  }
};

const applyQuickFilter = (status: string) => {
  filter.status = status;
  loadBookings();
};

const handleCreate = async () => {
  if (!newBooking.court_id || !newBooking.booker_name || !newBooking.booker_phone) {
    alert('请填写必填项');
    return;
  }
  try {
    await api.createBooking(newBooking);
    showCreateModal.value = false;
    loadBookings();
    emit('refresh');
    Object.assign(newBooking, {
      court_id: 0,
      coach_id: undefined,
      member_id: undefined,
      booker_name: '',
      booker_phone: '',
      booking_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00',
      remark: '',
    });
  } catch (e) {
    alert('创建失败：' + e);
  }
};

const refresh = () => {
  loadBookings();
};

defineExpose({ refresh });

onMounted(() => {
  loadBookings();
});
</script>

<template>
  <div>
    <div class="card">
      <div class="card-header">
        <h3>场地预约列表</h3>
        <button v-if="role === 'reception'" class="btn btn-primary" @click="showCreateModal = true">
          + 新建预约
        </button>
      </div>
      <div class="card-body">
        <div class="tabs" style="margin-bottom: 16px;">
          <div
            v-for="qf in quickFilters"
            :key="qf.status || 'all'"
            class="tab"
            :class="{ active: filter.status === qf.status }"
            @click="applyQuickFilter(qf.status)"
          >
            {{ qf.label }}
          </div>
        </div>

        <div class="filter-bar">
          <div class="filter-group">
            <label>场地</label>
            <select v-model.number="filter.court_id" @change="loadBookings">
              <option :value="undefined">全部场地</option>
              <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>日期从</label>
            <input type="date" v-model="filter.date_from" @change="loadBookings" />
          </div>
          <div class="filter-group">
            <label>到</label>
            <input type="date" v-model="filter.date_to" @change="loadBookings" />
          </div>
          <div class="filter-group">
            <label>搜索</label>
            <input type="text" v-model="filter.keyword" placeholder="姓名/电话/预订号" @input="loadBookings" />
          </div>
        </div>

        <div class="table-container" style="overflow-x: auto;">
          <table class="booking-table">
            <thead>
              <tr>
                <th>预订号</th>
                <th>场地</th>
                <th>预订人</th>
                <th>日期</th>
                <th>时段</th>
                <th>会员</th>
                <th>状态</th>
                <th>责任标记</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in bookings" :key="b.id" @click="emit('row-click', b.id)">
                <td><strong>{{ b.booking_no }}</strong></td>
                <td>{{ b.court_name }}</td>
                <td>{{ b.booker_name }}<br /><small style="color:#9ca3af">{{ b.booker_phone }}</small></td>
                <td>{{ b.booking_date }}</td>
                <td>{{ b.start_time }} - {{ b.end_time }}</td>
                <td>{{ b.member_name || '-' }}</td>
                <td><span class="status-badge" :class="b.status">{{ b.status_text }}</span></td>
                <td>
                  <span v-if="b.liability_flag" class="liability-badge">{{ b.liability_flag }}</span>
                  <span v-else style="color:#9ca3af">-</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!loading && bookings.length === 0" class="empty-state">
            <div class="icon">📭</div>
            <div class="text">暂无预约记录</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建场地预约</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>场地 <span class="required">*</span></label>
              <select v-model.number="newBooking.court_id">
                <option :value="0">请选择场地</option>
                <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.name }} ({{ c.court_type }} - {{ c.price_per_hour }}元/小时)</option>
              </select>
            </div>
            <div class="form-group">
              <label>教练</label>
              <select v-model.number="newBooking.coach_id">
                <option :value="undefined">不选择</option>
                <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }} ({{ c.specialty }})</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>会员</label>
            <select v-model.number="newBooking.member_id">
              <option :value="undefined">散客</option>
              <option v-for="m in members" :key="m.id" :value="m.id">{{ m.member_name }} - {{ m.card_no }} ({{ m.card_type }}, 余额:{{ m.balance }})</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>预订人姓名 <span class="required">*</span></label>
              <input type="text" v-model="newBooking.booker_name" placeholder="请输入姓名" />
            </div>
            <div class="form-group">
              <label>联系电话 <span class="required">*</span></label>
              <input type="text" v-model="newBooking.booker_phone" placeholder="请输入电话" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>预约日期 <span class="required">*</span></label>
              <input type="date" v-model="newBooking.booking_date" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间</label>
              <input type="time" v-model="newBooking.start_time" />
            </div>
            <div class="form-group">
              <label>结束时间</label>
              <input type="time" v-model="newBooking.end_time" />
            </div>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="newBooking.remark" rows="3" placeholder="选填"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate">提交预约</button>
        </div>
      </div>
    </div>
  </div>
</template>
