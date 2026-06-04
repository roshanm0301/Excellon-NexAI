import { ITask, TaskType } from "./task";

type BinaryToTextEncoding = 'base64' | 'base64url' | 'hex' | 'binary';

type CharacterEncoding = 'utf8' | 'utf-8' | 'utf16le' | 'latin1';

type LegacyCharacterEncoding = 'ascii' | 'binary' | 'ucs2' | 'ucs-2';

export type Encoding = BinaryToTextEncoding | CharacterEncoding | LegacyCharacterEncoding;
export interface ITaskCrypto extends ITask {
    type: TaskType.Crypto;
  }

export interface ITaskCryptoKey extends ITaskCrypto {
    method: "Hash",
    path: string;
  }
  export interface ITaskEncrypt extends ITaskCrypto {
    method: "Encrypt",
    hashAlgo: string,
    iv: string,
    algorithm: string,
    data: string,
    secret: string,
    outputEncoding: Encoding|string,
    inputEncoding:Encoding| string

}

export interface ITaskDecrypt extends ITaskCrypto {
    method: "Decrypt",
    hashAlgo: string,
    iv: string,
    algorithm: string,
    data: string,
    secret: string,
    outputEncoding: Encoding | string,
    inputEncoding: Encoding|string
}

export type TaskCrypto = ITaskCryptoKey | ITaskDecrypt | ITaskEncrypt

  export const execTaskCrypto = async (task: any, taskSettings: TaskCrypto): Promise<TaskCrypto> => {
    let action: TaskCrypto = { ...task, ...taskSettings };
    return action;
};

