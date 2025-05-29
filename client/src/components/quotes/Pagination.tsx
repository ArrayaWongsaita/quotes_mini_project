import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  fetchQuotes: (page: number) => Promise<void>;
}

export default function Pagination({
  page,
  totalPages,
  setPage,
  fetchQuotes,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Fixed: Combined page change and data fetching in one function
  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    await fetchQuotes(newPage);
  };

  // Create array of page numbers to display, with ellipsis for many pages
  const getPageNumbers = () => {
    const pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, page - 1);
    const rangeEnd = Math.min(totalPages - 1, page + 1);

    // Add ellipsis if needed before current range
    if (rangeStart > 2) {
      pages.push('ellipsis-start');
    }

    // Add pages in current range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed after current range
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis-end');
    }

    // Always show last page if not already included
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex justify-center mt-8 items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => handlePageChange(page - 1)}
        className="px-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, i) =>
          pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end' ? (
            <div key={`${pageNum}-${i}`} className="px-2">
              &hellip;
            </div>
          ) : (
            <Button
              key={`page-${pageNum}`}
              variant={pageNum === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(pageNum as number)}
            >
              {pageNum}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => handlePageChange(page + 1)}
        className="px-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Button>
    </div>
  );
}
