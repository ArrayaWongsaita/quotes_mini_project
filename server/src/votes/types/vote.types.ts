export interface VoteResult {
  success: boolean;
  message: string;
  quoteId: string;
  value: number | null;
  upVoteCount: number;
  downVoteCount: number;
}
