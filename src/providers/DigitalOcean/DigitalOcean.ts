import { BaseProvider, ProviderConfig } from '../../classes/BaseProvider';
import { PromptObject } from 'prompts';
import * as fs from 'fs';
import { allServers } from '../../helpers/servers';
import DOUniqueServerException from './DOUniqueServerException';

export interface DigitalOceanConfig extends ProviderConfig {
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

    getAdditionalInitQuestions(): PromptObject[] {
        const servers = allServers();
        if (servers.some((s) => s.provider() instanceof DigitalOcean)) {
            throw new DOUniqueServerException();
        }

        return [
            {
                type: 'text',
                name: 'doSSHPath',
                message: 'Path to your ssh public key',
                initial: `${process.env.HOME}/.ssh/id_rsa.pub`,
                validate: (path) => {
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

    getSelectorLabel(): string {
        return 'DigitalOcean (https://www.digitalocean.com/)';
    }

    getTerraformPath(): string {
        return `${__dirname}/do.tf`;
    }

    mapTerraformVarsToConfig(config: any): DigitalOceanConfig {
        return {
            _doToken: config.do_token,
            doServerName: config.server_name,
            doServerType: config.server_type,
            doSSHLabel: config.ssh_key_name,
            doSSHPath: config.ssh_key_path,
        };
    }

    mapConfigToTerraformVars(config: DigitalOceanConfig) {
        return {
            do_token: config._doToken,
            server_name: config.doServerName,
            server_type: config.doServerType,
            ssh_key_name: config.doSSHLabel,
            ssh_key_path: config.doSSHPath,
            cloud_init_path: `${__dirname}/do-cloud-init.sh`,
        };
    }
}

export default DigitalOcean;
