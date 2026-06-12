import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import * as api from '../services/api';
import { ProjectStatusLabels, DocumentStatusLabels } from '../types';
import clsx from 'clsx';

interface Stats {
  projectStats: Record<string, number>;
  documentStats: Record<string, number>;
  pendingTasks: Array<{ id: string; type: 'project' | 'document'; title: string; status: string }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then((result) => {
      if (result.success && result.data) {
        setStats(result.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const projectCards = [
    { label: '草稿', value: stats?.projectStats.draft || 0, icon: FileText, color: 'gray' },
    { label: '待审核', value: (stats?.projectStats.initial_review || 0) + (stats?.projectStats.re_review || 0), icon: Clock, color: 'yellow' },
    { label: '已立项', value: stats?.projectStats.approved || 0, icon: CheckCircle, color: 'green' },
    { label: '已驳回', value: stats?.projectStats.rejected || 0, icon: AlertCircle, color: 'red' },
  ];

  const documentCards = [
    { label: '待编制', value: stats?.documentStats.pending || 0, icon: FileText, color: 'gray' },
    { label: '编制中', value: stats?.documentStats.drafting || 0, icon: TrendingUp, color: 'blue' },
    { label: '待审核', value: stats?.documentStats.review || 0, icon: Clock, color: 'yellow' },
    { label: '已发布', value: stats?.documentStats.published || 0, icon: CheckCircle, color: 'green' },
  ];

  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">统一工作台</h1>
        <p className="text-gray-500 mt-1">查看所有待办事项和项目状态汇总</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-600" />
            项目立项状态
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {projectCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className={clsx('p-2 rounded-lg', colorMap[card.color])}>
                      <Icon className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            文件编制状态
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {documentCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className={clsx('p-2 rounded-lg', colorMap[card.color])}>
                      <Icon className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">待办事项</h2>
          <div className="bg-white rounded-xl border border-gray-200">
            {stats?.pendingTasks && stats.pendingTasks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.pendingTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={task.type === 'project' ? `/projects/${task.id}` : `/documents/${task.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        'px-2 py-1 rounded text-xs font-medium',
                        task.type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      )}>
                        {task.type === 'project' ? '项目' : '文件'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{task.title}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {task.type === 'project' 
                        ? ProjectStatusLabels[task.status as keyof typeof ProjectStatusLabels]
                        : DocumentStatusLabels[task.status as keyof typeof DocumentStatusLabels]
                      }
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>暂无待办事项</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
