import type { FinanceRecord, User } from '~/types';
import { formatDate, getStatusLabel, getStatusColor, getFinancDocumentStatusLabel, formatDaysRemaining } from '~/utils/formatters';

interface FinanceRecordsProps {
  records: FinanceRecord[];
  financeStaff?: User;
}

export default function FinanceRecords({ records, financeStaff }: FinanceRecordsProps) {
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const overdueCount = records.filter(r => r.status === 'overdue').length;
  
  const now = new Date();
  const overdueRecords = records.filter(r => r.status === 'pending' && new Date(r.dueDate) < now);
  const pendingRecords = records.filter(r => r.status === 'pending' && new Date(r.dueDate) >= now);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">金融资料</h2>
            <div className="flex items-center space-x-4 mt-2 text-purple-100 text-sm">
              <span>经办人: {financeStaff?.name || '未知'}</span>
              <span>已完成: {completedCount} 项</span>
              <span>待补件: {pendingCount} 项</span>
              {overdueCount > 0 && (
                <span className="text-red-200">⚠️ 逾期: {overdueCount} 项</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {overdueRecords.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3 flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              逾期资料 ({overdueRecords.length})
            </h3>
            <div className="space-y-3">
              {overdueRecords.map((record) => (
                <div 
                  key={record.id} 
                  className="bg-white rounded-lg p-3 border border-red-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">
                          {record.type === 'loan_application' && '💰'}
                          {record.type === 'document' && '📄'}
                          {record.type === 'approval' && '✅'}
                          {record.type === 'rejection' && '❌'}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{record.documentName}</div>
                          <div className="text-xs text-red-600">
                            已逾期 {formatDaysRemaining(new Date(record.dueDate))}
                          </div>
                        </div>
                      </div>
                      {record.note && (
                        <p className="text-sm text-gray-600 mb-2">{record.note}</p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-500">
                          负责人: {record.assigneeName}
                        </div>
                        <div className="text-gray-500">
                          截止日期: {formatDate(new Date(record.dueDate))}
                        </div>
                      </div>
                      {record.remindedCount > 0 && (
                        <div className="mt-2 text-xs text-orange-600">
                          已提醒 {record.remindedCount} 次
                          {record.lastRemindedAt && (
                            <span> (上次: {formatDate(new Date(record.lastRemindedAt))})</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                      催办
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRecords.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-xl mr-2">📋</span>
              待处理资料 ({pendingRecords.length})
            </h3>
            <div className="space-y-3">
              {pendingRecords.map((record) => {
                const daysRemaining = formatDaysRemaining(new Date(record.dueDate));
                const isUrgent = daysRemaining.includes('1天') || daysRemaining.includes('2天');
                
                return (
                  <div 
                    key={record.id} 
                    className={`border rounded-lg p-4 ${
                      isUrgent ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">
                            {record.type === 'loan_application' && '💰'}
                            {record.type === 'document' && '📄'}
                            {record.type === 'approval' && '✅'}
                            {record.type === 'rejection' && '❌'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">{record.documentName}</div>
                            <div className={`text-xs ${isUrgent ? 'text-orange-600' : 'text-gray-500'}`}>
                              {daysRemaining}
                            </div>
                          </div>
                        </div>
                        {record.note && (
                          <p className="text-sm text-gray-600 mb-2">{record.note}</p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-gray-500">
                            负责人: {record.assigneeName}
                          </div>
                          <div className="text-gray-500">
                            截止日期: {formatDate(new Date(record.dueDate))}
                          </div>
                        </div>
                        {record.remindedCount > 0 && (
                          <div className="mt-2 text-xs text-blue-600">
                            已提醒 {record.remindedCount} 次
                          </div>
                        )}
                      </div>
                      <button className={`px-3 py-1 text-xs rounded ${
                        isUrgent 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}>
                        提醒
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-xl mr-2">✅</span>
            已完成资料 ({completedCount})
          </h3>
          <div className="space-y-3">
            {records.filter(r => r.status === 'completed').map((record) => (
              <div 
                key={record.id} 
                className="border border-green-200 rounded-lg p-4 bg-green-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">
                        {record.type === 'loan_application' && '💰'}
                        {record.type === 'document' && '📄'}
                        {record.type === 'approval' && '✅'}
                        {record.type === 'rejection' && '❌'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{record.documentName}</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getFinancDocumentStatusLabel(record.status)}
                        </span>
                      </div>
                    </div>
                    {record.note && (
                      <p className="text-sm text-gray-600 mb-2">{record.note}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>创建人: {record.createdByName}</div>
                      <div>完成时间: {formatDate(new Date(record.updatedAt))}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {records.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💰</div>
            <p>暂无金融记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
