import { PAGING } from "../../components/constant/constant";

export interface IColumn {
  type: string;
  // primary: boolean,
  // generated: boolean,
  // objectId: boolean,
  // array: boolean,
  // IsCreateDate: boolean,
  // enum: string,
  // nullable: boolean,
  // IsUpdateDate: boolean,
  // unique: boolean,
  name: string;
}

export interface IRelations {
  id: string;
  type: string;
  name: string;
  subscription: string;
  schemaId: string;
  joinColumn: string;
  column: string;
  columns: string[];
  edge?: string;
  nodeLabel?: string;
  parentId?: null,
  relations?: IRelations[]
}

export interface IElasticsearch {
  enable: boolean;
  index: string;
}

export interface IMiniIo {
  enable: boolean,
  bucketName: string,
}

export interface ISchema {
  _id: string;
  id: string;
  Columns: IColumn[];
  Provider: string;
  SystemName: string;
  TableName: string;
  DisplayName: string;
  IsSystem: boolean;
  IsLock: boolean;
  List?: boolean;
  Get?: boolean;
  Post?: boolean;
  Put?: boolean;
  Paging?: boolean;
  TableType?: string;
  Help: string;
  Description: string;
  DefaultCrud?: [];
  Status?: string;
  Relations?: [];
  Topic: string;
  Elasticsearch: IElasticsearch;
  Minio: IMiniIo;
  CacheTTL: number;
  Silver: [];
  // Gold:[];
  EntityType:string
}

export interface IContainerProps {
  id: string | undefined;
  data: any;
  isActive: boolean;
  entityType?: string;
  RequestType?: string;
  disableUpdateButtons?: boolean;
  height?: any;
  visibility?: any;
}

export interface IContainerColumnProps {
  title: string;
  data: any;
  isActive: boolean;
  callback: any;
  listData: any;
  disable?: boolean;
}

export interface IContainerActionProps {
  schemaId: any;
  isActive: boolean;
  visibility?: any;
}

export const DefaultColumn: any[] = [
  {
    type: "varchar",
    primary: true,
    objectId: true,
    name: "_id",
  },
  {
    type: "varchar",
    name: "id",
  },
  {
    type: "varchar",
    name: "SchemaId",
  },
  {
    type: "varchar",
    name: "PartitionKey",
  },
  {
    type: "timestamp with time zone",
    name: "_ts",
    nullable: false,
  },
  {
    type: "varchar",
    name: "SystemNameId",
    nullable: true,
  },
];

export const DefaultSQLColumns = [
  {
    type: "varchar",
    primary: true,
    objectId: true,
    name: "_id",
    nullable: false,
  },
  {
    type: "varchar",
    name: "id",
    nullable: false,
  },
  {
    type: "varchar",
    name: "SchemaId",
    nullable: true,
  },
  {
    type: "varchar",
    name: "PartitionKey",
    nullable: true,
  },
  {
    type: "varchar",
    name: "CreatedOn",
    nullable: true,
  },
  {
    type: "varchar",
    name: "CreatedBy",
    nullable: true,
  },
  {
    type: "varchar",
    name: "UpdatedOn",
    nullable: true,
  },
  {
    type: "varchar",
    name: "UpdatedBy",
    nullable: true,
  },
  {
    type: "varchar",
    name: "_type",
    nullable: true,
  },
  {
    type: "timestamp",
    name: "_ts",
    nullable: false,
  },
];

export const DefaultPostgresColumns = [
  {
    type: "uuid",
    primary: true,
    objectId: true,
    name: "_id",
    nullable: false,
  },
  {
    type: "uuid",
    name: "id",
    nullable: false,
  },
  {
    type: "uuid",
    name: "SchemaId",
    nullable: true,
  },
  {
    type: "uuid",
    name: "PartitionKey",
    nullable: true,
  },
  {
    type: "timestamp with time zone",
    name: "CreatedOn",
    nullable: true,
  },
  {
    type: "uuid",
    name: "CreatedBy",
    nullable: true,
  },
  {
    type: "timestamp with time zone",
    name: "UpdatedOn",
    nullable: true,
  },
  {
    type: "uuid",
    name: "UpdatedBy",
    nullable: true,
  },
  {
    type: "varchar",
    name: "_type",
    nullable: true,
  },
  {
    type: "timestamp with time zone",
    name: "_ts",
    nullable: false,
  },
];

