<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from '../store';
import { formatLocalDateTime } from '../utils/date';

const emit = defineEmits<{
  (e: 'row-click', id: number): void;
}>();

const store = useStore();

const history = computed(() => store.verificationHistory.value);
const loading = computed(() => store.historyLoading.value);

onMounted(() => {
  store.loadVerificationHistory();
});
</script>

<template>
  <div>
    <div class="card">
      <div class="card-header">
        <h3>会员核销回看</h3>
        <button class="btn btn-secondary" @click="store.loadVerificationHistory()">🔄 刷新</button>
      </div>
      <div class="card-body">
        <div class="table-container" style="overflow-x: auto;">
          <table class="booking-table">
            <thead>
              <tr>
                <th>预订号</th>
                <th>场地</th>
                <th>预订人</th>
                <th>预约日期</th>
                <th>会员卡号</th>
                <th>核销前余额</th>
                <th>核销金额</th>
                <th>核销后余额</th>
                <th>核销人</th>
                <th>核销时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in history" :key="b.id" @click="emit('row-click', b.id)">
                <td><strong>{{ b.booking_no }}</strong></td>
                <td>{{ b.court_name }}</td>
                <td>{{ b.booker_name }}</td>
                <td>{{ b.booking_date }}</td>
                <td><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">{{ b.verify_card_no }}</code></td>
                <td style="color:#6b7280;">¥{{ b.verify_balance_before?.toFixed(2) }}</td>
                <td style="color:#ef4444;font-weight:600;">-¥{{ b.verify_amount?.toFixed(2) }}</td>
                <td style="color:#10b981;font-weight:600;">¥{{ b.verify_balance_after?.toFixed(2) }}</td>
                <td>{{ b.verify_by }}</td>
                <td><small>{{ formatLocalDateTime(b.verify_at) }}</small></td>
              </tr>
            </tbody>
          </table>
          <div v-if="!loading && history.length === 0" class="empty-state">
            <div class="icon">📭</div>
            <div class="text">暂无核销记录</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
