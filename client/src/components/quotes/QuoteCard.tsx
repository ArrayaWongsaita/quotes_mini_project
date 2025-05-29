import React from 'react';
import { Quote } from '@/types/quote';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Pencil, Trash2, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';

interface QuoteCardProps {
  quote: Quote;
  onVote: (quoteId: string, voteType: 'up' | 'down') => Promise<void>;
  onTagClick: (tag: string | null) => void;
  onDelete?: (quoteId: string) => void;
}

export default function QuoteCard({
  quote,
  onVote,
  onTagClick,
  onDelete,
}: QuoteCardProps) {
  const { data: session } = useSession();

  // Check if the current user is the owner of this quote
  const isOwner = Boolean(session?.user?.id === quote.userId);

  // Check if the quote has any votes
  const totalVotes = (quote.upVoteCount || 0) + (quote.downVoteCount || 0);
  const hasNoVotes = totalVotes === 0;

  // Can edit if owner and no votes
  const canEdit = isOwner && hasNoVotes;

  return (
    <div className="border rounded-lg shadow-sm bg-card p-4 relative">
      {/* Show actions if user is owner */}
      {isOwner && (
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          {/* Edit button - only if no votes */}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
              title="Edit quote"
            >
              <Link href={`/quotes/edit/${quote.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          )}

          {/* Delete button - always available to owner */}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(quote.id)}
              className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
              title="Delete quote"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Quote content */}
      <div className="mb-4 pr-20">
        {' '}
        {/* Added right padding to prevent text overlap with buttons */}
        <div className="text-lg font-medium mb-2">{quote.content}</div>
        <div className="text-sm text-muted-foreground">— {quote.author}</div>
      </div>

      {/* Added: Show who shared the quote */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <Share2 className="h-3 w-3" />
        <span>Shared by {quote.user?.name || 'Anonymous'}</span>
      </div>

      {/* Tags and voting */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex flex-wrap gap-2">
          {quote.tags &&
            quote.tags.map((tag) => (
              <Button
                key={tag.id}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onTagClick(tag.name)}
              >
                {tag.name}
              </Button>
            ))}
        </div>

        {/* Voting buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(quote.id, 'up')}
            className={`flex items-center gap-1 ${
              quote.userVote === 1
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{quote.upVoteCount || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(quote.id, 'down')}
            className={`flex items-center gap-1 ${
              quote.userVote === -1
                ? 'text-destructive bg-destructive/10'
                : 'text-muted-foreground'
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{quote.downVoteCount || 0}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
