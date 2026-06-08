import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: string;
  pulse?: boolean;
}

export default function StatCard({ label, value, icon, accent = 'text-slate-600', pulse }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center bg-slate-50 ${accent}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 tracking-tight">
          {pulse && <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse" />}
          {value}
        </div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
