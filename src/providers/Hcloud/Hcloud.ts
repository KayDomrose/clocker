import {Provider} from "../Provider";
import {PromptObject} from "prompts";
import {BaseConfig} from "../../actions/init";
import * as fs from "fs";

export interface HcloudConfig extends BaseConfig {
    hcloudServerName: string;
    hcloudServerType: string;
    hcloudSSHPath: string;
    hcloudSSHLabel: string;
    _hcloudToken: string;
}

class Hcloud implements Provider {
    getAdditionalInitQuestions(): PromptObject[] {
        return [
            {
                type: 'text',
                name: 'hcloudSSHPath',
                message: 'Path to your ssh public key',
                initial: `${process.env.HOME}/.ssh/id_rsa.pub`,
                validate: path => fs.existsSync(path),
            },
            {
                type: 'text',
                name: 'hcloudSSHLabel',
                message: 'Label for your ssh key (to identify in Hetzner backend)',
                initial: `${process.env.USER?.replace(' ', '-')}-ssh`,
            },
            {
                type: "text",
                name: 'hcloudServerName',
                message: 'Label for the server (to identify in Hetzner backend)',
                initial: 'Test-Server',
                validate: value => !value.includes(' ')
            },
            {
                type: "select",
                name: 'hcloudServerType',
                message: 'Server type (https://www.hetzner.com/cloud#pricing)',
                choices: [
                    {
                        title: 'CX11',
                        value: 'cx11'
                    }
                ]
            },
            {
                type: "password",
                name: '_hcloudToken',
                message: 'Your Hetzner Cloud API-Token (https://docs.hetzner.cloud/#overview-getting-started)',
                validate: value => value.length > 0
            }
        ];
    }

    getSelectorLabel(): string {
        return "Hetzner Cloud (https://www.hetzner.com/cloud)";
    }

    getTerraformPath(): string {
        return `${__dirname}/hcloud.tf`;
    }

    mapConfigToTerraformVars(config: HcloudConfig) {
        return {
            hcloud_token:  config._hcloudToken,
            server_name: config.hcloudServerName,
            server_type: config.hcloudServerType,
            ssh_key_name: config.hcloudSSHLabel,
            ssh_key_path: config.hcloudSSHPath,
            cloud_init_path: __dirname + '/cloud-init.sh'
        };
    }


}

export default Hcloud;
