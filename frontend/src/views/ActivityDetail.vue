<template>
  <div class="activity-detail">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="content-wrapper">
        <el-button @click="$router.back()" class="back-btn">返回列表</el-button>
        
        <div class="detail-card" v-if="activity">
          <div class="detail-header">
            <h1>{{ activity.title }}</h1>
            <span :class="['status-badge', getStatusClass(activity.status)]">{{ getStatusText(activity.status) }}</span>
          </div>
          
          <div class="detail-info">
            <div class="info-row">
              <label>活动地点</label>
              <span>{{ activity.location || '-' }}</span>
            </div>
            <div class="info-row">
              <label>开始时间</label>
              <span>{{ formatDateTime(activity.start_time) }}</span>
            </div>
            <div class="info-row">
              <label>结束时间</label>
              <span>{{ formatDateTime(activity.end_time) }}</span>
            </div>
            <div class="info-row">
              <label>活动时长</label>
              <span>{{ activity.duration }} 小时</span>
            </div>
            <div class="info-row">
              <label>最大名额</label>
              <span>{{ activity.max_participants || '不限' }}</span>
            </div>
            <div class="info-row">
              <label>所需技能</label>
              <span>{{ activity.required_skills || '不限' }}</span>
            </div>
            <div class="info-row">
              <label>活动描述</label>
              <span>{{ activity.description || '-' }}</span>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>报名列表 ({{ applications.length }}人)</h3>
            <el-table :data="applications" border>
              <el-table-column prop="volunteer_name" label="志愿者" />
              <el-table-column prop="preferred_shift" label="期望班次" />
              <el-table-column prop="remarks" label="备注" />
              <el-table-column prop="created_at" label="报名时间" :formatter="formatDateTime" />
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <span :class="['status-badge', getAppStatusClass(scope.row.status)]">{{ getAppStatusText(scope.row.status) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="assigned_post_name" label="分配岗位" />
            </el-table>
          </div>
          
          <div class="detail-section">
            <h3>岗位列表</h3>
            <div class="post-list">
              <div v-for="post in posts" :key="post.id" class="post-item">
                <div class="post-header">
                  <span class="post-name">{{ post.name }}</span>
                  <span :class="['status-badge', getPostStatusClass(post.status)]">{{ getPostStatusText(post.status) }}</span>
                </div>
                <p>班次: {{ post.shift }} | 名额: {{ post.current_count }}/{{ post.capacity }}</p>
                <p>技能: {{ post.required_skills || '不限' }}</p>
                <div v-if="getPostAssignees(post.id).length > 0" class="post-assignees">
                  <span v-for="user in getPostAssignees(post.id)" :key="user.id" class="assignee-tag">{{ user.name }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>附件管理</h3>
            <div class="attachment-upload">
              <el-upload
                action="http://localhost:8000/attachments"
                :data="{ activity_id: activity.id }"
                :auto-upload="true"
                :on-success="handleUploadSuccess"
                class="upload-demo"
              >
                <el-button size="small" type="primary">上传附件</el-button>
              </el-upload>
              <div v-if="attachments.length > 0" class="attachment-list">
                <div v-for="file in attachments" :key="file.id" class="attachment-item">
                  <el-icon><component :is="File" /></el-icon>
                  <span>{{ file.filename }}</span>
                  <el-button size="mini" @click="handleDeleteAttachment(file.id)">删除</el-button>
                </div>
              </div>
              <div v-else class="empty-attachment">
                <p>暂无附件，可上传签到表、活动照片等文件</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { File } from '@element-plus/icons-vue';
import Sidebar from '../components/Sidebar.vue';
import Header from '../components/Header.vue';
import { activityAPI, applicationAPI, postAPI, attachmentAPI, authAPI } from '../api';
import { ElMessage } from 'element-plus';
const route = useRoute();
const activity = ref(null);
const applications = ref([]);
const posts = ref([]);
const attachments = ref([]);
const users = ref([]);
async function loadData() {
 const activityId = parseInt(route.params.id);
 const [act, apps, ps, atts, usrs] = await Promise.all([
 activityAPI.get(activityId),
 applicationAPI.list({ activity_id: activityId }),
 postAPI.list({ activity_id: activityId }),
 attachmentAPI.list({ activity_id: activityId }),
 authAPI.getUsers()
 ]);
 activity.value = act.data;
 users.value = usrs.data;
 const userMap = {};
 usrs.data.forEach(u => userMap[u.id] = u.name);
 applications.value = apps.data.map(app => ({
 ...app,
 volunteer_name: userMap[app.volunteer_id] || '未知',
 assigned_post_name: ps.data.find(p => p.id === app.assigned_post_id)?.name || '-'
 }));
 posts.value = ps.data;
 attachments.value = atts.data;
}
function formatDateTime(dateStr) {
 if (!dateStr)
 return '-';
 const date = new Date(dateStr);
 return date.toLocaleString('zh-CN', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
}
function getStatusText(status) {
 const map = {
 draft: '草稿',
 published: '已发布',
 in_progress: '进行中',
 completed: '已完成',
 cancelled: '已取消'
 };
 return map[status] || status;
}
function getStatusClass(status) {
 const map = {
 draft: 'gray',
 published: 'blue',
 in_progress: 'green',
 completed: 'success',
 cancelled: 'red'
 };
 return map[status] || 'gray';
}
function getAppStatusText(status) {
 const map = {
 pending: '待处理',
 approved: '已通过',
 rejected: '已拒绝',
 withdrawn: '已撤回',
 completed: '已完成'
 };
 return map[status] || status;
}
function getAppStatusClass(status) {
 const map = {
 pending: 'orange',
 approved: 'green',
 rejected: 'red',
 withdrawn: 'gray',
 completed: 'success'
 };
 return map[status] || 'gray';
}
function getPostStatusText(status) {
 const map = {
 empty: '空缺',
 filled: '已满',
 in_progress: '进行中',
 completed: '已完成'
 };
 return map[status] || status;
}
function getPostStatusClass(status) {
 const map = {
 empty: 'orange',
 filled: 'green',
 in_progress: 'blue',
 completed: 'success'
 };
 return map[status] || 'gray';
}
function getPostAssignees(postId) {
 const appIds = applications.value.filter(a => a.assigned_post_id === postId).map(a => a.volunteer_id);
 return users.value.filter(u => appIds.includes(u.id));
}
function handleUploadSuccess() {
 ElMessage.success('上传成功');
 loadData();
}
async function handleDeleteAttachment(id) {
 try {
 await attachmentAPI.delete(id);
 ElMessage.success('删除成功');
 loadData();
 }
 catch (error) {
 ElMessage.error('删除失败');
 }
}
onMounted(() => {
 loadData();
});
</script>

<style scoped>
.activity-detail {
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

.back-btn {
  margin-bottom: 20px;
}

.detail-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.detail-header h1 {
  font-size: 24px;
  margin: 0;
}

.detail-info {
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row label {
  color: #999;
  font-weight: 500;
}

.detail-section {
  margin-bottom: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.detail-section h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.post-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.post-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
}

.post-item .post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.post-name {
  font-weight: bold;
}

.post-assignees {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.assignee-tag {
  background: #e6f4ff;
  color: #1890ff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.attachment-upload {
  padding: 20px;
  border: 1px dashed #ddd;
  border-radius: 8px;
}

.attachment-list {
  margin-top: 15px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.empty-attachment {
  margin-top: 15px;
  text-align: center;
  color: #999;
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

.status-badge.orange {
  background: #fff7e6;
  color: #fa8c16;
}
</style>