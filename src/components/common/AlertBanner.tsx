import { useEffect, useState } from 'react';
import type { ToastItem, BannerAlert } from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCaseStore } from '@/stores/caseStore';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X, ArrowRight } from 'lucide-react';

const STYLE_MAP = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    title: 'text-emerald-800',
    msg: 'text-emerald-700',
  },
  error: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: <AlertOctagon className="h-5 w-5 text-rose-600" />,
    title: 'text-rose-800',
    msg: 'text-rose-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    title: 'text-amber-800',
    msg: 'text-amber-700',
  },
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: <Info className="h-5 w-5 text-sky-600" />,
    title: 'text-sky-800',
    msg: 'text-sky-700',
  },
} as const;

function ToastView({ t }: { t: ToastItem }) {
  const dismiss = useNotificationStore((s) => s.dismissToast);
  const style = STYLE_MAP[t.type];
  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-2.5 rounded-lg border ${style.border} ${style.bg} p-3 shadow-lg shadow-slate-300/40 animate-toast-in`}
    >
      <div className="mt-0.5 shrink-0">{style.icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-[12.5px] font-semibold ${style.title}`}>{t.title}</div>
        <div className={`mt-0.5 text-[11.5px] leading-relaxed ${style.msg}`}>{t.message}</div>
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-white/60 hover:text-slate-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function BannerView({ b }: { b: BannerAlert }) {
  const dismiss = useNotificationStore((s) => s.dismissBanner);
  const selectCase = useCaseStore((s) => s.selectCase);
  const style = b.type === 'error' ? STYLE_MAP.error : STYLE_MAP.warning;
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 border-b-2 ${style.border} ${style.bg} px-6 py-2.5 shadow-md animate-banner-in`}
    >
      <div className="mt-0.5 shrink-0 animate-pulse">{style.icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-bold ${style.title}`}>{b.title}</div>
        <div className={`text-[11.5px] ${style.msg}`}>{b.message}</div>
      </div>
      {b.actionLabel && b.actionCaseId && (
        <button
          onClick={() => {
            selectCase(b.actionCaseId);
          }}
          className={`flex shrink-0 items-center gap-1 rounded-md border border-white/50 bg-white/80 px-2.5 py-1 text-[11.5px] font-semibold ${style.title} hover:bg-white`}
        >
          {b.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
      <button
        onClick={dismiss}
        className={`shrink-0 rounded-md p-1 ${style.title} hover:bg-white/60`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function NotificationLayer() {
  const toasts = useNotificationStore((s) => s.toasts);
  const banner = useNotificationStore((s) => s.bannerAlert);

  return (
    <>
      {banner && (
        <div className="fixed inset-x-0 top-0 z-[100]">
          <BannerView b={banner} />
        </div>
      )}
      <div className="pointer-events-none fixed right-4 top-20 z-[90] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastView key={t.id} t={t} />
        ))}
      </div>
    </>
  );
}
