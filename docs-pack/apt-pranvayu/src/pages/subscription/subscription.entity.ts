import { v4 } from "uuid"

export interface IProviders {
  type: string,
  url: string,
  authSource: string,
  database: string,
  driver: string,
  charset: string,
  timezone: string,
  connectTimeout: number,
  acquireTimeout: number,
  insecureAuth: boolean,
  supportBigNumbers: boolean,
  bigNumberStrings: boolean,
  dateStrings: boolean | string,
  debug: boolean | string,
  trace: boolean,
  multipleStatements: boolean,
  legacySpatialSupport: boolean,
  flags: string,
  connectorPackage: string,
}

export interface IContainerProps {
  id: string | undefined,
  data: any,
  isActive: boolean,
  entityType?: string
}

export interface ISubscriptionOptions {
  type: string,
  database: string,
  url: string,
  authSource: string
}


export interface IProviderOptions {
  type: string,
  database: string,
  url: string,
  authSource: string
}

export interface IDefaultRoles {
  Application: string,
  Role: string,
}

export interface IStorageProvider {
  id: string,
  options: any
  // type: string,
  // url: string,
}

export interface IAgentProviderDetails {
  id: string,
  SMS: string,
  Email: string,
  Firebase: string
}

export interface ISubscription {
  SourceSubscriptionId: string,
  SystemName: string,
  FirstName: string,
  LastName: string,
  Email: string,
  MobileNo: string,
  Username: string,
  Password: string,

  SubscriptionOptions: ISubscriptionOptions,
  ProviderOptions: IProviderOptions,
  StorageProvider: IStorageProvider,
}


export interface IOptions {
  type: string,
  url: string
}

const options: IOptions = {
  type: "",
  url: ""
}

const SubscriptionOptions: ISubscriptionOptions = {
  type: '',
  database: '',
  url: '',
  authSource: ''
};

const ProviderOptions: IProviderOptions = {
  type: '',
  database: '',
  url: '',
  authSource: ''
};

const StorageProvider: IStorageProvider = {
  id: v4(),
  options: { ...options }
};

export const SubscriptionDefinition: ISubscription = {
  SourceSubscriptionId: "",
  SystemName: "",
  FirstName: "",
  LastName: "",
  Email: "",
  MobileNo: "",
  Username: "",
  Password: "",

  SubscriptionOptions: { ...SubscriptionOptions },
  ProviderOptions: { ...ProviderOptions },
  StorageProvider: { ...StorageProvider },
};


export const ProvidersGridColumns = [
  {
    dataField: "type",
    caption: "Type",
    visible: true,
  },
  {
    dataField: "url",
    caption: "URL",
    visible: true,
  },
  {
    dataField: "authSource",
    caption: "AuthSource",
    visible: true,
  },
  {
    dataField: "database",
    caption: "Database",
    visible: true,
  },
  {
    dataField: "driver",
    caption: "Driver",
    visible: true,
  },
  {
    dataField: "charset",
    caption: "Charset",
    visible: true,
  },
  {
    dataField: "timezone",
    caption: "Timezone",
    visible: true,
  },
];


export const publishRequestFormDefinition = {
  SourceSubscription: '',
  DestinationSubscription: '',
  Title: "",
  Description: ""
}


//Onboard entity

export interface IContactDetails {
  UserFirstName: string,
  UserLastName: string,
  UserEmail: string,
  UserMobileNo: string,
}

export interface IAdminDetails {
  FirstName: string,
  LastName: string,
  Email: string,
  MobileNo: string,
}
const ContactDetails: IContactDetails = {
  UserFirstName: "",
  UserLastName: "",
  UserEmail: "",
  UserMobileNo: "",
}

const AdminDetails: IAdminDetails = {
  FirstName: "",
  LastName: "",
  Email: "",
  MobileNo: "",
}

export interface ISubscriptionOnBoard {
  _id: string;
  SystemName:string
  DisplayName:string
  CompanyName:string,
  CompanyWebsite:string
  CompanyDomain:string,
  CompanySize:string
  CompanyAddress:string
  PinCode:string
  City:string
  State:string
  Country:string
  Status?: string;
  SubscriptionOptions:ISubscriptionOptions,
  ContactDetails:IContactDetails,
  AdminDetails: IAdminDetails,
  StorageProvider: IStorageProvider,
}

export const SubscriptionOnBoardDefinition: ISubscriptionOnBoard = {
  _id:'',
  SystemName:"",
  DisplayName:"",
  CompanyName:'',
  CompanyWebsite: '',
  CompanyDomain:'',
  CompanySize:'',
  CompanyAddress:'',
  PinCode: '',
  City:'',
  State:'',
  Country:'',
  Status: "DRAFT",
  SubscriptionOptions:{...SubscriptionOptions},
  ContactDetails: { ...ContactDetails },
  AdminDetails:{ ...AdminDetails },
  StorageProvider: { ...StorageProvider },
};

export const SubscriptionTabsDataSource = [
  {
    id: 0,
    text: "Subscription",
    //   icon: "user",
    content: "",
  },
  {
    id: 1,
    text: "Settings",
    //   icon: "comment",
    content: "",
  },
];
