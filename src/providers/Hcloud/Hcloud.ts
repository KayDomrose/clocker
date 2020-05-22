import { BaseProvider, ProviderConfig } from '../../classes/BaseProvider';
import { PromptObject } from 'prompts';
import * as fs from 'fs';
import { allServers } from '../../helpers/servers';
import { Server } from '../../classes/Server';
import { logColorServer, logError } from '../../helpers/log';

export interface HcloudConfig extends ProviderConfig {
    hcloudServerName: string;
    hcloudServerType: string;
    hcloudSSHPath: string;
    hcloudSSHLabel: string;
    _hcloudToken: string;
}

class Hcloud extends BaseProvider {
    key(): string {
        return 'hcloud';
    }

    name(): string {
        return 'Hetzner Cloud';
    }

    getServerInfo(): string {
        const config: HcloudConfig = this._config as HcloudConfig;
        return `${config.hcloudServerName} (${config.hcloudServerType})`;
    }

    private getOtherServersWithSSHPath(servers: Server[], path: string): Server | undefined {
        return servers.find((s: Server) => {
            if (!(s.provider() instanceof Hcloud)) {
                return false;
            }
            const config: HcloudConfig = s.provider().getConfig();
            return config.hcloudSSHPath === path;
        });
    }

    getAdditionalInitQuestions(): PromptObject[] {
        const servers = allServers();
        return [
            {
                type: 'text',
                name: 'hcloudSSHPath',
                message: 'Path to your ssh public key',
                initial: `${process.env.HOME}/.ssh/id_rsa.pub`,
                validate: (path) => {
                    if (!fs.existsSync(path)) {
                        return `File not found.`;
                    }

                    const server = this.getOtherServersWithSSHPath(servers, path);
                    if (server !== undefined) {
                        console.log('\n');
                        logError('ATTENTION');
                        console.log(
                            `There already is a server for ${this.name()} configured with the same ssh public key (${logColorServer(
                                server.getId()
                            )}).`
                        );
                        console.log(
                            `Hetzner does not allow the same ssh key twice for the same project, so make sure to use another hetzner project (that means using a different Hetzner Cloud API-Token).`
                        );
                        console.log('\n');
                    }

                    return true;
                },
            },
            {
                type: 'text',
                name: 'hcloudSSHLabel',
                message: 'Label for your ssh key (to identify in Hetzner backend)',
                initial: `${process.env.USER?.replace(' ', '-')}-ssh`,
            },
            {
                type: 'text',
                name: 'hcloudServerName',
                message: 'Label for the server (to identify in Hetzner backend)',
                initial: 'Test-Server',
                validate: (value) => !value.includes(' '),
            },
            {
                type: 'select',
                name: 'hcloudServerType',
                message: 'Server type (https://www.hetzner.com/cloud#pricing)',
                choices: [
                    {
                        title: 'CX11',
                        value: 'cx11',
                    },
                ],
            },
            {
                type: 'password',
                name: '_hcloudToken',
                message:
                    'Your Hetzner Cloud API-Token (https://docs.hetzner.cloud/#overview-getting-started)',
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
        return 'Hetzner Cloud (https://www.hetzner.com/cloud)';
    }

    getTerraformPath(): string {
        return `${__dirname}/hcloud.tf`;
    }

    mapTerraformVarsToConfig(config: any): HcloudConfig {
        return {
            _hcloudToken: config.hcloud_token,
            hcloudServerName: config.server_name,
            hcloudServerType: config.server_type,
            hcloudSSHLabel: config.ssh_key_name,
            hcloudSSHPath: config.ssh_key_path,
        };
    }

    mapConfigToTerraformVars(config: HcloudConfig) {
        return {
            hcloud_token: config._hcloudToken,
            server_name: config.hcloudServerName,
            server_type: config.hcloudServerType,
            ssh_key_name: config.hcloudSSHLabel,
            ssh_key_path: config.hcloudSSHPath,
            cloud_init_path: `${__dirname}/hcloud-cloud-init.sh`,
        };
    }
}

export default Hcloud;
