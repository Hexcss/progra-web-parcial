import { Body, Controller, Delete, Get, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { FilesService } from "./files.service";
import { CurrentUser } from "src/common/decorators/user.decorator";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body("folder") folder?: string
  ) {
    return this.filesService.upload(file, String(user?.sub || user?.id || ""), folder);
  }

  @Delete()
  async remove(@Query("url") url: string) {
    return this.filesService.deleteByUrl(url);
  }

  @Get("filename")
  filename(@Query("url") url: string) {
    return { filename: this.filesService.getFilenameFromUrl(url) };
  }
}
