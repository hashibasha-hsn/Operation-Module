import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabaseUrl: string;
  private supabaseKey: string;
  private bucketName = 'chat';

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!this.supabaseUrl || !this.supabaseKey) {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — Supabase storage disabled',
      );
    }
  }

  private getClient() {
    return createClient(this.supabaseUrl, this.supabaseKey, {
      auth: { persistSession: false },
    });
  }

  private async ensureBucket(supabase: any, bucket: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(bucket);
      if (!error && data?.name === bucket) return true;

      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
      });
      if (createError && !String(createError.message || '').toLowerCase().includes('already exists')) {
        this.logger.error('Failed to create bucket', createError.message);
        return false;
      }
      await supabase.storage.updateBucket(bucket, { public: true });
      return true;
    } catch (err) {
      this.logger.error('ensureBucket error', err.message);
      return false;
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    bucket: string = this.bucketName,
  ): Promise<string | null> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      this.logger.error('Supabase not configured');
      return null;
    }

    try {
      const supabase = this.getClient();
      const filePath = `uploads/${filename}`;

      const ready = await this.ensureBucket(supabase, bucket);
      if (!ready) {
        this.logger.error('Bucket not ready', bucket);
        return null;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: mimetype,
          upsert: false,
        });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('already exists')) {
          const { data: overwrite } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, { contentType: mimetype, upsert: true });
          if (overwrite?.path) {
            const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(filePath);
            return publicUrl?.publicUrl || null;
          }
        }
        this.logger.error('Upload failed', error.message);
        return null;
      }

      const { data: publicUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl?.publicUrl || null;
    } catch (err) {
      this.logger.error('Supabase upload error', err.message);
      return null;
    }
  }

  async deleteFile(fileUrl: string, bucket: string = this.bucketName): Promise<boolean> {
    if (!this.supabaseUrl || !this.supabaseKey) return false;
    if (!fileUrl || fileUrl.startsWith('http://localhost')) return true;

    try {
      const supabase = this.getClient();

      const parts = fileUrl.split('/');
      const bucketIndex = parts.indexOf(bucket);
      if (bucketIndex === -1) return false;
      const filePath = parts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        this.logger.error('Delete failed', error.message);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error('Supabase delete error', err.message);
      return false;
    }
  }
}
