import { Choice, PromptObject } from 'prompts';
import { getProvider, providers } from '../provider';
import { logColorCommand, logColorServer, logSuccess } from '../helpers/log';
import { Server } from '../classes/Server';
import { allServers } from '../helpers/servers';
import ask from '../helpers/ask';
import { ProviderConfig } from '../classes/BaseProvider';

export interface RequestConfig {
    id: string;
    provider: string;
}

const requestConfig = async (): Promise<RequestConfig> => {
    const questions: PromptObject[] = [
        {
            type: 'text',
            name: 'id',
            message: 'Unique id',
            initial: `test-server`,
            validate: (value) => {
                if (
                    allServers()
                        .map((s) => s.getId())
                        .includes(value)
                ) {
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
                    const provider = getProvider(providerKey);
                    return {
                        title: provider.getSelectorLabel(),
                        value: providerKey,
                    } as Choice;
                }
            ),
        },
    ];

    return await ask<RequestConfig>(questions);
};

const add = async () => {
    console.log('Answer these questions to configure a new server.');
    console.log('No server will be created yet.');

    const config: RequestConfig = await requestConfig();

    const server = Server.buildFromProviderConfig(config);

    const providerQuestions: PromptObject[] = server.provider().getAdditionalInitQuestions();
    const providerAnswers = await ask<ProviderConfig>(providerQuestions);

    server.provider().setConfig(providerAnswers);

    if (server.save()) {
        logSuccess(
            `\nServer ${logColorServer(server.getId())} created at ${server.getServerPath()}`
        );
    }

    console.log(`Run ${logColorCommand(`clocker start ${server.getId()}`)} to start this server.`);
    console.log(`Run ${logColorCommand(`clocker list`)} to see all available servers.`);
};

export default add;
