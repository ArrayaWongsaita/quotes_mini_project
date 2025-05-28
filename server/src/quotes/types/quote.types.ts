import { Quote, Tag } from '../../../generated/prisma';

export interface UserBasic {
  id: string;
  name: string | null;
  email: string;
}

export interface TagBasic {
  id: string;
  name: string;
}

export interface QuoteWithUserVote {
  id: string;
  content: string;
  author: string | null;
  upVoteCount: number;
  downVoteCount: number;
  userId: string;
  user: UserBasic;
  tags: TagBasic[];
  createdAt: Date;
  updatedAt: Date;
  userVote: number | null;
}

// Define interface for the raw Prisma result
export interface QuoteWithRelations {
  id: string;
  content: string;
  author: string | null;
  upVoteCount: number;
  downVoteCount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  tags: Tag[];
  votes?: Array<{ value: number }> | [];
}

export interface PaginatedQuotesResult {
  data: QuoteWithUserVote[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface QuoteWithTags extends Quote {
  tags: Tag[];
}
