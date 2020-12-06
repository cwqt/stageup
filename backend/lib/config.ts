const dotenv = require("dotenv");
dotenv.config();

interface IEnv {
  PRIVATE_KEY: string;
  EMAIL_ADDRESS: string;
  SITE_TITLE: string;
  API_URL: string;
  FE_URL: string;
  PRODUCTION: boolean;
  DEVELOPMENT: boolean;
  TESTING: boolean;
  EXPRESS_PORT: number;
  LOCALTUNNEL_URL: string;
  SENDGRID: {
    USERNAME:string;
    API_KEY:string;
  },
  MUX: {
    ACCESS_TOKEN: string;
    SECRET_KEY: string;
    HOOK_SIGNATURE: string;
    IMAGE_API_ENDPOINT: string;
  },
  PG: {
    USER:string;
    HOST:string;
    DB:string;
    PASS:string;
    PORT:number;
  },
  REDIS: {
    HOST:string;
    PORT:number;
    TTL:number;  
  },
  INFLUX: {
    HOST:string;
    DB:string;
  },
  AWS: {
    S3_ACCESS_KEY_ID:string;
    S3_ACCESS_SECRET_KEY:string;
    S3_BUCKET_NAME:string;
  }
}

const base = {
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  EXPRESS_PORT: 3000,
  PRODUCTION: false,
  DEVELOPMENT: false,
  TESTING: false,
  LOCALTUNNEL_URL: process.env.LOCALTUNNEL_URL,
  MUX: {
    ACCESS_TOKEN: process.env.MUX_ACCESS_TOKEN,
    SECRET_KEY: process.env.MUX_SECRET_KEY,
    HOOK_SIGNATURE: process.env.MUX_HOOK_SIGNATURE,
    IMAGE_API_ENDPOINT: "https://image.mux.com"
  },
  PG: {
    USER: process.env.PG_USER,
    PASS: process.env.PG_PASS,
    HOST: process.env.PRODUCTION === "true" ? process.env.POSTGRES_SERVICE_HOST : "localhost",
    DB: "postgres",
    PORT: 5432,
  },
  REDIS: {
    HOST: process.env.PRODUCTION === "true" ? process.env.REDIS_SERVICE_HOST : "localhost",
    PORT: 6379,
    TTL: 86400,
  },
  AWS: {
    S3_ACCESS_KEY_ID: process.env.AWS_S3_KEY_ID,
    S3_ACCESS_SECRET_KEY: process.env.AWS_S3_ACCESS_SECRET_KEY,
    S3_BUCKET_NAME: process.env.AWS_S3_ACCESS_SECRET_KEY
  },
  INFLUX: {
    HOST: process.env.PRODUCTION === "true" ? process.env.INFLUX_HOST : "localhost",
    DB: "metrics"
  }
} as IEnv;

const prod: IEnv = {
  ...base,
  SITE_TITLE: "my.eventi.net",
  API_URL: "https://api.eventi.com",
  FE_URL: "https://eventi.com",
  PRODUCTION: true,
};

const dev: IEnv = {
  ...base,
  SITE_TITLE: "dev.eventi.net",
  API_URL: "http://localhost:3000",
  FE_URL: "http://localhost:4200",
  DEVELOPMENT: true,
};

const test: IEnv = {
  ...base,
  SITE_TITLE: "dev.eventi.net",
  API_URL: "http://localhost:3000",
  FE_URL: "http://localhost:4200",
  TESTING: true,
};

let env: IEnv;

switch (process.env.NODE_ENV) {
  case "production":
    env = prod;
    break;
  case "development":
    env = dev;
    break;
  case "testing":
    env = test;
    break;
}

console.log(
  "\nBackend running in env: \x1b[04m" + process.env.NODE_ENV + "\x1b[0m\n"
);

export default env;
