<template>
  <div class="exception-list">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="content-wrapper">
        <div class="toolbar">
          <el-select v-model="typeFilter" placeholder="异常类型">
            <el-option label="全部" value="" />
            <el-option label="时长漏记" value="duration_missing" />
            <el-option label="活动取消" value="activity_cancelled" />
            <el-option label="回访断档" value="followup_broken" />
            <el-option label="岗位未填满" value="post_not_filled" />
            <el-option label="报名卡壳" value="application_stuck" />
          </el-select>
          <el-select v-model="statusFilter" placeholder="处理状态">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
          </el-select>
        </div>
        
        <div class="stats-row">
          <div class="stat-item pending">
            <span class="stat-icon">!</span>
            <span class="stat-num">{{ pendingCount }}</span>
            <span class="stat-label">待处理</span>
          </div>
          <div class="stat-item processing">
            <span class="stat-icon">~</span>
            <span class="stat-num">{{ processingCount }}</span>
            <span class="stat-label">处理中</span>
          </div>
          <div class="stat-item resolved">
            <span class="stat-icon">✓</span>
            <span class="stat-num">{{ resolvedCount }}</span>
            <span class="stat-label">已解决</span>
          </div>
        </div>
        
        <el-table :data="exceptions" border>
          <el-table-column prop="type" label="异常类型">
            <template #default="scope">
              <span :class="['type-badge', getTypeClass(scope.row.type)]">{{ getTypeText(scope.row.type) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="related_activity_title" label="关联活动" />
          <el-table-column prop="created_at" label="创建时间" :formatter="formatDateTime" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <span :class="['status-badge', getStatusClass(scope.row.status)]">{{ getStatusText(scope.row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="handler_name" label="处理人" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="showDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" v-if="scope.row.status === 'pending'" @click="handleProcess(scope.row)">处理</el-button>
              <el-button size="small" type="success" v-if="scope.row.status !== 'resolved'" @click="handleResolve(scope.row)">解决</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <el-drawer title="异常详情" :visible.sync="showDetailDrawer" direction="rtl" size="40%">
      <div v-if="selectedException" class="drawer-content">
        <div class="drawer-header">
          <span :class="['type-badge', getTypeClass(selectedException.type)]">{{ getTypeText(selectedException.type) }}</span>
          <span :class="['status-badge', getStatusClass(selectedException.status)]">{{ getStatusText(selectedException.status) }}</span>
        </div>
        <div class="drawer-body">
          <h3>{{ selectedException.title }}</h3>
          <p>{{ selectedException.description }}</p>
          <div class="detail-info">
            <div class="info-row">
              <label>创建时间</label>
              <span>{{ formatDateTime(selectedException.created_at) }}</span>
            </div>
            <div class="info-row">
              <label>关联活动</label>
              <span>{{ selectedException.related_activity_title || '-' }}</span>
            </div>
            <div class="info-row">
              <label>处理人</label>
              <span>{{ selectedException.handler_name || '-' }}</span>
            </div>
            <div v-if="selectedException.resolved_at" class="info-row">
              <label>解决时间</label>
              <span>{{ formatDateTime(selectedException.resolved_at) }}</span>
            </div>
          </div>
          <div class="handle-section">
            <h4>处理意见</h4>
            <el-form :model="handleForm">
              <el-form-item>
                <el-textarea v-model="handleForm.remarks" rows="4" placeholder="请输入处理意见" />
              </el-form-item>
            </el-form>
          </div>
        </div>
        <div class="drawer-footer">
          <el-button @click="showDetailDrawer = false">关闭</el-button>
          <el-button type="primary" v-if="selectedException.status === 'pending'" @click="confirmProcess">开始处理</el-button>
          <el-button type="success" v-if="selectedException.status !== 'resolved'" @click="confirmResolve">标记已解决</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>import { ref, reactive, computed, onMounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import Header from '../components/Header.vue';
import { exceptionAPI, activityAPI, authAPI } from '../api';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';
const authStore = useAuthStore();
const typeFilter = ref('');
const statusFilter = ref('');
const exceptions = ref([]);
const showDetailDrawer = ref(false);
const selectedException = ref(null);
const handleForm = reactive({
 remarks: ''
});
const pendingCount = computed(() => exceptions.value.filter(e => e.status === 'pending').length);
const processingCount = computed(() => exceptions.value.filter(e => e.status === 'processing').length);
const resolvedCount = computed(() => exceptions.value.filter(e => e.status === 'resolved').length);
async function loadExceptions() {
 const params = {};
 if (typeFilter.value)
 params.type = typeFilter.value;
 if (statusFilter.value)
 params.status = statusFilter.value;
 const [excs, acts, users] = await Promise.all([
 exceptionAPI.list(params),
 activityAPI.list(),
 authAPI.getUsers()
 ]);
 const userMap = {};
 users.data.forEach(u => userMap[u.id] = u.name);
 exceptions.value = excs.data.map(exc => ({
 ...exc,
 related_activity_title: acts.data.find(a => a.id === exc.related_activity_id)?.title || '-',
 handler_name: exc.handler_id ? userMap[exc.handler_id] : '-'
 }));
}
function formatDateTime(dateStr) {
 if (!dateStr)
 return '-';
 const date = new Date(dateStr);
 return date.toLocaleString('zh-CN', {
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
}
function getTypeText(type) {
 const map = {
 duration_missing: '时长漏记',
 activity_cancelled: '活动取消',
 followup_broken: '回访断档',
 post_not_filled: '岗位未填满',
 application_stuck: '报名卡壳'
 };
 return map[type] || type;
}
function getTypeClass(type) {
 const map = {
 duration_missing: 'orange',
 activity_cancelled: 'red',
 followup_broken: 'purple',
 post_not_filled: 'blue',
 application_stuck: 'yellow'
 };
 return map[type] || 'gray';
}
function getStatusText(status) {
 const map = {
 pending: '待处理',
 processing: '处理中',
 resolved: '已解决'
 };
 return map[status] || status;
}
function getStatusClass(status) {
 const map = {
 pending: 'orange',
 processing: 'blue',
 resolved: 'green'
 };
 return map[status] || 'gray';
}
function showDetail(row) {
 selectedException.value = row;
 handleForm.remarks = row.handle_remarks || '';
 showDetailDrawer.value = true;
}
async function handleProcess(row) {
 showDetail(row);
}
async function handleResolve(row) {
 showDetail(row);
}
async function confirmProcess() {
 if (!selectedException.value)
 return;
 const currentUserId = authStore.user?.id || 1;
 try {
 await exceptionAPI.update(selectedException.value.id, {
 status: 'processing',
 handler_id: currentUserId,
 handle_remarks: handleForm.remarks
 });
 ElMessage.success('已开始处理');
 showDetailDrawer.value = false;
 loadExceptions();
 }
 catch (error) {
 ElMessage.error('操作失败');
 }
}
async function confirmResolve() {
 if (!selectedException.value)
 return;
 const currentUserId = authStore.user?.id || 1;
 try {
 await exceptionAPI.update(selectedException.value.id, {
 status: 'resolved',
 handler_id: currentUserId,
 handle_remarks: handleForm.remarks
 });
 ElMessage.success('已标记为解决');
 showDetailDrawer.value = false;
 loadExceptions();
 }
 catch (error) {
 ElMessage.error('操作失败');
 }
}
onMounted(() => {
 loadExceptions();
});
</script>

<style scoped>
.exception-list {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 150px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-item.pending .stat-icon,
.stat-item.pending .stat-num {
  color: #fa8c16;
}

.stat-item.processing .stat-icon,
.stat-item.processing .stat-num {
  color: #1890ff;
}

.stat-item.resolved .stat-icon,
.stat-item.resolved .stat-num {
  color: #52c41a;
}

.stat-num {
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  color: #888;
}

.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
}

.drawer-body h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

.drawer-body p {
  color: #666;
  line-height: 1.6;
}

.detail-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
}

.info-row label {
  color: #999;
}

.handle-section {
  margin-top: 20px;
}

.handle-section h4 {
  margin-bottom: 10px;
}

.drawer-footer {
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.type-badge, .status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.type-badge.orange {
  background: #fff7e6;
  color: #fa8c16;
}

.type-badge.red {
  background: #fff2f0;
  color: #f5222d;
}

.type-badge.purple {
  background: #f9f0ff;
  color: #722ed1;
}

.type-badge.blue {
  background: #e6f4ff;
  color: #1890ff;
}

.type-badge.yellow {
  background: #fffbe6;
  color: #faad14;
}

.type-badge.gray {
  background: #f5f5f5;
  color: #666;
}

.status-badge.orange {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.blue {
  background: #e6f4ff;
  color: #1890ff;
}

.status-badge.green {
  background: #f6ffed;
  color: #52c41a;
}
</style>