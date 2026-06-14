import { useState } from 'react';
import { Link, useParams } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/node';
import Timeline from '~/components/Timeline';
import InspectionReport from '~/components/InspectionReport';
import PreparationTasks from '~/components/PreparationTasks';
import FinanceRecords from '~/components/FinanceRecords';
import { getVehicleById, getReportByVehicleId, getTasksByVehicleId, getEventsByVehicleId, getFinanceRecordsByVehicleId, getUserById, getCostBudgetByVehicleId, getTasksCostSummary, getOperationRecordsByVehicleId, getNextAvailableTransitions } from '~/utils/data';
import { formatDate, formatMoney, getStatusLabel, getStatusColor, getRoleLabel, getCostStatus, getTaskStatusProgress } from '~/utils/formatters';

export const meta: MetaFunction = ({ params }) => {
  const vehicle = getVehicleById(params.id || '');
  return [
    { title: `${vehicle?.licensePlate} - 车辆详情` },
    { name: 'description', content: `${vehicle?.brand} ${vehicle?.model} 检测报告与整备计划` },
  ];
};

type TabType = 'overview' | 'inspection' | 'preparation' | 'finance' | 'audit';

export default function VehicleDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const vehicle = getVehicleById(id || '');
  const report = vehicle ? getReportByVehicleId(id || '') : undefined;
  const tasks = getTasksByVehicleId(id || '');
  const events = getEventsByVehicleId(id || '');
  const financeRecords = getFinanceRecordsByVehicleId(id || '');
  const costBudget = vehicle ? getCostBudgetByVehicleId(id || '') : undefined;
  const operationRecords = vehicle ? getOperationRecordsByVehicleId(id || '') : [];
  const costSummary = vehicle ? getTasksCostSummary(id || '') : { totalEstimated: 0, totalActual: 0, completedCost: 0, pendingCost: 0 };

  const manager = vehicle ? getUserById(vehicle.managerId) : undefined;
  const assessor = vehicle && vehicle.assessorId ? getUserById(vehicle.assessorId) : undefined;
  const financeStaff = vehicle && vehicle.financeId ? getUserById(vehicle.financeId) : undefined;
  const currentAssignee = vehicle ? getUserById(vehicle.currentAssigneeId) : undefined;

  const taskProgress = getTaskStatusProgress(tasks);
  const costStatus = costBudget ? getCostStatus(costSummary.totalActual, costBudget.estimatedBudget) : { status: 'normal' as const, message: '暂无预算' };
  const availableTransitions = vehicle ? getNextAvailableTransitions(vehicle.status) : [];

  const tabs: { id: TabType; label: string; badge?: string | number }[] = [
    { id: 'overview', label: '详情时间线' },
    { id: 'inspection', label: '检测报告', badge: report?.hasAccidentRecords ? '!' : undefined },
    { id: 'preparation', label: '整备计划', badge: costStatus.status === 'warning' || costStatus.status === 'overrun' ? '!' : undefined },
    { id: 'finance', label: '金融资料' },
    { id: 'audit', label: '审计记录' },
  ];

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚗</div>
        <h3 className="text-lg font-medium text-gray-900">车辆不存在</h3>
        <p className="text-gray-500 mt-1">未找到指定的车辆记录</p>
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 mt-4"
        >
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            ← 返回列表
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{vehicle.brand} {vehicle.model}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {getStatusLabel(vehicle.status)}
              </span>
            </div>
            <p className="text-gray-500 mt-1">车牌: {vehicle.licensePlate}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{formatMoney(vehicle.estimatedValue)}</div>
          <div className="text-sm text-gray-500">预估价值</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🔄 接力式工作流程</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${vehicle.managerId ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
              <span className="text-2xl">👔</span>
              <div>
                <div className="text-xs text-gray-500">收车经理</div>
                <div className="text-sm font-medium text-gray-900">{manager?.name || '待分配'}</div>
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${vehicle.assessorId ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
              <span className="text-2xl">🔍</span>
              <div>
                <div className="text-xs text-gray-500">评估师</div>
                <div className="text-sm font-medium text-gray-900">{assessor?.name || '待分配'}</div>
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${vehicle.financeId ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-xs text-gray-500">金融专员</div>
                <div className="text-sm font-medium text-gray-900">{financeStaff?.name || '待分配'}</div>
              </div>
            </div>
          </div>
          <div className="ml-4 px-4 py-2 bg-white rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">当前负责人</div>
            <div className="text-sm font-semibold text-blue-600">{currentAssignee?.name || '未知'}</div>
            <div className="text-xs text-gray-400">{getRoleLabel(vehicle.currentAssigneeRole)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-gray-500">年份</span>
            <div className="text-lg font-semibold text-gray-900 mt-1">{vehicle.year}年</div>
          </div>
          <div>
            <span className="text-gray-500">里程</span>
            <div className="text-lg font-semibold text-gray-900 mt-1">{(vehicle.mileage / 10000).toFixed(1)}万公里</div>
          </div>
          <div>
            <span className="text-gray-500">颜色</span>
            <div className="text-lg font-semibold text-gray-900 mt-1">{vehicle.color}</div>
          </div>
          <div>
            <span className="text-gray-500">收车价</span>
            <div className="text-lg font-semibold text-gray-900 mt-1">{formatMoney(vehicle.purchasePrice)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <span className="text-gray-500">入库时间</span>
            <div className="text-sm font-medium text-gray-900 mt-1">{formatDate(new Date(vehicle.createdAt))}</div>
          </div>
          <div>
            <span className="text-gray-500">最后更新</span>
            <div className="text-sm font-medium text-gray-900 mt-1">{formatDate(new Date(vehicle.updatedAt))}</div>
          </div>
          <div>
            <span className="text-gray-500">任务进度</span>
            <div className="text-sm font-medium text-gray-900 mt-1">
              {taskProgress.completed}/{taskProgress.total} ({taskProgress.percentage}%)
            </div>
          </div>
          <div>
            <span className="text-gray-500">整备成本</span>
            <div className={`text-sm font-medium mt-1 ${
              costStatus.status === 'overrun' ? 'text-red-600' : 
              costStatus.status === 'warning' ? 'text-orange-600' : 'text-gray-900'
            }`}>
              {formatMoney(costSummary.totalActual)} / {formatMoney(costBudget?.estimatedBudget || 0)}
              {costStatus.status !== 'normal' && (
                <span className="ml-2 text-xs">⚠️</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {vehicle.statusHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 状态历史</h3>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {vehicle.statusHistory.map((history, index) => (
              <div key={index} className="flex items-center space-x-2 flex-shrink-0">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                  {getStatusLabel(history.status)}
                </div>
                <div className="text-xs text-gray-400">
                  {getUserById(history.changedBy)?.name || history.changedByName}
                </div>
                <div className="text-xs text-gray-300">
                  {formatDate(new Date(history.changedAt))}
                </div>
                {index < vehicle.statusHistory.length - 1 && (
                  <span className="text-gray-300 mx-1">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  !
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">操作时间线</h2>
              <Timeline events={events} operationRecords={operationRecords.slice(0, 10)} />
            </div>
          )}

          {activeTab === 'inspection' && (
            <div>
              {report ? (
                <InspectionReport report={report} inspector={assessor} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900">暂无检测报告</h3>
                  <p className="text-gray-500 mt-1">该车辆尚未完成检测</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preparation' && (
            <PreparationTasks 
              tasks={tasks} 
              assignees={tasks.map(t => ({ id: t.assigneeId, name: t.assigneeName })) as any} 
              costBudget={costBudget}
              costSummary={costSummary}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceRecords records={financeRecords} financeStaff={financeStaff} />
          )}

          {activeTab === 'audit' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">审计记录</h2>
              <div className="space-y-4">
                {operationRecords.length > 0 ? (
                  operationRecords.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{record.action}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              record.actorRole === 'manager' ? 'bg-purple-100 text-purple-800' :
                              record.actorRole === 'assessor' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {getRoleLabel(record.actorRole)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{record.note}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>操作人: {record.actorName}</span>
                            <span>时间: {formatDate(new Date(record.createdAt))}</span>
                          </div>
                          {record.previousValue && record.newValue && (
                            <div className="mt-2 text-xs text-gray-600">
                              变更: <span className="line-through">{getStatusLabel(record.previousValue)}</span>
                              <span className="mx-1">→</span>
                              <span>{getStatusLabel(record.newValue)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    暂无审计记录
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
