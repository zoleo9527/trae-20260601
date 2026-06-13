import React from 'react';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <FileX className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
};

export default EmptyState;