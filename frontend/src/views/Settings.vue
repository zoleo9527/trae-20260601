<template>
  <div class="settings-page">
    <div class="card">
      <div class="card-header">
        <h3>数据管理</h3>
      </div>
      <div class="card-body">
        <div class="reset-section">
          <div class="reset-warning">
            <el-icon :size="32" class="warning-icon"><WarningFilled /></el-icon>
            <div class="warning-content">
              <h4>危险操作</h4>
              <p>重置系统将删除所有钥匙、学生、借还记录和操作日志数据。此操作不可撤销，请谨慎操作。</p>
            </div>
          </div>
          <div class="reset-action">
            <el-button type="danger" @click="handleReset" :loading="resetting">
              <el-icon><RefreshRight /></el-icon>
              重置系统数据
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>系统信息</h3>
      </div>
      <div class="card-body">
        <div class="info-list">
          <div class="info-item">
            <span class="label">系统名称</span>
            <span class="value">宿舍钥匙管理系统</span>
          </div>
          <div class="info-item">
            <span class="label">版本号</span>
            <span class="value">v1.0.0</span>
          </div>
          <div class="info-item">
            <span class="label">当前用户</span>
            <span class="value">{{ userStore.user?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">用户角色</span>
            <span class="value">{{ roleLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resetSystem } from '@/api'
import { WarningFilled, RefreshRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { User } from '@/types'

const userStore = useUserStore()

const resetting = ref(false)

const roleLabel = computed(() => {
  const labels: Record<User['role'], string> = {
    dorm_manager: '宿管员',
    counselor: '辅导员',
    maintenance: '维修人员'
  }
  return userStore.user ? labels[userStore.user.role] : ''
})

const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置系统吗？此操作将删除所有数据且不可恢复！',
      '危险操作确认',
      {
        confirmButtonText: '确认重置',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
        closeOnClickModal: false
      }
    )
  } catch {
    return
  }

  try {
    await ElMessageBox.prompt(
      '请输入 "RESET" 以确认操作',
      '二次验证',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPattern: /^RESET$/,
        inputErrorMessage: '输入不正确，请输入 "RESET"'
      }
    )
  } catch {
    return
  }

  resetting.value = true
  try {
    await resetSystem()
    ElMessage.success('系统已重置')
  } catch (e) {
    console.error('重置失败', e)
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.card-body {
  padding: 20px;
}

.reset-section {
  border: 1px solid #fee2e2;
  border-radius: 8px;
  padding: 20px;
  background: #fef2f2;
}

.reset-warning {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.warning-icon {
  color: #ef4444;
  flex-shrink: 0;
}

.warning-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.warning-content p {
  margin: 0;
  font-size: 14px;
  color: #b91c1c;
  line-height: 1.6;
}

.reset-action {
  display: flex;
  justify-content: flex-end;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #64748b;
  font-size: 14px;
}

.info-item .value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
}
</style>
