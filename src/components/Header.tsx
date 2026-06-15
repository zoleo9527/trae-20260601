import { Cpu, BarChart3, FileText, Package, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const tabs = [
    { id: 'dashboard', label: '仪表盘', icon: BarChart3 },
    { id: 'testing', label: '烤机测试', icon: Cpu },
    { id: 'approval', label: '交付验收', icon: FileText },
    { id: 'exceptions', label: '异常管理', icon: AlertTriangle },
    { id: 'export', label: '导出任务', icon: Package },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Cpu className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">电脑装机店</h1>
            <span className="text-sm text-gray-500">- 烤机测试与交付验收</span>
          </div>
          
          <nav className="flex items-center gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
