import mongoose from "mongoose";
import AWS from "aws-sdk";
import config from "../config";

AWS.config.update({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_ACCESS_SECRET_KEY,
});

var s3 = new AWS.S3();

interface S3Return {
  Location: string; //— the URL of the uploaded object
  ETag: string; //— the ETag of the uploaded object
  Bucket: string; //— the bucket to which the object was uploaded
  Key: string; // — the key to which the object was uploaded
  key?: string;
}

export interface S3Image {
  data: S3Return;
  fieldname?: string;
}

export const uploadImageToS3 = async (
  creator_id: string,
  file: Express.Multer.File,
  filename?: string
): Promise<S3Image> => {
  if (!file) throw new Error("No image provided");
  let mimetype;
  // check magic bytes to ensure incorrect extensions aren't uploaded
  let check = new Promise(function (resolve, reject) {
    require("file-type")
      .fromBuffer(file.buffer)
      .then((ft: any) => {
        if (!ft) {
          reject("Could not validate the file by magic bytes");
        } else {
          let allowedMimes = ["image/jpg", "image/jpeg", "image/png"];
          if (allowedMimes.indexOf(ft.mime) > -1) {
            mimetype = ft.mime;
            resolve();
          } else {
            reject("file type not allowed"); //ft.mime
          }
        }
      });
  });

  try {
    await check;
    let extension = file.originalname.substr(file.originalname.lastIndexOf(".") + 1);

    let fn = filename || new mongoose.Types.ObjectId();
    let params = {
      Bucket: config.AWS_BUCKET_NAME,
      Body: file.buffer,
      Key: `${creator_id}/${fn}.${extension}`,
      ContentDisposition: "inline",
      ContentType: mimetype,
      ACL: "public-read",
    };

    //upload the image
    try {
      let data = await s3.upload(params).promise();
      return {
        fieldname: fn,
        data: data,
      } as S3Image;
    } catch (e) {
      throw new Error(e);
    }
  } catch (e) {
    throw new Error(e);
  }
};
