import { Request } from "express";
const { query } = require("express-validator");
import { validate } from "../common/validate";

import config from "../config";
import { ErrorHandler } from "../common/errors";
import { HTTP } from "../common/http";
const { generateVerificationHash, verifyHash } = require("dbless-email-verification");
import nodemailer from "nodemailer";
import { User } from "../models/User.model";

export const validators = {
  verify: validate([
    query("email").isEmail().normalizeEmail().withMessage("not a valid email address"),
    query("hash").not().isEmpty().trim().withMessage("must have a verification hash"),
  ]),
};

const generateEmailHash = (email: string) => {
    const hash = generateVerificationHash(email, config.PRIVATE_KEY, 60);
    return hash;
  };
  
  export const verifyEmail = (email: string, hash: string) => {
    if (!config.PRODUCTION) return true;
    const isEmailVerified = verifyHash(hash, email, config.PRIVATE_KEY);
    return isEmailVerified;
  };
  
  export const sendVerificationEmail = (email: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (config.PRODUCTION == false) {
        resolve(true);
        return;
      }
  
      const hash = generateEmailHash(email);
      const verificationUrl = `${config.API_URL}/auth/verify?email=${email}&hash=${hash}`;
  
      const transporter = nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: config.SENDGRID.USERNAME,
          pass: config.SENDGRID.API_KEY,
        },
      });
  
      const mailOptions = {
        from: config.EMAIL_ADDRESS,
        to: email,
        subject: `Verify your ${config.SITE_TITLE} account 🌱`,
        html: `<p>Click the link to verify: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
      };
  
      transporter.sendMail(mailOptions, (error: any) => {
        if (error) {
          console.log(error);
          resolve(false);
        }
        resolve(true);
      });
    });
  };
  
  export const verifyUserEmail = async (req: Request): Promise<string> => {
    let hash = req.query.hash as string;
    let email = req.query.email as string;
  
    // Verify against hash
    let isVerified = verifyEmail(email, hash);
    if (!isVerified) throw new ErrorHandler(HTTP.BadRequest, "Not a valid hash");
  
    // Update verified state
    const u = await User.findOne({ email_address: email });
    u.is_verified = isVerified;
    await u.save();
      
    // Return redirect address
    return `${config.FE_URL}/verified?state=${isVerified}`;
  };
  