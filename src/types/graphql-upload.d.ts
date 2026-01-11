declare module "graphql-upload/GraphQLUpload.mjs" {
  import type { GraphQLScalarType } from "graphql";
  const GraphQLUpload: GraphQLScalarType;
  export default GraphQLUpload;
}

declare module "graphql-upload/graphqlUploadExpress.mjs" {
  import type { RequestHandler } from "express";
  const graphqlUploadExpress: (options?: Record<string, unknown>) => RequestHandler;
  export default graphqlUploadExpress;
}

declare module "graphql-upload/processRequest.mjs" {
  export type FileUpload = {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => NodeJS.ReadableStream;
  };
}
