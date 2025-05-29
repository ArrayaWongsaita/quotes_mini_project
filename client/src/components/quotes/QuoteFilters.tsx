import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

// Update the interface to include authorFilter props
interface QuoteFiltersProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  onApplyFilters: () => void;
  authorFilter: string;
  setAuthorFilter: (value: string) => void;
}

export default function QuoteFilters({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onApplyFilters,
  authorFilter,
  setAuthorFilter,
}: QuoteFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 justify-end w-full">
      {/* Add author filter input */}
      <div className="relative w-40">
        <Input
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          placeholder="Filter by author..."
          className="h-9 w-full"
        />
        {authorFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => {
              setAuthorFilter('');
              onApplyFilters();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <SortIcon className="size-4" />
            <span>Sort by: </span>
            <span className="font-medium">
              {sortBy === 'createdAt'
                ? 'Date'
                : sortBy === 'upVoteCount'
                ? 'Upvotes'
                : 'Downvotes'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Sort quotes by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={sortBy === 'createdAt' ? 'bg-accent' : ''}
            onClick={() => {
              setSortBy('createdAt');
              onApplyFilters(); // Apply filters immediately on selection
            }}
          >
            Date created
          </DropdownMenuItem>
          <DropdownMenuItem
            className={sortBy === 'upVoteCount' ? 'bg-accent' : ''}
            onClick={() => {
              setSortBy('upVoteCount');
              onApplyFilters(); // Apply filters immediately on selection
            }}
          >
            Most upvotes
          </DropdownMenuItem>
          <DropdownMenuItem
            className={sortBy === 'downVoteCount' ? 'bg-accent' : ''}
            onClick={() => {
              setSortBy('downVoteCount');
              onApplyFilters(); // Apply filters immediately on selection
            }}
          >
            Most downvotes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <OrderIcon className="size-4" />
            <span>Order: </span>
            <span className="font-medium">
              {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Sort order</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={sortOrder === 'desc' ? 'bg-accent' : ''}
            onClick={() => {
              setSortOrder('desc');
              onApplyFilters(); // Apply filters immediately on selection
            }}
          >
            Descending (highest first)
          </DropdownMenuItem>
          <DropdownMenuItem
            className={sortOrder === 'asc' ? 'bg-accent' : ''}
            onClick={() => {
              setSortOrder('asc');
              onApplyFilters(); // Apply filters immediately on selection
            }}
          >
            Ascending (lowest first)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Icons
function SortIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11 5h10"></path>
      <path d="M11 9h7"></path>
      <path d="M11 13h4"></path>
      <path d="m3 17 3 3 3-3"></path>
      <path d="M6 18V4"></path>
    </svg>
  );
}

function OrderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 16 4 4 4-4"></path>
      <path d="M7 20V4"></path>
      <path d="M11 4h10"></path>
      <path d="M11 8h7"></path>
      <path d="M11 12h4"></path>
    </svg>
  );
}
