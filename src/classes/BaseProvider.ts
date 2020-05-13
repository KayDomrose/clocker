import { PromptObject } from 'prompts';
import * as fs from 'fs';

export interface ProviderConfig {}

export abstract class BaseProvider {
    public abstract key(): string;
    public abstract name(): string;
    public abstract getSelectorLabel(): string;
    public abstract getAdditionalInitQuestions(): PromptObject[];
    public abstract getTerraformPath(): string;
    public abstract getServerInfo(): string;
    public abstract mapTerraformVarsToConfig(config: ProviderConfig): any;
    public abstract mapConfigToTerraformVars(config: any): any;

    protected _config: ProviderConfig = {};

    setConfig(value: ProviderConfig) {
        this._config = value;
    }

    public getConfig<T extends ProviderConfig>(): T {
        return this._config as T;
    }

    public copyTerraformTemplate(path: string): string {
        const target = `${path}/terraform.tf`;
        fs.copyFileSync(this.getTerraformPath(), target);
        return target;
    }

    public saveToTerraformVars(path: string): string {
        const target = `${path}/terraform.tfvars`;
        const terraformConfig = this.mapConfigToTerraformVars(this._config);
        const tfVarTemplate = Object.keys(terraformConfig)
            .map((key) => `${key}="${terraformConfig[key as any]}"`)
            .join('\n');
        fs.writeFileSync(target, tfVarTemplate);
        return target;
    }
}
