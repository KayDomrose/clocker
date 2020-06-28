import {
    BaseProvider,
    InitialiseHosterOutput,
    ProviderHosterVars,
    StaticServerVars,
} from '../../classes/BaseProvider';
import { PromptObject } from 'prompts';
import * as fs from 'fs';
import run from '../../helpers/command';

export interface DigitalOceanConfig extends ProviderHosterVars {
    server_name: string;
    server_type: string;
}

class DigitalOcean extends BaseProvider {
    key(): string {
        return 'do';
    }

    name(): string {
        return 'DigitalOcean';
    }

    getAdditionalServerQuestions(): PromptObject[] {
        return [
            {
                type: 'text',
                name: 'server_name',
                message: `Label for your ${this.name()} droplet`,
                initial: '',
            },
            {
                type: 'select',
                name: 'server_type',
                message: 'Server type (CPU - RAM) (https://www.digitalocean.com/pricing/)',
                choices: [
                    {
                        title: '1vCPU - 1GB',
                        value: 's-1vcpu-1gb',
                    },
                ],
            },
        ];
    }

    getAdditionalHosterQuestions(): PromptObject[] {
        return [
            {
                type: 'password',
                name: 'do_token',
                message:
                    'Your Personal access tokens (write scope required) (https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/)',
                validate: (value) => {
                    if (value.length === 0) {
                        return 'API-Token can not be empty';
                    }

                    return true;
                },
            },
            {
                type: 'text',
                name: 'ssh_key_path',
                message: 'Path to your ssh public key',
                initial: `${process.env.HOME}/.ssh/id_rsa.pub`,
                validate: (path: string) => {
                    if (!fs.existsSync(path)) {
                        return `File not found.`;
                    }

                    return true;
                },
            },
            {
                type: 'text',
                name: 'ssh_key_name',
                message: `Label for your ssh key (to identify in ${this.name()} dashboard)`,
                initial: `${process.env.USER?.replace(' ', '-')}-ssh`,
            },
        ];
    }

    getSelectorLabel(): string {
        return 'DigitalOcean (https://www.digitalocean.com/)';
    }

    getTerraformServerPath(): string {
        return `${__dirname}/do-server.tf`;
    }
    getTerraformHosterPath(): string {
        return `${__dirname}/do-hoster.tf`;
    }

    async getInitialiseHosterOutput(path: string): Promise<InitialiseHosterOutput> {
        const sshId = await run('terraform', ['output', 'ssh_id'], {
            cwd: path,
        });
        return {
            ssh_id: sshId?.replace('\n', '') || '',
        };
    }

    getStaticServerVars(): StaticServerVars {
        return {
            cloud_init_path: `${__dirname}/do-cloud-init.sh`,
        };
    }
}

export default DigitalOcean;
