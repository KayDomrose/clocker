import { PromptObject } from 'prompts';
import * as fs from 'fs';

export interface ProviderConfig {}

export interface Provider {
    key(): string;
    getSelectorLabel(): string;
    getAdditionalInitQuestions(): PromptObject[];
    getTerraformPath(): string;
    getCloudInitPath(): string;
    mapTerraformVarsToConfig(config: ProviderConfig): any;
    mapConfigToTerraformVars(config: any): any;
}

export abstract class Provider implements Provider {
    private _config: any = {};

    setConfig(value: any) {
        this._config = value;
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
