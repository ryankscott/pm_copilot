import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prdApi } from "@/lib/api";
import type { PRD } from "@/types";
import { toCamelCase } from "@/lib/utils";

// Query keys
export const prdKeys = {
  all: ["prds"] as const,
  lists: () => [...prdKeys.all, "list"] as const,
  list: (filters: Record<string, unknown> = {}) =>
    [...prdKeys.lists(), filters] as const,
  details: () => [...prdKeys.all, "detail"] as const,
  detail: (id: string) => [...prdKeys.details(), id] as const,
};

// Query hooks
export function usePrds() {
  return useQuery({
    queryKey: prdKeys.list(),
    queryFn: prdApi.getAll,
    select: (data) =>
      toCamelCase(data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePrd(id: string) {
  return useQuery({
    queryKey: prdKeys.detail(id),
    queryFn: () => prdApi.getById(id),
    select: (data) =>
      toCamelCase(data as unknown as Record<string, unknown>) as unknown as PRD,
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hooks
export function useCreatePrd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: prdApi.create,
    onSuccess: (newPrd) => {
      // Invalidate and refetch PRD list
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });

      // Add the new PRD to the cache
      queryClient.setQueryData(prdKeys.detail(newPrd.id!), newPrd);

      // Optimistically update the list
      queryClient.setQueryData(prdKeys.list(), (oldData: PRD[] | undefined) =>
        oldData ? [newPrd, ...oldData] : [newPrd]
      );
    },
    onError: (error) => {
      console.error("Error creating PRD:", error);
      // You can add toast notification here
    },
  });
}

export function useUpdatePrd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<PRD, "id" | "createdAt" | "updatedAt">>;
    }) => prdApi.update(id, data),
    onSuccess: (updatedPrd, { id }) => {
      // Update the specific PRD in cache
      queryClient.setQueryData(prdKeys.detail(id), updatedPrd);

      // Update the PRD in the list cache
      queryClient.setQueryData(
        prdKeys.list(),
        (oldData: PRD[] | undefined) =>
          oldData?.map((prd) => (prd.id === id ? updatedPrd : prd)) || []
      );
    },
    onError: (error) => {
      console.error("Error updating PRD:", error);
      // You can add toast notification here
    },
  });
}

export function useDeletePrd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: prdApi.delete,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: prdKeys.lists() });
      await queryClient.cancelQueries({ queryKey: prdKeys.detail(deletedId) });

      // Snapshot the previous values
      const previousPrds = queryClient.getQueryData(prdKeys.list());
      const previousPrd = queryClient.getQueryData(prdKeys.detail(deletedId));

      // Optimistically update
      queryClient.setQueryData(
        prdKeys.list(),
        (oldData: PRD[] | undefined) =>
          oldData?.filter((prd) => prd.id !== deletedId) || []
      );

      return { previousPrds, previousPrd, deletedId };
    },
    onError: (error, deletedId, context) => {
      // Rollback on error
      if (context?.previousPrds) {
        queryClient.setQueryData(prdKeys.list(), context.previousPrds);
      }
      if (context?.previousPrd) {
        queryClient.setQueryData(
          prdKeys.detail(deletedId),
          context.previousPrd
        );
      }
      console.error("Error deleting PRD:", error);
      // You can add toast notification here
    },
    onSuccess: (_, deletedId) => {
      // Remove the specific PRD from cache
      queryClient.removeQueries({ queryKey: prdKeys.detail(deletedId) });
    },
    onSettled: () => {
      // Ensure consistency
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });
    },
  });
}

// Optimistic update hook for better UX
export function useOptimisticUpdatePrd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<PRD, "id" | "createdAt" | "updatedAt">>;
    }) => prdApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: prdKeys.detail(id) });

      // Snapshot the previous value
      const previousPrd = queryClient.getQueryData(prdKeys.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(prdKeys.detail(id), (old: PRD | undefined) =>
        old ? { ...old, ...data, updatedAt: new Date().toISOString() } : old
      );

      // Return a context object with the snapshotted value
      return { previousPrd, id };
    },
    onError: (error, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPrd) {
        queryClient.setQueryData(
          prdKeys.detail(context.id),
          context.previousPrd
        );
      }
      console.error("Error updating PRD optimistically:", error);
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success to ensure cache is correct
      queryClient.invalidateQueries({ queryKey: prdKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });
    },
  });
}
