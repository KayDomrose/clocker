import { Choice, PromptObject } from 'prompts';
import { getProvider, providers } from '../helpers/provider';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import { Server } from '../classes/Server';
import { allServers } from '../helpers/servers';
import ask from '../helpers/ask';
import { ProviderHosterVars, ProviderServerVars } from '../classes/BaseProvider';
import { allHosters } from '../helpers/hosters';
import Hoster from '../classes/Hoster';

export interface ServerUserInput {
    id: string;
    hoster: string;
}

const requestConfig = async (): Promise<ServerUserInput> => {
    const questions: PromptObject[] = [
        {
            type: 'select',
            name: 'hoster',
            message: 'Choose your hoster',
            choices: allHosters().map(
                (hoster: Hoster): Choice => ({
                    title: hoster.getId(),
                    value: hoster.getId(),
                })
            ),
        },
        {
            type: 'text',
            name: 'id',
            message: 'Unique id',
            initial: '',
            validate: (value) => {
                if (value.length === 0) {
                    return 'ID can not be empty';
                }

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
    ];

    return await ask<ServerUserInput>(questions);
};

const serverAdd = async () => {
    if (allHosters().length === 0) {
        logError('No hosters found');
        console.log(
            `Run ${logColorCommand('clocker hoster register')} first to register a new hoster.`
        );
        return;
    }

    console.log('Answer these questions to configure a new server.');
    console.log('No server will be created yet.');
    console.log('\n');

    const input: ServerUserInput = await requestConfig();

    const hoster = Hoster.buildFromId(input.hoster);

    const providerQuestions: PromptObject[] = hoster.provider.getAdditionalServerQuestions();
    const providerAnswers = await ask<ProviderServerVars>(providerQuestions);

    const server = Server.buildFromUserInput(input, providerAnswers);

    if (!server.save()) {
        logError('Error');
    }

    console.log('\n');
    logSuccess(`Server ${logColorServer(server.getId())} added`);
    console.log(`Run ${logColorCommand(`clocker start ${server.getId()}`)} to start this server.`);
};

export default serverAdd;
