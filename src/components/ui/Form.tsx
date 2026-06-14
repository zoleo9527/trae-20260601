import React from 'react';
import { cn } from '@/lib/utils';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...rest }) => (
  <input
    className={cn(
      'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-bank-500 focus:outline-none focus:ring-2 focus:ring-bank-100',
      className,
    )}
    {...rest}
  />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  ...rest
}) => (
  <textarea
    className={cn(
      'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-bank-500 focus:outline-none focus:ring-2 focus:ring-bank-100',
      className,
    )}
    {...rest}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className,
  children,
  ...rest
}) => (
  <select
    className={cn(
      'h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:border-bank-500 focus:outline-none focus:ring-2 focus:ring-bank-100',
      className,
    )}
    {...rest}
  >
    {children}
  </select>
);

export const Label: React.FC<{
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}> = ({ children, className, htmlFor, required }) => (
  <label
    htmlFor={htmlFor}
    className={cn('mb-1.5 block text-sm font-medium text-slate-700', className)}
  >
    {children}
    {required && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);
