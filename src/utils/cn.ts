import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 })
}

export function formatDate(date?: string): string {
  if (!date) return '-'
  return date
}
