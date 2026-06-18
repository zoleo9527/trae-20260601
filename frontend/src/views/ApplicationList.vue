<template>
  <div class="application-list">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="content-wrapper">
        <div class="toolbar">
          <el-select v-model="statusFilter" placeholder="状态筛选">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
          <el-select v-model="activityFilter" placeholder="选择活动">
            <el-option label="全部活动" value="" />
            <el-option v-for="act in activities" :key="act.id" :label="act.title" :value="act.id" />
          </el-select>
        </div>
        
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num pending">{{ pendingCount }}</span>
            <span class="stat-label">待处理</span>
          </div>
          <div class="stat-item">
            <span class="stat-num approved">{{ approvedCount }}</span>
            <span class="stat-label">已通过</span>
          </div>
          <div class="stat-item">
            <span class="stat-num rejected">{{ rejectedCount }}</span>
            <span class="stat-label">已拒绝</span>
          </div>
        </div>
        
        <el-table :data="applications" border>
          <el-table-column prop="activity_title" label="活动名称" />
          <el-table-column prop="volunteer_name" label="志愿者" />
          <el-table-column prop="preferred_shift" label="期望班次" />
          <el-table-column prop="remarks" label="报名备注" />
          <el-table-column prop="process_remarks" label="处理意见" />
          <el-table-column prop="created_at" label="报名时间" :formatter="formatDateTime" />
          <el-table-column prop="processed_by_name" label="处理人" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <span :class="['status-badge', getStatusClass(scope.row.status)]">{{ getStatusText(scope.row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="showDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" v-if="scope.row.status === 'pending'" @click="handleApprove(scope.row)">通过</el-button>
              <el-button size="small" type="danger" v-if="scope.row.status === 'pending'" @click="handleReject(scope.row)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <el-dialog title="报名详情" :visible.sync="showDetailDialog" width="600px">
      <div v-if="selectedApplication" class="detail-content">
        <div class="detail-row">
          <label>活动名称</label>
          <span>{{ selectedApplication.activity_title }}</span>
        </div>
        <div class="detail-row">
          <label>志愿者</label>
          <span>{{ selectedApplication.volunteer_name }}</span>
        </div>
        <div class="detail-row">
          <label>期望班次</label>
          <span>{{ selectedApplication.preferred_shift || '-' }}</span>
        </div>
        <div class="detail-row">
          <label>报名备注</label>
          <span>{{ selectedApplication.remarks || '-' }}</span>
        </div>
        <div v-if="selectedApplication.process_remarks" class="detail-row">
          <label>处理意见</label>
          <span>{{ selectedApplication.process_remarks }}</span>
        </div>
        <div class="detail-row">
          <label>报名时间</label>
          <span>{{ formatDateTime(selectedApplication.created_at) }}</span>
        </div>
        <div class="detail-row">
          <label>处理状态</label>
          <span :class="['status-badge', getStatusClass(selectedApplication.status)]">{{ getStatusText(selectedApplication.status) }}</span>
        </div>
        <div v-if="selectedApplication.processed_by_name" class="detail-row">
          <label>处理人</label>
          <span>{{ selectedApplication.processed_by_name }}</span>
        </div>
        <div class="detail-section">
          <h4>处理意见</h4>
          <el-form :model="processForm">
            <el-form-item label="处理意见">
              <el-textarea v-model="processForm.process_remarks" rows="3" placeholder="请输入处理意见（与报名备注分开保存）" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" v-if="selectedApplication?.status === 'pending'" @click="handleProcess('approved')">通过</el-button>
        <el-button type="danger" v-if="selectedApplication?.status === 'pending'" @click="handleProcess('rejected')">拒绝</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
import Header from '../components/Header.vue';
import { applicationAPI, activityAPI, authAPI } from '../api';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';
const route = useRoute();
const authStore = useAuthStore();
const statusFilter = ref('');
const activityFilter = ref('');
const activities = ref([]);
const applications = ref([]);
const showDetailDialog = ref(false);
const selectedApplication = ref(null);
const processForm = reactive({
 process_remarks: ''
});
watch(() => route.query.focusId, (newVal) => {
 if (newVal && applications.value.length > 0) {
 const app = applications.value.find(a => a.id === parseInt(newVal));
 if (app) {
 showDetail(app);
 }
 }
});
const pendingCount = computed(() => applications.value.filter(a => a.status === 'pending').length);
const approvedCount = computed(() => applications.value.filter(a => a.status === 'approved').length);
const rejectedCount = computed(() => applications.value.filter(a => a.status === 'rejected').length);
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
function getStatusText(status) {
 const map = {
 pending: '待处理',
 approved: '已通过',
 rejected: '已拒绝',
 withdrawn: '已撤回',
 completed: '已完成'
 };
 return map[status] || status;
}
function getStatusClass(status) {
 const map = {
 pending: 'orange',
 approved: 'green',
 rejected: 'red',
 withdrawn: 'gray',
 completed: 'success'
 };
 return map[status] || 'gray';
}
function showDetail(row) {
 selectedApplication.value = row;
 processForm.process_remarks = (row.process_remarks && row.process_remarks !== '-') ? row.process_remarks : '';
 showDetailDialog.value = true;
}
async function handleApprove(row) {
 await processApplication(row.id, 'approved');
}
async function handleReject(row) {
 await processApplication(row.id, 'rejected');
}
async function handleProcess(status) {
 if (!selectedApplication.value)
 return;
 await processApplication(selectedApplication.value.id, status);
 showDetailDialog.value = false;
}
async function processApplication(id, status) {
 const currentUserId = authStore.user?.id;
 if (!currentUserId) {
 ElMessage.error('请先登录');
 return;
 }
 try {
 const app = applications.value.find(a => a.id === id);
 const updateData = {
 status,
 processed_by: currentUserId
 };
 if (processForm.process_remarks.trim()) {
 updateData.process_remarks = processForm.process_remarks.trim();
 }
 await applicationAPI.update(id, updateData);
 processForm.process_remarks = '';
 
 if (status === 'approved' && app?.activity_id) {
 await activityAPI.checkExceptions(app.activity_id);
 }
 
 ElMessage.success(status === 'approved' ? '已通过' : '已拒绝');
 loadApplications();
 }
 catch (error) {
 ElMessage.error('处理失败');
 }
}
async function loadApplications() {
 const params = {};
 if (statusFilter.value)
 params.status = statusFilter.value;
 if (activityFilter.value)
 params.activity_id = activityFilter.value;
 const [apps, acts, users] = await Promise.all([
 applicationAPI.list(params),
 activityAPI.list(),
 authAPI.getUsers()
 ]);
 activities.value = acts.data;
 const userMap = {};
 users.data.forEach(u => userMap[u.id] = u.name);
 applications.value = apps.data.map(app => ({
 ...app,
 activity_title: acts.data.find(a => a.id === app.activity_id)?.title || '未知活动',
 volunteer_name: userMap[app.volunteer_id] || '未知用户',
 processed_by_name: app.processed_by ? userMap[app.processed_by] : '-',
 process_remarks: app.process_remarks || null
 }));
 
 checkFocusId();
}

function checkFocusId() {
 const focusId = route.query.focusId;
 if (focusId && applications.value.length > 0) {
 const app = applications.value.find(a => a.id === parseInt(focusId));
 if (app) {
 showDetail(app);
 }
 }
}

onMounted(() => {
 loadApplications();
});
</script>

<style scoped>
.application-list {
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
  padding: 15px 30px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
}

.stat-num.pending {
  color: #fa8c16;
}

.stat-num.approved {
  color: #52c41a;
}

.stat-num.rejected {
  color: #f5222d;
}

.stat-label {
  font-size: 14px;
  color: #888;
}

.detail-content {
  padding: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.detail-row label {
  font-weight: bold;
  color: #666;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin-bottom: 10px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status-badge.orange {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.green {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.red {
  background: #fff2f0;
  color: #f5222d;
}

.status-badge.gray {
  background: #f5f5f5;
  color: #666;
}

.status-badge.success {
  background: #e6fffb;
  color: #13c2c2;
}
</style>