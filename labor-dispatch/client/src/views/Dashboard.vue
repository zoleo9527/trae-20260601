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
                <el-card shadow="hover" class="stat-card" @click="$router.push('/labor-demands?status=待处理')">
                  <template #header>
                    <div class="stat-header">
                      <span>用工需求</span>
                      <el-icon><Briefcase /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.laborDemand?.total || 0 }}</div>
                    <div class="stat-detail">
                      <el-tag size="small" type="info">待处理：{{ stats.laborDemand?.byStatus?.待处理 || 0 }}</el-tag>
                      <el-tag size="small" type="warning">匹配中：{{ stats.laborDemand?.byStatus?.匹配中 || 0 }}</el-tag>
                      <el-tag size="small" type="success">已完成：{{ stats.laborDemand?.byStatus?.已完成 || 0 }}</el-tag>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card shadow="hover" class="stat-card" @click="$router.push('/candidates?status=待匹配')">
                  <template #header>
                    <div class="stat-header">
                      <span>候选人</span>
                      <el-icon><User /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.candidate?.total || 0 }}</div>
                    <div class="stat-detail">
                      <el-tag size="small" type="info">待匹配：{{ stats.candidate?.byStatus?.待匹配 || 0 }}</el-tag>
                      <el-tag size="small" type="warning">匹配中：{{ stats.candidate?.byStatus?.匹配中 || 0 }}</el-tag>
                      <el-tag size="small" type="success">已入职：{{ stats.candidate?.byStatus?.已入职 || 0 }}</el-tag>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card shadow="hover" class="stat-card" @click="$router.push('/matchings?status=待确认')">
                  <template #header>
                    <div class="stat-header">
                      <span>匹配记录</span>
                      <el-icon><Connection /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.matching?.total || 0 }}</div>
                    <div class="stat-detail">
                      <el-tag size="small" type="warning">待确认：{{ stats.matching?.byStatus?.待确认 || 0 }}</el-tag>
                      <el-tag size="small" type="primary">面试中：{{ stats.matching?.byStatus?.面试中 || 0 }}</el-tag>
                      <el-tag size="small" type="success">已入职：{{ stats.matching?.byStatus?.已入职 || 0 }}</el-tag>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card shadow="hover" class="stat-card" @click="$router.push('/return-records?status=待处理')">
                  <template #header>
                    <div class="stat-header">
                      <span>异常处理</span>
                      <el-icon><Warning /></el-icon>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-number">{{ stats.returnRecord?.total || 0 }}</div>
                    <div class="stat-detail">
                      <el-tag size="small" type="danger">退回：{{ stats.returnRecord?.byType?.退回 || 0 }}</el-tag>
                      <el-tag size="small" type="warning">补录：{{ stats.returnRecord?.byType?.补录 || 0 }}</el-tag>
                      <el-tag size="small" type="primary">复核：{{ stats.returnRecord?.byType?.复核 || 0 }}</el-tag>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="16">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>待办事项</span>
                      <el-button type="primary" size="small" @click="refreshTodoList">刷新</el-button>
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
                          <el-tag size="small" type="info" style="margin-left: 10px">{{ item.status }}</el-tag>
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
                          <el-tag size="small" type="warning" style="margin-left: 10px">
                            {{ item.matchType }}
                          </el-tag>
                        </el-list-item>
                      </el-list>
                    </el-tab-pane>

                    <el-tab-pane label="待处理异常" name="returns">
                      <el-empty v-if="todoList.pendingReturns?.length === 0" description="暂无待处理" />
                      <el-list v-else>
                        <el-list-item v-for="item in todoList.pendingReturns" :key="item.id">
                          <el-tag size="small" :type="getReturnTypeTag(item.returnType)">
                            {{ item.returnType }}
                          </el-tag>
                          <span style="margin-left: 10px">{{ item.returnReason }}</span>
                          <el-button type="primary" link size="small" style="margin-left: 10px" @click="goToReturnRecord(item.id)">
                            一线处理
                          </el-button>
                        </el-list-item>
                      </el-list>
                    </el-tab-pane>

                    <el-tab-pane v-if="user.role === '管理'" label="待复核" name="pendingReview">
                      <el-empty v-if="todoList.pendingReview?.length === 0" description="暂无待复核" />
                      <el-list v-else>
                        <el-list-item v-for="item in todoList.pendingReview" :key="item.id">
                          <el-link type="primary" @click="$router.push(`/matchings/${item.id}`)">
                            {{ item.laborDemand?.companyName }} - {{ item.candidate?.name }}
                          </el-link>
                          <el-tag size="small" type="success" style="margin-left: 10px">
                            {{ item.status }}
                          </el-tag>
                          <el-button type="warning" link size="small" style="margin-left: 10px" @click="goToReturnRecord(item.returnRecordId)">
                            复核
                          </el-button>
                        </el-list-item>
                      </el-list>
                    </el-tab-pane>

                    <el-tab-pane v-if="user.role === '管理'" label="已处理待确认" name="processedRecords">
                      <el-empty v-if="todoList.processedRecords?.length === 0" description="暂无已处理待确认" />
                      <el-list v-else>
                        <el-list-item v-for="item in todoList.processedRecords" :key="item.id">
                          <el-tag size="small" :type="getReturnTypeTag(item.returnType)">
                            {{ item.returnType }}
                          </el-tag>
                          <span style="margin-left: 10px">{{ item.returnReason }}</span>
                          <el-tag size="small" type="success" style="margin-left: 10px">
                            已处理
                          </el-tag>
                          <el-button type="warning" link size="small" style="margin-left: 10px" @click="goToReturnRecord(item.id)">
                            复核
                          </el-button>
                        </el-list-item>
                      </el-list>
                    </el-tab-pane>
                  </el-tabs>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>最近活动</span>
                      <el-button type="primary" link size="small" @click="$router.push('/status-histories')">
                        查看全部
                      </el-button>
                    </div>
                  </template>

                  <el-timeline>
                    <el-timeline-item
                      v-for="activity in stats.recentActivity"
                      :key="activity.id"
                      :timestamp="formatTime(activity.createdAt)"
                      placement="top"
                    >
                      <el-card shadow="hover">
                        <p>
                          <el-tag size="small" :type="getActionTypeTag(activity.actionType)">
                            {{ activity.actionType }}
                          </el-tag>
                          <span style="margin-left: 10px">{{ activity.newStatus }}</span>
                        </p>
                        <p style="margin-top: 5px; color: #666; font-size: 13px">
                          {{ activity.operator?.name }}
                          <el-tag size="small" style="margin-left: 5px">
                            {{ activity.operator?.role }}
                          </el-tag>
                        </p>
                        <p v-if="activity.remark" style="margin-top: 5px; color: #999; font-size: 12px">
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

        if (user.value.role === '管理') {
          const reviewResult = await api.matchings.list({
            status: '已处理',
            pageSize: 5
          })
          todoList.value.pendingReview = reviewResult.data

          const processedResult = await api.returnRecords.list({
            status: '已处理',
            pageSize: 5
          })
          todoList.value.processedRecords = processedResult.data
        }
      } catch (error) {
        ElMessage.error('加载待办列表失败')
      }
    }

    const refreshTodoList = () => {
      loadTodoList()
      loadStats()
      ElMessage.success('已刷新')
    }

    const goToMatching = (item) => {
      if (item.matchingRecordId) {
        router.push(`/matchings/${item.matchingRecordId}`)
      }
    }

    const goToReturnRecord = (id) => {
      router.push(`/return-records`)
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    const getReturnTypeTag = (type) => {
      const types = {
        '退回': 'danger',
        '补录': 'warning',
        '复核': 'primary'
      }
      return types[type] || 'info'
    }

    const getActionTypeTag = (type) => {
      const types = {
        '创建': 'primary',
        '更新': 'info',
        '状态更新': 'warning',
        '退回': 'danger',
        '补录': 'warning',
        '复核': 'primary',
        '确认': 'success',
        '批量确认': 'success',
        '批量退回': 'danger',
        '一线处理': 'success',
        '重新处理': 'info'
      }
      return types[type] || 'info'
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
      refreshTodoList,
      goToMatching,
      goToReturnRecord,
      getReturnTypeTag,
      getActionTypeTag,
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

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
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
  margin-bottom: 10px;
}

.stat-detail {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>