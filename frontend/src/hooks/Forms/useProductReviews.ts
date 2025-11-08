// src/hooks/Forms/useProductReviews.ts
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReviewsAPI, type PaginatedReviews } from "../../backend/apis/review.api";
import { unwrapApiCall } from "../../utils/functions/unwrap-api-call.function";

export function useProductReviews(productId?: string) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const params = useMemo(
    () => ({ productId, page, limit }),
    [productId, page, limit]
  );

  const { data, isLoading, isFetching, refetch } = useQuery<PaginatedReviews>({
    queryKey: ["reviews", "list", params],
    queryFn: async () => unwrapApiCall(await ReviewsAPI.list(params)),
    enabled: !!productId,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  return {
    page,
    limit,
    setPage,
    setLimit,
    items,
    total,
    isLoading,
    isBusy: isFetching,
    refetch,
  };
}
