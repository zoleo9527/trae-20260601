<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
    <div class="bg-white h-full w-full max-w-md shadow-xl flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 class="text-xl font-bold text-gray-900">通知中心</h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ unreadCount }} 条未读通知
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <button v-if="unreadCount > 0" @click="markAllAsRead" class="text-sm text-primary-600 hover:text-primary-800">
            全部已读
          </button>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center h-full">
          <BellIcon class="w-16 h-16 text-gray-300" />
          <p class="text-gray-500 mt-4">暂无通知</p>
        </div>

        <div v-else class="p-4 space-y-6">
          <div v-if="refundNotifications.length > 0">
            <div class="flex items-center space-x-2 mb-3">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h3 class="font-semibold text-gray-900">退票相关</h3>
              <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {{ refundNotifications.filter(n => !n.read).length }} 条未读
              </span>
            </div>
            <div class="space-y-2">
              <div
                v-for="notification in refundNotifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-colors',
                  notification.read ? 'bg-white hover:bg-gray-50 border border-gray-100' : 'bg-orange-50 border border-orange-200'
                ]"
              >
                <div class="flex items-start space-x-2">
                  <div :class="getIconClass(notification.type)" class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationCircleIcon v-if="notification.type === 'alert'" class="w-4 h-4 text-white" />
                    <CheckCircleIcon v-else-if="notification.type === 'success'" class="w-4 h-4 text-white" />
                    <InformationCircleIcon v-else class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <h4 class="font-medium text-gray-900 text-sm">{{ notification.title }}</h4>
                      <span v-if="!notification.read" class="w-2 h-2 bg-primary-600 rounded-full"></span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                    <div class="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <span>{{ formatDateTime(notification.createdAt) }}</span>
                      <span v-if="notification.relatedNo">· {{ notification.relatedNo }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="rescheduleNotifications.length > 0">
            <div class="flex items-center space-x-2 mb-3">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 class="font-semibold text-gray-900">改期相关</h3>
              <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {{ rescheduleNotifications.filter(n => !n.read).length }} 条未读
              </span>
            </div>
            <div class="space-y-2">
              <div
                v-for="notification in rescheduleNotifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-colors',
                  notification.read ? 'bg-white hover:bg-gray-50 border border-gray-100' : 'bg-blue-50 border border-blue-200'
                ]"
              >
                <div class="flex items-start space-x-2">
                  <div :class="getIconClass(notification.type)" class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationCircleIcon v-if="notification.type === 'alert'" class="w-4 h-4 text-white" />
                    <CheckCircleIcon v-else-if="notification.type === 'success'" class="w-4 h-4 text-white" />
                    <InformationCircleIcon v-else class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <h4 class="font-medium text-gray-900 text-sm">{{ notification.title }}</h4>
                      <span v-if="!notification.read" class="w-2 h-2 bg-primary-600 rounded-full"></span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                    <div class="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <span>{{ formatDateTime(notification.createdAt) }}</span>
                      <span v-if="notification.relatedNo">· {{ notification.relatedNo }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="complaintNotifications.length > 0">
            <div class="flex items-center space-x-2 mb-3">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <h3 class="font-semibold text-gray-900">投诉相关</h3>
              <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {{ complaintNotifications.filter(n => !n.read).length }} 条未读
              </span>
            </div>
            <div class="space-y-2">
              <div
                v-for="notification in complaintNotifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-colors',
                  notification.read ? 'bg-white hover:bg-gray-50 border border-gray-100' : 'bg-red-50 border border-red-200'
                ]"
              >
                <div class="flex items-start space-x-2">
                  <div :class="getIconClass(notification.type)" class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationCircleIcon v-if="notification.type === 'alert'" class="w-4 h-4 text-white" />
                    <CheckCircleIcon v-else-if="notification.type === 'success'" class="w-4 h-4 text-white" />
                    <InformationCircleIcon v-else class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <h4 class="font-medium text-gray-900 text-sm">{{ notification.title }}</h4>
                      <span v-if="!notification.read" class="w-2 h-2 bg-primary-600 rounded-full"></span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                    <div class="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <span>{{ formatDateTime(notification.createdAt) }}</span>
                      <span v-if="notification.relatedNo">· {{ notification.relatedNo }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="otherNotifications.length > 0">
            <div class="flex items-center space-x-2 mb-3">
              <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
              <h3 class="font-semibold text-gray-900">其他通知</h3>
            </div>
            <div class="space-y-2">
              <div
                v-for="notification in otherNotifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-colors',
                  notification.read ? 'bg-white hover:bg-gray-50 border border-gray-100' : 'bg-gray-50 border border-gray-200'
                ]"
              >
                <div class="flex items-start space-x-2">
                  <div :class="getIconClass(notification.type)" class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationCircleIcon v-if="notification.type === 'alert'" class="w-4 h-4 text-white" />
                    <CheckCircleIcon v-else-if="notification.type === 'success'" class="w-4 h-4 text-white" />
                    <InformationCircleIcon v-else class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <h4 class="font-medium text-gray-900 text-sm">{{ notification.title }}</h4>
                      <span v-if="!notification.read" class="w-2 h-2 bg-primary-600 rounded-full"></span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                    <div class="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <span>{{ formatDateTime(notification.createdAt) }}</span>
                      <span v-if="notification.relatedNo">· {{ notification.relatedNo }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <button class="btn-secondary text-sm w-full" @click="handleExport">
          <ArrowDownTrayIcon class="w-4 h-4 inline mr-1" />
          导出通知记录 (模拟)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { ref, computed } from 'vue';
import { XMarkIcon, BellIcon, ExclamationCircleIcon, CheckCircleIcon, InformationCircleIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
export interface Notification {
 id: string;
 type: 'alert' | 'success' | 'info';
 title: string;
 message: string;
 relatedNo?: string;
 read: boolean;
 createdAt: string;
}
const props = defineProps<{
 notifications: Notification[];
}>();
const emit = defineEmits<{
 close: [
 ];
 update: [
 ];
 navigate: [
 taskId: string,
 type: string
 ];
}>();
const unreadCount = computed(() => props.notifications.filter(n => !n.read).length);

const refundNotifications = computed(() => {
  return props.notifications.filter(n => {
    if (n.relatedNo?.startsWith('RT')) return true;
    if (n.relatedNo?.startsWith('TK') && n.title.includes('退票')) return true;
    if (!n.relatedNo && n.title.includes('退票')) return true;
    return false;
  }).sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
});

const rescheduleNotifications = computed(() => {
  return props.notifications.filter(n => {
    if (n.relatedNo?.startsWith('TK') && n.title.includes('改期')) return true;
    if (!n.relatedNo && n.title.includes('改期')) return true;
    return false;
  }).sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
});

const complaintNotifications = computed(() => {
  return props.notifications.filter(n => {
    if (n.relatedNo?.startsWith('CT')) return true;
    if (!n.relatedNo && n.title.includes('投诉')) return true;
    return false;
  }).sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
});

const otherNotifications = computed(() => {
  return props.notifications.filter(n => {
    if (n.relatedNo?.startsWith('CT') || n.relatedNo?.startsWith('RT')) return false;
    if (n.relatedNo?.startsWith('TK') && (n.title.includes('退票') || n.title.includes('改期'))) return false;
    if (!n.relatedNo && (n.title.includes('退票') || n.title.includes('改期') || n.title.includes('投诉'))) return false;
    return true;
  }).sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));
});

