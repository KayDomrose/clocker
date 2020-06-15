import { BaseProvider, ProviderHosterVars } from '../../classes/BaseProvider';
import { PromptObject } from 'prompts';
import * as fs from 'fs';
import { allServers } from '../../helpers/servers';
import DOUniqueServerException from './DOUniqueServerException';

export interface DigitalOceanConfig extends ProviderHosterVars {
    doServerName: string;
    doServerType: string;
    doSSHPath: string;
    doSSHLabel: string;
    _doToken: string;
}

class DigitalOcean extends BaseProvider {
    key(): string {
        return 'do';
    }

    name(): string {
        return 'DigitalOcean';
    }

    getServerInfo(): string {
        const config = this._config as DigitalOceanConfig;
        return `${config.doServerName} (${config.doServerType})`;
    }

    getAdditionalServerQuestions(): PromptObject[] {
        const servers = allServers();
        if (servers.some((s) => s.provider() instanceof DigitalOcean)) {
            throw new DOUniqueServerException();
        }

        return [
            {
                type: 'text',
                name: 'doServerName',
                message: `Label for your ${this.name()} droplet (visible in ${this.name()} dashboard)`,
                initial: '',
            },
            {
                type: 'select',
                name: 'doServerType',
                message: 'Server type (CPU - RAM) (https://www.digitalocean.com/pricing/)',
                choices: [
                    {
                        title: '1vCPU - 1GB',
                        value: 's-1vcpu-1gb',
                    },
                ],
            },
            {
                type: 'password',
                name: '_doToken',
                message:
                    'Your Personal access tokens (write scope required) (https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/)',
                validate: (value) => {
                    if (value.length === 0) {
                        return 'API-Token can not be empty';
                    }

                    return true;
                },
            },
        ];
    }

    getAdditionalHosterQuestions(): PromptObject[] {
        return [
            {
                type: 'text',
                name: 'doSSHPath',
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
                name: 'doSSHLabel',
                message: `Label for your ssh key (to identify in ${this.name()} dashboard)`,
                initial: `${process.env.USER?.replace(' ', '-')}-ssh`,
            },
        ];
    }

    getSelectorLabel(): string {
        return 'DigitalOcean (https://www.digitalocean.com/)';
    }

    getTerraformServerPath(): string {
        return `${__dirname}/server.tf`;
    }
    getTerraformHosterPath(): string {
        return `${__dirname}/hoster.tf`;
    }
}

export default DigitalOcean;
