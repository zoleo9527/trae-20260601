import { AlertTriangle, Bike, CheckCircle, Clock, FileText, MapPin, Navigation, Repeat, Send, User, X } from 'lucide-react';
import { useState } from 'react';
import { hotspots } from '../../data/hotspots';
import { useAppStore } from '../../store/useAppStore';
import { formatTime, generateTimeline, priorityMap, statusMap } from '../../utils/format';
import { Timeline } from '../timeline/Timeline';
import { PhotoGallery } from './PhotoGallery';

export const ComplaintDetail = () => {
  const { selectedComplaintId, setSelectedComplaint, complaints, closeComplaint, userRole } = useAppStore();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closeNote, setCloseNote] = useState('');

  const complaint = complaints.find(c => c.id === selectedComplaintId);

  if (!selectedComplaintId || !complaint) return null;

  const status = statusMap[complaint.status];
  const priority = priorityMap[complaint.priority];
  const timeline = generateTimeline(complaint);
  const hotspot = complaint.hotspotId ? hotspots.find(h => h.id === complaint.hotspotId) : null;
  const hasRepeat = (complaint.repeatCount || 0) > 1;
  const hasOffset = complaint.location.offset;
  const canClose = userRole === 'dispatcher' || userRole === 'manager';
  const showCloseButton = canClose && complaint.status !== 'closed';

  const handleClose = () => {
    if (closeReason) {
      closeComplaint(complaint.id, `${closeReason}${closeNote ? '：' + closeNote : ''}`);
      setShowCloseModal(false);
      setCloseReason('');
      setCloseNote('');
    }
  };

  const closeReasons = [
    '处理完成，车辆已挪走',
    '定位偏差，车辆已不在现场',
    '重复投诉，已并案处理',
    '非我司车辆',
    '其他原因'
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => setSelectedComplaint(null)}
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-[520px] bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
        <style>{`
          @keyframes slide-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
        `}</style>

        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold">{complaint.title}</h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-slate-400">{complaint.id}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{formatTime(complaint.createTime)}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedComplaint(null)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${status.color}`}>
            {status.label}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${priority.color}`}>
            {priority.label}优先级
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {complaint.source}
          </span>
          {hasRepeat && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              重复{complaint.repeatCount}次
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-500" />
                投诉详情
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {complaint.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                位置信息
              </h3>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{complaint.location.address}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 pl-6">
                  <span>经度: {complaint.location.lng.toFixed(4)}</span>
                  <span>纬度: {complaint.location.lat.toFixed(4)}</span>
                </div>
                {complaint.location.accuracy && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 pl-6">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>定位精度: ±{complaint.location.accuracy}米</span>
                  </div>
                )}
                {hasOffset && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-800">定位可能存在偏移</p>
                      <p className="text-xs text-amber-600">请巡检员现场核实车辆位置</p>
                    </div>
                  </div>
                )}
                {hotspot && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <Repeat className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-800">位于热点区域: {hotspot.name}</p>
                      <p className="text-xs text-red-600">该区域累计投诉 {hotspot.complaintCount} 次</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Bike className="w-4 h-4 text-blue-500" />
                车辆信息
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">车辆编号</p>
                  <p className="text-sm font-mono font-semibold text-slate-800">{complaint.bikeId}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">车辆状态</p>
                  <p className="text-sm font-semibold text-slate-800">运营中</p>
                </div>
              </div>
            </div>

            {complaint.assignee && (
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  处理人员
                </h3>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {complaint.assignee.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{complaint.assignee}</p>
                    <p className="text-xs text-slate-500">巡检员</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-500" />
                处理时间线
              </h3>
              <Timeline nodes={timeline} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                处理照片
              </h3>
              <PhotoGallery photos={complaint.photos} allowUpload={userRole === 'inspector'} />
            </div>

            {complaint.processNote && (
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  处理说明
                </h3>
                <p className="text-sm text-slate-600 bg-green-50 p-3 rounded-lg border border-green-100 leading-relaxed">
                  {complaint.processNote}
                </p>
              </div>
            )}

            {complaint.closeReason && (
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  关闭原因
                </h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {complaint.closeReason}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          {showCloseButton ? (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                关闭反馈
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectedComplaint(null)}
              className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              关闭详情
            </button>
          )}
        </div>
      </div>

      {showCloseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCloseModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <style>{`
              @keyframes scale-in {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
              .animate-scale-in {
                animation: scale-in 0.2s ease-out;
              }
            `}</style>
            
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                关闭城市反馈
              </h3>
              <p className="text-sm text-slate-500 mt-1">请选择关闭原因，提交后将同步至城市管理平台</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  关闭原因 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {closeReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setCloseReason(reason)}
                      className={`w-full p-3 text-left text-sm rounded-lg border transition-all ${
                        closeReason === reason
                          ? 'border-green-500 bg-green-50 text-green-800 ring-2 ring-green-200'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  补充说明（可选）
                </label>
                <textarea
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="请输入补充说明..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClose}
                disabled={!closeReason}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  closeReason
                    ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30'
                    : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
