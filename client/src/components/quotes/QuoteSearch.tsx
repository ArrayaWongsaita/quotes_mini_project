import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';

interface QuoteSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (term: string) => void;
  selectedTag: string | null;
  handleTagFilter: (tag: string | null) => void;
}

export default function QuoteSearch({
  searchTerm,
  setSearchTerm,
  onSearch,
  selectedTag,
  handleTagFilter,
}: QuoteSearchProps) {
  // Local state to track input values independently from parent state
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [tagInput, setTagInput] = useState(selectedTag || '');

  // Update local state when props change (for initialization only)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (searchTerm !== undefined) {
      setLocalSearchTerm(searchTerm);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedTag !== tagInput) {
      setTagInput(selectedTag || '');
    }
  }, [selectedTag]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(localSearchTerm);
    onSearch(localSearchTerm);
  };

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Only apply tag filter if there's actually a tag entered
    const trimmedTag = tagInput.trim();
    handleTagFilter(trimmedTag || null);
  };

  // Debounced search for content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm);
        onSearch(localSearchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchTerm, setSearchTerm, onSearch, searchTerm]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
      {/* Content search */}
      <form onSubmit={handleSearchSubmit} className="flex-1">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search quotes by content or author..."
            value={localSearchTerm}
            onChange={handleSearchInputChange}
            className="w-full"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Button>
        </div>
      </form>

      {/* Tag filter input */}
      <form onSubmit={handleTagSearch} className="w-full md:w-72">
        <div className="relative">
          <Input
            type="text"
            placeholder="Filter by tag..."
            value={tagInput}
            onChange={handleTagInputChange}
            className="w-full"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            {selectedTag && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTagInput('');
                  handleTagFilter(null);
                }}
                className="h-7 px-2"
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
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            )}
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
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
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
