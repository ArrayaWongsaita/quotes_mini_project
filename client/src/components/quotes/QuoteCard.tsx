import React from 'react';
import { Quote } from '@/types/quote';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface QuoteCardProps {
  quote: Quote;
  onVote: (quoteId: string, voteType: 'up' | 'down') => Promise<void>;
  onTagClick: (tagName: string) => void;
}

export default function QuoteCard({
  quote,
  onVote,
  onTagClick,
}: QuoteCardProps) {
  // Get current user from session
  const { data: session } = useSession();

  // Determine if the user has voted on this quote
  const isUpvoted = quote.userVote === 1;
  const isDownvoted = quote.userVote === -1;

  // Check if quote belongs to current user
  const isOwnQuote = session?.user?.id === quote.userId;

  // Check if quote has no votes or net zero votes
  const hasNoVotes = quote.upVoteCount + quote.downVoteCount === 0;
  const hasNetZeroVotes = quote.upVoteCount - quote.downVoteCount === 0;
  const canEdit = isOwnQuote && (hasNoVotes || hasNetZeroVotes);

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Quote content and author */}
      <div className="flex justify-between items-start mb-4">
        <blockquote className="text-lg md:text-xl font-medium">
          {quote.content}
          <footer className="mt-2 text-muted-foreground">
            — {quote.author}
          </footer>
        </blockquote>

        {/* Edit button - only visible for user's own quotes with no/zero votes */}
        {canEdit && (
          <Button variant="outline" size="sm" className="ml-4" asChild>
            <Link href={`/quotes/edit/${quote.id}`}>
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
                className="mr-1"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Voting interface - removed the question text */}
      <div className="mt-6 bg-accent/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          {/* Empty div to maintain spacing */}
          <div></div>
          <div className="text-sm text-muted-foreground">
            {quote.upVoteCount - quote.downVoteCount} points
          </div>
        </div>

        {/* Buttons aligned to the right */}
        <div className="flex justify-end gap-3 mt-2">
          {/* Upvote button with label */}
          <Button
            size="sm"
            variant={isUpvoted ? 'default' : 'outline'}
            className={`max-w-[120px] ${isUpvoted ? 'bg-primary' : ''}`}
            onClick={() => onVote(quote.id, 'up')}
            aria-pressed={isUpvoted}
          >
            <svg
              className="mr-1"
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
              <path d="m12 5 7 7-7 7" />
              <path d="M5 12h14" />
            </svg>
            <span className="whitespace-nowrap">
              {isUpvoted ? 'Liked' : 'Like'}
            </span>
            <span className="ml-1">({quote.upVoteCount})</span>
          </Button>

          {/* Downvote button with label */}
          <Button
            size="sm"
            variant={isDownvoted ? 'destructive' : 'outline'}
            className={`max-w-[120px] ${isDownvoted ? 'bg-destructive' : ''}`}
            onClick={() => onVote(quote.id, 'down')}
            aria-pressed={isDownvoted}
          >
            <svg
              className="mr-1 rotate-180"
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
              <path d="m12 5 7 7-7 7" />
              <path d="M5 12h14" />
            </svg>
            <span className="whitespace-nowrap">
              {isDownvoted ? 'Disliked' : 'Dislike'}
            </span>
            <span className="ml-1">({quote.downVoteCount})</span>
          </Button>
        </div>
      </div>

      {/* Tags and metadata */}
      <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {quote.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary cursor-pointer"
              onClick={() => onTagClick(tag.name)}
            >
              {tag.name}
            </span>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          Shared by {quote.user.name} •{' '}
          {new Date(quote.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
