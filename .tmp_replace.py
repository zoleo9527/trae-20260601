#!/usr/bin/env python3
# -*- coding: utf-8 -*-

filepath = 'pages/index.vue'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """          <div
            v-for="item in conflictSchedules"
            :key="item.id"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900">{{ item.title }}</span>
              <span class="text-xs text-orange-600 font-medium">冲突</span>
            </div>
            <p class="text-xs text-gray-500">{{ item.date }} {{ item.startTime }}</p>
            <p v-if="item.conflictInfo" class="text-xs text-orange-600 mt-1 line-clamp-1">{{ item.conflictInfo }}</p>
            <div class="flex items-center gap-2 mt-2">
              <button
                v-if="getRelatedFeedbackBySchedule(item.id)"
                @click="handleScheduleClick(item)"
                class="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                查看关联反馈 →
              </button>
              <button
                v-else
                @click="createFeedbackForSchedule(item)"
                class="text-xs text-primary-600 hover:text-primary-700"
              >
                + 创建反馈
              </button>
            </div>
          </div>"""

new_block = """          <div
            v-for="item in conflictSchedules"
            :key="item.id"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900">{{ item.title }}</span>
              <span class="text-xs text-orange-600 font-medium">冲突</span>
            </div>
            <p class="text-xs text-gray-500">{{ item.date }} {{ item.startTime }}</p>
            <p v-if="item.conflictInfo" class="text-xs text-orange-600 mt-1 line-clamp-1">{{ item.conflictInfo }}</p>
            <div class="mt-2">
              <template v-if="getRelatedFeedbackBySchedule(item.id)">
                <!-- 处理摘要 -->
                <div class="bg-white border border-gray-200 rounded-md p-2 space-y-1">
                  <div class="flex items-center gap-2">
                    <span 
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-white"
                      :class="getFeedbackSummary(getRelatedFeedbackBySchedule(item.id))?.statusColor"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-white/80"></span>
                      {{ getFeedbackSummary(getRelatedFeedbackBySchedule(item.id))?.statusLabel }}
                    </span>
                    <span class="text-xs text-gray-600">
                      负责人: {{ getFeedbackSummary(getRelatedFeedbackBySchedule(item.id))?.currentAssignee }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500">
                    最近处理: {{ getFeedbackSummary(getRelatedFeedbackBySchedule(item.id))?.lastAt }}
                  </div>
                  <div v-if="getFeedbackSummary(getRelatedFeedbackBySchedule(item.id))?.lastRemark" 
                       class="text-xs text-gray-600 line-clamp-1">
                    备注: {{ getFeedbackSummary(getRelatedFeedbackBySchedule(item.id))?.lastRemark }}
                  </div>
                  <button
                    @click="handleScheduleClick(item)"
                    class="text-xs text-primary-600 hover:text-primary-700 underline mt-1"
                  >
                    查看关联反馈 →
                  </button>
                </div>
              </template>
              <template v-else>
                <button
                  @click="createFeedbackForSchedule(item)"
                  class="text-xs text-primary-600 hover:text-primary-700"
                >
                  + 创建反馈
                </button>
              </template>
            </div>
          </div>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: 预约冲突卡片 v-for 块替换完成")
else:
    print("ERROR: 未找到匹配的旧代码块")
    if 'v-for="item in conflictSchedules"' in content:
        print("INFO: 找到 v-for 循环，但内容不匹配")
    else:
        print("INFO: 甚至没找到 v-for 循环")
