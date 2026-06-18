<template>
  <div class="post-allocation">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="content-wrapper">
        <div class="toolbar">
          <el-select v-model="activityId" placeholder="选择活动">
            <el-option label="全部活动" value="" />
            <el-option v-for="act in activities" :key="act.id" :label="act.title" :value="act.id" />
          </el-select>
          <el-button type="primary" @click="showCreatePostDialog = true">创建岗位</el-button>
        </div>
        
        <div class="allocation-grid">
          <div class="posts-section">
            <h3>岗位列表</h3>
            <div class="post-cards">
              <div v-for="post in filteredPosts" :key="post.id" class="post-card" :class="{ filled: post.status === 'filled' }">
                <div class="post-header">
                  <span class="post-name">{{ post.name }}</span>
                  <span :class="['status-badge', getPostStatusClass(post.status)]">{{ getPostStatusText(post.status) }}</span>
                </div>
                <div class="post-info">
                  <p><span>班次:</span> {{ post.shift || '全天' }}</p>
                  <p><span>名额:</span> {{ post.current_count }}/{{ post.capacity }}</p>
                  <p><span>技能:</span> {{ post.required_skills || '不限' }}</p>
                </div>
                <div class="post-assignees">
                  <div v-if="getAssignees(post.id).length > 0">
                    <p>已分配:</p>
                    <div class="assignee-tags">
                      <span v-for="user in getAssignees(post.id)" :key="user.id" class="assignee-tag">{{ user.name }}</span>
                    </div>
                  </div>
                  <p v-else class="no-assignee">暂无分配</p>
                </div>
                <div v-if="post.current_count < post.capacity" class="unfilled-warning">
                  <el-icon class="warning-icon"><component :is="AlertTriangle" /></el-icon>
                  <span>还差 {{ post.capacity - post.current_count }} 人</span>
                </div>
                <div v-if="getPostException(post.id)" class="exception-info">
                  <el-icon class="exception-icon"><component :is="AlertCircle" /></el-icon>
                  <div class="exception-content">
                    <span class="exception-title">{{ getPostException(post.id).title }}</span>
                    <span class="exception-desc">{{ getPostException(post.id).description }}</span>
                  </div>
                </div>
                <div class="post-actions">
                  <el-button size="small" @click="showAssignDialog(post)">分配人员</el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="applicants-section">
            <h3>待分配人员</h3>
            <el-table :data="approvedApplications" border>
              <el-table-column prop="volunteer_name" label="志愿者" />
              <el-table-column prop="preferred_shift" label="期望班次" />
              <el-table-column prop="remarks" label="报名备注" />
              <el-table-column prop="process_remarks" label="处理意见" />
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button size="small" @click="assignToPost(scope.row)">分配</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
    
    <el-dialog title="创建岗位" :visible.sync="showCreatePostDialog" width="450px">
      <el-form :model="postForm">
        <el-form-item label="岗位名称" required>
          <el-input v-model="postForm.name" />
        </el-form-item>
        <el-form-item label="所属活动" required>
          <el-select v-model="postForm.activity_id">
            <el-option v-for="act in activities" :key="act.id" :label="act.title" :value="act.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="postForm.shift">
            <el-option label="上午" value="上午" />
            <el-option label="下午" value="下午" />
            <el-option label="全天" value="全天" />
          </el-select>
        </el-form-item>
        <el-form-item label="名额">
          <el-input v-model.number="postForm.capacity" type="number" />
        </el-form-item>
        <el-form-item label="所需技能">
          <el-input v-model="postForm.required_skills" />
        </el-form-item>
        <el-form-item label="岗位描述">
          <el-textarea v-model="postForm.description" rows="3" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showCreatePostDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreatePost">创建</el-button>
      </div>
    </el-dialog>
    
    <el-dialog :title="`分配人员 - ${selectedPost?.name}`" :visible.sync="showAssignDialog" width="500px">
      <div v-if="selectedPost">
        <p>当前名额: {{ selectedPost.current_count }}/{{ selectedPost.capacity }}</p>
        <el-table :data="availableApplicants" border>
          <el-table-column prop="volunteer_name" label="志愿者" />
          <el-table-column prop="preferred_shift" label="期望班次" />
          <el-table-column prop="remarks" label="报名备注" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" type="primary" @click="confirmAssign(scope.row)">确认分配</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer">
        <el-button @click="showAssignDialog = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>import { ref, reactive, computed, onMounted } from 'vue';
