import { PromptObject } from 'prompts';
import { BaseConfig } from '../actions/init';

export interface Provider {
    getSelectorLabel(): string;
    getAdditionalInitQuestions(): PromptObject[];
    getTerraformPath(): string;
    mapConfigToTerraformVars(config: BaseConfig): any;
}
