import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-neutral-200 rounded-b-lg">
      <div className="text-sm text-neutral-500">
        显示 <span className="font-medium text-neutral-700">{startItem}</span> -{' '}
        <span className="font-medium text-neutral-700">{endItem}</span> 条，共{' '}
        <span className="font-medium text-neutral-700">{totalItems}</span> 条记录
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft size={16} />
        </button>

        {renderPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              page === currentPage
                ? 'bg-primary-500 text-white shadow-md'
                : page === '...'
                ? 'cursor-default text-neutral-400'
                : 'text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
