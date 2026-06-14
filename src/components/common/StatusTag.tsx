import { ReactNode } from 'react';

interface StatusTagProps {
  status: string;
  label: string;
  colorClass?: string;
  children?: ReactNode;
}

export function StatusTag({ status, label, colorClass = 'bg-gray-100 text-gray-700', children }: StatusTagProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {children || label}
    </span>
  );
}
