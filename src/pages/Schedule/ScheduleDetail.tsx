import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Film,
  MapPin,
  Clock,
  DollarSign,
  User,
  Edit,
  RefreshCw,
  XCircle,
  CheckCircle,
  X,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useHallStore } from '@/store/hallStore';
import { useTicketStore } from '@/store/ticketStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Timeline, type TimelineItem } from '@/components/common/Timeline';
import { Modal } from '@/components/common/Modal';
import { formatDateTime, formatTime } from '@/utils/date';

const ScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSchedule, getScheduleLogs, updateSchedule, changeHall, changeScheduleStatus, closeSchedule } = useScheduleStore();
  const { halls } = useHallStore();
  const { generateTickets, getTicketsBySchedule } = useTicketStore();

  const schedule = id ? getSchedule(id) : undefined;
  const logs = id ? getScheduleLogs(id) : [];
  const tickets = id ? getTicketsBySchedule(id) : [];

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hallModalOpen, setHallModalOpen] = useState(false);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    movieName: '',
    price: 0,
    remark: '',
  });

  const [newHallId, setNewHallId] = useState('');
  const [changeHallReason, setChangeHallReason] = useState('');
  const [statusRemark, setStatusRemark] = useState('');
  const [ticketCount, setTicketCount] = useState(10);
  const [ticketType, setTicketType] = useState<'normal' | 'group'>('group');
  const [pendingAction, setPendingAction] = useState<'adjusting' | 'cancel' | 'complete' | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!schedule) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">排片不存在</h2>
        <p className="text-gray-500 mb-4">该排片记录可能已被删除</p>
        <Link to="/schedule" className="btn-primary">
          返回排片列表
        </Link>
      </div>
    );
  }

  const timelineItems: TimelineItem[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    operator: log.operator,
    operatorRole: log.operatorRole,
    remark: log.remark,
    createdAt: log.createdAt,
    beforeData: log.beforeData as Record<string, unknown>,
    afterData: log.afterData as Record<string, unknown>,
  }));

  const openEditModal = () => {
    setEditForm({
      movieName: schedule.movieName,
      price: schedule.price,
      remark: schedule.remark || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editForm.movieName.trim()) {
      setError('请输入影片名称');
      return;
    }
    updateSchedule(
      schedule.id,
      {
        movieName: editForm.movieName,
        price: editForm.price,
        remark: editForm.remark,
      },
      '补充/修改排片信息'
    );
    setEditModalOpen(false);
    setSuccess('排片信息已更新');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleChangeHall = () => {
    if (!newHallId) {
      setError('请选择目标影厅');
      return;
    }
    if (!changeHallReason.trim()) {
      setError('请填写换厅原因');
      return;
    }
    const success = changeHall(schedule.id, newHallId, changeHallReason);
    if (success) {
      setHallModalOpen(false);
      setNewHallId('');
      setChangeHallReason('');
      setError(null);
      setSuccess('换厅成功');
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError('换厅失败，目标影厅该时段可能已有排片');
    }
  };

  const handleStatusAction = (action: 'adjusting' | 'cancel' | 'complete') => {
    const statusMap = {
      adjusting: 'adjusting' as const,
      cancel: 'cancelled' as const,
      complete: 'completed' as const,
    };
    const remarkMap = {
      adjusting: '退回调整：' + statusRemark,
      cancel: '取消排片：' + statusRemark,
      complete: '完成排片：' + statusRemark,
    };
    changeScheduleStatus(schedule.id, statusMap[action], remarkMap[action]);
    setRemarkModalOpen(false);
    setStatusRemark('');
    setSuccess('操作成功');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleClose = () => {
    closeSchedule(schedule.id);
    setCloseModalOpen(false);
    setSuccess('排片已关闭归档');
    setTimeout(() => {
      setSuccess(null);
      navigate('/schedule');
    }, 1500);
  };

  const handleGenerateTickets = () => {
    const newTickets = generateTickets(schedule.id, ticketCount, ticketType);
    setTicketModalOpen(false);
    setSuccess(`成功生成 ${newTickets.length} 张${ticketType === 'group' ? '团体' : '普通'}票`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const availableHalls = halls.filter(
    (h) => h.id !== schedule.hallId && (h.status === 'idle' || h.status === 'screening')
  );

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link to="/schedule" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{schedule.movieName}</h1>
            <StatusBadge type="schedule" status={schedule.status} />
          </div>
          <p className="text-gray-500 mt-1">排片详情 · 创建于 {formatDateTime(schedule.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">排片信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cinema-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Film className="w-5 h-5 text-cinema-red" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">影片名称</p>
                    <p className="font-medium text-gray-900">{schedule.movieName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">放映影厅</p>
                    <p className="font-medium text-gray-900">{schedule.hallName}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">放映时间</p>
                    <p className="font-medium text-gray-900">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </p>
                    <p className="text-sm text-gray-500">时长 {schedule.duration} 分钟</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">票价</p>
                    <p className="font-medium text-gray-900">¥{schedule.price}</p>
                  </div>
                </div>
              </div>
            </div>
            {schedule.remark && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">备注</p>
                <p className="text-gray-700">{schedule.remark}</p>
              </div>
            )}
          </div>

          {tickets.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">关联票券</h2>
                <span className="text-sm text-gray-500">共 {tickets.length} 张</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tickets.slice(0, 10).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-mono font-medium text-gray-900">{ticket.code}</p>
                      <p className="text-xs text-gray-500">
                        {ticket.type === 'group' ? '团体票' : '普通票'} · ¥{ticket.price}
                      </p>
                    </div>
                    <StatusBadge type="ticket" status={ticket.status} />
                  </div>
                ))}
                {tickets.length > 10 && (
                  <p className="text-center text-sm text-gray-500 py-2">
                    还有 {tickets.length - 10} 张票券...
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作记录</h2>
            <Timeline items={timelineItems} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">常用动作</h2>
            <div className="space-y-3">
              <button onClick={openEditModal} className="w-full btn-secondary justify-start">
                <Edit className="w-4 h-4 mr-2" />
                补充/修改信息
              </button>
              <button
                onClick={() => setHallModalOpen(true)}
                className="w-full btn-secondary justify-start"
                disabled={schedule.status === 'closed' || schedule.status === 'cancelled'}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                临时换厅
              </button>
              <button
                onClick={() => setTicketModalOpen(true)}
                className="w-full btn-secondary justify-start"
                disabled={schedule.status === 'closed' || schedule.status === 'cancelled'}
              >
                <Plus className="w-4 h-4 mr-2" />
                生成团体票
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">状态流转</h2>
            <div className="space-y-3">
              {schedule.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      setPendingAction('adjusting');
                      setRemarkModalOpen(true);
                      setStatusRemark('');
                    }}
                    className="w-full btn-warning justify-start"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    退回调整
                  </button>
                  <button
                    onClick={() => {
                      setPendingAction('complete');
                      setRemarkModalOpen(true);
                      setStatusRemark('');
                    }}
                    className="w-full btn-success justify-start"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    标记完成
                  </button>
                  <button
                    onClick={() => {
                      setPendingAction('cancel');
                      setRemarkModalOpen(true);
                      setStatusRemark('');
                    }}
                    className="w-full btn-danger justify-start"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    取消排片
                  </button>
                </>
              )}
              {schedule.status === 'adjusting' && (
                <button
                  onClick={() => changeScheduleStatus(schedule.id, 'active', '调整完成，重新生效')}
                  className="w-full btn-success justify-start"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  重新生效
                </button>
              )}
              {(schedule.status === 'completed' || schedule.status === 'cancelled') && (
                <button
                  onClick={() => setCloseModalOpen(true)}
                  className="w-full btn-primary justify-start"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  关闭归档
                </button>
              )}
              {schedule.status === 'closed' && (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">此排片已关闭归档</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">创建信息</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">创建人</p>
                  <p className="font-medium text-gray-900">{schedule.createdBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="font-medium text-gray-900">{formatDateTime(schedule.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">最后更新</p>
                  <p className="font-medium text-gray-900">{formatDateTime(schedule.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setError(null);
        }}
        title="编辑排片信息"
        footer={
          <>
            <button
              onClick={() => {
                setEditModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleEditSubmit} className="btn-primary">
              保存修改
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">影片名称</label>
            <input
              type="text"
              value={editForm.movieName}
              onChange={(e) => setEditForm({ ...editForm, movieName: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">票价（元）</label>
            <input
              type="number"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={editForm.remark}
              onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={hallModalOpen}
        onClose={() => {
          setHallModalOpen(false);
          setError(null);
          setNewHallId('');
          setChangeHallReason('');
        }}
        title="临时换厅"
        footer={
          <>
            <button
              onClick={() => {
                setHallModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleChangeHall} className="btn-primary">
              确认换厅
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">
              <strong>当前影厅：</strong>
              {schedule.hallName}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目标影厅</label>
            <select
              value={newHallId}
              onChange={(e) => setNewHallId(e.target.value)}
              className="input"
            >
              <option value="">请选择影厅</option>
              {availableHalls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name}（{hall.seatCount}座）
                </option>
              ))}
            </select>
            {availableHalls.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">暂无其他可用影厅</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">换厅原因</label>
            <textarea
              value={changeHallReason}
              onChange={(e) => setChangeHallReason(e.target.value)}
              placeholder="请说明换厅原因..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={remarkModalOpen}
        onClose={() => {
          setRemarkModalOpen(false);
          setError(null);
          setPendingAction(null);
        }}
        title="操作备注"
        footer={
          <>
            <button
              onClick={() => {
                setRemarkModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (pendingAction) {
                  handleStatusAction(pendingAction);
                }
              }}
              className="btn-primary"
            >
              确认
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
          <textarea
            value={statusRemark}
            onChange={(e) => setStatusRemark(e.target.value)}
            placeholder="请填写操作备注..."
            rows={3}
            className="input resize-none"
          />
        </div>
      </Modal>

      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="关闭归档"
        footer={
          <>
            <button onClick={() => setCloseModalOpen(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleClose} className="btn-primary">
              确认关闭
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          确定要关闭并归档此排片吗？关闭后将无法再进行修改操作。
        </p>
      </Modal>

      <Modal
        isOpen={ticketModalOpen}
        onClose={() => {
          setTicketModalOpen(false);
          setError(null);
        }}
        title="生成票券"
        footer={
          <>
            <button
              onClick={() => {
                setTicketModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleGenerateTickets} className="btn-primary">
              生成
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">票券类型</label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as 'normal' | 'group')}
              className="input"
            >
              <option value="group">团体票</option>
              <option value="normal">普通票</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">生成数量</label>
            <input
              type="number"
              value={ticketCount}
              onChange={(e) => setTicketCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              min={1}
              max={100}
              className="input"
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              将为 <strong>{schedule.movieName}</strong> 生成 <strong>{ticketCount}</strong> 张
              {ticketType === 'group' ? '团体' : '普通'}票，单价 ¥{schedule.price}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleDetail;
