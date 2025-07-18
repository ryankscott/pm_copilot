import { useQuery } from "@tanstack/react-query";
import { templateApi } from "@/lib/api";

// Query keys
export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (filters: Record<string, unknown> = {}) =>
    [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// Query hooks
export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: templateApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes (templates don't change often)
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templateApi.getById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
  });
}
