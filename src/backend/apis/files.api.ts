// src/backend/apis/files.api.ts
import { z } from "zod";
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function";
import { fileClient } from "../clients/file.client";

export const ZUploadedFile = z.object({
  url: z.string().url(),
  key: z.string(),
  filename: z.string(),
  size: z.number(),
  mimeType: z.string(),
});
export type UploadedFile = z.infer<typeof ZUploadedFile>;

const ZDeleteResponse = z.object({ success: z.boolean() });
export type DeleteResponse = z.infer<typeof ZDeleteResponse>;

const ZFilenameResponse = z.object({ filename: z.string() });
export type FilenameResponse = z.infer<typeof ZFilenameResponse>;

export const FilesAPI = {
  async upload(input: { file: File; folder?: string }): Promise<SafeApiResult<UploadedFile>> {
    const fd = new FormData();
    fd.append("file", input.file);            // field name must be "file"
    if (input.folder) fd.append("folder", input.folder);

    return safeApiCall(async () => {
      const res = await fileClient.post("/files/upload", fd, { withCredentials: true });
      return ZUploadedFile.parse(res.data);
    });
  },

  async deleteByUrl(url: string): Promise<SafeApiResult<DeleteResponse>> {
    return safeApiCall(async () => {
      const res = await fileClient.delete("/files", { withCredentials: true, params: { url } });
      return ZDeleteResponse.parse(res.data);
    });
  },

  async getFilenameFromUrl(url: string): Promise<SafeApiResult<FilenameResponse>> {
    return safeApiCall(async () => {
      const res = await fileClient.get("/files/filename", { withCredentials: true, params: { url } });
      return ZFilenameResponse.parse(res.data);
    });
  },
};
