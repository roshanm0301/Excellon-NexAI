import {
  createConditionStep,
  createIteratorStep,
  createLoopStep,
  createPromise,
  createStateStep,
  createSwitchStep,
  createTask,
  createTaskStep,
  createTransactionStep,
} from "./stepUtils";

export const ToolboxConfig = {
  isHidden: false,
  groups: [
    {
      name: "Tasks",
      steps: [
        createTask("Document", "Document", {
          type: "",
        }),
        createTask("Request", "Request", {
          type: "",
        }),
        createTask("Response", "Response", {}),
        createTask("Resolver", "Resolver", {}),
        createTask("Rule", "Rule", {}),
        createTask("Query", "Query", {
          type: "",
        }),
        createTask("Date", "Date", {
          type: "",
        }),
        createTask("UUID", "UUID", {
          type: "",
        }),
        createTask("JSON", "JSON", {
          type: "",
        }),
        createTask("Identifier", "Identifier", {
          type: "",
        }),
        createTask("Object", "Object", {
          type: "",
        }),
        createTask("Array", "Array", { type: "" }),
        createTask("Geometry", "Geometry", {
          type: "",
        }),
        createTask("HTTP", "HTTP", {
          type: "",
        }),
        createTask("Security", "Security", {
          type: "",
        }),
        createTask("Math", "Math", {
          type: "",
        }),
        createTask("Action", "Action", {
          type: "",
        }),
        createTask("SMTP", "SMTP", {}),
        createTask("String", "String", {}),
        createTask("Provider", "Provider", {}),
        createTask("Schema", "Schema", {}),
        createTask("Repository", "Repository", {}),
        createTask("RSA", "RSA", {}),
        createTask("Crypto", "Crypto", {}),
        createTask("Workflow", "Workflow", {}),
        createTask("Subscription", "Subscription", {}),
        createTask("Cache", "Cache", {}),
        createTask("History", "History", {}),
        createTask("Version", "Version", {}),
        createTask("Entity", "Entity", {}),
        createTask("ORM", "ORM", {}),
        createTask("MinIO", "MinIO", {}),
        createTask("Filter", "Filter", {}),
        createTask("Trino", "Trino", {}),
        createTask("Azure", "Azure", {}),
        createTask("Variable", "Variable", {}),
        createTask("Sequence", "Sequence", {}),
        createTask("Validator", "Validator", {}),
        createTask("ESQuery", "ESQuery", {}),
        createTask("Export", "Export", {}),
        createTask("Template", "Template", {}),
        createTask("UIComponent", "UIComponent", {}),
        createTask("Keycloak", "Keycloak", {}),
        
        createSwitchStep(),
        createConditionStep(),
        createPromise(),
        createTransactionStep(),
        createLoopStep(),
        createIteratorStep(),
        createStateStep(),
        // createIndexOfStep(),
      ],
    },
    { name: "Steps", steps: [createTaskStep(), createSwitchStep()] },

  ],
};
