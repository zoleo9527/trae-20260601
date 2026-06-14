import {
  X,
  User,
  Phone,
  FileText,
  Calendar,
  Hash,
  Layers,
  History,
  AlertCircle,
  FileWarning,
  FileArchive,
} from 'lucide-react';
import { useState } from 'react';
import type { Application } from '../types';
import { Timeline } from './Timeline';
import { CorrectionNoticeView } from './CorrectionNoticeView';
import { StatusBadge } from './StatusBadge';
import { FlowGuide } from './FlowGuide';
import { cn } from '../lib/utils';

interface SidebarProps {
  application: Application | null;
  onClose?: () => void;
  mode?: 'review' | 'archive';
}

type TabType = 'info' | 'timeline' | 'correction';

export function Sidebar({ application, onClose, mode = 'review' }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');

  if (!application) {
    return (
      <div className="h-full flex flex-col bg-white border-l" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400">选择申请查看详情</p>
            <p className="text-[10px] text-slate-300 mt-1">点击列表中的申请卡片</p>
          </div>
        </div>
        {mode === 'review' && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <FlowGuide />
          </div>
        )}
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: typeof FileText; badge?: number }[] = [
    { key: 'info', label: '基本信息', icon: Layers },
    { key: 'timeline', label: '时间线', icon: History },
    {
      key: 'correction',
      label: '补正通知',
      icon: FileWarning,
      badge: application.correctionNotices.length || undefined,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-l" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <FileArchive className="w-4 h-4 text-navy-500" />
          <span className="text-sm font-semibold text-slate-700">详情</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-b bg-slate-50/50" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">预约号</span>
          <StatusBadge status={application.status} size="sm" />
        </div>
        <p className="font-mono font-bold text-sm text-slate-800 tracking-tight">
          {application.appointmentNo}
        </p>
      </div>

      <div className="flex border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                isActive
                  ? 'text-navy-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[16px] h-4 text-[10px] font-bold rounded-full px-1',
                    isActive
                      ? 'bg-navy-100 text-navy-600'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-navy-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div>
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                申请人信息
              </h4>
              <div className="space-y-2">
                <InfoRow icon={User} label="姓名" value={application.applicantName} />
                <InfoRow
                  icon={Phone}
                  label="联系电话"
                  value={application.applicantPhone}
                />
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                申请信息
              </h4>
              <div className="space-y-2">
                <InfoRow
                  icon={FileText}
                  label="申请事项"
                  value={application.applicationType}
                />
                <InfoRow
                  icon={Calendar}
                  label="受理时间"
                  value={application.receivedAt}
                />
                <InfoRow
                  icon={Hash}
                  label="受理窗口"
                  value={application.windowNo}
                />
              </div>
            </div>

            {application.archiveNo && (
              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  归档信息
                </h4>
                <div className="space-y-2">
                  <InfoRow
                    icon={FileArchive}
                    label="档案号"
                    value={application.archiveNo}
                  />
                  {application.archivedAt && (
                    <InfoRow
                      icon={Calendar}
                      label="归档时间"
                      value={application.archivedAt}
                    />
                  )}
                </div>
              </div>
            )}

            {application.exceptionNote && (
              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  异常说明
                </h4>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {application.exceptionNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                材料清单
              </h4>
              <div className="space-y-1.5">
                {application.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700 truncate">
                        {material.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {material.isOriginal && (
                        <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                          原件
                        </span>
                      )}
                      <StatusBadge status={material.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="p-4 animate-fadeIn">
            <Timeline records={application.reviewRecords} />
          </div>
        )}

        {activeTab === 'correction' && (
          <div className="p-4 animate-fadeIn">
            <CorrectionNoticeView notices={application.correctionNotices} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400">{label}</p>
        <p className="text-xs font-medium text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
