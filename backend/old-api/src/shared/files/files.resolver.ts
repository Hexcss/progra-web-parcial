import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';
import { FilesService } from './files.service';
import { UploadedFile } from './files.types';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { DeleteResponse, FilenameResponse } from 'src/common/graphql/types';

@Resolver()
export class FilesResolver {
  constructor(private readonly filesService: FilesService) {}

  @Mutation(() => UploadedFile)
  async uploadFile(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @CurrentUser() user: any,
    @Args('folder', { nullable: true }) folder?: string,
  ) {
    const { createReadStream, filename, mimetype, encoding } = await file;
    const stream = createReadStream();
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);
    const uploadFile = {
      buffer,
      originalname: filename,
      mimetype,
      size: buffer.length,
      encoding,
      fieldname: 'file',
      destination: '',
      filename,
      path: '',
      stream,
    } as Express.Multer.File;

    const userId = String(user?.sub || user?.id || '');
    return this.filesService.upload(uploadFile, userId, folder);
  }

  @Mutation(() => DeleteResponse)
  deleteFile(@Args('url') url: string) {
    return this.filesService.deleteByUrl(url);
  }

  @Query(() => FilenameResponse)
  fileName(@Args('url') url: string) {
    return { filename: this.filesService.getFilenameFromUrl(url) };
  }
}
