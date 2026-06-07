import { useState } from 'react';
import { ListFilter, RefreshCw, Wallet, Search, ChevronDown, ChevronUp, Link, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { StatusTag } from '@/components/StatusTag';
import { formatDate, cn } from '@/lib/utils';

type TabType = 'bottles' | 'deposits';

export default function ListPage() {
  const [activeTab, setActiveTab] = useState<TabType>('bottles');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { bottleReturnRecords, depositReconciliations, routes, customers } = useAppStore();

  const filteredBottles = bottleReturnRecords.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return r.customer.name.toLowerCase().includes(term) ||
             r.route.name.toLowerCase().includes(term);
    }
    return true;
  });

  const filteredDeposits = depositReconciliations.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return r.customer.name.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">筛选列表</h2>
        <p className="text-sm text-gray-500 mt-1">
          多维度筛选空瓶回收和押金核对记录
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('bottles')}
              className={cn(
                'flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2',
                activeTab === 'bottles'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              空瓶回收列表
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={cn(
                'flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2',
                activeTab === 'deposits'
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Wallet className="w-4 h-4" />
              押金核对列表
            </button>
          </nav>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'bottles' ? '搜索客户名称或路线...' : '搜索客户名称...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {activeTab === 'bottles' && (
          <div className="divide-y divide-gray-100">
            {filteredBottles.map(record => {
              const linkedDeposit = depositReconciliations.find(d => d.bottleReturnRecordId === record.id);
              return (
                <div key={record.id} className="hover:bg-gray-50">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <RefreshCw className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{record.customer.name}</h4>
                          <p className="text-sm text-gray-500">
                            {record.route.name} · {record.customer.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {record.returnedBottles} / {record.expectedBottles} 个
                          </p>
                          <p className="text-xs text-gray-500">实收 / 预期</p>
                        </div>
                        <StatusTag type="bottle" status={record.status} />
                        {expandedId === record.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedId === record.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 ml-14">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">创建时间</p>
                          <p className="text-sm text-gray-900">{formatDate(record.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">回收时间</p>
                          <p className="text-sm text-gray-900">{record.collectedAt ? formatDate(record.collectedAt) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">运回站点</p>
                          <p className="text-sm text-gray-900">{record.returnedToStationAt ? formatDate(record.returnedToStationAt) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">核验时间</p>
                          <p className="text-sm text-gray-900">{record.verifiedAt ? formatDate(record.verifiedAt) : '-'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">空瓶回收</p>
                          <StatusTag type="bottle" status={record.status} />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">押金核对</p>
                          {linkedDeposit ? (
                            <StatusTag type="deposit" status={linkedDeposit.status} />
                          ) : (
                            <span className="text-xs text-gray-400">未发起</span>
                          )}
                        </div>
                      </div>

                      {linkedDeposit && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-purple-600" />
                            <p className="text-sm font-medium text-purple-800">关联押金核对</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs">预期押金:</span>
                              <span className="text-gray-900 ml-1">¥{linkedDeposit.expectedDeposit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">实收押金:</span>
                              <span className="text-gray-900 ml-1">¥{linkedDeposit.actualDeposit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">差额:</span>
                              <span className={cn(
                                'ml-1 font-medium',
                                linkedDeposit.difference !== 0 ? 'text-red-600' : 'text-green-600'
                              )}>
                                {linkedDeposit.difference >= 0 ? '+' : ''}¥{linkedDeposit.difference}
                              </span>
                            </div>
                          </div>
                          {linkedDeposit.reason && (
                            <p className="text-xs text-purple-700 mt-2">
                              <span className="font-medium">原因:</span> {linkedDeposit.reason}
                            </p>
                          )}
                        </div>
                      )}

                      {record.reason && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                          <p className="text-xs text-yellow-700">
                            <span className="font-medium">原因:</span> {record.reason}
                          </p>
                        </div>
                      )}
                      {record.stuckReason && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-700">
                            <span className="font-medium">卡住原因:</span> {record.stuckReason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'deposits' && (
          <div className="divide-y divide-gray-100">
            {filteredDeposits.map(record => {
              const linkedBottle = bottleReturnRecords.find(b => b.id === record.bottleReturnRecordId);
              return (
                <div key={record.id} className="hover:bg-gray-50">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{record.customer.name}</h4>
                          <p className="text-sm text-gray-500">
                            {record.customer.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ¥{record.actualDeposit} / ¥{record.expectedDeposit}
                          </p>
                          <p className={cn(
                            'text-xs',
                            record.difference !== 0 ? 'text-red-500' : 'text-green-500'
                          )}>
                            差额: {record.difference >= 0 ? '+' : ''}¥{record.difference}
                          </p>
                        </div>
                        <StatusTag type="deposit" status={record.status} />
                        {expandedId === record.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedId === record.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 ml-14">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">创建时间</p>
                          <p className="text-sm text-gray-900">{formatDate(record.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">更新时间</p>
                          <p className="text-sm text-gray-900">{formatDate(record.updatedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">核验人</p>
                          <p className="text-sm text-gray-900">{record.verifiedBy || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">核验时间</p>
                          <p className="text-sm text-gray-900">{record.verifiedAt ? formatDate(record.verifiedAt) : '-'}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">空瓶回收（上游）</p>
                          {linkedBottle ? (
                            <StatusTag type="bottle" status={linkedBottle.status} />
                          ) : (
                            <span className="text-xs text-gray-400">未关联</span>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">押金核对（下游）</p>
                          <StatusTag type="deposit" status={record.status} />
                        </div>
                      </div>

                      {linkedBottle && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-medium text-blue-800">关联空瓶回收</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs">路线:</span>
                              <span className="text-gray-900 ml-1">{linkedBottle.route.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">预期:</span>
                              <span className="text-gray-900 ml-1">{linkedBottle.expectedBottles}个</span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">实收:</span>
                              <span className="text-gray-900 ml-1">{linkedBottle.returnedBottles}个</span>
                            </div>
                          </div>
                          {linkedBottle.stuckReason && (
                            <p className="text-xs text-red-600 mt-2">
                              <span className="font-medium">卡住原因:</span> {linkedBottle.stuckReason}
                            </p>
                          )}
                        </div>
                      )}

                      {record.reason && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                          <p className="text-xs text-yellow-700">
                            <span className="font-medium">原因:</span> {record.reason}
                          </p>
                        </div>
                      )}
                      {record.stuckReason && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-700">
                            <span className="font-medium">卡住原因:</span> {record.stuckReason}
                          </p>
                        </div>
                      )}
                      {record.disputeReason && (
                        <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                          <p className="text-xs text-orange-700">
                            <span className="font-medium">争议说明:</span> {record.disputeReason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {((activeTab === 'bottles' && filteredBottles.length === 0) ||
          (activeTab === 'deposits' && filteredDeposits.length === 0)) && (
          <div className="p-12 text-center">
            <ListFilter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无符合条件的记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
