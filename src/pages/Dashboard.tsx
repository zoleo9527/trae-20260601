import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import {
  FILLING_STATUS_LABELS, FILLING_STATUS_COLORS,
  PACKAGING_STATUS_LABELS, PACKAGING_STATUS_COLORS,
  ROLE_LABELS
} from '../types';
import type { FillingSchedule, PackagingRequisition } from '../types';

export default function Dashboard() {
  const { currentUser, refreshTrigger } = useContext(AppContext);
  const [fillingSchedules, setFillingSchedules] = useState<FillingSchedule[]>([]);
  const [packagingRequisitions, setPackagingRequisitions] = useState<PackagingRequisition[]>([]);
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch('/api/filling-schedules').then(r => r.json()),
      fetch('/api/packaging-requisitions').then(r => r.json()),
      fetch('/api/stats/summary').then(r => r.json())
    ]).then(([f, p, s]) => {
      setFillingSchedules(f);
      setPackagingRequisitions(p);
      setStats(s);
    });
  }, [refreshTrigger]);

  const myFilling = fillingSchedules.filter(s => s.currentHandler === currentUser?.role).slice(0, 5);
  const myPackaging = packagingRequisitions.filter(r => r.currentHandler === currentUser?.role).slice(0, 5);

  const getFillingCount = (status: string) => {
    return stats?.fillingStats?.find((s: any) => s.status === status)?._count?.status || 0;
  };

  const getPackagingCount = (status: string) => {
    return stats?.packagingStats?.find((s: any) => s.status === status)?._count?.status || 0;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">
            {currentUser?.avatar} 欢迎回来，{currentUser?.name}（{ROLE_LABELS[currentUser!.role]}）
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => navigate('/filling/new')} className="btn-primary">
            + 新建灌装排产
          </button>
          <button onClick={() => navigate('/packaging/new')} className="btn-secondary">
            + 新建包装领用
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card border-l-4 border-l-yellow-500">
          <div className="text-sm text-gray-500">灌装待复核</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">{getFillingCount('SUBMITTED')}</div>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <div className="text-sm text-gray-500">灌装生产中</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{getFillingCount('IN_PRODUCTION')}</div>
        </div>
        <div className="card border-l-4 border-l-yellow-500">
          <div className="text-sm text-gray-500">包装待审核</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">{getPackagingCount('PENDING')}</div>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <div className="text-sm text-gray-500">包装待发放</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{getPackagingCount('APPROVED')}</div>
        </div>
        <div className="card border-l-4 border-l-orange-500">
          <div className="text-sm text-gray-500">变更待处置</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">
            {packagingRequisitions.filter(r => r.hasPendingChange).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">待我处理 - 灌装排产</h2>
            <button onClick={() => navigate('/filling')} className="text-sm text-beer-600 hover:text-beer-700">
              查看全部 →
            </button>
          </div>
          {myFilling.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">✅</div>
              暂无待处理的灌装排产
            </div>
          ) : (
            <div className="space-y-3">
              {myFilling.map(schedule => (
                <button
                  key={schedule.id}
                  onClick={() => navigate(`/filling/${schedule.id}`)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-beer-300 hover:bg-beer-50 transition-all text-left group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-beer-700">
                        {schedule.batchNo} - {schedule.productName}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {schedule.beerType} · {schedule.volume}L · {schedule.targetBottles}瓶
                      </div>
                    </div>
                    <span className={`status-badge ${FILLING_STATUS_COLORS[schedule.status]}`}>
                      {FILLING_STATUS_LABELS[schedule.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">待我处理 - 包装领用</h2>
            <button onClick={() => navigate('/packaging')} className="text-sm text-beer-600 hover:text-beer-700">
              查看全部 →
            </button>
          </div>
          {myPackaging.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">✅</div>
              暂无待处理的包装领用
            </div>
          ) : (
            <div className="space-y-3">
              {myPackaging.map(req => (
                <button
                  key={req.id}
                  onClick={() => navigate(`/packaging/${req.id}`)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-beer-300 hover:bg-beer-50 transition-all text-left group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-beer-700">
                        {req.requisitionNo} - {req.schedule?.productName}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {req.bottleType} · {req.bottleCount}个
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`status-badge ${PACKAGING_STATUS_COLORS[req.status]}`}>
                        {PACKAGING_STATUS_LABELS[req.status]}
                      </span>
                      {req.hasPendingChange ? (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 animate-pulse">
                          ⚠️ 变更待处置({req.pendingChangeCount})
                        </span>
                      ) : req.hasConfirmedChange ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          ✓ 变更已处置
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {packagingRequisitions.filter(r => r.hasPendingChange).length > 0 && (
        <div className="card border-l-4 border-l-orange-500">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">⚠️ 排产变更待处置</h2>
              <p className="text-sm text-gray-500 mt-1">以下包装领有关联的灌装排产已变更，请及时确认是否受影响</p>
            </div>
            <button onClick={() => navigate('/packaging')} className="text-sm text-beer-600 hover:text-beer-700">
              查看全部 →
            </button>
          </div>
          <div className="space-y-3">
            {packagingRequisitions.filter(r => r.hasPendingChange).map(req => (
              <button
                key={req.id}
                onClick={() => navigate(`/packaging/${req.id}`)}
                className="w-full p-3 border border-orange-200 bg-orange-50 rounded-lg hover:border-orange-400 hover:bg-orange-100 transition-all text-left group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-orange-700">
                      {req.requisitionNo} - {req.schedule?.productName}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {req.bottleType} · {req.bottleCount}个 · 有 {req.pendingChangeCount} 项变更待处置
                    </div>
                  </div>
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded animate-pulse">
                    待处置
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">角色处理节奏说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-beer-50 rounded-lg border border-beer-100">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">🍺</span>
              <span className="font-medium text-beer-800">酿酒师</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-beer-500">•</span>
                <span>创建并提交灌装排产单</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-beer-500">•</span>
                <span>驳回后修改并补录重提</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-beer-500">•</span>
                <span>通过后开始生产、完成灌装</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-beer-500">•</span>
                <span>审核后发放包装物料</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">📦</span>
              <span className="font-medium text-blue-800">包装主管</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>创建包装领用申请</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>退回后修改并补录重提</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>实时感知关联排产的变更</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>接收物料后确认领用完成</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">💼</span>
              <span className="font-medium text-green-800">销售内勤</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span>复核灌装排产，驳回或通过</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span>审核包装领用，退回或通过</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span>监控排产变更对领用的影响</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span>完成后归档，安排发货</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
