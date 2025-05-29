'use client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios/axios.config';
import QuoteCard from '@/components/quotes/QuoteCard';
import QuoteSearch from '@/components/quotes/QuoteSearch';
import Pagination from '@/components/quotes/Pagination';
import QuoteFilters from '@/components/quotes/QuoteFilters';
import { Quote, Tag, QuoteResponse } from '@/types/quote';

export default function Quotes() {
  const { data: session } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // Now stores tag name instead of ID
  // We're collecting tags but not using them yet - will be used for a future feature
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_tags, setTags] = useState<Tag[]>([]);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [authorFilter, setAuthorFilter] = useState<string>('');

  // Fetch quotes from the API
  const fetchQuotes = useCallback(
    async (pageNum = 1) => {
      if (!session?.accessToken) return; // Don't fetch if no session

      setLoading(true);
      try {
        const res = await api.get(`/quotes`, {
          params: {
            page: pageNum,
            limit: 4,
            sortBy: sortBy,
            sortOrder: sortOrder,
            search: searchTerm || undefined,
            tag: selectedTag || undefined, // Changed from tagName to tag as expected by the API
            author: authorFilter || undefined,
          },
        });

        const data: QuoteResponse = res.data;

        setQuotes(data.data);
        setPage(data.page);
        setTotalPages(data.totalPages);

        // Extract unique tags from quotes for filter options
        const uniqueTags = Array.from(
          new Set(
            data.data
              .flatMap((quote) => quote.tags)
              .map((tag) => JSON.stringify(tag))
          )
        ).map((tagString) => JSON.parse(tagString) as Tag);

        setTags(uniqueTags);
      } catch (err) {
        console.error('Failed to fetch quotes:', err);
        setError('Failed to load quotes. Please try again later.');
        toast.error('Failed to load quotes');
      } finally {
        setLoading(false);
      }
    },
    [
      session?.accessToken,
      searchTerm,
      selectedTag,
      sortBy,
      sortOrder,
      authorFilter,
    ]
  );

  // Handle voting on quotes - updated to match the correct API endpoint and numeric values
  const handleVote = async (quoteId: string, voteType: 'up' | 'down') => {
    try {
      // Find the quote to update optimistically
      const quoteIndex = quotes.findIndex((q) => q.id === quoteId);
      if (quoteIndex === -1) return;

      const quote = quotes[quoteIndex];
      const updatedQuotes = [...quotes];

      // Convert voteType to numeric value
      let voteValue: number;
      let upVoteChange = 0;
      let downVoteChange = 0;

      const currentVote = quote.userVote; // Current vote state (1, -1, or null)
      const newVote = voteType === 'up' ? 1 : -1; // Requested vote value

      // If clicking same button that's already active, cancel the vote
      if (currentVote === newVote) {
        voteValue = 0; // API expects 0 to cancel a vote

        // Update vote counts accordingly
        if (newVote === 1) {
          upVoteChange = -1; // Reduce upvotes by 1
        } else {
          downVoteChange = -1; // Reduce downvotes by 1
        }

        // Update UI state
        updatedQuotes[quoteIndex] = {
          ...quote,
          upVoteCount: quote.upVoteCount + upVoteChange,
          downVoteCount: quote.downVoteCount + downVoteChange,
          userVote: null, // Clear the vote
        };
      }
      // If changing vote or voting for first time
      else {
        voteValue = newVote;

        // Calculate vote count changes
        if (newVote === 1) {
          upVoteChange = 1; // Add upvote
          // If switching from downvote, also remove the downvote
          if (currentVote === -1) {
            downVoteChange = -1;
          }
        } else {
          downVoteChange = 1; // Add downvote
          // If switching from upvote, also remove the upvote
          if (currentVote === 1) {
            upVoteChange = -1;
          }
        }

        // Update UI state
        updatedQuotes[quoteIndex] = {
          ...quote,
          upVoteCount: quote.upVoteCount + upVoteChange,
          downVoteCount: quote.downVoteCount + downVoteChange,
          userVote: newVote, // Set the new vote value (1 or -1)
        };
      }

      // Update UI immediately for better UX
      setQuotes(updatedQuotes);

      // Send vote to API
      await api.put('/votes', {
        quoteId: quoteId,
        value: voteValue,
      });
    } catch (err) {
      console.error('Failed to vote:', err);
      toast.error('Failed to register your vote');
      // Revert optimistic update on error by refetching
      fetchQuotes(page);
    }
  };

  // Handle search with debouncing (managed by QuoteSearch component)
  const handleDebouncedSearch = useCallback(
    (term: string) => {
      setSearchTerm(term); // Use the term parameter
      setPage(1); // Reset to first page when searching
      fetchQuotes(1);
    },
    [fetchQuotes, setPage]
  );

  // Make sure the tag filter handler properly updates the API params
  const handleTagFilter = useCallback(
    (tag: string | null) => {
      setSelectedTag(tag);
      setPage(1);
      // This will trigger a re-fetch with the updated tagName parameter
    },
    [setPage]
  );

  // Apply filters function
  const handleApplyFilters = useCallback(() => {
    setPage(1);
    fetchQuotes(1);
  }, [fetchQuotes]);

  // Fix the pagination to update quotes list
  const handlePageChange = useCallback(
    async (pageNum: number) => {
      if (pageNum < 1 || pageNum > totalPages) return;
      setLoading(true); // Show loading state while changing pages
      setPage(pageNum);
      await fetchQuotes(pageNum);
    },
    [fetchQuotes, totalPages]
  );

  // Initial fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session?.accessToken) {
      fetchQuotes(1);
    }
  }, [fetchQuotes]);

  // Add separate effect to handle selectedTag changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session?.accessToken && selectedTag !== null) {
      setPage(1);
    }
  }, [selectedTag]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="text-destructive text-xl">{error}</div>
        <Button onClick={() => fetchQuotes()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-screen-xl w-full mx-auto px-4 sm:px-6 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Quotes</h1>
          <p className="text-muted-foreground">
            Discover and vote for inspiring quotes
          </p>
        </div>

        <Button className="mt-4 md:mt-0" asChild>
          <Link href="/quotes/new">Add New Quote</Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <QuoteSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleDebouncedSearch}
          selectedTag={selectedTag}
          handleTagFilter={handleTagFilter}
        />

        {/* Sorting options */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {loading
              ? 'Loading quotes...'
              : `Showing ${quotes.length} of ${totalPages * 3} quotes`}
          </div>

          <QuoteFilters
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onApplyFilters={handleApplyFilters}
            authorFilter={authorFilter}
            setAuthorFilter={setAuthorFilter} // Use the setter here
          />
        </div>
      </div>

      {/* Quotes List */}
      {loading && quotes.length === 0 ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin size-8 border-4 border-primary/20 border-t-primary rounded-full"></div>
        </div>
      ) : quotes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onVote={handleVote}
              onTagClick={handleTagFilter}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-xl font-medium mb-2">No quotes found</div>
          <p className="text-muted-foreground mb-6">
            {selectedTag
              ? 'Try removing filters or search terms'
              : 'Be the first to add a quote!'}
          </p>
          <Button asChild>
            <Link href="/quotes/new">Add Quote</Link>
          </Button>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        fetchQuotes={handlePageChange} // Use the new handler
      />
    </div>
  );
}
