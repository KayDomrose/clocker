import { SERVERS_PATH, TEST_DOCKER_CONTAINER_PORT } from '../variables';
import { BaseProvider } from './BaseProvider';
import * as fs from 'fs';
import { getProvider } from '../provider';
import { readJson, writeJson } from '../helpers/file';
import { RequestConfig } from '../actions/add';
import { AxiosResponse } from 'axios';
import axiosRequest from '@nelsonomuto/axios-request-timeout';
import { logError } from '../helpers/log';
import run from '../helpers/command';
import rimraf from 'rimraf';

export interface ServerDeployment {
    composePath: string;
    lastDeployment: Date | null;
}

export interface ServerConfiguration {
    provider: string;
    ip: string;
    deployments: ServerDeployment[];
}

export interface ServerSavePaths {
    configPath: string;
    terraformPath: string;
    terraformVariablesPath: string;
}

export class Server {
    private readonly _id: string;
    private _path: string = '';
    private _provider: BaseProvider | null = null;
    private _ipAddress: string | null = null;
    private _deployments: ServerDeployment[] = [];

    constructor(id: string) {
        this._id = id;

        this.setServerPath();
    }

    public getId(): string {
        return this._id;
    }

    private setServerPath() {
        this._path = `${SERVERS_PATH}/${this._id}`;

        if (!fs.existsSync(this._path)) {
            fs.mkdirSync(this._path);
        }
    }

    public getServerPath(): string {
        return this._path;
    }

    public getIpAddress(): string {
        return this._ipAddress || '';
    }

    public setProvider(providerId: string) {
        this._provider = getProvider(providerId);
    }

    public setIpAddress(ip: string) {
        this._ipAddress = ip;
    }

    public addDeployment(deployment: ServerDeployment): boolean {
        if (
            this._deployments.some(
                (d: ServerDeployment) => d.composePath === deployment.composePath
            )
        ) {
            return false;
        }

        this._deployments = [...this._deployments, deployment];
        return true;
    }

    public setDeployments(deployments: ServerDeployment[]) {
        this._deployments = deployments;
    }

    public getDeployments(): ServerDeployment[] {
        return this._deployments;
    }

    public save(): ServerSavePaths {
        const config: ServerConfiguration = {
            provider: this._provider?.key() || '',
            ip: this._ipAddress || '',
            deployments: this._deployments || [],
        };
        writeJson(this._path, 'config', config);
        const configPath = `${this._path}/config.json`;

        const terraformPath = this._provider!.copyTerraformTemplate(this._path);
        const terraformVariablesPath = this._provider!.saveToTerraformVars(this._path);

        return {
            configPath,
            terraformPath,
            terraformVariablesPath,
        };
    }

    public provider(): BaseProvider {
        if (this._provider === null) {
            throw new Error(`Provider not set for ${this._id}`);
        }
        return this._provider;
    }

    public async initializeTerraform(): Promise<boolean> {
        const result = await run('terraform', ['init'], {
            cwd: this._path,
        });
        return result !== null;
    }

    public async start(): Promise<boolean> {
        const terraformResult = await run(
            'terraform',
            ['apply', '--auto-approve', '--input=false', this._path],
            {
                cwd: this._path,
                shell: true,
            }
        );
        if (terraformResult === null) {
            return false;
        }

        if (global.verbose) {
            console.log('>> Server created');
            console.log('>> Fetching IP');
        }

        const ipOutput = await run('terraform', ['output', 'ip_address'], {
            cwd: this._path,
        });

        if (ipOutput === null) {
            logError(`Can't get ip address from terraform`);
            return false;
        }

        this._ipAddress = ipOutput.replace('\n', '');
        if (global.verbose) {
            console.log(`>> Saving IP ${this._ipAddress}`);
        }
        this.save();
        return true;
    }

    public async isReady(): Promise<boolean> {
        if (global.verbose) {
            console.log(`>> Check if server ${this._id} is running.`);
        }
        if (!this._ipAddress) {
            if (global.verbose) {
                console.log(`>> No ip address for ${this._id}`);
            }
            return false;
        }

        const url = `http://${this._ipAddress}:${TEST_DOCKER_CONTAINER_PORT}`;
        if (global.verbose) {
            console.log(`>> Fetching ${url}`);
        }
        try {
            const result: AxiosResponse = await axiosRequest({
                url,
                method: 'GET',
                timeout: 1000,
            });
            if (global.verbose) {
                console.log(`>> Fetch status: ${result.status}`);
            }
            return result.status === 200;
        } catch (e) {
            return false;
        }
    }

    public async stop(): Promise<boolean> {
        const output = await run('terraform', ['destroy', '--auto-approve'], {
            cwd: this._path,
        });

        if (output === null) {
            logError('Error while destroying server');
            return false;
        }

        this._ipAddress = '';
        this._deployments = [];
        this.save();
        return true;
    }

    public remove(): boolean {
        rimraf.sync(this._path);

        return true;
    }

    public loadProviderConfig() {
        const varPath = `${this._path}/terraform.tfvars`;
        if (!fs.existsSync(varPath)) {
            return;
        }

        const content = fs.readFileSync(varPath).toString();

        const vars: { [key: string]: string } = {};
        content.split('\n').forEach((pair) => {
            const key = pair.slice(0, pair.indexOf('='));
            const value = pair.slice(pair.indexOf('=') + 2).replace('"', '');
            vars[key] = value;
        });
        const config = this._provider?.mapTerraformVarsToConfig(vars);
        this._provider?.setConfig(config);
    }

    public static buildFromId(id: string): Server {
        const serverPath = `${SERVERS_PATH}/${id}`;

        if (!fs.existsSync(serverPath)) {
            throw new Error(`Server ${id} not found.`);
        }
        if (!fs.existsSync(`${serverPath}/config.json`)) {
            throw new Error(`No config found for ${id}`);
        }

        const config: ServerConfiguration = readJson(serverPath, 'config');
        ['provider', 'ip'].forEach((requiredField) => {
            if (!Object(config).hasOwnProperty(requiredField)) {
                throw new Error(`Required field "${requiredField}" missing in config for ${id}`);
            }
        });

        const server = new Server(id);
        server.setProvider(config.provider);
        server.setIpAddress(config.ip);
        server.setDeployments(config.deployments || []);
        server.loadProviderConfig();
        return server;
    }

    public static buildFromProviderConfig(config: RequestConfig): Server {
        const server = new Server(config.id);
        server.setProvider(config.provider);
        server.setDeployments([]);
        server.loadProviderConfig();
        return server;
    }
}
