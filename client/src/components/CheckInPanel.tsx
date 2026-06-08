import { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function CheckInPanel() {
  const { checkInModalOpen, setCheckInModalOpen, tourGroups, dispatches, checkIns, guides, selectedTourGroupId, confirmCheckIn } =
    useAppStore();
  const [exceptionText, setExceptionText] = useState('');
  const [isException, setIsException] = useState(false);

  const tourGroup = tourGroups.find((tg) => tg.id === selectedTourGroupId);
  const dispatch = dispatches.find((d) => d.tourGroupId === selectedTourGroupId);
  const guide = dispatch ? guides.find((g) => g.id === dispatch.guideId) : undefined;
  const checkIn = checkIns.find((ci) => ci.tourGroupId === selectedTourGroupId);

  if (!checkInModalOpen || !tourGroup) return null;

  const handleConfirm = () => {
    confirmCheckIn(tourGroup.id, isException ? exceptionText : undefined);
    setExceptionText('');
    setIsException(false);
  };

  const handleClose = () => {
    setCheckInModalOpen(false);
    setExceptionText('');
    setIsException(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">接团签到确认</h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4">
            <div className="text-xs text-slate-400 font-mono mb-1">{tourGroup.groupCode}</div>
            <div className="font-semibold text-slate-800">{tourGroup.tourName}</div>
            <div className="text-sm text-slate-500 mt-1">{tourGroup.route} · {tourGroup.tourDate}</div>
          </div>

          {guide && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">导游：{guide.name}</span>
              <span className="text-sm text-slate-400">{guide.phone}</span>
            </div>
          )}

          {checkIn?.checkInStatus === 'checked_in' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-700 text-sm mb-4">
              <CheckCircle className="w-4 h-4" />
              已于 {checkIn.checkedInAt} 签到
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsException(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                !isException
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-1.5" />
              正常签到
            </button>
            <button
              onClick={() => setIsException(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                isException
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              异常上报
            </button>
          </div>

          {isException && (
            <textarea
              value={exceptionText}
              onChange={(e) => setExceptionText(e.target.value)}
              placeholder="请描述异常情况…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 resize-none mb-4"
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
            onClick={handleConfirm}
            disabled={isException && !exceptionText.trim()}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isException ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isException ? '确认上报' : '确认签到'}
          </button>
        </div>
      </div>
    </div>
  );
}
