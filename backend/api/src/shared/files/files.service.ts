// src/shared/files/files.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { EnvVars } from '../../config/env.validation';

@Injectable()
export class FilesService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly config: ConfigService<EnvVars, true>) {
    this.storage = new Storage();
    this.bucketName =
      this.config.get('STORAGE_BUCKET', { infer: true }) ||
      this.config.get('GCS_BUCKET', { infer: true }) ||
      '';
    if (!this.bucketName) throw new InternalServerErrorException('Missing GCS bucket env');
  }

  async upload(file: Express.Multer.File, userId: string, folder?: string) {
    if (!file || (!file.buffer && !(file as any).path) || !file.originalname) {
      throw new InternalServerErrorException('Invalid file');
    }

    const data =
      file.buffer ??
      (await fs.readFile((file as any).path).catch(() => undefined));

    if (!data) throw new InternalServerErrorException('Invalid file');

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const base = this.sanitizeBase(path.basename(file.originalname, path.extname(file.originalname)));
    const ext = (path.extname(file.originalname) || '').toLowerCase().replace(/[^.\w]/g, '');
    const key = `${folder || 'uploads'}/${userId}/${yyyy}/${mm}/${randomUUID()}_${base}${ext}`;

    const bucket = this.storage.bucket(this.bucketName);
    const gcsFile = bucket.file(key);

    await gcsFile.save(data, {
      resumable: false,
      contentType: file.mimetype || 'application/octet-stream',
      metadata: {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: 'public, max-age=31536000, immutable',
      },
      validation: false,
    });

    const url = this.publicUrl(key);
    return {
      url,
      key,
      filename: path.basename(key),
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
    };
  }

  async deleteByUrl(url: string) {
    const objectPath = this.getObjectPathFromUrl(url);
    if (!objectPath) return { success: false };
    const bucket = this.storage.bucket(this.bucketName);
    await bucket.file(objectPath).delete({ ignoreNotFound: true });
    return { success: true };
  }

  getFilenameFromUrl(url: string) {
    const objectPath = this.getObjectPathFromUrl(url);
    if (!objectPath) return '';
    const i = objectPath.lastIndexOf('/');
    return i >= 0 ? objectPath.slice(i + 1) : objectPath;
  }

  getObjectPathFromUrl(url: string) {
    if (!url) return '';
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host === 'storage.googleapis.com' || host.endsWith('.storage.googleapis.com')) {
        if (u.pathname.startsWith(`/${this.bucketName}/`)) return decodeURIComponent(u.pathname.slice(this.bucketName.length + 2));
        if (host === `${this.bucketName}.storage.googleapis.com`) return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
      }
      const b = u.searchParams.get('bucket');
      const o = u.searchParams.get('name') || u.searchParams.get('object') || u.searchParams.get('o');
      if ((b && b === this.bucketName) && o) return decodeURIComponent(o);
      return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    } catch {
      return '';
    }
  }

  private publicUrl(objectPath: string) {
    return `https://storage.googleapis.com/${this.bucketName}/${encodeURIComponent(objectPath).replace(/%2F/g, '/')}`;
  }

  private sanitizeBase(s: string) {
    const t = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return t.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'file';
  }
}
