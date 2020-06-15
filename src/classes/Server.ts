import { SERVER_USER, SERVERS_PATH, TEST_DOCKER_CONTAINER_PORT } from '../variables';
import { ProviderServerVars } from './BaseProvider';
import * as fs from 'fs';
import { readJson, readTfVars, writeJson, writeTfVars } from '../helpers/file';
import { AxiosResponse } from 'axios';
import axiosRequest from '@nelsonomuto/axios-request-timeout';
import { logError, logHint, logVerbose } from '../helpers/log';
import run, { RunResult } from '../helpers/command';
import rimraf from 'rimraf';
import { ServerUserInput } from '../actions/server-add';
import Hoster from './Hoster';

export interface ServerDeployment {
    composePath: string;
    lastDeployment: Date | null;
}

export interface ServerConfig {
    hosterId: string;
    ip: string;
    deployments: ServerDeployment[];
}

export class Server {
    private readonly _id: string;
    private _vars: ProviderServerVars = {};
    private _ipAddress: string | null = null;
    private _deployments: ServerDeployment[] = [];

    public readonly hosterId: string;
    public readonly hoster: Hoster;

    public readonly path: string;
    public readonly data_path: string;
    public readonly remote_data_path: string;
    public readonly config_path: string;
    public readonly terraform_template_path: string;
    public readonly terraform_variable_path: string;

    constructor(id: string, hosterId: string) {
        this._id = id;

        this.path = Server.path(this._id);
        this.terraform_template_path = `${this.path}/server.tf`;
        this.terraform_variable_path = `${this.path}/server.tfvars`;
        this.config_path = `${this.path}/config`;
        this.data_path = `${this.path}/clocker-data`;
        this.remote_data_path = `/home/${SERVER_USER}/clocker-data`;

        this.hosterId = hosterId;
        this.hoster = Hoster.buildFromId(this.hosterId);
    }

    public getId(): string {
        return this._id;
    }

    public getIpAddress(): string {
        return this._ipAddress || '';
    }

    public setIpAddress(ip: string) {
        this._ipAddress = ip;
    }

    public setVars(vars: ProviderServerVars) {
        this._vars = vars;
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

    public save(): boolean {
        if (!fs.existsSync(this.path)) {
            logVerbose(`Created server directory: ${this.path}`);
            fs.mkdirSync(this.path);
        }

        logVerbose(`Writing config: ${this.config_path}`);
        writeJson(this.config_path, {
            hosterId: this.hosterId,
            deployments: this._deployments,
            ip: this._ipAddress,
        } as ServerConfig);

        logVerbose(`Writing terraform vars: ${this.terraform_variable_path}`);
        writeTfVars(this.terraform_variable_path, this._vars);

        logVerbose(`Created Data directory: ${this.data_path}`);
        if (!fs.existsSync(this.data_path)) {
            fs.mkdirSync(this.data_path);
        }

        logVerbose(`Copying terraform server template: ${this.terraform_template_path} `);
        fs.copyFileSync(
            this.hoster.provider.getTerraformServerPath(),
            this.terraform_template_path
        );

        return true;
    }

    public async initializeTerraform(): Promise<boolean> {
        const result = await run('terraform', ['init'], {
            cwd: this.path,
        });
        return result !== null;
    }

    private async terraformCommand(action: 'apply' | 'destroy'): Promise<RunResult> {
        const additionalVars = this.hoster.provider.getStaticServerVars();
        const v = Object.keys(additionalVars).map((key) => `--var '${key}=${additionalVars[key]}'`);

        return await run(
            'terraform',
            [
                action,
                '--auto-approve',
                '--input=false',
                `--var-file=${this.terraform_variable_path}`,
                `--var-file=${this.hoster.terraform_variable_path}`,
                ...v,
                this.path,
            ],
            {
                cwd: this.path,
                shell: true,
            }
        );
    }

    public async start(): Promise<boolean> {
        const terraformResult = await this.terraformCommand('apply');
        if (terraformResult === null) {
            return false;
        }

        logVerbose(`Fetching IP`);
        const ipOutput = await run('terraform', ['output', 'ip_address'], {
            cwd: this.path,
        });

        if (ipOutput === null) {
            logError(`Can't get ip address from terraform`);
            return false;
        }

        this._ipAddress = ipOutput.replace('\n', '');
        logVerbose(`Saving IP ${this._ipAddress}`);
        this.save();

        return true;
    }

    public async copyDataToRemote(): Promise<boolean> {
        try {
            const output = await run('scp', [
                '-r',
                this.data_path,
                `${SERVER_USER}@${this._ipAddress}:${this.remote_data_path}`,
            ]);
            console.log(output);
            return true;
        } catch (e) {
            logError(e);
            return false;
        }
    }

    public async copyDataFromRemote(): Promise<boolean> {
        if (fs.readdirSync(this.data_path).length > 0) {
            logHint('Local data found. Backing up ...');
            const backupDate = new Date().toISOString();
            const backupData = `${this.data_path}_${backupDate}`;
            fs.renameSync(this.data_path, backupData);
            logHint(`Backup local data to ${backupData}`);

            fs.rmdirSync(this.data_path, { recursive: true });
        }

        try {
            await run('scp', [
                '-r',
                `${SERVER_USER}@${this._ipAddress}:${this.remote_data_path}`,
                this.data_path,
            ]);
            return true;
        } catch (e) {
            logError(e);
            return false;
        }
    }

    public async isReady(): Promise<boolean> {
        logVerbose(`Check if server ${this._id} is running.`);

        if (!this._ipAddress) {
            logVerbose(`No ip address for ${this._id}`);
            return false;
        }

        const url = `http://${this._ipAddress}:${TEST_DOCKER_CONTAINER_PORT}`;
        logVerbose(`Fetching ${url}`);
        try {
            const result: AxiosResponse = await axiosRequest({
                url,
                method: 'GET',
                timeout: 1000,
            });
            logVerbose(`Fetch status: ${result.status}`);
            return result.status === 200;
        } catch (e) {
            return false;
        }
    }

    public async stop(): Promise<boolean> {
        const output = await this.terraformCommand('destroy');

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
        logVerbose(`Delete directory ${this.path}`);
        rimraf.sync(this.path);

        return true;
    }

    public static path(id: string): string {
        return `${SERVERS_PATH}/${id}`;
    }

    public static buildFromId(id: string): Server {
        const config: ServerConfig = readJson(`${Server.path(id)}/config`);

        const server = new Server(id, config.hosterId);
        server.setVars(readTfVars(server.terraform_variable_path));
        server.setIpAddress(config.ip);
        server.setDeployments(config.deployments || []);
        return server;
    }

    public static buildFromUserInput(
        initialInput: ServerUserInput,
        vars: ProviderServerVars
    ): Server {
        const server = new Server(initialInput.id, initialInput.hoster);
        server.setVars(vars);
        server.setDeployments([]);
        return server;
    }
}
