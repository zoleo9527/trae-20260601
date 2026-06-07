import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Image,
  Clock,
  User,
  Edit3,
  ChevronRight,
  MessageSquare,
  Camera
} from 'lucide-react';
import { useDecorationStore } from '../stores/decorationStore';
import { useBookingStore } from '../stores/bookingStore';
import { useAuditStore } from '../stores/auditStore';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime } from '../utils/storage';
import { DecorationStatus } from '../types';

const DecorationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, updateTaskStatus, addPhoto } = useDecorationStore();
  const { getBookingById } = useBookingStore();
  const { getLogsByEntity } = useAuditStore();
  const [statusNote, setStatusNote] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const task = getTaskById(id!);
  const booking = task ? getBookingById(task.bookingId) : undefined;
  const auditLogs = id ? getLogsByEntity('decoration', id) : [];

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">布置任务不存在</p>
        <button
          onClick={() => navigate('/decorations')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          返回布置看板
        </button>
      </div>
    );
  }

  const statusFlow: { status: DecorationStatus; label: string; next: DecorationStatus[] }[] = [
    { status: 'pending', label: '待布置', next: ['in_progress'] },
    { status: 'in_progress', label: '布置中', next: ['completed'] },
    { status: 'completed', label: '已完成', next: ['restored'] },
    { status: 'restored', label: '已还原', next: [] },
  ];

  const currentFlow = statusFlow.find((f) => f.status === task.status);

  const handleStatusChange = (newStatus: DecorationStatus) => {
    updateTaskStatus(task.id, newStatus, statusNote || undefined);
    setStatusNote('');
    setShowStatusMenu(false);
  };

  const handleAddPhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
    ];
    const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    addPhoto(task.id, randomPhoto);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/decorations')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">布置详情</h2>
            <StatusBadge status={task.status} type="decoration" />
            <span className="text-xs text-slate-500 font-mono">{task.id}</span>
          </div>
        </div>
        {currentFlow && currentFlow.next.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              更新状态
              <ChevronRight className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-90' : ''}`} />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 p-4">
                <div className="mb-3">
                  <label className="text-xs text-slate-400 mb-1 block">变更说明（可选）</label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="输入说明..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  {currentFlow.next.map((nextStatus) => {
                    const nextFlow = statusFlow.find((f) => f.status === nextStatus);
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusChange(nextStatus)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded text-sm transition-colors"
                      >
                        标记为「{nextFlow?.label}」
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              布置信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">布置主题</p>
                <p className="font-medium">{task.theme}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">关联包厢</p>
                {booking ? (
                  <Link
                    to={`/bookings/${booking.id}`}
                    className="text-blue-400 hover:underline font-medium"
                  >
                    {booking.roomNumber}
                  </Link>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">开始时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">
                    {task.startedAt ? formatDateTime(task.startedAt) : '未开始'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">完成时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">
                    {task.completedAt ? formatDateTime(task.completedAt) : '未完成'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">操作员</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{task.operator || '未分配'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">创建时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{formatDateTime(task.createdAt)}</span>
                </div>
              </div>
            </div>
            {task.notes && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-1">布置说明</p>
                <p className="text-sm">{task.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-400" />
                布置照片回看
              </h3>
              <button
                onClick={handleAddPhoto}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                <Camera className="w-4 h-4" />
                添加照片
              </button>
            </div>
            {task.photos.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无照片记录</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {task.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    <img
                      src={photo}
                      alt={`布置照片${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4">状态流转</h3>
            <div className="space-y-3">
              {statusFlow.map((flow, idx) => {
                const isActive = flow.status === task.status;
                const isPast = statusFlow.findIndex((f) => f.status === task.status) > idx;
                return (
                  <div key={flow.status} className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        isActive
                          ? 'bg-amber-500 ring-4 ring-amber-500/20'
                          : isPast
                          ? 'bg-emerald-500'
                          : 'bg-slate-700'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isActive ? 'font-medium text-white' : isPast ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {flow.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              操作记录
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 text-sm">暂无操作记录</p>
              ) : (
                auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-300">
                        {log.action === 'create' ? '创建' : log.action === 'status_change' ? '状态变更' : '更新'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-500 text-xs">{log.operator || '系统'}</span>
                    </div>
                    {log.note && <p className="text-slate-400 text-xs">{log.note}</p>}
                    <p className="text-slate-600 text-xs">{formatDateTime(log.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="大图预览"
            className="max-w-4xl max-h-[80vh] rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default DecorationDetail;
