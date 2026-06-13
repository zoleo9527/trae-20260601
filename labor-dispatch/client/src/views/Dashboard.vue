<template>
  <div class="layout-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>人力派遣公司管理系统</h2>
          <div class="header-right">
            <span>欢迎，{{ user.name }}</span>
            <el-tag size="small">{{ user.role }}</el-tag>
            <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
          </div>
        </div>
      </el-header>

      <el-container>
        <el-aside width="200px">
          <el-menu
            :default-active="$route.path"
            router
          >
            <el-menu-item index="/dashboard">
              <el-icon><House /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/labor-demands">
              <el-icon><Briefcase /></el-icon>
              <span>用工需求</span>
            </el-menu-item>
            <el-menu-item index="/candidates">
              <el-icon><User /></el-icon>
              <span>候选人</span>
            </el-menu-item>
            <el-menu-item index="/matchings">
              <el-icon><Connection /></el-icon>
              <span>匹配记录</span>
            </el-menu-item>
            <el-menu-item index="/return-records">
              <el-icon><Refresh /></el-icon>
              <span>退回/补录/复核</span>
            </el-menu-item>
            <el-menu-item index="/status-histories">
              <el-icon><Clock /></el-icon>
              <span>状态历史</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main>
          <div class="page-container">
            <h1>工作台</h1>

            <el-row :gutter="20" style="margin-bottom: 20px">
              <el-col :span="6">
                <el-card>
                  <template #header>
                    <div class="stat-header">
                      <span>用工需求</span>
                      <el-icon><Briefcase /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.laborDemand?.total || 0 }}</div>
                    <div class="stat-detail">
                      <span>待处理：{{ stats.laborDemand?.byStatus?.待处理 || 0 }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card>
                  <template #header>
                    <div class="stat-header">
                      <span>候选人</span>
                      <el-icon><User /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.candidate?.total || 0 }}</div>
                    <div class="stat-detail">
                      <span>待匹配：{{ stats.candidate?.byStatus?.待匹配 || 0 }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card>
                  <template #header>
                    <div class="stat-header">
                      <span>匹配记录</span>
                      <el-icon><Connection /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.matching?.total || 0 }}</div>
                    <div class="stat-detail">
                      <span>待确认：{{ stats.matching?.byStatus?.待确认 || 0 }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card>
                  <template #header>
                    <div class="stat-header">
                      <span>异常处理</span>
                      <el-icon><Warning /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.returnRecord?.total || 0 }}</div>
                    <div class="stat-detail">
                      <span>本周退回/补录/复核</span>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>待办事项</span>
                    </div>
                  </template>

                  <el-tabs v-model="activeTab">
                    <el-tab-pane label="用工需求" name="demands">
                      <el-empty v-if="todoList.pendingDemands?.length === 0" description="暂无待处理" />
                      <el-list v-else>
                        <el-list-item v-for="item in todoList.pendingDemands" :key="item.id">
                          <el-link type="primary" @click="$router.push(`/labor-demands/${item.id}`)">
                            {{ item.demandNumber }}
                          </el-link>
                          <span style="margin-left: 10px">{{ item.companyName }} - {{ item.position }}</span>
                        </el-list-item>
                      </el-list>
                    </el-tab-pane>

                    <el-tab-pane label="匹配待确认" name="matchings">
                      <el-empty v-if="todoList.pendingMatchings?.length === 0" description="暂无待确认" />
                      <el-list v-else>
                        <el-list-item v-for="item in todoList.pendingMatchings" :key="item.id">
                          <el-link type="primary" @click="$router.push(`/matchings/${item.id}`)">
                            {{ item.laborDemand?.companyName }} - {{ item.candidate?.name }}
                          </el-link>
                        </el-list-item>
                      </el-list>
                    </el-tab-pane>

                    <el-tab-pane label="异常处理" name="returns">
                      <el-empty v-if="todoList.pendingReturns?.length === 0" description="暂无待处理" />
                      <el-list v-else>
                        <el-list-item v-for="item in todoList.pendingReturns" :key="item.id">
                          <el-tag size="small" type="warning">{{ item.returnType }}</el-tag>
                          <span style="margin-left: 10px">{{ item.returnReason }}</span>
                        </el-list-item>
                      </el-list>
                    </el-tab-pane>
                  </el-tabs>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>最近活动</span>
                    </div>
                  </template>

                  <el-timeline>
                    <el-timeline-item
                      v-for="activity in stats.recentActivity"
                      :key="activity.id"
                      :timestamp="formatTime(activity.createdAt)"
                      placement="top"
                    >
                      <el-card>
                        <p>
                          <el-tag size="small">{{ activity.actionType }}</el-tag>
                          <span style="margin-left: 10px">{{ activity.newStatus }}</span>
                        </p>
                        <p style="margin-top: 5px; color: #666">
                          操作人：{{ activity.operator?.name }} ({{ activity.operator?.role }})
                        </p>
                        <p v-if="activity.remark" style="margin-top: 5px; color: #999">
                          {{ activity.remark }}
                        </p>
                      </el-card>
                    </el-timeline-item>
                  </el-timeline>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const user = ref({})
    const stats = ref({})
    const todoList = ref({})
    const activeTab = ref('demands')

    onMounted(async () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        user.value = JSON.parse(userStr)
      }

      await loadStats()
      await loadTodoList()
    })

    const loadStats = async () => {
      try {
        stats.value = await api.dashboard.getStats()
      } catch (error) {
        ElMessage.error('加载统计数据失败')
      }
    }

    const loadTodoList = async () => {
      try {
        todoList.value = await api.dashboard.getTodoList({ role: user.value.role })
      } catch (error) {
        ElMessage.error('加载待办列表失败')
      }
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    const handleLogout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }

    return {
      user,
      stats,
      todoList,
      activeTab,
      formatTime,
      handleLogout
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.el-aside {
  background: #fff;
  border-right: 1px solid #e4e7ed;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-content {
  padding: 10px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.stat-detail {
  margin-top: 5px;
  font-size: 14px;
  color: #666;
}
</style>
