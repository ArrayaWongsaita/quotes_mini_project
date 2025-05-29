'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import api from '@/lib/axios/axios.config';
import { Input } from '@/components/ui/input';

// Form validation schema for the quote creation form
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

export default function CreateQuotePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      author: '',
      tags: '',
    },
  });

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
      await api.post('/quotes', {
        content: data.content,
        author: data.author,
        tags: tagsArray,
      });

      toast.success('Quote created successfully');
      reset(); // Clear the form
      router.push('/quotes');
    } catch (err: unknown) {
      console.error('Error creating quote:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create quote');
      toast.error('Failed to create quote');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Quote</h1>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Quote Content"
              id="content"
              {...register('content')}
              error={errors.content?.message}
              placeholder="Enter the quote text"
            />

            <Input
              label="Author"
              id="author"
              {...register('author')}
              error={errors.author?.message}
              placeholder="Who said or wrote this quote"
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
                  Creating...
                </>
              ) : (
                'Create Quote'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
