import { v4 } from "uuid";
import { IAction } from "./action.entity";
import {
  errorDefinition,
  failedDefinition,
  successDefinition,
} from "./common.entity";
import {
  IKeyValue,
  ITaskResolver,
  ITaskResponse,
  TaskType,
  ValueTypes,
} from "./rule";

export const DefaultPayload: any[] = [
  {
    id: "0b0a923d-a97f-471f-9f00-99ce21f53726",
    Key: "success",
    Value: true,
    Type: ValueTypes.Literal,
    IsResolved: true,
  },
  {
    id: "cebc6af9-9aee-4fe6-b1c6-df06041ec372",
    Key: "statusCode",
    Value: 200,
    Type: ValueTypes.Literal,
    IsResolved: true,
  },
  {
    id: "c7950880-0918-4652-a919-d95d969e3fdb",
    Key: "code",
    Value: "",
    Type: ValueTypes.Literal,
    IsResolved: true,
  },
  {
    id: "5fc6b19b-cd25-42d1-8aba-be38eecb6755",
    Key: "data",
    Value: "{$.dbquery.data}",
    Type: ValueTypes.Property,
    IsResolved: true,
  },
];

export const resolverDefinition: ITaskResolver = {
  id: "ResolverId",
  type: TaskType.Resolver,
  name: 'Resolver',
  method: "",
  isArray: false,
  path: "",
  payload: [],
  success: successDefinition,
  failed: failedDefinition,
  error: errorDefinition,
};

export const responseDefinition: ITaskResponse = {
  id: "Response", // hardcode for now
  name: "",
  type: TaskType.Response,
  payload: DefaultPayload,
  success: successDefinition,
  failed: failedDefinition,
  error: errorDefinition,
};

export const ActionDefinition: IAction = {
  id: "",
  _id: "",
  ActionType: "",
  ParentSchemaId: "",
  PartitionKey: "",
  SystemName: "",
  DisplayName: "",
  Description: "",
  Routing: false,
  Topic: "",
  Method: "",
  Body: {},
  Params: {},
  Query: {},
  Response: {},
  State: [],
  Tasks: [],
  Cache: {
    Enabled: false,
    TTL: 0,
    Headers: []
  },
  DLQ: {
    Enabled: false,
    Topic: "",
  }
  // Resolver: resolver,
  // Response: responseDefinition,
};

export let paramsBodyDataSource = [
  { id: 1, title: "Params", componentType: "Params" },
  { id: 2, title: "Body", componentType: "Body" },
  { id: 3, title: "Query", componentType: "Query" },
];

export let responseResolverDataSource = [
  { id: 1, title: "Response", componentType: "Response" },
  { id: 2, title: "Resolver", componentType: "Resolver" },
];

export const buttonGroup = [
  {
    title: 'Params',
    hint: 'Params',
    text: "Params",
  },
  {
    title: 'Query',
    hint: 'Query', text: "Query"
  },
  {
    title: 'Body',
    hint: 'Body', text: "Body"
  },
  {
    title: 'Response',
    hint: 'Response', text: "Response"
  }
];

export enum ActionType {
  "Atom" = "Atom",
  "Molecule" = "Molecule",
  "Template" = "Template",
  "BusinessWorkflow" = "BusinessWorkflow",
}