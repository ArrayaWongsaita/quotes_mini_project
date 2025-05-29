'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import api from '@/lib/axios/axios.config';
import { Input } from '@/components/ui/input';

// Form validation schema for the quote edit form
const formSchema = z.object({
  content: z
    .string()
    .min(3, { message: 'Content must be at least 3 characters long' }),
  author: z
    .string()
    .min(2, { message: 'Author must be at least 2 characters long' }),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Tag {
  id: string;
  name: string;
}

interface QuoteData {
  id: string;
  content: string;
  author: string;
  tags: Tag[];
  // Other fields not needed for the form
}

// Define a type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message: string;
}

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const quoteId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      author: '',
      tags: '',
    },
  });

  // Fetch the quote data on page load
  useEffect(() => {
    async function fetchQuote() {
      setIsFetching(true);

      try {
        const response = await api.get<QuoteData>(`/quotes/${quoteId}`);
        const quote = response.data;

        // Set form values with existing data
        setValue('content', quote.content);
        setValue('author', quote.author);

        // Convert tags array of objects to comma-separated string of names
        if (quote.tags && Array.isArray(quote.tags)) {
          const tagNames = quote.tags.map((tag) => tag.name);
          setValue('tags', tagNames.join(', '));
        }
      } catch (err: unknown) {
        console.error('Failed to fetch quote:', err);
        const apiError = err as ApiError;
        setError(
          apiError.response?.data?.message || 'Failed to load quote data'
        );
        toast.error('Could not load quote data');
      } finally {
        setIsFetching(false);
      }
    }

    if (quoteId) {
      fetchQuote();
    }
  }, [quoteId, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    // Convert comma-separated tags to an array
    const tagsArray = data.tags
      ? data.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    try {
      await api.put(`/quotes/${quoteId}`, {
        content: data.content,
        author: data.author,
        tags: tagsArray,
      });

      toast.success('Quote updated successfully');
      router.push('/quotes');
    } catch (err: unknown) {
      console.error('Error updating quote:', err);
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Failed to update quote');
      toast.error('Failed to update quote');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Quote</h1>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {isFetching ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin size-8 border-4 border-primary/20 border-t-primary rounded-full"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Quote Content"
                id="content"
                {...register('content')}
                error={errors.content?.message}
                placeholder="Enter quote content"
              />

              <Input
                label="Author"
                id="author"
                {...register('author')}
                error={errors.author?.message}
                placeholder="Enter author name"
              />

              <Input
                label="Tags (comma-separated)"
                id="tags"
                {...register('tags')}
                error={errors.tags?.message}
                placeholder="e.g., inspiration, philosophy, motivation"
                helperText="Separate tags with commas"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