export const DefaultMongodbColumns = [
  {
    type: "varchar",
    primary: true,
    objectId: true,
    name: "_id",
    nullable: false,
  },
  {
    type: "varchar",
    name: "id",
    nullable: false,
  },
  {
    type: "varchar",
    name: "SchemaId",
    nullable: true,
  },
  {
    type: "varchar",
    name: "PartitionKey",
    nullable: true,
  },
  {
    type: "varchar",
    name: "CreatedOn",
    nullable: true,
  },
  {
    type: "varchar",
    name: "CreatedBy",
    nullable: true,
  },
  {
    type: "varchar",
    name: "UpdatedOn",
    nullable: true,
  },
  {
    type: "varchar",
    name: "UpdatedBy",
    nullable: true,
  },
  {
    type: "varchar",
    name: "_type",
    nullable: true,
  },
  {
    type: "timestamp",
    name: "_ts",
    nullable: false,
  },
];
export const SchemaDefinition: ISchema = {
  _id: "",
  id: "",
  Columns: DefaultColumn,
  Provider: "",
  SystemName: "",
  TableName: "",
  DisplayName: "",
  IsSystem: false,
  IsLock: false,
  Help: "",
  Description: "",
  TableType: "",
  DefaultCrud: [],
  Status: "DRAFT",
  Relations: [],
  Topic: "",
  Elasticsearch: {
    enable: false,
    index: "",
  },
  Minio: {
    enable: false,
    bucketName: "",
  },
  CacheTTL: 0,
  Silver: [],
  // Gold:[],
  EntityType: ""
};

export const Providers = ["mongodb", "postgres", "mysql"];

export const TableTypes = ["regular", "view"];

export const EntityTypeList = ["Transaction", "Master"];

export enum ColumnType {
  uuid = "uuid",
  varchar = "varchar",
  string = "string",
  number = "number",
  boolean = "boolean",
  date = "date",
  any = "any",
  union = "union",
}

export enum EnumType {
  string = "string",
  integer = "integer",
  heterogenous = "heterogenous",
}

export const GridColumns = [
  {
    dataField: "name",
    caption: "Name",
    visible: true,
  },
  {
    dataField: "type",
    caption: "Type",
    visible: true,
  },
  {
    dataField: "isPrimary",
    caption: "Primary",
    visible: true,
  },
  {
    dataField: "primary",
    caption: "Primary",
    visible: true,
  },
  {
    dataField: "generated",
    caption: "Generated",
    visible: true,
  },
  {
    dataField: "objectId",
    caption: "ObjectId",
    visible: true,
  },
  // {
  //     dataField: "IsCreateDate",
  //     caption: "IsCreateDate",
  //     visible: true,
  // },
  // {
  //     dataField: "IsUpdateDate",
  //     caption: "IsUpdateDate",
  //     visible: true,
  // },
  {
    dataField: "nullable",
    caption: "Nullable",
    visible: true,
  },
  {
    dataField: "unique",
    caption: "Unique",
    visible: true,
  },
  {
    dataField: "enum",
    caption: "Enum",
    visible: true,
  },
];

export const SchemaGridColumn = [
  {
    dataField: "SystemName",
    caption: "System Name",
    visible: true,
  },
  {
    dataField: "DisplayName",
    caption: "Display Name",
    visible: true,
  },
  {
    dataField: "TableName",
    caption: "Table Name",
    visible: true,
  },
  {
    dataField: "IsSystem",
    caption: "Is System",
    visible: true,
  },
  {
    // calculateCellValue: function (data: any) {
    //     return data.DatabaseName + " " + data.DatabaseType;
    // },
    dataField: "DatabaseType",
    caption: "Provider",
    visible: true,
  },
  {
    dataField: "Status",
    caption: "Status",
    visible: true,
  },
];

export const SchemaActionColumn = [
  {
    dataField: "SystemName",
    caption: "System Name",
    visible: true,
  },
  {
    dataField: "DisplayName",
    caption: "Display Name",
    visible: true,
  },
];

export interface IDefaultState {
  orderby: string;
  asc: number;
  page: number;
  take: number;
  search: string;
}

export interface IColumnData {
  id: number;
  name: string;
  type: string;
  primary: boolean;
  generated: boolean;
  objectId: boolean;
  array: boolean;
  IsCreateDate: boolean;
  IsUpdateDate: boolean;
  nullable: boolean;
  unique: boolean;
  enum: string;
}

export const defaultState: IDefaultState = {
  orderby: "CreatedOn",
  asc: -1,
  page: PAGING.pageIndex,
  take: PAGING.pageSize,
  search: "",
};

export const DefaultCrud = ["List", "Get", "Post", "Put", "Paging"];

export enum requestType {
  PullRequest = "PULLREQUEST",
  CheckoutRequest = "CHECKOUTREQUEST",
  Publish = "PUBLISHED",
}

