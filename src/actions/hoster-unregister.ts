import Hoster from '../classes/Hoster';
import { logColorCommand, logColorHoster, logError, logServer, logSuccess } from '../helpers/log';
import { allServers } from '../helpers/servers';
import { PromptObject } from 'prompts';
import ask from '../helpers/ask';
import { HosterArgBag } from '../clocker';

const hosterUnregister = async (args: HosterArgBag) => {
    let hoster: Hoster | null = null;
    try {
        hoster = Hoster.buildFromId(args.hosterId);
    } catch (e) {
        logError(`Can't find hoster with id ${args.hosterId}`);
        console.log(`Run ${logColorCommand('clocker list')} to get all hosters.`);
        return;
    }

    console.log(`Going to unregister hoster ${logColorHoster(hoster.getId())} ...`);

    console.log('\n');
    console.log('Checking servers for hoster ...');
    const serversForHoster = allServers().filter((s) => s.hosterId === hoster!.getId());
    if (serversForHoster.length > 0) {
        logError('Found servers for this hoster');
        console.log(
            "Hoster can't be unregistered with servers attached. Stop and remove servers, then try again."
        );
        console.log('Servers found:');
        serversForHoster.forEach((s) => logServer(s.getId()));

        return;
    }
    logSuccess('No servers');

    console.log('\n');
    const q: PromptObject = {
        type: 'confirm',
        message: `Do you really want to completely and irreversible unregister hoster ${logColorHoster(
            hoster.getId()
        )}?`,
        name: 'confirm',
    };

    const a = await ask<{ confirm: boolean }>(q);

    if (!a.confirm) {
        console.log(`Keeping hoster.`);
        return;
    }

    console.log('\n');
    console.log('Unregistering hoster ...');
    if (!(await hoster.remove())) {
        logError('Error');
        return;
    }
    logSuccess('Hoster unregistered');
};

export default hosterUnregister;
