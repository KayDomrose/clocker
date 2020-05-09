import { checkInitOrFail } from '../helpers/check-init';
import { Choice, PromptObject } from 'prompts';
import * as fs from 'fs';
import { getProvider, providers } from '../provider';
import { Provider } from '../providers/Provider';
import { BaseConfig } from './init';
import prompts = require('prompts');
import { addServer, serverIds } from '../helpers/servers';
import { BASE_PATH } from '../variables';
import { logColorCommand, logColorServer, logSuccess } from '../helpers/log';

const requestConfig = async (): Promise<BaseConfig> => {
    const questions: PromptObject[] = [
        {
            type: 'text',
            name: 'id',
            message: 'Unique id',
            initial: `test-server`,
            validate: (value) => {
                if (serverIds().includes(value)) {
                    return 'Server id already used.';
                }

                return true;
            },
        },
        {
            type: 'select',
            name: 'provider',
            message: 'Cloud server provider',
            choices: Object.keys(providers).map(
                (providerKey: string): Choice => {
                    const provider: Provider = getProvider(providerKey);
                    return {
                        title: provider.getSelectorLabel(),
                        value: providerKey,
                    } as Choice;
                }
            ),
        },
    ];

    const initResponse = await prompts(questions);

    const provider: Provider = getProvider(initResponse.provider);
    const providerQuestions: PromptObject[] = provider.getAdditionalInitQuestions();

    const providerResponse = await prompts(providerQuestions);

    return { ...initResponse, ...providerResponse } as BaseConfig;
};

const add = async () => {
    if (!checkInitOrFail()) {
        return;
    }
    console.log('Answer these questions to configure a new server.');
    console.log('No server will be created yet.');

    const config: BaseConfig = await requestConfig();
    config.ip = null;
    const provider = getProvider(config.provider);
    addServer(config);

    const SERVER_DIR = `${BASE_PATH}/servers/${config.id}`;
    fs.mkdirSync(SERVER_DIR);
    fs.copyFileSync(provider.getTerraformPath(), `${BASE_PATH}/servers/${config.id}/terraform.tf`);

    const terraformConfig = provider.mapConfigToTerraformVars(config);
    const tfvarTemplate = Object.keys(terraformConfig)
        .map((key) => `${key}="${terraformConfig[key]}"`)
        .join('\n');
    fs.writeFileSync(`${SERVER_DIR}/terraform.tfvars`, tfvarTemplate);

    logSuccess(`Server ${logColorServer(config.id)} configured`);
    console.log(`Run ${logColorCommand(`clocker start ${config.id}`)} to start this server.`);
};

export default add;
