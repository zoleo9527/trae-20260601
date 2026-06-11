'use client';

import RoleSwitcher from './RoleSwitcher';
import { resetAllData } from '@/services/dataService';
import { useApp } from '@/context/AppContext';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { triggerRefresh } = useApp();

  const handleReset = async () => {
    if (window.confirm('确定要重置所有数据吗？此操作不可恢复。')) {
      await resetAllData();
      triggerRefresh();
      alert('数据已重置');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        <RoleSwitcher />
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          重置数据
        </button>
      </div>
    </header>
  );
}
