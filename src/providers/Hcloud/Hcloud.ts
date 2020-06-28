import {
    BaseProvider,
    InitialiseHosterOutput,
    ProviderHosterVars,
    StaticServerVars,
} from '../../classes/BaseProvider';
import { PromptObject } from 'prompts';
import * as fs from 'fs';
import run from '../../helpers/command';
import { validateId } from '../../helpers/validator';

export interface HcloudConfig extends ProviderHosterVars {
    server_name: string;
    server_type: string;
}

class Hcloud extends BaseProvider {
    key(): string {
        return 'hcloud';
    }

    name(): string {
        return 'Hetzner Cloud';
    }

    getAdditionalServerQuestions(): PromptObject[] {
        return [
            {
                type: 'text',
                name: 'server_name',
                message: 'Label for the server (to identify in Hetzner backend)',
                initial: '',
                validate: (value) => {
                    if (!validateId(value)) {
                        return 'Invalid character';
                    }

                    return true;
                },
            },
            {
                type: 'select',
                name: 'server_type',
                message: 'Server type (https://www.hetzner.com/cloud#pricing)',
                choices: [
                    {
                        title: 'CX11',
                        value: 'cx11',
                    },
                ],
            },
        ];
    }

    getAdditionalHosterQuestions(): PromptObject[] {
        return [
            {
                type: 'password',
                name: 'hcloud_token',
                message:
                    'Your Hetzner Cloud API-Token (https://docs.hetzner.cloud/#overview-authentication)',
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
                message: 'Label for your ssh key (to identify in Hetzner backend)',
                initial: `${process.env.USER?.replace(' ', '-')}-ssh`,
            },
        ];
    }

    getSelectorLabel(): string {
        return 'Hetzner Cloud (https://www.hetzner.com/cloud)';
    }

    getTerraformHosterPath(): string {
        return `${__dirname}/hcloud-hoster.tf`;
    }

    getTerraformServerPath(): string {
        return `${__dirname}/hcloud-server.tf`;
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
            cloud_init_path: `${__dirname}/hcloud-cloud-init.sh`,
        };
    }
}

export default Hcloud;
