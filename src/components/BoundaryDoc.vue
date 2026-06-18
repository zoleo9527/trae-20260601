<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">交付边界说明</h1>
      <p class="text-gray-500 mt-2">社区志愿服务站-重点对象回访与问题上报系统</p>
    </div>
    
    <div class="space-y-6">
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-blue-600 px-6 py-4">
          <h2 class="text-lg font-semibold text-white">1. 系统概述</h2>
        </div>
        <div class="p-6">
          <p class="text-gray-700 leading-relaxed">
            本系统是社区志愿服务站的重点对象回访与问题上报管理系统，旨在帮助站点社工、志愿队长和社区干部高效管理重点对象的回访工作，并及时处理回访过程中发现的问题。
          </p>
        </div>
      </div>
      
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-green-600 px-6 py-4">
          <h2 class="text-lg font-semibold text-white">2. 已实现功能</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-blue-50 rounded-lg p-4">
              <h3 class="font-medium text-blue-900 mb-2">站点社工功能</h3>
              <ul class="space-y-1 text-sm text-blue-700">
                <li>• 创建回访任务</li>
                <li>• 执行回访记录</li>
                <li>• 完成回访任务</li>
                <li>• 上报问题</li>
                <li>• 标记回访卡住</li>
              </ul>
            </div>
            <div class="bg-yellow-50 rounded-lg p-4">
              <h3 class="font-medium text-yellow-900 mb-2">志愿队长功能</h3>
              <ul class="space-y-1 text-sm text-yellow-700">
                <li>• 查看问题列表</li>
                <li>• 处理待办问题</li>
                <li>• 升级问题上报</li>
                <li>• 查看回访记录</li>
                <li>• 责任流转追溯</li>
              </ul>
            </div>
            <div class="bg-red-50 rounded-lg p-4">
              <h3 class="font-medium text-red-900 mb-2">社区干部功能</h3>
              <ul class="space-y-1 text-sm text-red-700">
                <li>• 处理异常问题</li>
                <li>• 协调卡住回访</li>
                <li>• 查看统计报表</li>
                <li>• 系统监控总览</li>
                <li>• 角色权限管理</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-orange-600 px-6 py-4">
          <h2 class="text-lg font-semibold text-white">3. 未接入外部系统说明</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div class="border-l-4 border-orange-400 bg-orange-50 pl-4 py-3">
              <h3 class="font-medium text-orange-900">3.1 民政信息系统</h3>
              <p class="text-sm text-orange-700 mt-1">
                当前系统未与民政部门的重点对象信息系统对接。重点对象数据需手动录入，包括姓名、年龄、地址、联系方式、关怀等级等信息。
              </p>
            </div>
            
            <div class="border-l-4 border-orange-400 bg-orange-50 pl-4 py-3">
              <h3 class="font-medium text-orange-900">3.2 网格化管理平台</h3>
              <p class="text-sm text-orange-700 mt-1">
                当前系统未接入社区网格化管理平台。回访任务分配需人工进行，无法自动根据网格区域进行任务分发和调度。
              </p>
            </div>
            
            <div class="border-l-4 border-orange-400 bg-orange-50 pl-4 py-3">
              <h3 class="font-medium text-orange-900">3.3 短信/通知平台</h3>
              <p class="text-sm text-orange-700 mt-1">
                当前系统未集成短信或推送通知平台。回访提醒、问题处理通知等需通过人工方式进行沟通和告知。
              </p>
            </div>
            
            <div class="border-l-4 border-orange-400 bg-orange-50 pl-4 py-3">
              <h3 class="font-medium text-orange-900">3.4 电子签章系统</h3>
              <p class="text-sm text-orange-700 mt-1">
                当前系统未接入电子签章系统。回访记录的确认和问题处理的审批需线下签字确认，无法进行线上电子签名。
              </p>
            </div>
            
            <div class="border-l-4 border-orange-400 bg-orange-50 pl-4 py-3">
              <h3 class="font-medium text-orange-900">3.5 数据上报接口</h3>
              <p class="text-sm text-orange-700 mt-1">
                当前系统未与上级管理部门的数据上报接口对接。统计报表数据需人工导出并手动上报。
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-purple-600 px-6 py-4">
          <h2 class="text-lg font-semibold text-white">4. 交付边界</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium text-purple-900 mb-3">✅ 系统交付范围</h3>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">完整的前端界面和交互逻辑</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">本地存储数据持久化方案</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">角色权限控制机制</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">责任流转追溯功能</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">异常处理和问题升级流程</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="font-medium text-purple-900 mb-3">❌ 非交付范围</h3>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <XCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">与外部系统的接口开发</span>
                </li>
                <li class="flex items-start gap-2">
                  <XCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">短信/推送通知服务</span>
                </li>
                <li class="flex items-start gap-2">
                  <XCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">电子签章集成</span>
                </li>
                <li class="flex items-start gap-2">
                  <XCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">真实数据库部署</span>
                </li>
                <li class="flex items-start gap-2">
                  <XCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-700">云端服务器部署</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-600 px-6 py-4">
          <h2 class="text-lg font-semibold text-white">5. 部署与运行说明</h2>
        </div>
        <div class="p-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <pre class="text-sm text-gray-700 font-mono overflow-x-auto"><code># 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview</code></pre>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            系统采用 localStorage 进行本地数据持久化，无需配置数据库。首次运行时会自动初始化模拟数据。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle } from 'lucide-vue-next'
</script>
