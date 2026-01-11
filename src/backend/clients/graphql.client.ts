import type { AxiosRequestConfig } from "axios";
import { baseClient } from "./base.client";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await baseClient.post<GraphQLResponse<T>>(
    "/graphql",
    { query, variables },
    config
  );
  return res.data?.data as T;
}
