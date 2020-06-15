import { getProvider, providers } from '../helpers/provider';
import { Choice, PromptObject } from 'prompts';
import ask from '../helpers/ask';
import Hoster from '../classes/Hoster';
import { ProviderHosterVars } from '../classes/BaseProvider';
import { logColorCommand, logColorHoster, logSuccess } from '../helpers/log';
import { allHosters } from '../helpers/hosters';
import { validateId } from '../helpers/validator';

export interface HosterUserInput {
    id: string;
    hoster: string;
}

const hosterRegister = async () => {
    console.log('We are going to ask you some questions.');
    console.log(
        'After that, we will initialize the hoster of your choice (by registering ssh keys for example).'
    );
    console.log('\n');

    const question: PromptObject[] = [
        {
            type: 'select',
            name: 'hoster',
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
        {
            type: 'text',
            name: 'id',
            message: 'Unique identifier (e.g hoster-project) [A-Za-z_-]',
            validate: (value) => {
                if (allHosters().some((h) => h.getId() === value)) {
                    return 'Id already in use';
                }

                if (!validateId(value)) {
                    return 'Use only A-Z, a-z and -';
                }

                return true;
            },
        },
    ];

    const answer = await ask<HosterUserInput>(question);

    const hoster = Hoster.buildFromUserInput(answer);

    const providerAnswers = await (<ProviderHosterVars>(
        ask(hoster.provider.getAdditionalHosterQuestions())
    ));
    hoster.setVars(providerAnswers);

    console.log('\n');
    console.log('Saving hoster ...');
    if (!hoster.save()) {
        // Ups ...
    }
    logSuccess('Saved');

    console.log('\n');
    console.log('Initializing hoster ...');
    if (!(await hoster.initialize())) {
        // Ups again ...
    }
    logSuccess('Initialized');

    console.log('\n');
    logSuccess(`Hoster ${logColorHoster(hoster.getId())} registered`);
    console.log(`Run ${logColorCommand(`clocker add`)} to configure a new server.`);
};

export default hosterRegister;
