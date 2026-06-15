<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const emit = defineEmits<{
  navigate: [page: string]
}>()

const { currentUser, roleName, logout, getAvailableRoles, switchRole } = useAuth()
const showRoleMenu = ref(false)
const showSimulatedInfo = ref(false)

const menuItems = [
  { key: 'dashboard', label: '待办中心', icon: '📋' },
  { key: 'appointments', label: '预约处理', icon: '📅' },
  { key: 'inventory', label: '物品清单', icon: '📦' },
  { key: 'exceptions', label: '异常处理', icon: '⚠️' }
]

const handleLogout = () => {
  logout()
  showRoleMenu.value = false
}

const handleSwitchRole = (role: string) => {
  switchRole(role as any)
  showRoleMenu.value = false
}

const handleNavigate = (key: string) => {
  emit('navigate', key)
}
</script>

<template>
  <div style="min-height: 100vh; background-color: #f5f7fa;">
    <header class="layout-header">
      <div class="layout-title">搬家公司管理工具</div>
      <div class="layout-user">
        <div class="layout-user-role">
          当前角色：<strong>{{ roleName }}</strong>（{{ currentUser?.name }}）
        </div>
        <div class="layout-user-actions">
          <button class="btn btn-secondary" @click="showSimulatedInfo = true">
            📖 功能说明
          </button>
          <div class="btn btn-secondary" style="position: relative;" @click="showRoleMenu = !showRoleMenu">
            切换角色
            <div 
              v-if="showRoleMenu" 
              style="position: absolute; right: 0; top: 100%; margin-top: 8px; background: white; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px; min-width: 160px; z-index: 100;"
            >
              <div 
                v-for="role in getAvailableRoles()" 
                :key="role.id"
                @click="handleSwitchRole(role.role)"
                style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background-color 0.2s;"
                :class="{ 'bg-blue-50': currentUser?.role === role.role }"
              >
                <div style="font-weight: 500;">{{ role.name }}</div>
                <div style="font-size: 12px; color: #999;">{{ role.roleName }}</div>
              </div>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e8e8e8;" />
              <div 
                @click="handleLogout" 
                style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background-color 0.2s; color: #f5222d;"
              >
                退出登录
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <div class="flex" style="min-height: calc(100vh - 65px);">
      <aside class="sidebar">
        <div 
          v-for="item in menuItems" 
          :key="item.key"
          @click="handleNavigate(item.key)"
          class="sidebar-item"
        >
          <span>{{ item.icon }}</span>
          {{ item.label }}
        </div>
      </aside>
      
      <main class="flex-1" style="padding: 20px;">
        <slot />
      </main>
    </div>
    
    <div v-if="showSimulatedInfo" class="drawer-mask" @click.self="showSimulatedInfo = false">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-title">📖 功能说明</div>
          <div class="drawer-close" @click="showSimulatedInfo = false">✕</div>
        </div>
        <div class="drawer-body">
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px; color: #52c41a;">✅ 已实现功能</h3>
            <ul style="padding-left: 20px; line-height: 1.8;">
              <li>角色切换（调度员、搬运组长、客服）</li>
              <li>待办中心 - 各角色专属待办事项</li>
              <li>预约处理 - 确认/取消预约，查看详情</li>
              <li>物品清单 - 查看、编辑物品结论</li>
              <li>异常处理 - 新增、处理临时加价/物品破损/车辆迟到</li>
              <li>数据通过 Nitro API 读写服务端</li>
            </ul>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px; color: #faad14;">⚠️ 模拟实现功能</h3>
            <div style="background-color: #fff7e6; padding: 16px; border-radius: 8px; border-left: 4px solid #faad14;">
              <p style="margin-bottom: 12px; font-weight: 500;">以下功能为模拟展示，实际使用需集成后端服务：</p>
              <ul style="padding-left: 20px; line-height: 1.8;">
                <li><strong>导出功能</strong> - 导出预约单、物品清单为 PDF/Excel 格式（需集成文件生成服务）</li>
                <li><strong>附件上传</strong> - 物损照片上传、合同附件存储（需集成云存储服务如 OSS/S3）</li>
                <li><strong>消息通知</strong> - 短信/微信通知客户和员工（需集成短信网关和微信 API）</li>
                <li><strong>车辆排班</strong> - 车辆调度和司机分配（需对接车辆管理系统）</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 style="margin-bottom: 12px; color: #4080ff;">💡 使用提示</h3>
            <ul style="padding-left: 20px; line-height: 1.8;">
              <li>点击待办事项可跳转到对应预约或异常记录</li>
              <li>数据存储在服务端内存中，重启服务后数据会重置</li>
              <li>切换角色后可体验不同角色的待办视角</li>
            </ul>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn btn-primary" @click="showSimulatedInfo = false">知道了</button>
        </div>
      </div>
    </div>
  </div>
</template>