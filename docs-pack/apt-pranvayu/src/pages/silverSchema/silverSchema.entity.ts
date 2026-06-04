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
  Query: string,
  Gold:[]
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

export const SilverSchemaDefinition: ISchema = {
  SystemName: "",
  DisplayName: "",
  TableName: "",
  Columns: DefaultColumn,
  Query: '',
  Gold: []
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

// export const validateQueryColumns = (query: string, columnList: any[]) => {
//   const extractColumnsFromQuery = (query: string) => {
//     const match = query.match(/select\s+(.*?)\s+from/i);
//     if (!match || match.length < 2) return [];

//     return match[1]
//       .split(',')
//       .map(col => {
//         col = col.trim();

//         // Extract alias if present
//         const aliasMatch = col.match(/\s+as\s+(\w+)$/i);
//         if (aliasMatch) {
//           return aliasMatch[1].trim();
//         }

//         // If it's a table.column like u.name, return name
//         if (col.includes('.')) {
//           return col.split('.')[1].trim();
//         }

//         // If it's a function or expression without alias, skip validation
//         // or return the whole expression (optional behavior)
//         return col;
//       });
//   };

//   const queryColumns = extractColumnsFromQuery(query);
//   const allowedColumns = columnList.map(col => col.name.toLowerCase());
// console.log("queryColumns",queryColumns)
//   const invalidColumns = queryColumns.filter(col => !allowedColumns.includes(col.toLowerCase()));

//   if (invalidColumns.length > 0) {
//     return {
//       success: false,
//       invalidColumns,
//       message: `Invalid column(s): ${invalidColumns.join(', ')}`
//     };
//   }

//   return {
//     success: true,
//     message: 'All columns are valid.'
//   };
// };


export const validateQueryColumns = (query: string, columnList: any[]) => {
  const extractColumnsFromQuery = (query: string) => {
    const match = query.match(/select\s+(.*?)\s+from/i);
    if (!match || match.length < 2) return [];

    const selectClause = match[1];

    const columns: string[] = [];
    let current = '';
    let parenLevel = 0;

    for (let char of selectClause) {
      if (char === '(') parenLevel++;
      if (char === ')') parenLevel--;

      if (char === ',' && parenLevel === 0) {
        columns.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current) columns.push(current); // last column

    return columns.map(col => {
      col = col.trim();

      // Extract alias if exists (AS or implicit alias)
      const aliasMatch = col.match(/\s+as\s+(\w+)$/i);
      if (aliasMatch) return aliasMatch[1].trim();

      const spaceParts = col.split(/\s+/);
      if (spaceParts.length > 1) return spaceParts[1]; // implicit alias

      // If function or expression, return as-is (you could assign dummy name if needed)
      if (col.includes('(')) return ''; // skip unnamed functions

      // u.name â†’ name
      return col.includes('.') ? col.split('.')[1].trim() : col.trim();
    }).filter(Boolean); // remove empty ones
  };

  const queryColumns = extractColumnsFromQuery(query);

  const allowedColumns = columnList.map(col => col.name.toLowerCase());

  const invalidColumns = queryColumns.filter(
    col => !allowedColumns.includes(col.toLowerCase())
  );

  if (invalidColumns.length > 0) {
    return {
      success: false,
      invalidColumns,
      message: `Invalid column(s): ${invalidColumns.join(', ')}`
    };
  }

  return {
    success: true,
    message: 'All columns are valid.'
  };
};

