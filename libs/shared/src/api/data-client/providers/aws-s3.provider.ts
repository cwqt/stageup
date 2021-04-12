import { config, S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Provider } from '../';

export interface IAWS3ProviderConfig {
  s3_access_key_id: string;
  s3_access_secret_key: string;
  s3_bucket_name: string;
  s3_url: string;
  s3_region: string;
}

export interface S3Return {
  Location: string;
  ETag: string;
  Bucket: string;
}

export default class S3Provider implements Provider<S3> {
  name = 'AWS S3';
  connection: S3;
  config: IAWS3ProviderConfig;

  constructor(config: IAWS3ProviderConfig) {
    this.config = config;
  }

  async connect() {
    config.update({
      region: this.config.s3_region,
      accessKeyId: this.config.s3_access_key_id,
      secretAccessKey: this.config.s3_access_secret_key
    });

    this.connection = new S3({ apiVersion: '2006-03-01' });
    return this.connection;
  }

  public async upload(asset:Express.Multer.File | null, oldUrl?:string) {
    // !oldUrl && asset --> add file
    // oldUrl && asset --> replace file
    // oldUrl && !asset --> delete file
    if(oldUrl || (asset == null && oldUrl)) await this.delete(this.extractKeyFromUrl(oldUrl));
    return asset
      ? (await this.uploadImagetoS3(asset)).Location
      : null;
  }

  public async delete(keyId: string) {
    try {
      return await this.connection
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
      const listedObjects = await this.connection
        .listObjectsV2({
          Bucket: this.config.s3_bucket_name
        })
        .promise();

      if (listedObjects.Contents.length === 0) return;

      await this.connection
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

  private async uploadImagetoS3(file: Express.Multer.File): Promise<S3Return> {
    try {
      if (!file) throw new Error('No available file to upload');

      return await this.connection
        .upload({
          Body: file.buffer,
          ContentType: file.mimetype,
          Key: `${uuidv4()}.${this.getFileExtension(file)}`,
          Bucket: this.config.s3_bucket_name,
          ACL: 'public-read'
        })
        .promise();
    } catch (error) {
      throw new Error(`S3 upload error: ${error.message}`);
    }
  }

  private getFileExtension(file: Express.Multer.File): string {
    //e.g. "myfile.jpg" --> "jpg"
    return file.originalname.split(".").pop();
  }

  private extractKeyFromUrl(s3ObjectUrl: string): string {
    //Extract the key from the bucket object URL (everything after last slash)
    //e.g https://su-assets.s3.eu-west-2.amazonaws.com/   ce76acbd-cec5-476f-a80d-2a910c86710c.jpg
    return s3ObjectUrl.split("/").pop();
  }
}
