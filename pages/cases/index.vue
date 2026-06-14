<script setup lang="ts">
import { List, Plus } from 'lucide-vue-next'

const authStore = useAuthStore()
const caseStore = useCaseStore()

const currentUser = computed(() => authStore.currentUser)

onMounted(async () => {
  await caseStore.fetchCases()
})

const cases = computed(() => caseStore.cases)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex flex-between flex-center">
        <div>
          <h1 class="page-title">报案列表</h1>
          <p class="page-subtitle">管理所有理赔报案</p>
        </div>
        <NuxtLink 
          v-if="currentUser?.role === 'CLAIM_AGENT'" 
          to="/cases/new"
          class="btn btn-primary"
        >
          <Plus :size="16" />
          新建报案
        </NuxtLink>
      </div>
    </div>

    <div class="card">
      <div v-if="caseStore.loading" class="loading-state">
        <p>加载中...</p>
      </div>
      <div v-else-if="cases.length === 0" class="empty-state">
        <List :size="48" class="empty-icon" />
        <p>暂无报案记录</p>
        <NuxtLink 
          v-if="currentUser?.role === 'CLAIM_AGENT'" 
          to="/cases/new"
          class="btn btn-primary mt-md"
        >
          创建第一个报案
        </NuxtLink>
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>报案编号</th>
            <th>保单号</th>
            <th>被保险人</th>
            <th>事故经过</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cases" :key="item.id">
            <td>
              <NuxtLink :to="`/cases/${item.id}`" class="link">
                {{ item.reportNo }}
              </NuxtLink>
            </td>
            <td>{{ item.policyNo }}</td>
            <td>{{ item.policyHolder }}</td>
            <td class="text-overflow">{{ item.accidentDesc }}</td>
            <td>
              <CommonStatusBadge :status="item.status" />
            </td>
            <td>{{ new Date(item.createdAt).toLocaleString('zh-CN') }}</td>
            <td>
              <NuxtLink :to="`/cases/${item.id}`" class="btn btn-secondary">
                查看详情
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.loading-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.text-overflow {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
