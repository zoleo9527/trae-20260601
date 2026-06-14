interface StatusBadgeProps<T extends string = string> {
  status: T;
  labels: Record<T, string>;
  colors: Record<T, string>;
}

export default function StatusBadge<T extends string = string>({
  status,
  labels,
  colors,
}: StatusBadgeProps<T>) {
  const label = labels[status] ?? status;
  const colorClass = colors[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorClass}`}
    >
      {label}
    </span>
  );
}
