import { v4 as uuidv4 } from 'uuid';
import { format } from 'util';
import { Provider } from '../';
import { Service } from 'typedi';
import { Storage, Bucket } from '@google-cloud/storage';

export interface BlobUploadResponse {
  location: string; // url
  asset_identifier: string; // asset id
}

export interface Blobs {
  upload: (asset: Express.Multer.File | null, oldUrl?: string) => Promise<BlobUploadResponse>;
  delete: (id: string) => Promise<void>;
}

export interface IGCPBlobProviderConfig {
  service_account_key: string;
  service_account_email: string;
  bucket_name: string;
  public_url: string;
}

@Service()
export class GCPBlobProvider implements Provider<Blobs> {
  name = 'GCP Storage';
  connection: Blobs;
  private bucket: Bucket;
  public config: IGCPBlobProviderConfig;

  constructor(config: IGCPBlobProviderConfig) {
    this.config = config;
  }

  async connect() {
    const credentials = {
      private_key: this.config.service_account_key,
      client_email: this.config.service_account_email
    };

    // Get reference to GCP storage
    const storage = new Storage({ credentials });
    // Get reference to the asset bucket
    this.bucket = storage.bucket(this.config.bucket_name);
    return this;
  }

  public async upload(asset: Express.Multer.File | null, oldUrl?: string): Promise<BlobUploadResponse> {
    // !oldUrl && asset --> add file
    // oldUrl && asset --> replace file
    // oldUrl && !asset --> delete file
    if (oldUrl || (asset == null && oldUrl)) await this.delete(this.extractKeyFromUrl(oldUrl));
    return asset ? await this.uploadImagetoGStorage(asset) : null;
  }

  private async uploadImagetoGStorage(asset: Express.Multer.File): Promise<BlobUploadResponse> {
    try {
      if (!asset) throw new Error('No available file to upload');
      const file = this.bucket.file(`${uuidv4()}.${this.getFileExtension(asset)}`);
      await file.save(asset.buffer);
      return {
        location: format(`${this.config.public_url}/${this.config.bucket_name}/${file.name}`),
        asset_identifier: file.name
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  public async delete(keyId: string) {
    try {
      const file = this.bucket.file(keyId);
      await file.delete({ ignoreNotFound: true });
    } catch (error) {
      throw new Error(error);
    }
  }

  private getFileExtension(file: Express.Multer.File): string {
    //e.g. "myfile.jpg" --> "jpg"
    return file.originalname.split('.').pop();
  }

  private extractKeyFromUrl(gStorageObjectUrl: string): string {
    //Extract the key from the bucket object URL (everything after last slash)
    //e.g https://storage.cloud.google.com/su-test-bucket  ce76acbd-cec5-476f-a80d-2a910c86710c.jpg
    return gStorageObjectUrl.split('/').pop();
  }

  async disconnect() {
    return;
  }
}
