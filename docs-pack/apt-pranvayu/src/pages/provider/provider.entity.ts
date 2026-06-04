export interface IProviders {
  SystemName: string,
  DisplayName: string,
  subscriptionName: string,
  type: string,
  database: string,
  url: string,
  authSource: string,
  password: string,
  host: string,
  port: number,
  username: string,
  synchronize: boolean,
  endPoint: string,
  useSSL: boolean,
  accessKey: string,
  secretKey: string,
  s3_region: string
  aws_access_key_id: string
  aws_secret_access_key: string;
  node: string;
  auth: IAuth;
  ssl: ISSL;
}

export interface IAuth {
  username: string;
  password: string;
}

export interface ISSL {
  rejectUnauthorized: boolean
}

export interface IAgentProviderDetails {
  SMS: string,
  Email: string,
  Firebase: string
}
export interface IContainerProps {
  id: string | undefined,
  data: string,
  isActive: boolean
}

export const ProviderData: IProviders = {
  SystemName: "",
  DisplayName: "",
  type: "",
  subscriptionName: "",
  database: "",
  url: "",
  authSource: "",
  password: "",
  host: "",
  port: 5432,
  username: "",
  synchronize: false,
  endPoint: "",
  useSSL: false,
  accessKey: "",
  secretKey: "",
  s3_region: "",
  aws_access_key_id: "",
  aws_secret_access_key: "",
  node: "",
  auth: {
    username: "",
    password: ""
  },
  ssl: {
    rejectUnauthorized: false
  }
};

export enum ProviderTypes {
  mongodb = "mongodb",
  minio = "minio",
  postgres = "postgres",
  elasticsearch = "elasticsearch"
}

