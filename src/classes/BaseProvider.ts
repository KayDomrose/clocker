import { PromptObject } from 'prompts';

export interface ProviderHosterVars {}
export interface ProviderServerVars {}
export type InitialiseHosterOutput = { [key: string]: string };
export type StaticServerVars = { [key: string]: string };

export abstract class BaseProvider {
    public abstract name(): string;
    public abstract getSelectorLabel(): string;
    public abstract getAdditionalServerQuestions(): PromptObject[];
    public abstract getAdditionalHosterQuestions(): PromptObject[];
    public abstract getTerraformServerPath(): string;
    public abstract getTerraformHosterPath(): string;
    public abstract async getInitialiseHosterOutput(path: string): Promise<InitialiseHosterOutput>;
    public abstract getStaticServerVars(): StaticServerVars;
}
