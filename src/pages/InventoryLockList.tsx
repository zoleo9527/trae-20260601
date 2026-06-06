import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, Lock, Unlock, AlertTriangle, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusBadge } from '@/components/StatusBadge';
import type { InventoryLockStatus } from '@/types';
import { INVENTORY_LOCK_STATUS_MAP } from '@/types';

const InventoryLockList: React.FC = () => {
  const navigate = useNavigate();
  const { inventoryLocks } = useStore();

  const [statusFilter, setStatusFilter] = useState<InventoryLockStatus | 'ALL'>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  const stats = useMemo(() => {
    return {
      pending: inventoryLocks.filter(l => l.status === 'PENDING').length,
      locked: inventoryLocks.filter(l => l.status === 'LOCKED').length,
      released: inventoryLocks.filter(l => l.status === 'RELEASED').length,
      expired: inventoryLocks.filter(l => l.status === 'EXPIRED').length,
    };
  }, [inventoryLocks]);

  const warehouses = useMemo(() => {
    const set = new Set(inventoryLocks.map(l => l.warehouseName));
    return Array.from(set);
  }, [inventoryLocks]);

  const isExpiringSoon = (expireAt: string) => {
    const expire = new Date(expireAt).getTime();
    const now = Date.now();
    const diffHours = (expire - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  };

  const filteredLocks = useMemo(() => {
    return inventoryLocks.filter(lock => {
      if (statusFilter !== 'ALL' && lock.status !== statusFilter) return false;
      if (warehouseFilter !== 'ALL' && lock.warehouseName !== warehouseFilter) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        if (
          !lock.lockNo.toLowerCase().includes(keyword) &&
          !lock.sku.toLowerCase().includes(keyword) &&
          !lock.skuName.toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [inventoryLocks, statusFilter, warehouseFilter, searchKeyword]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBizTypeLabel = (bizType: string) => {
    const map: Record<string, string> = {
      preparation: '备货单',
      order: '订单',
      return: '退件',
    };
    return map[bizType] || bizType;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">库存锁定管理</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待锁定</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已锁定</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.locked}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已释放</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.released}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Unlock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已过期</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">筛选：</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InventoryLockStatus | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">全部状态</option>
              {Object.entries(INVENTORY_LOCK_STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">全部仓库</option>
              {warehouses.map(wh => (
                <option key={wh} value={wh}>{wh}</option>
              ))}
            </select>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索锁定单号、SKU、商品名..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">锁定单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">锁定数量</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联业务</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过期时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLocks.map(lock => {
                const expiringSoon = isExpiringSoon(lock.expireAt) && lock.status === 'LOCKED';
                return (
                  <tr
                    key={lock.id}
                    className={`hover:bg-gray-50 transition-colors ${expiringSoon ? 'bg-orange-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => navigate(`/inventory-locks/${lock.id}`)}>
                      {lock.lockNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{lock.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{lock.skuName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{lock.lockQuantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-gray-400">{getBizTypeLabel(lock.bizType)}</span>
                        {lock.bizNo && (
                          <span className="text-blue-600">{lock.bizNo}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lock.status} type="inventory" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${expiringSoon ? 'text-orange-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${expiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                          {formatDate(lock.expireAt)}
                        </span>
                        {expiringSoon && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                            即将过期
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/inventory-locks/${lock.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLocks.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryLockList;
