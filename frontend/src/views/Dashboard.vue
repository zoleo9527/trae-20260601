<template>
  <div class="dashboard">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="content-wrapper">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <el-icon><component :is="Calendar" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalActivities }}</div>
              <div class="stat-label">活动总数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <el-icon><component :is="Users" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingApplications }}</div>
              <div class="stat-label">待处理报名</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <el-icon><component :is="AlertTriangle" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingExceptions }}</div>
              <div class="stat-label">待处理异常</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">
              <el-icon><component :is="ClipboardList" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.unfilledPosts }}</div>
              <div class="stat-label">未填满岗位</div>
            </div>
          </div>
        </div>
        
        <div class="recent-section">
          <h3>近期活动</h3>
          <el-table :data="recentActivities" border>
            <el-table-column prop="title" label="活动名称" />
            <el-table-column prop="start_time" label="开始时间" :formatter="formatDateTime" />
            <el-table-column prop="status" label="状态" :formatter="formatStatus" />
            <el-table-column prop="max_participants" label="名额" />
          </el-table>
        </div>
        
        <div class="recent-section">
          <h3>待处理报名</h3>
          <el-table :data="pendingApplications" border>
            <el-table-column prop="activity_title" label="活动名称" />
            <el-table-column prop="volunteer_name" label="志愿者" />
            <el-table-column prop="created_at" label="报名时间" :formatter="formatDateTime" />
            <el-table-column prop="remarks" label="备注" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="goToApplication(scope.row.id)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Calendar, Users, AlertTriangle, ClipboardList } from '@element-plus/icons-vue';
import Sidebar from '../components/Sidebar.vue';
import Header from '../components/Header.vue';
import { activityAPI, applicationAPI, exceptionAPI, postAPI } from '../api';
const router = useRouter();
const stats = ref({
 totalActivities: 0,
 pendingApplications: 0,
 pendingExceptions: 0,
 unfilledPosts: 0
});
const recentActivities = ref([]);
const pendingApplications = ref([]);
async function loadStats() {
 const [activities, applications, exceptions, posts] = await Promise.all([
 activityAPI.list(),
 applicationAPI.list({ status: 'pending' }),
 exceptionAPI.list({ status: 'pending' }),
 postAPI.list({ status: 'empty' })
 ]);
 stats.value = {
 totalActivities: activities.data.length,
 pendingApplications: applications.data.length,
 pendingExceptions: exceptions.data.length,
 unfilledPosts: posts.data.length
 };
 recentActivities.value = activities.data.slice(0, 5).map(act => ({
 ...act,
 status: formatActivityStatus(act.status)
 }));
}
function formatActivityStatus(status) {
 const map = {
 draft: '草稿',
 published: '已发布',
 in_progress: '进行中',
 completed: '已完成',
 cancelled: '已取消'
 };
 return map[status] || status;
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
function formatStatus(row) {
 const colors = {
 '草稿': 'gray',
 '已发布': 'blue',
 '进行中': 'green',
 '已完成': 'success',
 '已取消': 'red'
 };
 return `<span class="status-badge ${colors[row.status]}">${row.status}</span>`;
}
function goToApplication(id) {
 router.push(`/applications/${id}`);
}
onMounted(() => {
 loadStats();
});
</script>

<style scoped>
.dashboard {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
}

.stat-icon.blue {
  background: #e6f4ff;
  color: #1890ff;
}

.stat-icon.green {
  background: #f6ffed;
  color: #52c41a;
}

.stat-icon.orange {
  background: #fff7e6;
  color: #fa8c16;
}

.stat-icon.purple {
  background: #f9f0ff;
  color: #722ed1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #888;
}

.recent-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.recent-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
  color: #333;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status-badge.gray {
  background: #f5f5f5;
  color: #666;
}

.status-badge.blue {
  background: #e6f4ff;
  color: #1890ff;
}

.status-badge.green {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.success {
  background: #e6fffb;
  color: #13c2c2;
}

.status-badge.red {
  background: #fff2f0;
  color: #f5222d;
}
</style>