import { v4 } from "uuid";

export enum MethodTypeDataSource {
    "GET" = "GET",
    "POST" = "POST",
    "PUT" = "PUT"
}

// export const Schemas = [
//     { id: "e9e0beb9-b3b9-4d6a-aed6-8bfaa3cad02d", text: "Application", },
//     { id: "a934db15-9d03-4492-bf01-4254d9a51c81", text: "Role", },
//     { id: "b7df0743-1671-434f-b0eb-d0786be871b6", text: "Identity" }
// ]

// export enum SchemasDataSource {
//     "e9e0beb9-b3b9-4d6a-aed6-8bfaa3cad02d" = "e9e0beb9-b3b9-4d6a-aed6-8bfaa3cad02d", //"Application",
//     "a934db15-9d03-4492-bf01-4254d9a51c81" = "a934db15-9d03-4492-bf01-4254d9a51c81", // Role
//     "b7df0743-1671-434f-b0eb-d0786be871b6" = "b7df0743-1671-434f-b0eb-d0786be871b6" // Identity.
// }

export const SchemasDataSource = [
    {
        id: 'e9e0beb9-b3b9-4d6a-aed6-8bfaa3cad02d',
        parentSchema: 'Application'
    },
    {
        id: 'a934db15-9d03-4492-bf01-4254d9a51c81',
        parentSchema: 'Role'
    },
    {
        id: 'b7df0743-1671-434f-b0eb-d0786be871b6',
        parentSchema: 'Identity'
    },
    {
        id: '782a3cec-447b-4d1a-ad18-61833020c625',
        parentSchema: 'Template'
    }
]


export const TabsDataSource = [
    {
        id: 0,
        text: "Workflow Definition",
        icon: "user",
        content: "",
    },
    {
        id: 1,
        text: "Action Definition",
        icon: "comment",
        content: "",
    },
];

export function createBodyPropertiesArray(schema: any) {
    const properties =
        schema?.allOf?.[0]?.properties ?? {};

    return Object.entries(properties).map(([key, value]: any) => ({
        id: v4(),
        name: key,
        // type: value.type,
        SourceType: "Body",
        path: `{$.body.${key}}`,
        IsPredefineColumn: true,
        DataType: "String"
    }));
}