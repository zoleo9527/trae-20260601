import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, GitCompare, AlertTriangle, ChefHat, Utensils, Building, Minus, Plus, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ChangeTypeBadge, ImpactScopeBadge } from '@/components/Badges';
import TableLayout from '@/components/TableLayout';
import { getChangeTypeLabel, getImpactScopeLabel } from '@/utils/compareUtils';
import type { VersionDiff, MaterialItem, Table } from '@shared/types';

export default function VersionCompare() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentBanquet, fetchBanquet, compareResult, compareVersions, clearCompareResult, loading } = useAppStore();
  const [v1, setV1] = useState<number>(Number(searchParams.get('v1')) || 1);
  const [v2, setV2] = useState<number>(Number(searchParams.get('v2')) || 2);

  useEffect(() => {
    if (id) {
      fetchBanquet(id);
    }
    return () => clearCompareResult();
  }, [id, fetchBanquet, clearCompareResult]);

  useEffect(() => {
    if (id && v1 && v2) {
      compareVersions(id, v1, v2);
    }
  }, [id, v1, v2, compareVersions]);

  if (loading && !compareResult) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-champagne-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentBanquet || !compareResult) {
    return (
      <div className="text-center py-20">
        <GitCompare className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">请选择两个版本进行对比</h3>
        <Link to={`/banquet/${id}`} className="text-wine-600 hover:text-wine-800">返回详情</Link>
      </div>
    );
  }

  const renderMaterialDiff = (diff: VersionDiff) => {
    const oldMats = diff.oldValue as MaterialItem[];
    const newMats = diff.newValue as MaterialItem[];
    
    const allNames = new Set([...oldMats, ...newMats].map(m => m.name));
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
          <Building size={14} />
          <span>物资变更明细</span>
        </div>
        {Array.from(allNames).map(name => {
          const oldMat = oldMats.find(m => m.name === name);
          const newMat = newMats.find(m => m.name === name);
          
          if (!oldMat) {
            return (
              <div key={name} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Plus size={16} className="text-green-600" />
                <span className="flex-1">{name}</span>
                <span className="text-green-700 font-medium">
                  新增 {newMat?.quantity} {newMat?.unit}
                </span>
              </div>
            );
          }
          
          if (!newMat) {
            return (
              <div key={name} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Minus size={16} className="text-red-600" />
                <span className="flex-1">{name}</span>
                <span className="text-red-700 font-medium line-through">
                  移除 {oldMat.quantity} {oldMat.unit}
                </span>
              </div>
            );
          }
          
          if (oldMat.quantity !== newMat.quantity) {
            return (
              <div key={name} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <ArrowRight size={16} className="text-amber-600" />
                <span className="flex-1">{name}</span>
                <span className="text-gray-500 line-through">{oldMat.quantity} {oldMat.unit}</span>
                <ArrowRight size={12} className="text-gray-400" />
                <span className="text-amber-700 font-medium">{newMat.quantity} {newMat.unit}</span>
              </div>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  const renderTableDiff = (diff: VersionDiff) => {
    const oldTables = diff.oldValue as Table[];
    const newTables = diff.newValue as Table[];
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
          <Utensils size={14} />
          <span>桌型变更明细</span>
        </div>
        {oldTables.length !== newTables.length && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <ArrowRight size={16} className="text-amber-600" />
            <span className="flex-1">桌数变更</span>
            <span className="text-gray-500">{oldTables.length} 桌</span>
            <ArrowRight size={12} className="text-gray-400" />
            <span className="text-amber-700 font-medium">{newTables.length} 桌</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/banquet/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-wine-700 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>返回详情</span>
        </button>
      </div>

      <div className="bg-gradient-to-r from-wine-800 via-wine-700 to-wine-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <GitCompare size={28} className="text-champagne-400" />
          <div>
            <h2 className="font-display text-2xl font-bold">方案版本对比</h2>
            <p className="text-champagne-200/90">{currentBanquet.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-champagne-200/70 mb-2">旧版本</label>
            <select
              value={v1}
              onChange={(e) => setV1(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-champagne-500"
            >
              {currentBanquet.versions.map(v => (
                <option key={v.version} value={v.version} className="text-gray-800">
                  v{v.version} - {new Date(v.createdAt).toLocaleDateString('zh-CN')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-champagne-200/70 mb-2">新版本</label>
            <select
              value={v2}
              onChange={(e) => setV2(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-champagne-500"
            >
              {currentBanquet.versions.map(v => (
                <option key={v.version} value={v.version} className="text-gray-800">
                  v{v.version} - {new Date(v.createdAt).toLocaleDateString('zh-CN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="text-3xl font-bold">{compareResult.summary.totalChanges}</div>
            <div className="text-xs text-champagne-200/70">总变更数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-300">{compareResult.summary.hallChanges}</div>
            <div className="text-xs text-champagne-200/70">厅面变更</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-300">{compareResult.summary.kitchenChanges}</div>
            <div className="text-xs text-champagne-200/70">后厨变更</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-300">{compareResult.summary.bothChanges}</div>
            <div className="text-xs text-champagne-200/70">双部门影响</div>
          </div>
        </div>
      </div>

      {compareResult.differences.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-champagne-100">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">两个版本完全一致</h3>
          <p className="text-gray-500">没有检测到任何差异</p>
        </div>
      ) : (
        <div className="space-y-4">
          {compareResult.differences.map((diff, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border border-champagne-100 overflow-hidden stagger-item"
              style={{ animationDelay: `${index * 0.1}s`, transform: 'translateY(20px)' }}
            >
              <div className="bg-gradient-to-r from-champagne-50 to-wine-50 px-5 py-4 border-b border-champagne-100">
                <div className="flex flex-wrap items-center gap-3">
                  <ChangeTypeBadge type={diff.changeType} />
                  <ImpactScopeBadge scope={diff.impactScope} />
                  <span className="text-lg font-semibold text-gray-800">
                    {getChangeTypeLabel(diff.changeType)}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    影响: {getImpactScopeLabel(diff.impactScope)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                {diff.field === 'materials' && renderMaterialDiff(diff)}
                {diff.field === 'tableLayout' && renderTableDiff(diff)}
                {diff.field === 'hall' && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Building size={18} className="text-amber-600" />
                    <span className="flex-1">场地变更</span>
                    <span className="text-gray-500 line-through">{diff.oldValue as string}</span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="text-amber-700 font-medium">{diff.newValue as string}</span>
                  </div>
                )}
                {diff.field === 'soundSystem' && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={18} className="text-amber-600" />
                      <span className="font-medium text-amber-800">音响设备变更</span>
                    </div>
                    <p className="text-sm text-amber-700">音响系统配置有更新，请检查设备清单</p>
                  </div>
                )}
                {diff.field === 'remark' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800">备注变更：</span>
                      {diff.newValue as string}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            v{v1} 会场布局
          </h3>
          <TableLayout
            tables={compareResult.version1.tableLayout}
            hallName={compareResult.version1.hall}
          />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-wine-600"></span>
            v{v2} 会场布局
          </h3>
          <TableLayout
            tables={compareResult.version2.tableLayout}
            hallName={compareResult.version2.hall}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-champagne-100 p-5">
        <h3 className="font-display text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ChefHat size={20} className="text-forest-600" />
          后厨变更影响分析
        </h3>
        {compareResult.differences.filter(d => d.impactScope === 'kitchen' || d.impactScope === 'both').length === 0 ? (
          <p className="text-gray-500 text-center py-4">本次变更不影响后厨备餐</p>
        ) : (
          <div className="space-y-3">
            {compareResult.differences
              .filter(d => d.impactScope === 'kitchen' || d.impactScope === 'both')
              .map((diff, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-forest-50 rounded-lg border border-forest-200">
                  <AlertTriangle size={16} className="text-forest-600" />
                  <div className="flex-1">
                    <div className="font-medium text-forest-800">{getChangeTypeLabel(diff.changeType)}</div>
                    <div className="text-sm text-forest-600">
                      {diff.field === 'tableCount' && '请调整备餐数量'}
                      {diff.field === 'materials' && '请核对物资清单变化'}
                      {diff.field === 'tableLayout' && '桌数变更可能影响上菜顺序'}
                      {diff.field === 'hall' && '换厅可能影响传菜动线'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