export const SchemaTabsDataSource = [
  {
    id: 0,
    text: "Edit Schema",
    //   icon: "user",
    content: "",
  },
  {
    id: 1,
    text: "View History",
    //   icon: "comment",
    content: "",
  },
];

export const defaultColumnNames = [
  "PartitionKey",
  "SchemaId",
  "_id",
  "id",
  "SystemName",
  "DisplayName",
  "_ts",
];

export interface ICheckoutProcessProps {
  data: object;
  setIsOpen: any;
}

export interface IAboutActionProps {
  schemaId: string;
  id: string;
  data: any;
  setIsOpen: any;
}

export enum EntityType {
  Action = "Action",
  Schema = "Schema",
  Subscription = "Subscription",
}

export interface IReadMeEditor {
  data: any;
  callback: any;
  title?: string;
  disable?: boolean;
}

export interface IViewHistory {
  schemaId: any;
}

export enum RoleType {
  Contributor = "Contributor",
  Moderator = "Moderator",
}

export const defaultStateForSchemaList: IDefaultState = {
  orderby: "CreatedOn",
  asc: -1,
  page: PAGING.pageIndex,
  take: 1000,
  search: "",
};

export const formDefinition = {
  Tags: [],
  Description: "",
  Help: "",
};
export const payloadForLakeHouse = {
  db: {
    retrycount: 0,
    maxretrycount: 3,
    rbretrycount: 0,
    rbmaxretrycount: 3,
    success: false,
    name: "",
  },
  mb: {
    retrycount: 0,
    maxretrycount: 3,
    rbretrycount: 0,
    rbmaxretrycount: 3,
    success: false,
    name: "",
  },
  s3: {
    retrycount: 0,
    maxretrycount: 3,
    rbretrycount: 0,
    rbmaxretrycount: 3,
    success: false,
    name: "",
  },
  trinoschema: {
    retrycount: 0,
    maxretrycount: 3,
    rbretrycount: 0,
    rbmaxretrycount: 3,
    success: false,
    name: "",
  },
  trinotable: {
    retrycount: 0,
    maxretrycount: 3,
    rbretrycount: 0,
    rbmaxretrycount: 3,
    success: false,
    name: "",
  },
  expiryinhrs: 48,
};

export enum ReltionTypes {
  ONE_TO_ONE = "OneToOne",
  ONE_TO_MANY = "OneToMany",
  MANY_TO_ONE = "ManyToOne",
}

export const RelationGridColumns = [
  {
    dataField: "name",
    caption: "Name",
    visible: true,
  },
  {
    dataField: "type",
    caption: "Type",
    visible: true,
  },
  {
    dataField: "subscription",
    caption: "Subscription",
    visible: true,
  },
  {
    dataField: "schemaId",
    caption: "Schema",
    visible: true,
  },
  {
    dataField: "joinColumn",
    caption: "JoinColumn",
    visible: true,
  },
  {
    dataField: "column",
    caption: "Column",
    visible: true,
  },
  {
    dataField: "columns",
    caption: "Columns",
    visible: true,
  },
];

export const findDuplicateObjectsByName = (arr: any[], key: string) => {
  const occurrences: { [key: string]: number } = {};

  // Count occurrences of each key value
  arr.forEach(item => {
    const keyValue = item[key];
    occurrences[keyValue] = (occurrences[keyValue] || 0) + 1;
  });

  // Filter out the items that have more than one occurrence
  const duplicates = arr.filter(item => occurrences[item[key]] > 1);

  return duplicates;
}


export const formatTreeListDataForPayload = (data: any[]) => {
  const itemMap = new Map();
  let parents: any[] = [];
  data.forEach((item: any) => {
    itemMap.set(item.id, { ...item, relations: [] });
    if (item.parentId === null) {
      parents.push(itemMap.get(item.id));
    }
  });
  data.forEach((item: any) => {
    if (item.parentId !== null) {
      const parentItem = itemMap.get(item.parentId);
      if (parentItem) {
        parentItem.relations.push(itemMap.get(item.id));
      }
    }
  });
  return parents;
};

export const formatRelationsDataForTreeList = (data: any[]) => {
  const flattenedData: any[] = [];

  const processItem = (item: any) => {
    // Push the current item into the flattened array
    flattenedData.push({ ...item });

    // Process child relations recursively if they exist
    if (item.relations && item.relations.length > 0) {
      item.relations.forEach((relation: any) => {
        processItem(relation);
      });
    }
  };

  data.forEach((item: any) => {
    if (item.parentId === null) {
      processItem(item);
    }
  });

  return flattenedData;
};