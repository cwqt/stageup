import { config, S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Provider } from '../';
import { Service, Token } from 'typedi';

export interface BlobUploadResponse {
  location: string; // url
  asset_identifier: string; // asset id
}

export interface Blobs {
  upload: (asset: Express.Multer.File | null, oldUrl?: string) => Promise<BlobUploadResponse>;
  delete: (id: string) => Promise<void>;
}

export interface IAWS3ProviderConfig {
  s3_access_key_id: string;
  s3_access_secret_key: string;
  s3_bucket_name: string;
  s3_url: string;
  s3_region: string;
}

// For moving to GCP Storage...
// @Service()
// export class GCPBlobManager implements Provider<BlobManager>

@Service()
export class S3BlobProvider implements Provider<Blobs> {
  name = 'AWS S3';
  connection: Blobs;
  config: IAWS3ProviderConfig;

  private s3: S3;

  constructor(config: IAWS3ProviderConfig) {
    this.config = config;
  }

  async connect() {
    config.update({
      region: this.config.s3_region,
      accessKeyId: this.config.s3_access_key_id,
      secretAccessKey: this.config.s3_access_secret_key
    });

    this.s3 = new S3({ apiVersion: '2006-03-01' });
    return this;
  }

  public async upload(asset: Express.Multer.File | null, oldUrl?: string): Promise<BlobUploadResponse> {
    // !oldUrl && asset --> add file
    // oldUrl && asset --> replace file
    // oldUrl && !asset --> delete file
    if (oldUrl || (asset == null && oldUrl)) await this.delete(this.extractKeyFromUrl(oldUrl));
    return asset ? await this.uploadImagetoS3(asset) : null;
  }

  public async delete(keyId: string) {
    try {
      await this.s3
        .deleteObject({
          Key: keyId,
          Bucket: this.config.s3_bucket_name
        })
        .promise();
    } catch (error) {
      throw new Error(`S3 deletion error: ${error.message}`);
    }
  }

  async disconnect() {
    return;
  }

  async drop() {
    try {
      const listedObjects = await this.s3
        .listObjectsV2({
          Bucket: this.config.s3_bucket_name
        })
        .promise();

      if (listedObjects.Contents.length === 0) return;

      await this.s3
        .deleteObjects({
          Bucket: this.config.s3_bucket_name,
          Delete: {
            Objects: listedObjects.Contents.map(c => ({ Key: c.Key }))
          }
        })
        .promise();

      if (listedObjects.IsTruncated) await this.drop();
    } catch (error) {
      throw new Error(`S3 emtpying bucket error:  ${error.message}`);
    }
  }

  private async uploadImagetoS3(file: Express.Multer.File): Promise<BlobUploadResponse> {
    try {
      if (!file) throw new Error('No available file to upload');

      const asset = await this.s3
        .upload({
          Body: file.buffer,
          ContentType: file.mimetype,
          Key: `${uuidv4()}.${this.getFileExtension(file)}`,
          Bucket: this.config.s3_bucket_name,
          ACL: 'public-read'
        })
        .promise();

      return {
        location: asset.Location,
        asset_identifier: asset.Key
      };
    } catch (error) {
      throw new Error(`S3 upload error: ${error.message}`);
    }
  }

  private getFileExtension(file: Express.Multer.File): string {
    //e.g. "myfile.jpg" --> "jpg"
    return file.originalname.split('.').pop();
  }

  private extractKeyFromUrl(s3ObjectUrl: string): string {
    //Extract the key from the bucket object URL (everything after last slash)
    //e.g https://su-assets.s3.eu-west-2.amazonaws.com/   ce76acbd-cec5-476f-a80d-2a910c86710c.jpg
    return s3ObjectUrl.split('/').pop();
  }
}
