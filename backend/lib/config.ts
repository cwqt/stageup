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
}

const base = {
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  EXPRESS_PORT: 3000,
  PRODUCTION: false,
  DEVELOPMENT: false,
  TESTING: false,
} as IEnv;

const prod: IEnv = {
  ...base,
  SITE_TITLE: "my.eventi.net",
  API_URL: "https://api.corrhizal.net",
  FE_URL: "https://my.corrhizal.net",
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
