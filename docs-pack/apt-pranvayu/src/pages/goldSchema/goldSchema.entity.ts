import { DefaultColumn } from "../schema";

export interface IColumn {
  type: string;
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
  SystemName: string;
  DisplayName: string;
  TableName: string;
  Columns: IColumn[];
  Revision: string
  Query: string
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

export const GoldSchemaDefinition: ISchema = {
  SystemName: "",
  DisplayName: "",
  TableName: "",
  Columns: DefaultColumn,
  Revision: "",
  Query: ''
};

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

