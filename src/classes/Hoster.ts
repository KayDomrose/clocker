import { BaseProvider, ProviderHosterVars } from './BaseProvider';
import { getProvider } from '../helpers/provider';
import { HOSTERS_PATH } from '../variables';
import * as fs from 'fs';
import { readJson, readTfVars, writeJson, writeTfVars } from '../helpers/file';
import { logVerbose } from '../helpers/log';
import { HosterUserInput } from '../actions/hoster-register';
import run, { RunResult } from '../helpers/command';
import rimraf from 'rimraf';

export interface HosterConfig {
    providerKey: string;
}

export default class Hoster {
    private _vars: ProviderHosterVars = {};
    private readonly _id: string;
    private readonly _providerKey: string;
    public readonly provider: BaseProvider;

    public readonly path: string;
    public readonly terraform_template_path: string;
    public readonly terraform_variable_path: string;
    public readonly config_path: string;

    constructor(id: string, providerKey: string) {
        this._id = id;
        this._providerKey = providerKey;
        this.provider = getProvider(providerKey);

        this.path = Hoster.path(this._id);
        this.terraform_template_path = `${this.path}/hoster.tf`;
        this.terraform_variable_path = `${this.path}/hoster.tfvars`;
        this.config_path = `${this.path}/config`;
    }

    public getId(): string {
        return this._id;
    }

    public setVars(vars: ProviderHosterVars) {
        this._vars = vars;
    }

    public save(): boolean {
        if (!fs.existsSync(this.path)) {
            logVerbose(`Creating provider directory: ${this.path}`);
            fs.mkdirSync(this.path);
        }

        logVerbose(`Writing config: ${this.config_path}`);
        writeJson(this.config_path, {
            providerKey: this._providerKey,
        } as HosterConfig);

        logVerbose(`Writing terraform vars: ${this.terraform_variable_path}`);
        writeTfVars(this.terraform_variable_path, this._vars);

        logVerbose(`Copying terraform host template: ${this.terraform_template_path} `);
        fs.copyFileSync(this.provider.getTerraformHosterPath(), this.terraform_template_path);

        return true;
    }

    public async initialize(): Promise<boolean> {
        await run('terraform', ['init'], { cwd: this.path });
        await this.terraformCommand('apply');

        const output = await this.provider.getInitialiseHosterOutput(this.path);
        this._vars = { ...this._vars, ...output };
        this.save();

        return true;
    }

    public async remove(): Promise<boolean> {
        logVerbose(`Destroy terraform template`);
        await this.terraformCommand('destroy');

        logVerbose(`Delete directory ${this.path}`);
        rimraf.sync(this.path);

        return true;
    }

    private async terraformCommand(action: 'apply' | 'destroy'): Promise<RunResult> {
        return await run(
            'terraform',
            [
                action,
                '--auto-approve',
                '--input=false',
                `--var-file=${this.terraform_variable_path}`,
                this.path,
            ],
            {
                cwd: this.path,
                shell: true,
            }
        );
    }

    public static path(id: string): string {
        return `${HOSTERS_PATH}/${id}`;
    }

    public static buildFromUserInput({ id, hoster }: HosterUserInput): Hoster {
        return new Hoster(id, hoster);
    }

    public static buildFromId(id: string): Hoster {
        const config = readJson<HosterConfig>(`${Hoster.path(id)}/config`);

        const hoster = new Hoster(id, config.providerKey);
        hoster.setVars(readTfVars(hoster.terraform_variable_path));
        return hoster;
    }
}
