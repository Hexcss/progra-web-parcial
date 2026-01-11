// src/backend/apis/files.api.ts
import { z } from "zod";
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function";
import { fileClient } from "../clients/file.client";
import { graphqlRequest } from "../clients/graphql.client";

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

const UPLOAD_MUTATION = `
  mutation UploadFile($file: Upload!, $folder: String) {
    uploadFile(file: $file, folder: $folder) {
      url
      key
      filename
      size
      mimeType
    }
  }
`;

const DELETE_MUTATION = `
  mutation DeleteFile($url: String!) {
    deleteFile(url: $url) {
      success
    }
  }
`;

const FILENAME_QUERY = `
  query FileName($url: String!) {
    fileName(url: $url) {
      filename
    }
  }
`;

export const FilesAPI = {
  async upload(input: { file: File; folder?: string }): Promise<SafeApiResult<UploadedFile>> {
    return safeApiCall(async () => {
      const fd = new FormData();
      const operations = {
        query: UPLOAD_MUTATION,
        variables: { file: null as any, folder: input.folder ?? null },
      };
      const map = { "0": ["variables.file"] };
      fd.append("operations", JSON.stringify(operations));
      fd.append("map", JSON.stringify(map));
      fd.append("0", input.file);

      const res = await fileClient.post("/graphql", fd, { withCredentials: true });
      const payload = res.data?.data?.uploadFile ?? res.data?.uploadFile;
      return ZUploadedFile.parse(payload);
    });
  },

  async deleteByUrl(url: string): Promise<SafeApiResult<DeleteResponse>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ deleteFile: DeleteResponse }>(DELETE_MUTATION, { url });
      return ZDeleteResponse.parse(data.deleteFile);
    });
  },

  async getFilenameFromUrl(url: string): Promise<SafeApiResult<FilenameResponse>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ fileName: FilenameResponse }>(FILENAME_QUERY, { url });
      return ZFilenameResponse.parse(data.fileName);
    });
  },
};
