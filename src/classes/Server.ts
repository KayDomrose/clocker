import { SERVER_USER, SERVERS_PATH, TEST_DOCKER_CONTAINER_PORT } from '../variables';
import { Provider } from '../providers/Provider';
import * as fs from 'fs';
import { getProvider } from '../provider';
import { readJson, writeJson } from '../helpers/file';
import { RequestConfig } from '../actions/add';
// @ts-ignore
import spawn from 'await-spawn';
import { AxiosResponse } from 'axios';
import axiosRequest from '@nelsonomuto/axios-request-timeout';
import { logColorCommand, logError } from '../helpers/log';

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
    private _provider: Provider | null = null;
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

    public provider(): Provider {
        if (this._provider === null) {
            throw new Error(`Provider not set for ${this._id}`);
        }
        return this._provider;
    }

    public async initializeTerraform(): Promise<boolean> {
        const command = 'terraform';
        const args = ['init'];
        if (global.verbose) {
            console.log(`>> Running ${logColorCommand(`${command} ${args.join(' ')}`)}`);
        }

        try {
            const stdOur: Buffer = await spawn(command, args, {
                cwd: this._path,
                shell: true,
            });
            if (global.verbose) {
                console.log('>>');
                console.log(stdOur.toString());
                console.log('<<');
            }
            return true;
        } catch (e) {
            console.error(e.stdout.toString());
            return false;
        }
    }

    public async start(): Promise<boolean> {
        const startCommand = 'terraform';
        const startArgs = ['apply', '--auto-approve', '--input=false', this._path];
        if (global.verbose) {
            console.log(`>> Running ${logColorCommand(`${startCommand} ${startArgs.join(' ')}`)}`);
        }

        try {
            const stdOut: Buffer = await spawn(startCommand, startArgs, {
                cwd: this._path,
                shell: true,
            });
            if (global.verbose) {
                console.log('>>');
                console.log(stdOut.toString());
                console.log('<<');
            }
        } catch (e) {
            console.error(e.stderr.toString());
            return false;
        }

        if (global.verbose) {
            console.log('>> Server created');
            console.log('>> Fetching IP');
        }

        try {
            const stdOut: Buffer = await spawn('terraform', ['output', 'ip_address'], {
                cwd: this._path,
            });
            this._ipAddress = stdOut.toString().replace('\n', '');
            if (global.verbose) {
                console.log(`>> Saving IP ${this._ipAddress}`);
            }
            this.save();

            return true;
        } catch (e) {
            console.error(e.stderr.toString());
            return false;
        }
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
        const command = 'terraform';
        const args = ['destroy', '--auto-approve'];
        if (global.verbose) {
            console.log(`>> Running ${logColorCommand(`${command} ${args.join(' ')}`)}`);
        }
        try {
            const stdOut: Buffer = await spawn(command, args, {
                cwd: this._path,
            });
            if (global.verbose) {
                console.log('>>');
                console.log(stdOut.toString());
                console.log('<<');
            }
            this._ipAddress = '';
            this.save();
            return true;
        } catch (e) {
            console.error(e.stderr.toString());
            return false;
        }
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

    public checkSSH(): boolean {
        if (!this._ipAddress) {
            logError(`No IP address for ${this._id}`);
            return false;
        }

        const knownHostsFile = `${process.env.HOME}/.ssh/known_hosts`;
        if (global.verbose) {
            console.log(`>> Locking for known_hosts at ${knownHostsFile}.`);
        }
        if (!fs.existsSync(knownHostsFile)) {
            logError(`known_hosts file missing at ${knownHostsFile}.`);
            return false;
        }

        const knownHostContent: Buffer = fs.readFileSync(knownHostsFile);
        if (global.verbose) {
            console.log(`>> Checking if ip ${this._ipAddress} exists in known_hosts.`);
        }
        if (!knownHostContent.toString().includes(this._ipAddress!)) {
            logError(`Fingerprint for ${this._ipAddress} not found in ${knownHostsFile}`);
            console.log(
                `Please run ${logColorCommand(
                    `ssh ${SERVER_USER}@${this._ipAddress} exit`
                )} and confirm.`
            );
            return false;
        }

        return true;
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
