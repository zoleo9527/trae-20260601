'use client';

import { useState } from 'react';

interface SystemInfoProps {}

interface InfoSection {
  id: string;
  title: string;
  icon: string;
  items: { label: string; description: string }[];
}

const infoSections: InfoSection[] = [
  {
    id: 'permissions',
    title: '权限简化说明',
    icon: '🔐',
    items: [
      {
        label: '案场经理',
        description:
          '全功能权限，可查看所有数据、处理异常、审批流程、监督各角色工作负荷。实际系统中需对接企业组织架构和权限中心。',
      },
      {
        label: '置业顾问',
        description:
          '仅可查看和处理自己负责的客户、认购单和签约提醒。负责客户对接、资料收集、签约提醒发送。',
      },
      {
        label: '销控专员',
        description:
          '负责资料审核、认购单确认、销控管理。可查看分配给自己审核的认购单和资料。',
      },
      {
        label: '简化点',
        description:
          '当前使用前端角色切换模拟权限验证。实际系统需在服务端做权限拦截，对接RBAC权限体系，支持数据行级权限。',
      },
    ],
  },
  {
    id: 'attachments',
    title: '附件简化说明',
    icon: '📎',
    items: [
      {
        label: '资料类型',
        description:
          '当前包含身份证、户口本、收入证明三类核心资料。实际系统需支持更多类型：婚姻证明、社保、银行流水等。',
      },
      {
        label: '文件上传',
        description:
          '当前仅展示资料状态和文本备注。实际系统需对接文件存储服务（OSS/COS），支持多文件上传、预览、下载。',
      },
      {
        label: '资料版本',
        description:
          '当前简化为单状态流转。实际系统需支持多版本管理，记录每次提交的文件版本，支持历史版本回溯。',
      },
      {
        label: 'OCR识别',
        description:
          '当前为人工审核。实际系统可集成OCR自动识别证件信息，自动校验资料完整性和一致性。',
      },
    ],
  },
  {
    id: 'notifications',
    title: '通知简化说明',
    icon: '🔔',
    items: [
      {
        label: '提醒方式',
        description:
          '当前为系统内待办和状态标记。实际系统需支持短信、微信、电话等多渠道通知，可配置通知模板和发送策略。',
      },
      {
        label: '实时推送',
        description:
          '当前通过页面刷新感知变更。实际系统需集成WebSocket或消息推送，实现状态变更实时通知。',
      },
      {
        label: '通知模板',
        description:
          '当前为固定文案。实际系统需支持通知模板管理，可自定义签约提醒、资料退回、延期提醒等多种模板。',
      },
      {
        label: '发送记录',
        description:
          '当前仅记录提醒次数。实际系统需完整记录每次通知的发送渠道、时间、状态、回执等信息。',
      },
    ],
  },
  {
    id: 'external',
    title: '外部系统简化说明',
    icon: '🔗',
    items: [
      {
        label: 'CRM系统',
        description:
          '当前客户数据为本地模拟。实际系统需对接企业CRM系统，同步客户信息、跟进记录、销售机会等数据。',
      },
      {
        label: '房源系统',
        description:
          '当前房号为文本字段。实际系统需对接房源管理系统，实时查询房源状态、价格、户型图等信息。',
      },
      {
        label: '财务系统',
        description:
          '当前定金为展示字段。实际系统需对接财务系统，实现定金收取、退款、对帐等财务流程自动化。',
      },
      {
        label: '合同系统',
        description:
          '当前签约为状态标记。实际系统需对接电子合同平台，实现合同生成、在线签署、存证管理等完整签约流程。',
      },
    ],
  },
  {
    id: 'workflow',
    title: '业务流程说明',
    icon: '🔄',
    items: [
      {
        label: '正常流程',
        description:
          '来访登记 → 客户跟进 → 认购单创建 → 资料提交 → 资料审核 → 签约提醒 → 签约完成。正常流程只占约30%。',
      },
      {
        label: '异常场景',
        description:
          '资料被退回、认购单修改、客户延期、资料变更后重审等是现场常态。系统的核心价值在于处理异常和责任界定。',
      },
      {
        label: '责任界定',
        description:
          '资料变更自动触发签约提醒标记，确保置业顾问及时感知。交接记录明确各环节责任人和时限。',
      },
      {
        label: '压力传导',
        description:
          '通过待办优先级、紧急度标记、现场压力指数等方式，将现场压力转化为可量化指标，驱动问题快速解决。',
      },
    ],
  },
];

export default function SystemInfoPage({}: SystemInfoProps) {
  const [activeSection, setActiveSection] = useState('permissions');

  const activeData = infoSections.find((s) => s.id === activeSection);

  return (
    <div className="flex gap-4 h-[calc(100vh-64px)]">
      <div className="w-64 bg-white rounded-xl border border-gray-200 p-4 flex-shrink-0">
        <h3 className="font-semibold text-gray-800 mb-4">系统说明</h3>
        <div className="space-y-1">
          {infoSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 overflow-y-auto scrollbar-thin">
        {activeData && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{activeData.icon}</span>
              <h2 className="text-xl font-semibold text-gray-800">
                {activeData.title}
              </h2>
            </div>

            <div className="space-y-4">
              {activeData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <h4 className="font-medium text-gray-800 mb-2">
                    {item.label}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-semibold text-primary-700">设计理念</h4>
                  <p className="text-sm text-primary-600 mt-2 leading-relaxed">
                    本系统以"问题导向"为核心设计思路，正常流程只是其中一小部分。
                    重点突出认购资料与签约提醒之间的联动感知，
                    明确案场经理、置业顾问、销控专员各角色的责任边界和处理节奏，
                    通过数据可视化传导现场压力，推动问题快速闭环。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
