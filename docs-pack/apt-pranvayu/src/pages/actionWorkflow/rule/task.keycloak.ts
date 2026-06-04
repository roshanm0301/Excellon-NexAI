import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";


export enum KeycloakMethodType {
    "Auth" = "Auth",
    "UserFind" = "UserFind",
    "UserCreate" = "UserCreate",
    "UserUpdate" = "UserUpdate",
    "UserResetPassword" = "UserResetPassword",
    "UserSendVerifyEmail" = "UserSendVerifyEmail",
    "UserAddRealmRole" = "UserAddRealmRole",
    "UserListRealmRoles" = "UserListRealmRoles",
    "UserListGroups" = "UserListGroups",
    "GroupFind" = "GroupFind",
    "GroupCreate" = "GroupCreate",
    "GroupUpdate" = "GroupUpdate",
    "GroupAddUser" = "GroupAddUser",
    "RoleFind" = "RoleFind",
    "RoleCreate" = "RoleCreate",
    "RoleUpdate" = "RoleUpdate",
    "ClientFind" = "ClientFind",
    "ClientCreate" = "ClientCreate",
    "ClientUpdate" = "ClientUpdate"
}

export interface ITaskKeycloak extends ITask {
    type: TaskType.Keycloak;
    method: KeycloakMethodType;
    baseUrl?: string;
    realm?: string;
    adminUsername?: string;
    password?: string;
    grantType?: string;
    clientId?: string;
    clientSecret?: string;
}

export interface ITaskKeycloakAuth extends ITaskKeycloak {
    method: KeycloakMethodType.Auth;
}

export interface ITaskKeycloakUserFind extends ITaskKeycloak {
    method: KeycloakMethodType.UserFind;
    query?: IKeyValue[];
}

export interface ITaskKeycloakUserCreate extends ITaskKeycloak {
    method: KeycloakMethodType.UserCreate;
    payload: IKeyValue[];
}

export interface ITaskKeycloakUserUpdate extends ITaskKeycloak {
    method: KeycloakMethodType.UserUpdate;
    userId: string;
    payload: IKeyValue[];
}

export interface ITaskKeycloakUserResetPassword extends ITaskKeycloak {
    method: KeycloakMethodType.UserResetPassword;
    userId: string;
    payload: IKeyValue[];
}

export interface ITaskKeycloakUserSendVerifyEmail extends ITaskKeycloak {
    method: KeycloakMethodType.UserSendVerifyEmail;
    userId: string;
    payload: IKeyValue[];
}

export interface ITaskKeycloakUserAddRealmRole extends ITaskKeycloak {
    method: KeycloakMethodType.UserAddRealmRole;
    userId: string;
    roleId: string;
}

export interface ITaskKeycloakUserListRealmRoles extends ITaskKeycloak {
    method: KeycloakMethodType.UserListRealmRoles;
    userId: string;
}

export interface ITaskKeycloakUserListGroups extends ITaskKeycloak {
    method: KeycloakMethodType.UserListGroups;
    userId: string;
}

export interface ITaskKeycloakGroupFind extends ITaskKeycloak {
    method: KeycloakMethodType.GroupFind;
    query?: IKeyValue[];
}

export interface ITaskKeycloakGroupCreate extends ITaskKeycloak {
    method: KeycloakMethodType.GroupCreate;
    payload: IKeyValue[];
}

export interface ITaskKeycloakGroupUpdate extends ITaskKeycloak {
    method: KeycloakMethodType.GroupUpdate;
    groupId: string;
    payload: IKeyValue[];
}

export interface ITaskKeycloakGroupAddUser extends ITaskKeycloak {
    method: KeycloakMethodType.GroupAddUser;
    userId: string;
    groupId: string;
}

export interface ITaskKeycloakRoleFind extends ITaskKeycloak {
    method: KeycloakMethodType.RoleFind;
    query?: IKeyValue[];
}

export interface ITaskKeycloakRoleCreate extends ITaskKeycloak {
    method: KeycloakMethodType.RoleCreate;
    payload: IKeyValue[];
}

export interface ITaskKeycloakRoleUpdate extends ITaskKeycloak {
    method: KeycloakMethodType.RoleUpdate;
    roleId: string;
    payload: IKeyValue[];
}

export interface ITaskKeycloakClientFind extends ITaskKeycloak {
    method: KeycloakMethodType.ClientFind;
    query?: IKeyValue[];
}

export interface ITaskKeycloakClientCreate extends ITaskKeycloak {
    method: KeycloakMethodType.ClientCreate;
    payload: IKeyValue[];
}

export interface ITaskKeycloakClientUpdate extends ITaskKeycloak {
    method: KeycloakMethodType.ClientUpdate;
    kcClientId: string;
    payload: IKeyValue[];
}

export type TaskKeycloak = ITaskKeycloakAuth | ITaskKeycloakUserFind | ITaskKeycloakUserCreate | ITaskKeycloakUserUpdate | ITaskKeycloakUserResetPassword |
    ITaskKeycloakUserSendVerifyEmail | ITaskKeycloakUserAddRealmRole | ITaskKeycloakUserListRealmRoles |
    ITaskKeycloakUserListGroups | ITaskKeycloakGroupFind | ITaskKeycloakGroupCreate | ITaskKeycloakGroupUpdate |
    ITaskKeycloakGroupAddUser | ITaskKeycloakRoleFind | ITaskKeycloakRoleCreate | ITaskKeycloakRoleUpdate | ITaskKeycloakClientFind |
    ITaskKeycloakClientCreate | ITaskKeycloakClientUpdate



export const execTaskKeycloak = async (task: any, taskSettings: TaskKeycloak): Promise<TaskKeycloak> => {
    let action: TaskKeycloak = { ...task, ...taskSettings };
    return action;
};