function getIconClass(type: string) {
 const classMap: Record<string, string> = {
 alert: 'bg-red-600',
 success: 'bg-green-600',
 info: 'bg-blue-600'
 };
 return classMap[type] || 'bg-gray-600';
}
function formatDateTime(dateStr: string) {
 if (!dateStr)
 return '-';
 const date = new Date(dateStr);
 const now = new Date();
 const diff = now.getTime() - date.getTime();
 const minutes = Math.floor(diff / 60000);
 const hours = Math.floor(diff / 3600000);
 const days = Math.floor(diff / 86400000);
 if (minutes < 1)
 return '刚刚';
 if (minutes < 60)
 return `${minutes}分钟前`;
 if (hours < 24)
 return `${hours}小时前`;
 if (days < 7)
 return `${days}天前`;
 return dateStr.slice(0, 10);
}
function markAllAsRead() {
 props.notifications.forEach(n => n.read = true);
 emit('update');
}
function handleNotificationClick(notification: Notification) {
 notification.read = true;
 emit('update');
 if (notification.relatedNo) {
 let taskType = 'refund';
 if (notification.relatedNo.startsWith('CT')) {
 taskType = 'complaint';
 } else if (notification.relatedNo.startsWith('RT')) {
 taskType = 'refund';
 } else if (notification.relatedNo.startsWith('TK')) {
 if (notification.title.includes('改期')) {
 taskType = 'reschedule';
 } else if (notification.title.includes('退票')) {
 taskType = 'refund';
 }
 }
 emit('navigate', notification.relatedNo, taskType);
 }
}
function handleExport() {
 alert('导出功能为模拟实现,实际将导出通知记录');
}
</script>