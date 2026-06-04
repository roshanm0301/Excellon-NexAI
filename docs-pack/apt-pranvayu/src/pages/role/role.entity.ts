import { v4 } from "uuid";

export const ActionList =
[
    { id: '6281bf63-3e96-4510-8db1-de9e1654b48c', SystemName: "Action1" },
    { id: '6bbb5368-43d8-444f-8e1f-167a8ed17c35', SystemName: "Action2" },
    { id: 'b757a931-eb76-4c8f-90a0-6d1b91ca8ccf', SystemName: "Action3" },
    { id: '9758bf98-a665-43c0-85d2-f5ebdfe4e0e1', SystemName: "Action4" },
    { id: '05c24974-4dd7-4ce5-8bb3-c9f0186e1997', SystemName: "Action5" },
    { id: 'f387de1f-1f27-4da5-835b-6e6b82681cb9', SystemName: "Action6" },
]


export const SchemaList =
[
    { id: '6281bf63-3e96-4510-8db1-de9e1654b48c', SystemName: "Schema1" },
    { id: '6bbb5368-43d8-444f-8e1f-167a8ed17c35', SystemName: "Schema2" },
    { id: 'b757a931-eb76-4c8f-90a0-6d1b91ca8ccf', SystemName: "Schema3" },
    { id: '9758bf98-a665-43c0-85d2-f5ebdfe4e0e1', SystemName: "Schema4" },
    { id: '05c24974-4dd7-4ce5-8bb3-c9f0186e1997', SystemName: "Schema5" },
    { id: 'f387de1f-1f27-4da5-835b-6e6b82681cb9', SystemName: "Schema6" },
]

interface IRoleDefinition {
    SystemName: string,
	DisplayName: string,
    RoleSchemaMapping: Array<any>


    // {
    //     id: "",
    //     schemaId: "",
    //     schematitle: "",
    //     actions: []
    // }
}

export const RoleDefinition : IRoleDefinition = {
	SystemName: "",
	DisplayName: "",
    RoleSchemaMapping: []
};
export const RoleGridColumn = [
    {
        dataField: "SystemName",
        caption : "System Name",
        visible: true,
    },
    {
        dataField: "DisplayName",
        caption : "Display Name",
        visible: true,
    }
];
export const companies = [{
    ID: 1,
    id: "6281bf63-3e96-4510-8db1-de9e1654b48c",
    SystemName : "test",
    DisplayName : "test"
}];

