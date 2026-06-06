import { FileX, Search } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  type?: 'empty' | 'no-results';
}

export function EmptyState({ title, description, icon: Icon = FileX, type = 'empty' }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
        {type === 'no-results' ? (
          <Search className="h-8 w-8 text-gray-400" />
        ) : (
          <Icon className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
