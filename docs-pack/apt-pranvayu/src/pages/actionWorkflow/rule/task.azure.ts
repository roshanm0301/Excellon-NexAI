import { ITask, TaskType } from "./task";

export interface ITaskAzure extends ITask {
    type: TaskType.Azure;
    containerName: string;
    options: string;
}

export interface ITaskGetContainerClient extends ITaskAzure {
    method: 'GetContainerClient';
}

export interface ITaskCreateContainer extends ITaskAzure {
    method: 'CreateContainer';
}

export interface ITaskDeleteContainer extends ITaskAzure {
    method: 'DeleteContainer';
}

export interface ITaskUndeleteContainer extends ITaskAzure {
    method: 'UndeleteContainer';
    deletedContainerName: string;
    deletedContainerVersion: string;
}

export interface ITaskGetProperties extends ITaskAzure {
    method: 'GetProperties';
}

export interface ITaskSetProperties extends ITaskAzure {
    method: 'SetProperties';
    properties: string;
}
export interface ITaskListContainers extends ITaskAzure {
    method: 'ListContainers';
    properties: string;
}

export interface ITaskDownloadBlobToBuffer extends ITaskAzure {
    method: 'DownloadBlobToBuffer';
    blobName: string;
    offset: string;
    count: number;
}

export interface ITaskDownload extends ITaskAzure {
    method: 'Download';
    blobName: string;
    offset: string;
    count: number;
}

export interface ITaskGetBlockBlobClient extends ITaskAzure {
    method: 'GetBlockBlobClient';
    blobName: string;
}

export interface ITaskUploadData extends ITaskAzure {
    method: 'UploadData';
    blobName: string;
    data: string;
}

export interface ITaskDownloadToBuffer extends ITaskAzure {
    method: 'DownloadToBuffer';
    blobName: string;
    offset: string;
    count: number;
}

export interface ITaskUpload extends ITaskAzure {
    method: 'Upload';
    body: string;
    contentLength: string;
    blobName: string;
}

export type TaskAzure = ITaskGetContainerClient | ITaskCreateContainer | ITaskDeleteContainer | ITaskUndeleteContainer |
    ITaskGetProperties | ITaskSetProperties | ITaskListContainers | ITaskDownloadBlobToBuffer | ITaskDownload |
    ITaskGetBlockBlobClient | ITaskUploadData | ITaskDownloadToBuffer | ITaskUpload

export const execTaskAzure = async (task: any, taskSettings: TaskAzure): Promise<TaskAzure> => {
    let document: TaskAzure = { ...task, ...taskSettings };
    return document;
};

export enum AzureMethodType {
    "GetContainerClient" = "GetContainerClient",
    "CreateContainer" = "CreateContainer",
    "DeleteContainer" = "DeleteContainer",
    "UndeleteContainer" = "UndeleteContainer",
    "GetProperties" = "GetProperties",
    "SetProperties" = "SetProperties",
    "ListContainers" = "ListContainers",
    "DownloadBlobToBuffer" = "DownloadBlobToBuffer",
    "Download"="Download",
    "GetBlockBlobClient"="GetBlockBlobClient",
    "UploadData"="UploadData",
    "DownloadToBuffer"="DownloadToBuffer",
    "Upload"="Upload"
}