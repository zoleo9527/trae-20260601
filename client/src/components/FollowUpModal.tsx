import { useState } from 'react';
import { X, MessageSquarePlus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function FollowUpModal() {
  const { followUpModalOpen, setFollowUpModalOpen, tourGroups, selectedTourGroupId, addFollowUp, resolveStuck } = useAppStore();
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'followup' | 'resolve'>('followup');
  const [resolveNote, setResolveNote] = useState('');

  const tourGroup = tourGroups.find((tg) => tg.id === selectedTourGroupId);

  if (!followUpModalOpen || !tourGroup) return null;

  const handleFollowUp = () => {
    if (!content.trim()) return;
    addFollowUp(tourGroup.id, content.trim());
    setContent('');
    setMode('followup');
    setResolveNote('');
  };

  const handleResolve = () => {
    if (!resolveNote.trim()) return;
    resolveStuck(tourGroup.id, resolveNote.trim());
    setContent('');
    setMode('followup');
    setResolveNote('');
  };

  const handleClose = () => {
    setFollowUpModalOpen(false);
    setContent('');
    setMode('followup');
    setResolveNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">跟进备注</h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4">
            <div className="text-xs text-slate-400 font-mono mb-1">{tourGroup.groupCode}</div>
            <div className="font-semibold text-slate-800">{tourGroup.tourName}</div>
          </div>

          {tourGroup.followUps.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto space-y-2">
              <div className="text-xs font-semibold text-slate-500 mb-1">历史跟进</div>
              {tourGroup.followUps.map((fu) => (
                <div key={fu.id} className={`text-xs px-3 py-2 rounded-lg ${fu.isResolved ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                  <div className={fu.isResolved ? 'text-emerald-700' : 'text-slate-700'}>{fu.content}</div>
                  <div className="text-slate-400 mt-0.5">{new Date(fu.createdAt).toLocaleString('zh-CN')}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setMode('followup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                mode === 'followup'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4 inline mr-1.5" />
              添加跟进
            </button>
            <button
              onClick={() => setMode('resolve')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                mode === 'resolve'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              标记已处理
            </button>
          </div>

          {mode === 'followup' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入跟进内容…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
            />
          ) : (
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="输入处理说明（必填）…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-300/30 focus:border-emerald-400 resize-none"
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            取消
          </button>
          <button
            onClick={mode === 'followup' ? handleFollowUp : handleResolve}
            disabled={mode === 'followup' ? !content.trim() : !resolveNote.trim()}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#1e3a5f] hover:bg-[#2a4f7f]'
            }`}
          >
            {mode === 'followup' ? '提交跟进' : '确认处理'}
          </button>
        </div>
      </div>
    </div>
  );
}
