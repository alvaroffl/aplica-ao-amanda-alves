import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => {
        if (
          error instanceof ApiError &&
          ['FORBIDDEN', 'INVALID_TOKEN', 'BUSINESS_NOT_FOUND'].includes(error.code)
        )
          return false;
        return count < 2;
      },
    },
  },
});
