import { useState, useEffect, useCallback } from 'react';
import PressureBar from '@/components/PressureBar';
import TodoList from '@/components/TodoList';
import CoopStatusGrid from '@/components/CoopStatusGrid';
import AnomalyDrawer from '@/components/AnomalyDrawer';
import { api } from '@/lib/api';
import type { DashboardStats, TodoItem, CoopStatus } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [coops, setCoops] = useState<CoopStatus[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, todosRes, coopsRes] = await Promise.all([
        api.dashboard.stats().catch(() => ({ data: null })),
        api.dashboard.todos().catch(() => ({ data: [] })),
        api.dashboard.coopStatus().catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setTodos(todosRes.data || []);
      setCoops(coopsRes.data || []);
    } catch {
      // use empty defaults
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [fetchData]);

  return (
    <div>
      <PressureBar stats={stats} />
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-farm-orange rounded-full" />
            我的待办
          </h3>
          <TodoList todos={todos} />
        </div>
        <div className="col-span-3">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-farm-green rounded-full" />
            鸡舍状态
          </h3>
          <CoopStatusGrid coops={coops} />
        </div>
      </div>
      <AnomalyDrawer />
    </div>
  );
}
