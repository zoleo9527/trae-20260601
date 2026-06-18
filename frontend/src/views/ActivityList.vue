<template>
  <div class="activity-list">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="content-wrapper">
        <div class="toolbar">
          <el-input v-model="searchQuery" placeholder="搜索活动名称" class="search-input" />
          <el-select v-model="statusFilter" placeholder="状态筛选">
            <el-option label="全部" value="" />
            <el-option label="已发布" value="published" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-button type="primary" @click="showCreateDialog = true">创建活动</el-button>
        </div>
        
        <el-table :data="activities" border>
          <el-table-column prop="title" label="活动名称" />
          <el-table-column prop="location" label="地点" />
          <el-table-column prop="start_time" label="开始时间" :formatter="formatDateTime" />
          <el-table-column prop="end_time" label="结束时间" :formatter="formatDateTime" />
          <el-table-column prop="duration" label="时长(小时)" />
          <el-table-column prop="max_participants" label="名额" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <span :class="['status-badge', getStatusClass(scope.row.status)]">{{ getStatusText(scope.row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="goToDetail(scope.row.id)">详情</el-button>
              <el-button size="small" @click="handleCancel(scope.row)" v-if="scope.row.status !== 'cancelled'">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <el-dialog title="创建活动" :visible.sync="showCreateDialog" width="500px">
      <el-form ref="createForm" :model="form" label-width="80px">
        <el-form-item label="活动名称" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="活动地点">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker v-model="form.start_time" type="datetime" />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker v-model="form.end_time" type="datetime" />
        </el-form-item>
        <el-form-item label="最大名额">
          <el-input v-model.number="form.max_participants" type="number" />
        </el-form-item>
        <el-form-item label="所需技能">
          <el-input v-model="form.required_skills" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-textarea v-model="form.description" rows="3" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
import Header from '../components/Header.vue';
import { activityAPI } from '../api';
import { ElMessage } from 'element-plus';
const router = useRouter();
const searchQuery = ref('');
const statusFilter = ref('');
const showCreateDialog = ref(false);
const activities = ref([]);
const form = reactive({
 title: '',
 location: '',
 start_time: null,
 end_time: null,
 max_participants: null,
 required_skills: '',
 description: ''
});
async function loadActivities() {
 const params = {};
 if (statusFilter.value)
 params.status = statusFilter.value;
 const response = await activityAPI.list(params);
 activities.value = response.data.filter(act => {
 if (!searchQuery.value)
 return true;
 return act.title.toLowerCase().includes(searchQuery.value.toLowerCase());
 });
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
function goToDetail(id) {
 router.push(`/activities/${id}`);
}
async function handleCreate() {
 if (!form.title || !form.start_time || !form.end_time) {
 ElMessage.error('请填写必填项');
 return;
 }
 try {
 await activityAPI.create({
 title: form.title,
 location: form.location,
 start_time: new Date(form.start_time).toISOString(),
 end_time: new Date(form.end_time).toISOString(),
 max_participants: form.max_participants,
 required_skills: form.required_skills,
 description: form.description,
 organizer_id: 1
 });
 ElMessage.success('创建成功');
 showCreateDialog.value = false;
 form.title = '';
 form.location = '';
 form.start_time = null;
 form.end_time = null;
 form.max_participants = null;
 form.required_skills = '';
 form.description = '';
 loadActivities();
 }
 catch (error) {
 ElMessage.error('创建失败');
 }
}
async function handleCancel(row) {
 try {
 await activityAPI.update(row.id, {
 status: 'cancelled',
 cancelled_reason: '管理员取消'
 });
 ElMessage.success('活动已取消');
 loadActivities();
 }
 catch (error) {
 ElMessage.error('取消失败');
 }
}
onMounted(() => {
 loadActivities();
});
</script>

<style scoped>
.activity-list {
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
  align-items: center;
}

.search-input {
  width: 250px;
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