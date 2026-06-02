import { CheckCircle, Clock, Tv } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { broadcastsApi } from '../api';

export default function Broadcast() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadBroadcasts();
  }, [filter]);

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'pending') params.confirmed = '0';
      else if (filter === 'confirmed') params.confirmed = '1';
      const data = await broadcastsApi.list(params);
      setBroadcasts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await broadcastsApi.confirm(id, {
        confirmed_by: '张明',
        notes: '确认播出正常',
      });
      loadBroadcasts();
    } catch (e) {
      alert('确认失败：' + e.message);
    }
  };

  const pendingCount = broadcasts.filter(b => !b.confirmed).length;
  const confirmedCount = broadcasts.filter(b => b.confirmed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">播出确认</h2>
        <p className="text-gray-500 mt-1">确认广告播出效果，完成结算流程</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`card p-5 cursor-pointer hover:shadow-md transition-shadow ${filter === 'pending' ? 'ring-2 ring-amber-200' : ''}`} onClick={() => setFilter('pending')}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">待确认</p>
            </div>
          </div>
        </div>
        <div className={`card p-5 cursor-pointer hover:shadow-md transition-shadow ${filter === 'confirmed' ? 'ring-2 ring-emerald-200' : ''}`} onClick={() => setFilter('confirmed')}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
              <p className="text-sm text-gray-500">已确认</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {filter === 'pending' ? '暂无待确认的播出记录' : '暂无已确认的播出记录'}
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.map(b => (
            <div key={b.id} className={`card p-5 ${!b.confirmed ? 'ring-1 ring-amber-100' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${b.confirmed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <Tv size={22} className={b.confirmed ? 'text-emerald-500' : 'text-amber-500'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{b.order_no}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-600">{b.client_name}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {b.channel} · {b.schedule_date} {b.time_slot}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      实际播出时间：{b.actual_air_time || '—'}
                    </p>
                    {b.file_name && (
                      <p className="text-xs text-gray-400 mt-1">素材：{b.file_name}</p>
                    )}
                    {b.notes && (
                      <p className="text-xs text-gray-400 mt-1">备注：{b.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {b.confirmed ? (
                    <div className="text-right">
                      <span className="badge bg-emerald-100 text-emerald-700">✅ 已确认</span>
                      <p className="text-xs text-gray-400 mt-1">{b.confirmed_by} · {b.confirmed_time}</p>
                    </div>
                  ) : (
                    <button onClick={() => handleConfirm(b.id)} className="btn-success">
                      <CheckCircle size={16} /> 确认播出
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