import { AlertTriangle, AlertCircle } from '@element-plus/icons-vue';
import Sidebar from '../components/Sidebar.vue';
import Header from '../components/Header.vue';
import { postAPI, activityAPI, applicationAPI, authAPI, exceptionAPI } from '../api';
import { ElMessage } from 'element-plus';
const activityId = ref('');
const activities = ref([]);
const posts = ref([]);
const applications = ref([]);
const users = ref([]);
const exceptions = ref([]);
const showCreatePostDialog = ref(false);
const showAssignDialog = ref(false);
const selectedPost = ref(null);
const postForm = reactive({
 name: '',
 activity_id: '',
 shift: '全天',
 capacity: 1,
 required_skills: '',
 description: ''
});
async function loadData() {
 const [acts, ps, apps, usrs, excs] = await Promise.all([
 activityAPI.list(),
 postAPI.list(),
 applicationAPI.list(),
 authAPI.getUsers(),
 exceptionAPI.list()
 ]);
 activities.value = acts.data;
 posts.value = ps.data;
 applications.value = apps.data.map(app => ({
 ...app,
 volunteer_name: usrs.data.find(u => u.id === app.volunteer_id)?.name || '未知',
 remarks: app.remarks || '-',
 process_remarks: app.process_remarks || '-'
 }));
 users.value = usrs.data;
 exceptions.value = excs.data;
}
function getPostException(postId) {
 return exceptions.value.find(e => e.related_post_id === postId && e.status !== 'resolved');
}
const filteredPosts = computed(() => {
 if (!activityId.value)
 return posts.value;
 return posts.value.filter(p => p.activity_id === parseInt(activityId.value));
});
const approvedApplications = computed(() => {
 const assignedIds = applications.value.filter(a => a.assigned_post_id).map(a => a.id);
 return applications.value.filter(a => a.status === 'approved' && !assignedIds.includes(a.id));
});
const availableApplicants = computed(() => {
 if (!selectedPost.value)
 return [];
 const assignedIds = applications.value.filter(a => a.assigned_post_id === selectedPost.value.id).map(a => a.id);
 return approvedApplications.value.filter(a => !assignedIds.includes(a.id));
});
function getAssignees(postId) {
 const appIds = applications.value.filter(a => a.assigned_post_id === postId).map(a => a.volunteer_id);
 return users.value.filter(u => appIds.includes(u.id));
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
function showAssignDialog(post) {
 selectedPost.value = post;
 showAssignDialog.value = true;
}
function assignToPost(app) {
 const availablePosts = posts.value.filter(p => p.status !== 'filled' && (!p.activity_id || p.activity_id === app.activity_id));
 if (availablePosts.length === 0) {
 ElMessage.warning('没有可用的岗位');
 return;
 }
 selectedPost.value = availablePosts[0];
 showAssignDialog.value = true;
}
async function confirmAssign(app) {
 if (!selectedPost.value)
 return;
 try {
 await postAPI.assign(selectedPost.value.id, app.id);
 
 if (selectedPost.value.activity_id) {
 await activityAPI.checkExceptions(selectedPost.value.activity_id);
 }
 
 ElMessage.success('分配成功');
 showAssignDialog.value = false;
 loadData();
 }
 catch (error) {
 ElMessage.error('分配失败');
 }
}
async function handleCreatePost() {
 if (!postForm.name || !postForm.activity_id) {
 ElMessage.error('请填写必填项');
 return;
 }
 try {
 const activityId = postForm.activity_id;
 await postAPI.create({
 name: postForm.name,
 activity_id: activityId,
 shift: postForm.shift,
 capacity: postForm.capacity,
 required_skills: postForm.required_skills,
 description: postForm.description
 });
 
 await activityAPI.checkExceptions(activityId);
 
 ElMessage.success('创建成功');
 showCreatePostDialog.value = false;
 postForm.name = '';
 postForm.activity_id = '';
 postForm.shift = '全天';
 postForm.capacity = 1;
 postForm.required_skills = '';
 postForm.description = '';
 loadData();
 }
 catch (error) {
 ElMessage.error('创建失败');
 }
}
onMounted(() => {
 loadData();
});
</script>

<style scoped>
.post-allocation {
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

.allocation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.posts-section, .applicants-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.posts-section h3, .applicants-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
}

.post-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.post-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s;
}

.post-card:hover {
  border-color: #1890ff;
}

.post-card.filled {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.post-name {
  font-weight: bold;
  font-size: 15px;
}

.post-info p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
}

.post-info span {
  color: #999;
}

.post-assignees {
  margin: 10px 0;
}

.post-assignees p {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.assignee-tags {
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

.no-assignee {
  color: #999;
  font-size: 12px;
  font-style: italic;
}

.unfilled-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #fff7e6;
  border-radius: 6px;
  margin-top: 10px;
  color: #fa8c16;
  font-size: 12px;
}

.warning-icon {
  font-size: 14px;
}

.post-actions {
  margin-top: 10px;
  text-align: right;
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

.status-badge.blue {
  background: #e6f4ff;
  color: #1890ff;
}

.status-badge.success {
  background: #e6fffb;
  color: #13c2c2;
}

.status-badge.gray {
  background: #f5f5f5;
  color: #666;
}

.exception-info {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fff2f0;
  border-radius: 6px;
  margin-top: 10px;
  border-left: 4px solid #f5222d;
}

.exception-icon {
  font-size: 16px;
  color: #f5222d;
  flex-shrink: 0;
}

.exception-content {
  flex: 1;
}

.exception-title {
  display: block;
  font-weight: bold;
  color: #f5222d;
  font-size: 13px;
  margin-bottom: 4px;
}

.exception-desc {
  display: block;
  color: #d93026;
  font-size: 12px;
  line-height: 1.4;
}
</style>