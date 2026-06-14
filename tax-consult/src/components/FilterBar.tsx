import { Search, RotateCcw } from 'lucide-react';

type FieldConfig =
  | { key: string; type: 'search'; placeholder?: string }
  | {
      key: string;
      type: 'select';
      placeholder?: string;
      options: { value: string; label: string }[];
    }
  | { key: string; type: 'date'; placeholder?: string }
  | { key: string; type: 'date_range'; fromKey: string; toKey: string; placeholder?: string };

interface FilterBarProps<T extends Record<string, unknown>> {
  filter: T;
  setFilter: (patch: Partial<T>) => void;
  onReset: () => void;
  fields: FieldConfig[];
}

export default function FilterBar<T extends Record<string, unknown>>({
  filter,
  setFilter,
  onReset,
  fields,
}: FilterBarProps<T>) {
  const hasActiveFilter = Object.values(filter).some(
    (v) => v !== '' && v !== 'all'
  );

  return (
    <div className="flex items-end gap-2 flex-wrap p-3 bg-white border border-gray-200 rounded-lg">
      {fields.map((field) => {
        if (field.type === 'search') {
          return (
            <div key={field.key} className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="search"
                value={(filter[field.key] as string) ?? ''}
                onChange={(e) => setFilter({ [field.key]: e.target.value } as Partial<T>)}
                placeholder={field.placeholder ?? '搜索...'}
                className="pl-7 w-44"
              />
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <select
              key={field.key}
              value={(filter[field.key] as string) ?? 'all'}
              onChange={(e) => setFilter({ [field.key]: e.target.value } as Partial<T>)}
              className="w-28"
            >
              <option value="all">{field.placeholder ?? '全部'}</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }

        if (field.type === 'date') {
          return (
            <input
              key={field.key}
              type="date"
              value={(filter[field.key] as string) ?? ''}
              onChange={(e) => setFilter({ [field.key]: e.target.value } as Partial<T>)}
              className="w-32"
            />
          );
        }

        if (field.type === 'date_range') {
          return (
            <div key={field.key} className="flex items-center gap-1">
              <input
                type="date"
                value={(filter[field.fromKey] as string) ?? ''}
                onChange={(e) => setFilter({ [field.fromKey]: e.target.value } as Partial<T>)}
                className="w-32"
              />
              <span className="text-gray-400 text-xs">~</span>
              <input
                type="date"
                value={(filter[field.toKey] as string) ?? ''}
                onChange={(e) => setFilter({ [field.toKey]: e.target.value } as Partial<T>)}
                className="w-32"
              />
            </div>
          );
        }

        return null;
      })}

      {hasActiveFilter && (
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary gap-1 text-xs"
        >
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
      )}
    </div>
  );
}
