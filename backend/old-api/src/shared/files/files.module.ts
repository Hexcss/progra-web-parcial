import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { FilesService } from "./files.service";
import { FilesResolver } from "./files.resolver";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  providers: [FilesService, FilesResolver],
  exports: [FilesService],
})
export class FilesModule {}
