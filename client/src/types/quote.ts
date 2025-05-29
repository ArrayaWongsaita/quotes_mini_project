export interface Tag {
  id: string;
  name: string;
}

export interface QuoteUser {
  id: string;
  name: string;
  email: string;
}

export interface Quote {
  id: string;
  content: string;
  author: string;
  upVoteCount: number;
  downVoteCount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  user: QuoteUser;
  userVote: 1 | -1 | null; // Updated to use numeric values
}

export interface QuoteResponse {
  data: Quote[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
