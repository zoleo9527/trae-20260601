import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Filter } from 'lucide-react';
import { Button, Card } from '@/components/common';
import { MaterialCard } from '@/components/material';
import { useMaterialStore } from '@/store';
import { MaterialStatus } from '@/types';
import { MaterialStatusConfig } from '@/constants';
import clsx from 'clsx';

export const MaterialListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { materials, fetchMaterials, isLoading } = useMaterialStore();

  const currentStatus = searchParams.get('status') as MaterialStatus | null;

  React.useEffect(() => {
    fetchMaterials();
  }, []);

  const filteredMaterials = currentStatus
    ? materials.filter(m => m.status === currentStatus)
    : materials;

  const statusFilters: { status: MaterialStatus | null; label: string; count: number }[] = [
    { status: null, label: '全部', count: materials.length },
    { status: 'NOT_STARTED', label: '未开始', count: materials.filter(m => m.status === 'NOT_STARTED').length },
    { status: 'IN_PROGRESS', label: '准备中', count: materials.filter(m => m.status === 'IN_PROGRESS').length },
    { status: 'BLOCKED', label: '受阻', count: materials.filter(m => m.status === 'BLOCKED').length },
    { status: 'READY', label: '已就绪', count: materials.filter(m => m.status === 'READY').length },
    { status: 'IN_USE', label: '使用中', count: materials.filter(m => m.status === 'IN_USE').length },
    { status: 'RETURNED', label: '已归还', count: materials.filter(m => m.status === 'RETURNED').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">物料清单</h1>
          <p className="text-gray-600 mt-1">管理所有活动的物料准备情况</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          {statusFilters.map((filter) => {
            const isActive = filter.status === currentStatus;
            const config = filter.status ? MaterialStatusConfig[filter.status] : null;

            return (
              <button
                key={filter.label}
                onClick={() => {
                  if (filter.status) {
                    setSearchParams({ status: filter.status });
                  } else {
                    setSearchParams({});
                  }
                }}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-museum-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {filter.label} ({filter.count})
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无物料数据</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onClick={() => navigate(`/materials/${material.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
