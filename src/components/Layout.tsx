import { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import {
  LayoutDashboard,
  ClipboardList,
  ChevronDown,
  User,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import type { UserRole } from '../types/order';
import { exportToExcel, exportToJSON, downloadImportTemplate } from '../utils/export';

interface LayoutProps {
  children: React.ReactNode;
}

const roles: UserRole[] = ['客服', '工程师', '配件管理员'];

export const Layout = ({ children }: LayoutProps) => {
  const { currentRole, currentUser, orders, setCurrentRole, handleImportFile: importFileFromStore, resetToMock, getVisibleOrders } =
    useOrderStore();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportExcel = () => {
    exportToExcel(orders);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    exportToJSON(orders);
    setShowExportMenu(false);
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const count = await importFileFromStore(file);
          alert(`成功导入 ${count} 条工单数据`);
        } catch (err) {
          alert('导入失败：' + (err as Error).message);
        }
      }
    };
    input.click();
    setShowExportMenu(false);
  };

  const handleDownloadTemplate = () => {
    downloadImportTemplate();
    setShowExportMenu(false);
  };

  const handleReset = () => {
    if (confirm('确定要恢复默认样例数据吗？当前数据将被覆盖。')) {
      resetToMock();
    }
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-slate-900 text-white flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            家电售后管理
          </h1>
          <p className="text-xs text-slate-400 mt-1">完工收费与电子回单</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <a
            href="#/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-slate-800 text-white"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm">工作台</span>
          </a>
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            恢复样例数据
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-slate-800">工作台</h2>
            <span className="text-sm text-slate-500">共 {getVisibleOrders().length} 条工单</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
                导入/导出
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                  <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-100">导出</div>
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    导出 Excel
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    导出 JSON
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-100">导入（旧台账）</div>
                  <button
                    onClick={handleImportFile}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    导入 Excel/CSV/JSON
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    下载导入模板
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">
                  {currentRole} · {currentUser}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showRoleDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                  <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-100">
                    切换角色
                  </div>
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentRole(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                        currentRole === role ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
