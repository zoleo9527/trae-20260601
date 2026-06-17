import { BarChart3, ClipboardList, CheckSquare, Headphones } from 'lucide-react';
import { UserSwitcher } from './UserSwitcher';

interface HeaderProps {
    currentPage: string;
    onPageChange: (page: string) => void;
}

export const Header = ({ currentPage, onPageChange }: HeaderProps) => {
    const navItems = [
        { id: 'workbench', label: '异常放行', icon: BarChart3 },
        { id: 'records', label: '放行记录', icon: ClipboardList },
        { id: 'approval', label: '审批管理', icon: CheckSquare },
        { id: 'customer_service', label: '客服处理', icon: Headphones }
    ];

    return (
        <header className="bg-blue-800 text-white shadow-lg sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
                <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-xl font-bold truncate">景区票务异常放行系统</h1>
                            <p className="text-blue-200 text-xs sm:text-sm hidden sm:block">入园检票与异常放行管理</p>
                        </div>
                    </div>

                    <nav className="flex items-center space-x-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onPageChange(item.id)}
                                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-blue-100 hover:bg-blue-700'
                                    }`}
                                >
                                    <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <UserSwitcher />
                </div>
            </div>
        </header>
    );
};
