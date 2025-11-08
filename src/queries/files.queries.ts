// src/queries/files.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FilesAPI,
  type UploadedFile,
  type DeleteResponse,
  type FilenameResponse,
} from "../backend/apis/files.api";
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function";

export const filesKey = {
  root: ["files"] as const,
  filename: (url: string) => [...filesKey.root, "filename", url] as const,
};

export function useUploadFileMutation() {
  return useMutation<UploadedFile, Error, { file: File; folder?: string }>({
    mutationFn: async (payload) => unwrapApiCall(await FilesAPI.upload(payload)),
    retry: 0,
  });
}

export function useDeleteFileByUrlMutation() {
  const qc = useQueryClient();
  return useMutation<DeleteResponse, Error, { url: string }>({
    mutationFn: async ({ url }) => unwrapApiCall(await FilesAPI.deleteByUrl(url)),
    retry: 0,
    onSuccess: (_res, { url }) => {
      qc.invalidateQueries({ queryKey: filesKey.filename(url) });
    },
  });
}

export function useFilenameFromUrlQuery(url?: string) {
  const key = filesKey.filename(url ?? "__none__");
  return useQuery<FilenameResponse>({
    queryKey: key,
    queryFn: async () => unwrapApiCall(await FilesAPI.getFilenameFromUrl(url!)),
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Optional: prefetch helper
export function usePrefetchFilename() {
  const qc = useQueryClient();
  return async (url: string) => {
    await qc.prefetchQuery({
      queryKey: filesKey.filename(url),
      queryFn: async () => unwrapApiCall(await FilesAPI.getFilenameFromUrl(url)),
      staleTime: 5 * 60 * 1000,
    });
  };
}
