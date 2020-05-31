export {};

declare global {
    namespace NodeJS {
        interface Global {
            verbose: boolean;
        }
    }
}

export interface ArgBag {}

export interface Action {
    name: string;
    namespace?: string;
    args?: string[];
    action: { (args: any): void } | { (args: any): Promise<void> };
}

export interface ServerArgBag {
    serverId: string;
}

export interface ServerDeployArgBag extends ServerArgBag {
    composeFile: string;
}

export interface ServerEjectArgBag extends ServerArgBag {
    targetPath: string;
}
