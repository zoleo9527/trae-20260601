import { Scissors, Home, ListChecks, Users } from 'lucide-react';

interface HeaderProps {
  currentPage: 'dashboard' | 'order-detail';
  onNavigate: (page: 'dashboard') => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="bg-navy-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gold-500 p-2 rounded-lg">
              <Scissors className="w-6 h-6 text-navy-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold">定制工坊</h1>
              <p className="text-xs text-navy-300">交付验收与售后调整工作台</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentPage === 'dashboard'
                  ? 'bg-gold-500 text-navy-900'
                  : 'text-navy-300 hover:bg-navy-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">工作台</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-navy-300 hover:bg-navy-800 transition-all">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">订单管理</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-navy-300 hover:bg-navy-800 transition-all">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">客户管理</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
