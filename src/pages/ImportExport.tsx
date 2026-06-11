import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  FileText, 
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  FileJson,
  Trash2
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { IOService } from '@/services/io';
import { formatDateTime, formatCurrency } from '@/utils/format';

export function ImportExport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const { promotions, mergeImportedState, clearAllData } = useAppStore();
  
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    promotionCount?: number;
    recentItemCount?: number;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportJSON = () => {
    const result = IOService.exportFullState();
    const blob = new Blob([result], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `促销活动数据_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    try {
      IOService.exportExcel(promotions, `促销活动数据_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      setImportResult({
        success: false,
        message: '导出 Excel 失败，请稍后重试。',
      });
    }
  };

  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportExcelClick = () => {
    excelInputRef.current?.click();
  };

  const handleJSONFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = IOService.importJSON(text);
      
      if (result.success && result.data) {
        let mergeResult;
        if (result.fullState) {
          mergeResult = mergeImportedState({
            promotions: result.fullState.promotions,
            recentItems: result.fullState.recentItems,
            currentRole: result.fullState.currentRole,
          });
        } else {
          mergeResult = mergeImportedState({
            promotions: result.data,
          });
        }
        
        const parts = [`${mergeResult.promotionCount} 条促销活动`];
        if (mergeResult.recentItemCount > 0) {
          parts.push(`${mergeResult.recentItemCount} 条最近打开记录`);
        }
        if (result.fullState) {
          parts.push('角色设置已同步');
        }
        
        setImportResult({
          success: true,
          message: `成功导入${parts.join('、')}。`,
          promotionCount: mergeResult.promotionCount,
          recentItemCount: mergeResult.recentItemCount,
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || '导入失败，文件格式不正确。',
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: '读取文件失败，请确保文件格式正确。',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const result = IOService.importExcel(buffer);
      
      if (result.success && result.data) {
        const mergeResult = mergeImportedState({
          promotions: result.data,
        });
        
        setImportResult({
          success: true,
          message: `成功从 Excel 导入 ${mergeResult.promotionCount} 条促销活动数据。`,
          promotionCount: mergeResult.promotionCount,
          recentItemCount: mergeResult.recentItemCount,
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || '导入失败，Excel 格式不正确。',
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: '读取 Excel 文件失败，请确保文件格式正确。',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleClearAll = () => {
    clearAllData();
    setShowClearConfirm(false);
    setImportResult({
      success: true,
      message: '已清空所有数据。',
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-500">数据导入导出</h1>
          <p className="text-sm text-slate-500 mt-1">批量导入导出促销活动数据，支持 JSON 和 Excel 格式</p>
        </div>
      </div>

      {importResult && (
        <div className={`card p-4 flex items-start gap-3 ${
          importResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          {importResult.success ? (
            <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              importResult.success ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {importResult.success ? '操作成功' : '操作失败'}
            </p>
            <p className={`text-sm mt-1 ${
              importResult.success ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {importResult.message}
            </p>
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            关闭
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-navy-500 mb-5 flex items-center gap-2">
            <Download size={20} className="text-emerald-500" />
            导出数据
          </h2>
          
          <p className="text-sm text-slate-600 mb-6">
            将当前所有促销活动数据导出为文件，方便备份或迁移。
          </p>

          <div className="space-y-4">
            <button
              onClick={handleExportJSON}
              className="w-full p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-navy-300 hover:bg-navy-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileJson size={24} className="text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700 group-hover:text-navy-600">导出为 JSON</p>
                <p className="text-xs text-slate-500 mt-0.5">完整数据格式，适合系统间迁移</p>
              </div>
              <Download size={18} className="text-slate-400 group-hover:text-navy-500" />
            </button>

            <button
              onClick={handleExportExcel}
              className="w-full p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-navy-300 hover:bg-navy-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <FileSpreadsheet size={24} className="text-emerald-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700 group-hover:text-navy-600">导出为 Excel</p>
                <p className="text-xs text-slate-500 mt-0.5">表格格式，方便查看和打印</p>
              </div>
              <Download size={18} className="text-slate-400 group-hover:text-navy-500" />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3">导出数据包含：</p>
            <div className="flex flex-wrap gap-2">
              {['活动信息', '审批步骤', '备注记录', '销售数据', '最近打开', '角色设置'].map((item) => (
                <span key={item} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-navy-500 mb-5 flex items-center gap-2">
            <Upload size={20} className="text-amber-500" />
            导入数据
          </h2>
          
          <p className="text-sm text-slate-600 mb-6">
            从文件导入促销活动数据，将合并到现有数据中。
          </p>

          <div className="space-y-4">
            <button
              onClick={handleImportJSONClick}
              className="w-full p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileJson size={24} className="text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700 group-hover:text-navy-600">导入 JSON 文件</p>
                <p className="text-xs text-slate-500 mt-0.5">导入系统导出的 JSON 格式数据</p>
              </div>
              <Upload size={18} className="text-slate-400 group-hover:text-amber-500" />
            </button>

            <button
              onClick={handleImportExcelClick}
              className="w-full p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <FileSpreadsheet size={24} className="text-emerald-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700 group-hover:text-navy-600">导入 Excel 文件</p>
                <p className="text-xs text-slate-500 mt-0.5">导入符合模板格式的 Excel 数据</p>
              </div>
              <Upload size={18} className="text-slate-400 group-hover:text-amber-500" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleJSONFileChange}
            className="hidden"
          />
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelFileChange}
            className="hidden"
          />

          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-600 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>
                导入操作不会覆盖现有数据，而是将新数据追加到现有列表中。
                请确保导入的文件格式正确。
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2">
            <FileText size={20} className="text-purple-500" />
            当前数据预览
            <span className="text-sm font-normal text-slate-400 ml-2">
              ({promotions.length} 条)
            </span>
          </h2>
          {promotions.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 size={14} />
              清空所有
            </button>
          )}
        </div>

        {showClearConfirm && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 mb-3">
              确定要清空所有数据吗？此操作不可恢复，建议先导出备份。
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                className="btn btn-danger text-sm"
              >
                确认清空
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {promotions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    活动标题
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    品牌/专柜
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    周期
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    预算
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    更新时间
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotions.map((promotion) => (
                  <tr 
                    key={promotion.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/promotion/${promotion.id}`)}
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                        {promotion.title}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">{promotion.brand}</p>
                      <p className="text-xs text-slate-400">{promotion.counter}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">{promotion.type}</p>
                      <p className="text-xs text-slate-400">
                        {promotion.startDate} ~ {promotion.endDate}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-slate-700">
                        {formatCurrency(promotion.budget)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={promotion.status} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-slate-500">
                        {formatDateTime(promotion.updatedAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="暂无数据"
            description="当前没有促销活动数据，可以创建新活动或导入数据。"
          />
        )}
      </div>
    </div>
  );
}
