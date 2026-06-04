import { regEx } from "../../../../components/constant/regex/regex";
import { regexEx } from "../../../../components/constant/regex/regexEx";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import {
  errorStatusCode,
  failedStatusCode,
  successStatusCode
} from "../../common.entity";

export const GetEntityFormItems = [
  {
    label: { text: "Id", location: "top" },
    dataField: "id",
    isRequired: true,
  },
  {
    label: { text: "Name", location: "top" },
    dataField: "name",
    isRequired: true,
  },
  {
    label: { text: "Document Id", location: "top" },
    dataField: "documentId",
    isRequired: true,
    validationRules: [
      {
        type: "required",
        message: isRequiredField("documentId"),
      },
      {
        type: "pattern",
        pattern: regEx.pattern,
        message: isValidField(`documentId ${regexEx.pattern}`),
      },
    ],
  },
  {
    label: { text: "Subscription Id", location: "top" },
    dataField: "subscriptionId",
    validationRules: [
      {
        type: "required",
        message: isRequiredField("subscriptionId"),
      },
      {
        type: "pattern",
        pattern: regEx.pattern,
        message: isValidField(`subscriptionId ${regexEx.pattern}`),
      },
    ],
  },
  {
    label: { text: "Container Id", location: "top" },
    dataField: "containerId",
    isRequired: true,
  },
  {
    itemType: "group",
    caption: "Success",
    cssClass: "no-margin",
    colCount: 1,
    items: [
      {
        label: { text: "Status Code" },
        dataField: "success.statusCode",
        editorType: "dxSelectBox",
        editorOptions: {
          dataSource: successStatusCode,
        },
      },
      {
        label: { text: "Data" },
        dataField: "success.data",
        validationRules: [
          {
            type: "pattern",
            pattern: regEx.validString,
            message: isValidField("data"),
          },
        ],
      },
      {
        label: { text: "Code" },
        dataField: "success.code",
      },
    ],
  },
  {
    itemType: "group",
    caption: "Error",
    cssClass: "no-margin",
    colCount: 1,
    items: [
      {
        label: { text: "Status Code" },
        dataField: "error.statusCode",
        editorType: "dxSelectBox",
        editorOptions: {
          dataSource: errorStatusCode,
        },
      },
      {
        label: { text: "Message" },
        dataField: "error.message",
      },
      {
        label: { text: "Code" },
        dataField: "error.code",
      },
      {
        label: { text: "Error" },
        dataField: "error.error",
      },
    ],
  },
  {
    itemType: "group",
    caption: "Failed",
    cssClass: "no-margin",
    colCount: 1,
    items: [
      {
        label: { text: "Status Code" },
        dataField: "failed.statusCode",
        editorType: "dxSelectBox",
        editorOptions: {
          dataSource: failedStatusCode,
        },
      },
      {
        label: { text: "Message" },
        dataField: "failed.message",
      },
      {
        label: { text: "Code" },
        dataField: "failed.code",
      },
      {
        label: { text: "Error" },
        dataField: "failed.error",
      },
    ],
  },
  {
    itemType: "button",
    horizontalAlignment: "center",
    buttonOptions: {
      text: "Save",
      type: "default",
      useSubmitBehavior: true,
    },
  },
];
