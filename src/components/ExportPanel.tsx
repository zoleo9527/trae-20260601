import { useState } from 'react';
import { Download, FileSpreadsheet, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { ExportTask } from '@/types';

interface ExportPanelProps {
  tasks: ExportTask[];
  onCreateExport: (type: ExportTask['type']) => void;
}

const typeLabels: Record<ExportTask['type'], string> = {
  burn_in_test: '烤机测试报告',
  delivery: '交付记录报告',
  exception: '异常报告',
  all: '完整报告',
};

const statusLabels: Record<ExportTask['status'], string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

export function ExportPanel({ tasks, onCreateExport }: ExportPanelProps) {
  const [selectedType, setSelectedType] = useState<ExportTask['type']>('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">导出任务</h2>
          <p className="text-sm text-gray-500 mt-1">生成和管理数据导出任务</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ExportTask['type'])}
            className="select max-w-xs"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => onCreateExport(selectedType)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            导出
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">任务ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">导出类型</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">文件名</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">进度</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">创建时间</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    暂无导出任务
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-700">{task.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {typeLabels[task.type]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">{task.filename}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        {task.status === 'processing' && <RefreshCw className="h-3 w-3 animate-spin" />}
                        {task.status === 'failed' && <AlertCircle className="h-3 w-3" />}
                        {task.status === 'pending' && <Clock className="h-3 w-3" />}
                        {statusLabels[task.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${(task.exportedRecords / task.totalRecords) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {task.exportedRecords}/{task.totalRecords}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{task.createdAt}</span>
                    </td>
                    <td className="py-3 px-4">
                      {task.status === 'completed' ? (
                        <button className="btn btn-secondary text-sm flex items-center gap-1">
                          <FileSpreadsheet className="h-4 w-4" />
                          下载
                        </button>
                      ) : task.status === 'processing' ? (
                        <span className="text-sm text-gray-400">处理中...</span>
                      ) : task.status === 'failed' ? (
                        <button 
                          onClick={() => onCreateExport(task.type)}
                          className="btn btn-warning text-sm flex items-center gap-1"
                        >
                          <RefreshCw className="h-4 w-4" />
                          重试
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">等待中</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">总任务数</p>
          <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600">已完成</p>
          <p className="text-2xl font-bold text-green-700">
            {tasks.filter(t => t.status === 'completed').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600">处理中</p>
          <p className="text-2xl font-bold text-blue-700">
            {tasks.filter(t => t.status === 'processing').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm text-red-600">失败</p>
          <p className="text-2xl font-bold text-red-700">
            {tasks.filter(t => t.status === 'failed').length}
          </p>
        </div>
      </div>
    </div>
  );
}
