interface StatusBadgeProps {
  label: string
  colorClass: string
  bgClass: string
}

export default function StatusBadge({ label, colorClass, bgClass }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {label}
    </span>
  )
}
