import { v4 } from "uuid";

export interface IApplication {
    _id: string,
    id: string,
    SystemName: string,
    DisplayName: string,
}

export interface IContainerProps {
    id: string | undefined,
    data: string,
    isActive: boolean,
    entityType?: string
}

export interface IAddRoleApplicationMappingContainerProps {
    data: any[],
    callback: any,
    title?: string,
    rolesData: any
}

export interface IPayloadDefinition {
    RoleIds: any[]
};

export const ApplicationDefinition: IApplication = {
    _id: '',
    id: '',
    SystemName: '',
    DisplayName: '',
};

export const ApplicationGridColumn = [
    {
        dataField: "SystemName",
        caption: "System Name",
        visible: true,
        width: '15%',
    },
    {
        dataField: "DisplayName",
        caption: "Display Name",
        visible: true,
        width: '15%',
    },
    {
        dataField: "RoleIds",
        caption: "Role Ids",
        visible: true,
        width: '10%',
    },
];

export const RoleList =
    [
        { id: '6281bf63-3e96-4510-8db1-de9e1654b48c', SystemName: "Action1" },
        { id: '6bbb5368-43d8-444f-8e1f-167a8ed17c35', SystemName: "Action2" },
        { id: 'b757a931-eb76-4c8f-90a0-6d1b91ca8ccf', SystemName: "Action3" },
        { id: '9758bf98-a665-43c0-85d2-f5ebdfe4e0e1', SystemName: "Action4" },
        { id: '05c24974-4dd7-4ce5-8bb3-c9f0186e1997', SystemName: "Action5" },
        { id: 'f387de1f-1f27-4da5-835b-6e6b82681cb9', SystemName: "Action6" },
    ]